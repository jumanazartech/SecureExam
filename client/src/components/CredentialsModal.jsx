import React from 'react';
import { Download, X } from 'lucide-react';
import CredentialsDisplay from './CredentialsDisplay';
import { useAuth } from '../context/AuthContext';

// Shows freshly generated logins/passwords once, with a CSV export.
const CredentialsModal = ({ credentials, title, onClose }) => {
    const { t } = useAuth();
    if (!credentials || credentials.length === 0) return null;

    const downloadCsv = () => {
        const rows = [['Full name', 'Login', 'Password'],
            ...credentials.map(c => [`${c.last_name || ''} ${c.first_name || ''}`.trim(), c.username, c.password])];
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'credentials.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[300]">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-2xl w-full border dark:border-gray-800 shadow-2xl">
                <div className="flex items-start justify-between mb-2">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('credentials_hint')}</p>
                <CredentialsDisplay credentials={credentials} />
                <div className="flex gap-3 mt-4">
                    <button onClick={downloadCsv} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={onClose} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">{t('close') || 'OK'}</button>
                </div>
            </div>
        </div>
    );
};

export default CredentialsModal;
