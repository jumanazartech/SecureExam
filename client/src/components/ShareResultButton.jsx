import React, { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Copies a public, no-login link to a nicely designed result card (/r/:token) and offers a
// one-tap Telegram share — the "prove I did this" virality loop.
const ShareResultButton = ({ shareToken, className = '' }) => {
    const { t } = useAuth();
    const [copied, setCopied] = useState(false);
    if (!shareToken) return null;

    const url = `${window.location.origin}/r/${shareToken}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
        } catch (err) {
            // clipboard unavailable — fall through to opening the Telegram share sheet below
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? t('share_result_copied') : t('share_result')}
            </button>
            <a
                href={`https://t.me/share/url?url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#26A5E4]/10 text-[#26A5E4] hover:bg-[#26A5E4]/20 transition-colors"
                title="Telegram"
            >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M21.9 3.3 2.6 10.9c-1.3.5-1.3 1.3-.2 1.6l4.9 1.5 1.9 5.8c.2.6.4.9.9.9.4 0 .6-.2.9-.5l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.8l3-14.1c.3-1.3-.5-1.8-1.5-1.3z" /></svg>
            </a>
        </div>
    );
};

export default ShareResultButton;
