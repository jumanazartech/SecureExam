import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Landing point after Google/GitHub sign-in: the session arrives in the URL fragment.
const AuthCallback = () => {
    const { startSession } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const p = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = p.get('token');
        const role = p.get('role');
        const sessionId = p.get('sessionId');
        window.history.replaceState(null, '', '/auth/callback'); // never leave the token in the address bar
        if (!accessToken || !role) { navigate('/login?error=oauth_failed', { replace: true }); return; }
        startSession({ accessToken, role, sessionId });
        navigate(role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/student', { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-nearblack text-gray-500 dark:text-gray-400">…</div>;
};

export default AuthCallback;
