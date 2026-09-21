import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCopy } from '../hooks/useCopy';

const COPY = {
    uz: { title: "Sinfga qo'shilish", hint: "O'qituvchingiz bergan sinf kodini kiriting.", current: (n) => `Sizning sinfingiz: ${n}`, join: "Qo'shilish", placeholder: 'Masalan, K7M2QX', joined: (n) => `${n} sinfiga qo'shildingiz` },
    ru: { title: 'Вступить в класс', hint: 'Введите код класса от вашего учителя.', current: (n) => `Ваш класс: ${n}`, join: 'Вступить', placeholder: 'Например, K7M2QX', joined: (n) => `Вы вступили в класс ${n}` },
    en: { title: 'Join a class', hint: 'Enter the class code your teacher gave you.', current: (n) => `Your class: ${n}`, join: 'Join', placeholder: 'e.g. K7M2QX', joined: (n) => `You joined ${n}` }
};

const JoinClass = ({ onJoined }) => {
    const c = useCopy(COPY);
    const { api, account, refreshAccount } = useAuth();
    const [code, setCode] = useState('');
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
            const res = await api.post('/classes/join', { code });
            setMsg({ ok: true, text: c.joined(res.data.class.name) });
            setCode('');
            await refreshAccount();
            onJoined?.();
        } catch (err) {
            setMsg({ ok: false, text: err.response?.data?.error || err.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h3 className="font-display text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" />{c.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{account?.class ? c.current(account.class.name) : c.hint}</p>
                </div>
                <form onSubmit={submit} className="flex gap-2">
                    <label htmlFor="join-code" className="sr-only">{c.title}</label>
                    <input id="join-code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={c.placeholder} maxLength={8}
                        className="h-11 w-40 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 font-mono tracking-widest text-gray-900 dark:text-white outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15" required />
                    <button disabled={busy || code.length < 4} className="h-11 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">{c.join}</button>
                </form>
            </div>
            {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{msg.text}</p>}
        </div>
    );
};

export default JoinClass;
