import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sun, Moon, Globe } from 'lucide-react';

const StudentProfile = () => {
    const { api, logout, t, theme, toggleTheme, language, changeLanguage } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile');
                setProfile(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load profile:', err);
                if (err.response?.status === 404) {
                    setMessage('Error: Profile not found. Please log out and back in.');
                }
                setLoading(false);
            }
        };
        fetchProfile();
    }, [api]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (profile.email && !profile.email.endsWith('@gmail.com')) {
            setMessage('Error: Email must end with @gmail.com');
            return;
        }

        try {
            setSaving(true);
            await api.put('/auth/profile', {
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email
            });
            setMessage(t('Profile updated successfully!'));
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-nearblack flex items-center justify-center transition-colors">
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-nearblack transition-colors">
            <header className="bg-white dark:bg-nearblack border-b dark:border-gray-800 shadow-sm p-4 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/student')} className="text-blue-600 dark:text-blue-400 hover:opacity-80 flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" /> {t('back')}
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('settings')}</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <select
                            value={language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="bg-transparent text-sm font-medium focus:outline-none dark:text-gray-300"
                        >
                            <option value="en">EN</option>
                            <option value="ru">RU</option>
                            <option value="uz">UZ</option>
                        </select>
                    </div>
                    <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">{t('logout')}</button>
                </div>
            </header>

            <main className="p-8 max-w-2xl mx-auto">
                {message && (
                    <div className={`mb-6 p-4 rounded shadow-sm ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {message}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('username')}</label>
                            <input
                                type="text"
                                value={profile.username}
                                disabled
                                className="w-full border dark:border-gray-700 p-3 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('email')}</label>
                            <input
                                type="email"
                                name="email"
                                value={profile.email || ''}
                                onChange={handleChange}
                                className="w-full border dark:border-gray-700 p-3 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                placeholder="example@gmail.com"
                            />
                            <p className="text-xs text-blue-600 mt-1 italic">Must end with @gmail.com</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('first_name')}</label>
                            <input
                                type="text"
                                name="first_name"
                                value={profile.first_name || ''}
                                onChange={handleChange}
                                className="w-full border dark:border-gray-700 p-3 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('last_name')}</label>
                            <input
                                type="text"
                                name="last_name"
                                value={profile.last_name || ''}
                                onChange={handleChange}
                                className="w-full border dark:border-gray-700 p-3 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    <div className="border-t dark:border-gray-800 pt-8 mb-8">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">{t('security')}</h2>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded border dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t('password')}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Managed by admin.</p>
                                </div>
                                <div className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded font-semibold">
                                    🔒 Locked
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-shadow hover:shadow-lg"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? t('saving') : t('save')}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentProfile;
