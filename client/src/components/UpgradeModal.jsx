import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useCopy } from '../hooks/useCopy';
import { CONTACT } from '../config';

const COPY = {
    uz: { title: 'Bu imkoniyat Pro tarifda', body: 'Joriy tarif chegarasiga yetdingiz.', see: 'Pro nimalarni beradi', contact: 'Telegramda yozish', close: 'Yopish' },
    ru: { title: 'Эта возможность есть в тарифе Pro', body: 'Вы достигли лимита текущего тарифа.', see: 'Что даёт Pro', contact: 'Написать в Telegram', close: 'Закрыть' },
    en: { title: 'This is a Pro feature', body: 'You have reached the limit of your current plan.', see: 'See what Pro includes', contact: 'Message us on Telegram', close: 'Close' }
};

// Global dialog: opened by the axios interceptor whenever the server answers with code PLAN_LIMIT.
const UpgradeModal = () => {
    const c = useCopy(COPY);
    const [info, setInfo] = useState(null);

    useEffect(() => {
        const open = (e) => setInfo(e.detail || {});
        window.addEventListener('plan-limit', open);
        return () => window.removeEventListener('plan-limit', open);
    }, []);

    if (!info) return null;
    return (
        <div className="fixed inset-0 z-[400] grid place-items-center bg-black/60 backdrop-blur-sm p-4">
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-7 shadow-2xl">
                <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl grid place-items-center bg-saffron-300/30 text-saffron-600"><Sparkles className="w-6 h-6" /></div>
                    <button onClick={() => setInfo(null)} aria-label={c.close} className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-gray-900 dark:text-white">{c.title}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{info.message || c.body}</p>
                <div className="mt-6 flex flex-col gap-2">
                    <Link to="/pricing" onClick={() => setInfo(null)} className="h-11 rounded-xl bg-blue-600 text-white font-semibold grid place-items-center hover:bg-blue-700">{c.see}</Link>
                    <a href={CONTACT.telegramUrl} target="_blank" rel="noreferrer" className="h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-semibold grid place-items-center hover:bg-gray-200 dark:hover:bg-gray-700">{c.contact}</a>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
