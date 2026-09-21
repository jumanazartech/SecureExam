import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import { useCopy } from '../hooks/useCopy';
import AuthLayout from '../components/AuthLayout';
import PhoneField from '../components/PhoneField';

const COPY = {
    uz: { back: 'Kirish', title: 'Parolni tiklash', sub: "Telefon raqamingizga SMS kod yuboramiz.", phone: 'Telefon raqam', send: 'SMS kod yuborish', code: 'SMS kod', pass: 'Yangi parol', save: 'Parolni saqlash', done: "Parol yangilandi. Endi kirishingiz mumkin.", signin: 'Kirishga o‘tish', hint: 'Kamida 8 belgi', dev: 'Test rejimi: kod', studentNote: "Ustoz bergan login/parolli talabalar parolni o'qituvchisidan oladi." },
    ru: { back: 'Вход', title: 'Восстановление пароля', sub: 'Мы отправим SMS-код на ваш номер.', phone: 'Номер телефона', send: 'Отправить SMS-код', code: 'SMS-код', pass: 'Новый пароль', save: 'Сохранить пароль', done: 'Пароль обновлён. Теперь можно войти.', signin: 'Перейти ко входу', hint: 'Минимум 8 символов', dev: 'Тестовый режим: код', studentNote: 'Студенты с логином от учителя получают пароль у учителя.' },
    en: { back: 'Sign in', title: 'Reset your password', sub: 'We will text a code to your phone.', phone: 'Phone number', send: 'Send SMS code', code: 'SMS code', pass: 'New password', save: 'Save password', done: 'Password updated. You can sign in now.', signin: 'Go to sign in', hint: 'At least 8 characters', dev: 'Test mode: code', studentNote: 'Students with a teacher-issued login get their password from the teacher.' }
};

const inputCls = 'w-full h-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-base text-gray-900 dark:text-white outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15';

const ForgotPassword = () => {
    const c = useCopy(COPY);
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState('phone');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [devCode, setDevCode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const call = async (fn) => {
        setBusy(true);
        setError('');
        try { await fn(); } catch (err) { setError(err.response?.data?.error || err.message); } finally { setBusy(false); }
    };

    const send = (e) => { e.preventDefault(); call(async () => {
        const res = await axios.post(`${API_BASE}/account/forgot/start`, { phone: `+998${phone}` });
        setDevCode(res.data.dev_code || '');
        setStep('reset');
    }); };

    const reset = (e) => { e.preventDefault(); call(async () => {
        await axios.post(`${API_BASE}/account/forgot/reset`, { phone: `+998${phone}`, code, password });
        setStep('done');
    }); };

    return (
        <AuthLayout back="/login" backLabel={c.back} title={c.title} subtitle={step === 'done' ? c.done : c.sub}>
            {step === 'phone' && (
                <form onSubmit={send} className="space-y-5">
                    <PhoneField value={phone} onChange={setPhone} label={c.phone} />
                    <button disabled={busy || phone.length !== 9} className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">{c.send}</button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.studentNote}</p>
                </form>
            )}
            {step === 'reset' && (
                <form onSubmit={reset} className="space-y-4">
                    {devCode && <p className="rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 px-3 py-2 text-sm font-mono">{c.dev}: {devCode}</p>}
                    <div>
                        <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{c.code}</label>
                        <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className={`${inputCls} text-center font-mono text-xl tracking-[0.4em]`} required />
                    </div>
                    <div>
                        <label htmlFor="newpass" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{c.pass}</label>
                        <input id="newpass" type="password" autoComplete="new-password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} required />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{c.hint}</p>
                    </div>
                    <button disabled={busy || code.length !== 6} className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">{c.save}</button>
                </form>
            )}
            {step === 'done' && <Link to="/login" className="inline-flex h-12 items-center rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">{c.signin}</Link>}
            {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">{error}</div>}
        </AuthLayout>
    );
};

export default ForgotPassword;
