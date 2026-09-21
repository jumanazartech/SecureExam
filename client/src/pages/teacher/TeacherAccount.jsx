import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, FileUp, ShieldQuestion, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCopy } from '../../hooks/useCopy';
import { CONTACT } from '../../config';

const COPY = {
    uz: {
        title: 'Hisob va tarif', free: 'Bepul tarif', pro: 'Pro tarif', trial: (d) => `Pro sinov: ${d} kun qoldi`, proUntil: (d) => `Pro ${d} gacha`, proForever: 'Pro (muddatsiz)',
        usage: 'Foydalanish', students: 'Talabalar', classes: 'Sinflar', exams: 'Imtihonlar', ai: 'AI savollar (shu oy)',
        upgrade: 'Pro imkoniyatlarini ko‘rish', contact: 'Pro sotib olish',
        verifyTitle: "O'qituvchi ekanligingizni tasdiqlang", verifyText: "Tasdiqlangach 3 kunlik Pro avtomatik yoqiladi. Hujjat faqat administratorga ko'rinadi.",
        workplace: 'Ish joyingiz (maktab / muassasa)', subject: 'Fan', doc: 'Hujjat (ID, sertifikat yoki maktab xati) — JPG, PNG, PDF', send: 'Tekshiruvga yuborish', sending: 'Yuborilmoqda…',
        pending: "So'rovingiz ko'rib chiqilmoqda. Odatda 24 soat ichida javob beramiz.", verified: "Siz tasdiqlangan o'qituvchisiz.", rejected: 'So‘rov rad etildi', again: 'Qayta yuborish',
        trialUsed: 'Sinov muddati ishlatilgan.'
    },
    ru: {
        title: 'Аккаунт и тариф', free: 'Бесплатный тариф', pro: 'Тариф Pro', trial: (d) => `Пробный Pro: осталось ${d} дн.`, proUntil: (d) => `Pro до ${d}`, proForever: 'Pro (бессрочно)',
        usage: 'Использование', students: 'Студенты', classes: 'Классы', exams: 'Экзамены', ai: 'ИИ-вопросы (в этом месяце)',
        upgrade: 'Что даёт Pro', contact: 'Купить Pro',
        verifyTitle: 'Подтвердите, что вы учитель', verifyText: 'После подтверждения автоматически включится 3-дневный Pro. Документ виден только администратору.',
        workplace: 'Место работы (школа / организация)', subject: 'Предмет', doc: 'Документ (ID, сертификат или письмо из школы) — JPG, PNG, PDF', send: 'Отправить на проверку', sending: 'Отправка…',
        pending: 'Заявка на рассмотрении. Обычно отвечаем в течение суток.', verified: 'Вы подтверждённый учитель.', rejected: 'Заявка отклонена', again: 'Подать заново',
        trialUsed: 'Пробный период использован.'
    },
    en: {
        title: 'Account & plan', free: 'Free plan', pro: 'Pro plan', trial: (d) => `Pro trial: ${d} day(s) left`, proUntil: (d) => `Pro until ${d}`, proForever: 'Pro (no expiry)',
        usage: 'Usage', students: 'Students', classes: 'Classes', exams: 'Exams', ai: 'AI questions (this month)',
        upgrade: 'See what Pro includes', contact: 'Buy Pro',
        verifyTitle: 'Verify that you are a teacher', verifyText: 'Once verified, a 3-day Pro trial starts automatically. Your document is visible only to the administrator.',
        workplace: 'Workplace (school / institution)', subject: 'Subject', doc: 'Document (ID, certificate or a school letter) — JPG, PNG, PDF', send: 'Submit for review', sending: 'Submitting…',
        pending: 'Your request is under review. We usually reply within a day.', verified: 'You are a verified teacher.', rejected: 'Request rejected', again: 'Submit again',
        trialUsed: 'Trial already used.'
    }
};

