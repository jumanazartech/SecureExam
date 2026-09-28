import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.4 14.4a7.200 7.200 0 0 1 0-4.800V6.500H1.400a12 12 0 0 0 0 11z" />
        <path fill="#EA4335" d="M12 4.800c1.700 0 3.300.6 4.500 1.800l3.400-3.400A12 12 0 0 0 1.400 6.500l4 3.100C6.300 6.900 8.900 4.800 12 4.800z" />
    </svg>
);

// Shows the Google button only if the server has GOOGLE_CLIENT_ID/SECRET configured.
const OAuthButtons = ({ label = 'Google', divider = 'or' }) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        axios.get(`${API_BASE}/account/providers`).then(r => setEnabled(!!r.data.google)).catch(() => {});
    }, []);

    if (!enabled) return null;
    return (
        <div className="mt-6">
            <a
                href={`${API_BASE}/account/oauth/google`}
                className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
                <GoogleIcon />{label}
            </a>
            <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />{divider}<span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>
        </div>
    );
};

export default OAuthButtons;
