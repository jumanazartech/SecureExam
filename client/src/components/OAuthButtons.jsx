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

const GithubIcon = () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .5A11.500 11.500 0 0 0 .5 12c0 5.100 3.300 9.400 7.900 10.900.6.100.8-.2.8-.6v-2c-3.200.7-3.900-1.400-3.900-1.400-.5-1.300-1.300-1.700-1.300-1.700-1-.7.1-.7.1-.7 1.200.1 1.800 1.200 1.800 1.200 1 1.800 2.700 1.300 3.400 1 .1-.8.4-1.300.7-1.600-2.600-.3-5.300-1.300-5.300-5.700 0-1.300.5-2.300 1.200-3.100-.1-.3-.5-1.500.1-3.100 0 0 1-.3 3.200 1.200a11 11 0 0 1 5.800 0c2.200-1.500 3.200-1.200 3.200-1.200.6 1.600.2 2.800.1 3.100.8.800 1.200 1.800 1.200 3.100 0 4.400-2.700 5.400-5.300 5.700.4.400.8 1.100.8 2.200v3.300c0 .3.200.7.800.6A11.500 11.500 0 0 0 23.500 12 11.500 11.500 0 0 0 12 .5z" />
    </svg>
);

// Shows only the providers that are configured on the server (Google / GitHub).
const OAuthButtons = ({ label = { google: 'Google', github: 'GitHub' }, divider = 'or' }) => {
    const [providers, setProviders] = useState({ google: false, github: false });

    useEffect(() => {
        axios.get(`${API_BASE}/account/providers`).then(r => setProviders(r.data)).catch(() => {});
    }, []);

    if (!providers.google && !providers.github) return null;
    const btn = 'flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition';

    return (
        <div className="mt-6">
            <div className="flex gap-3">
                {providers.google && <a href={`${API_BASE}/account/oauth/google`} className={btn}><GoogleIcon />{label.google}</a>}
                {providers.github && <a href={`${API_BASE}/account/oauth/github`} className={btn}><GithubIcon />{label.github}</a>}
            </div>
            <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />{divider}<span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>
        </div>
    );
};

export default OAuthButtons;