const Meter = ({ label, used, limit }) => {
    const pct = Math.min(100, Math.round((used / limit) * 100));
    return (
        <div>
            <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <span className="font-mono text-gray-600 dark:text-gray-400">{used} / {limit}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className={`h-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const inputCls = 'w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 text-gray-900 dark:text-white outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15';

const TeacherAccount = () => {
    const c = useCopy(COPY);
    const { api, account, refreshAccount, language } = useAuth();
    const [form, setForm] = useState({ workplace: '', subject: '' });
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { refreshAccount(); }, [refreshAccount]);

    if (!account) return <div className="text-gray-500">…</div>;

    const isPro = account.plan === 'pro';
    const untilDate = account.pro_until ? new Date(account.pro_until) : null;
    const daysLeft = untilDate ? Math.max(0, Math.ceil((untilDate - Date.now()) / 86400000)) : null;
    const status = account.user.teacher_status;
    const usage = account.usage;

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('workplace', form.workplace);
            fd.append('subject', form.subject);
            fd.append('document', file);
            await api.post('/account/teacher/verification', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await refreshAccount();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{c.title}</h2>

            <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-xl grid place-items-center ${isPro ? 'bg-saffron-300/30 text-saffron-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}><Sparkles className="w-5 h-5" /></span>
                        <div>
                            <div className="font-display text-lg font-bold text-gray-900 dark:text-white">{isPro ? c.pro : c.free}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                {isPro && untilDate && <><Clock className="w-4 h-4" />{account.trial_used && daysLeft <= 3 ? c.trial(daysLeft) : c.proUntil(untilDate.toLocaleDateString(language))}</>}
                                {isPro && !untilDate && c.proForever}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/pricing" className="h-10 px-4 inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">{c.upgrade}</Link>
                        {!isPro || daysLeft !== null ? <a href={CONTACT.telegramUrl} target="_blank" rel="noreferrer" className="h-10 px-4 inline-flex items-center rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">{c.contact}</a> : null}
                    </div>
                </div>

                {usage && (
                    <div className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-4">
                        <h3 className="sr-only">{c.usage}</h3>
                        <Meter label={c.students} used={usage.used.students} limit={usage.limits.maxStudents} />
                        <Meter label={c.classes} used={usage.used.classes} limit={usage.limits.maxClasses} />
                        <Meter label={c.exams} used={usage.used.exams} limit={usage.limits.maxExams} />
                        <Meter label={c.ai} used={usage.used.aiQuestions} limit={usage.limits.aiQuestionsPerMonth} />
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {status === 'verified' ? <BadgeCheck className="w-5 h-5 text-emerald-600" /> : <ShieldQuestion className="w-5 h-5 text-blue-600" />}
                    {c.verifyTitle}
                </h3>

                {status === 'verified' && <p className="mt-3 text-emerald-700 dark:text-emerald-400 font-medium">{c.verified} {account.trial_used && account.plan !== 'pro' ? c.trialUsed : ''}</p>}
                {status === 'pending' && <p className="mt-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 px-4 py-3 text-sm">{c.pending}</p>}

                {(status === 'none' || status === 'rejected') && (
                    <>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{c.verifyText}</p>
                        {status === 'rejected' && (
                            <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 px-4 py-3 text-sm"><b>{c.rejected}.</b> {account.verification?.note}</p>
                        )}
                        <form onSubmit={submit} className="mt-5 space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div><label htmlFor="v-work" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{c.workplace}</label><input id="v-work" className={inputCls} value={form.workplace} onChange={e => setForm({ ...form, workplace: e.target.value })} required minLength={3} /></div>
                                <div><label htmlFor="v-subj" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{c.subject}</label><input id="v-subj" className={inputCls} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
                            </div>
                            <div>
                                <label htmlFor="v-doc" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{c.doc}</label>
                                <label htmlFor="v-doc" className="flex items-center gap-3 h-11 rounded-xl border border-dashed border-gray-400 dark:border-gray-600 px-3.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:border-blue-600">
                                    <FileUp className="w-4 h-4" /><span className="truncate">{file ? file.name : '…'}</span>
                                </label>
                                <input id="v-doc" type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only" onChange={e => setFile(e.target.files[0] || null)} required />
                            </div>
                            {error && <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 px-4 py-3 text-sm">{error}</div>}
                            <button disabled={busy || !file} className="h-11 px-5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">{busy ? c.sending : (status === 'rejected' ? c.again : c.send)}</button>
                        </form>
                    </>
                )}
            </section>
        </div>
    );
};

export default TeacherAccount;
