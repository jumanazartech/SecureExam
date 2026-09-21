import React, { useState } from 'react';
import { Copy, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CredentialsDisplay = ({ credentials }) => {
    const { t } = useAuth();
    const [showPasswords, setShowPasswords] = useState({});
    const [copiedField, setCopiedField] = useState(null);

    const togglePasswordVisibility = (index) => {
        setShowPasswords(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const copyToClipboard = async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="space-y-4">
            {credentials && credentials.length > 0 ? (
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {credentials.map((cred, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl p-6 mb-4 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all group shadow-sm"
                        >
                            {/* Full Name display if available */}
                            <div className="mb-4">
                                <h4 className="font-black text-lg dark:text-white uppercase tracking-tighter">
                                    {cred.last_name} {cred.first_name}
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Login Field */}
                                <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        {t('login')}
                                    </label>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm font-bold dark:text-gray-200">{cred.username}</span>
                                        <button
                                            onClick={() => copyToClipboard(cred.username, `login-${index}`)}
                                            className="text-blue-500 hover:text-blue-600 transition-colors"
                                            title="Copy login"
                                        >
                                            {copiedField === `login-${index}` ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <Copy className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        {t('password')}
                                    </label>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm font-bold dark:text-gray-200">
                                            {showPasswords[index] ? cred.password : '••••••••'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => togglePasswordVisibility(index)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                title={showPasswords[index] ? 'Hide password' : 'Show password'}
                                            >
                                                {showPasswords[index] ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(cred.password, `password-${index}`)}
                                                className="text-blue-500 hover:text-blue-600 transition-colors"
                                                title="Copy password"
                                            >
                                                {copiedField === `password-${index}` ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-3xl text-center border-2 border-dashed dark:border-gray-800">
                    <p className="text-gray-400 font-bold italic">
                        {t('no_students_found')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CredentialsDisplay;
