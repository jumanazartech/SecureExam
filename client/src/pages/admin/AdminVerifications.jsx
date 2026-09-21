import React, { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCopy } from '../../hooks/useCopy';

const COPY = {
    uz: { title: "O'qituvchilarni tasdiqlash", queue: 'Kutilayotgan so‘rovlar', empty: "Kutilayotgan so'rov yo'q", plans: "O'qituvchilar va tariflar", name: 'Ism', phone: 'Telefon', work: 'Ish joyi', doc: 'Hujjat', open: 'Ochish', approve: 'Tasdiqlash (3 kun Pro)', reject: 'Rad etish', reason: 'Rad etish sababi', trial: 'Sinov ishlatilgan', plan: 'Tarif', status: 'Holat', act: 'Amal', grant: '+30 kun Pro', forever: 'Pro (muddatsiz)', toFree: 'Bepulga', until: 'gacha' },
    ru: { title: 'Подтверждение учителей', queue: 'Ожидающие заявки', empty: 'Нет ожидающих заявок', plans: 'Учителя и тарифы', name: 'Имя', phone: 'Телефон', work: 'Место работы', doc: 'Документ', open: 'Открыть', approve: 'Одобрить (3 дня Pro)', reject: 'Отклонить', reason: 'Причина отказа', trial: 'Пробный период использован', plan: 'Тариф', status: 'Статус', act: 'Действие', grant: '+30 дней Pro', forever: 'Pro бессрочно', toFree: 'На Бесплатный', until: 'до' },
    en: { title: 'Teacher verification', queue: 'Pending requests', empty: 'No pending requests', plans: 'Teachers & plans', name: 'Name', phone: 'Phone', work: 'Workplace', doc: 'Document', open: 'Open', approve: 'Approve (3-day Pro)', reject: 'Reject', reason: 'Rejection reason', trial: 'Trial already used', plan: 'Plan', status: 'Status', act: 'Action', grant: '+30 days Pro', forever: 'Pro (no expiry)', toFree: 'Set Free', until: 'until' }
};

const AdminVerifications = () => {
    const c = useCopy(COPY);
    const { api } = useAuth();
    const [queue, setQueue] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const [q, t] = await Promise.all([api.get('/account/admin/verifications?status=pending'), api.get('/account/admin/teacher-plans')]);
            setQueue(q.data);
            setTeachers(t.data);
        } catch (err) { setError(err.response?.data?.error || err.message); }
    }, [api]);

    useEffect(() => { load(); }, [load]);

    const act = async (fn) => { try { await fn(); await load(); } catch (err) { setError(err.response?.data?.error || err.message); } };

    // The document is protected: fetch it with the auth header and open it as a blob
    const openDoc = async (id) => {
        const res = await api.get(`/account/admin/verifications/${id}/document`, { responseType: 'blob' });
        window.open(URL.createObjectURL(res.data), '_blank', 'noopener');
    };

    const reject = (id) => {
        const note = window.prompt(c.reason) ;
        if (note === null) return;
        act(() => api.post(`/account/admin/verifications/${id}/reject`, { note }));
    };

    const btn = 'h-9 px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5';

    return (
        <div className="space-y-10">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{c.title}</h2>
            {error && <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 px-4 py-3 text-sm">{error}</div>}

            <section>
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-3">{c.queue} <span className="font-mono text-sm text-gray-500">({queue.length})</span></h3>
                {queue.length === 0 && <p className="text-gray-500 dark:text-gray-400">{c.empty}</p>}
                <ul className="space-y-3">
                    {queue.map(v => (
                        <li key={v.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                            <div className="min-w-[12rem]">
                                <div className="font-semibold text-gray-900 dark:text-white">{v.User?.first_name} {v.User?.last_name}</div>
                                <div className="font-mono text-sm text-gray-600 dark:text-gray-400">{v.User?.phone}</div>
                            </div>
                            <div className="flex-1 min-w-[12rem] text-sm text-gray-700 dark:text-gray-300">
                                <div><span className="text-gray-500">{c.work}:</span> {v.workplace}</div>
                                {v.subject && <div><span className="text-gray-500">{c.plan === 'Plan' ? 'Subject' : ''}</span> {v.subject}</div>}
                                {v.User?.trial_used && <div className="text-amber-700 dark:text-amber-400">{c.trial}</div>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {v.has_document && <button onClick={() => openDoc(v.id)} className={`${btn} border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800`}><ExternalLink className="w-4 h-4" />{c.doc}</button>}
                                <button onClick={() => act(() => api.post(`/account/admin/verifications/${v.id}/approve`))} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}><Check className="w-4 h-4" />{c.approve}</button>
                                <button onClick={() => reject(v.id)} className={`${btn} bg-red-600 text-white hover:bg-red-700`}><X className="w-4 h-4" />{c.reject}</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-3">{c.plans}</h3>
                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <table className="w-full min-w-[40rem] text-left text-sm">
                        <thead className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                            <tr><th className="p-4">{c.name}</th><th className="p-4">{c.phone}</th><th className="p-4">{c.status}</th><th className="p-4">{c.plan}</th><th className="p-4">{c.act}</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                            {teachers.map(t => (
                                <tr key={t.id}>
                                    <td className="p-4 font-medium">{t.first_name} {t.last_name}</td>
                                    <td className="p-4 font-mono">{t.phone || '—'}</td>
                                    <td className="p-4">{t.teacher_status}</td>
                                    <td className="p-4 font-mono">{t.effective_plan}{t.effective_plan === 'pro' && t.pro_until ? ` ${c.until} ${new Date(t.pro_until).toLocaleDateString()}` : ''}</td>
                                    <td className="p-4 flex flex-wrap gap-2">
                                        <button onClick={() => act(() => api.post(`/account/admin/users/${t.id}/plan`, { days: 30 }))} className={`${btn} border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800`}>{c.grant}</button>
                                        <button onClick={() => act(() => api.post(`/account/admin/users/${t.id}/plan`, { days: null }))} className={`${btn} border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800`}>{c.forever}</button>
                                        <button onClick={() => act(() => api.post(`/account/admin/users/${t.id}/plan`, { days: 0 }))} className={`${btn} border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800`}>{c.toFree}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminVerifications;
