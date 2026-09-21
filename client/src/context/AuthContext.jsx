import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { translations } from '../translations';
import { useAlert } from './AlertContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'uz');
    const { showAlert } = useAlert();

    // Move api up so it's defined before useEffects
    const api = React.useMemo(() => {
        const instance = axios.create({
            baseURL: API_BASE,
        });
        // Any PLAN_LIMIT response opens the global upgrade dialog (see components/UpgradeModal)
        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.data?.code === 'PLAN_LIMIT') {
                    window.dispatchEvent(new CustomEvent('plan-limit', {
                        detail: { message: error.response.data.error || error.response.data.message, feature: error.response.data.feature }
                    }));
                }
                return Promise.reject(error);
            }
        );
        instance.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        return instance;
    }, [user?.token]);

    const t = React.useCallback((key) => {
        if (!translations[language]) return key;
        return translations[language][key] || key;
    }, [language]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const sessionId = localStorage.getItem('sessionId');
        if (token && role && sessionId) {
            setUser({ role, token, sessionId });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!user?.token || !user?.sessionId) return;

        const heartbeat = setInterval(async () => {
            try {
                await api.post('/auth/heartbeat');
            } catch (err) {
                if (err.response?.status === 401) {
                    showAlert(t('session_active'), t('logged_out_new'), 'warning');
                    logout();
                }
            }
        }, 30000); // Pulse every 30s

        return () => clearInterval(heartbeat);
    }, [user, t, api, showAlert]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const changeLanguage = (lang) => setLanguage(lang);

    const login = async (username, password, force = false) => {
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username, password, force });
            const { accessToken, role, sessionId } = res.data;
            localStorage.setItem('token', accessToken);
            localStorage.setItem('role', role);
            localStorage.setItem('sessionId', sessionId);
            setUser({ role, token: accessToken, sessionId });
            return true;
        } catch (error) {
            if (error.response?.data?.code === 'SESSION_ACTIVE') {
                // Keep window.confirm for critical destructive actions if needed, 
                // but for login conflict it's better to show UI block in Login.jsx
                // For now, we will let Login.jsx handle the conflict UI since it was already redesigned recently
            }
            console.error('Login failed', error);
            throw error;
        }
    };

    // Used by registration and OAuth, which receive the same session payload as /auth/login
    const startSession = ({ accessToken, role, sessionId }) => {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('role', role);
        localStorage.setItem('sessionId', sessionId);
        setUser({ role, token: accessToken, sessionId });
    };

    // Plan, usage and teacher-verification state of the signed-in account
    const [account, setAccount] = useState(null);
    const refreshAccount = React.useCallback(async () => {
        if (!localStorage.getItem('token')) return null;
        try {
            const res = await api.get('/account/me');
            setAccount(res.data);
            return res.data;
        } catch (err) {
            return null;
        }
    }, [api]);

    useEffect(() => {
        if (user?.token) refreshAccount();
        else setAccount(null);
    }, [user?.token, refreshAccount]);

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout failed on server', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('sessionId');
            setUser(null);
            setAccount(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout, api, loading, startSession, account, refreshAccount,
            theme, toggleTheme,
            language, changeLanguage, t
        }}>
            {children}
        </AuthContext.Provider>
    );
};
