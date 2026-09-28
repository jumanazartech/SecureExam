import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, School } from 'lucide-react';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCopy } from '../hooks/useCopy';
import AuthLayout from '../components/AuthLayout';
import OAuthButtons from '../components/OAuthButtons';
import PhoneField from '../components/PhoneField';

const COPY = {
    uz: {
        back: 'Bosh sahifa', title: "Ro'yxatdan o'tish", sub: "Bir necha soniyada hisobingizni yarating.",
        student: 'Talaba', teacher: "O'qituvchi", studentHint: "Sinf kodi bilan qo'shilasiz", teacherHint: "Testlar yarating, 3 kun Pro",
        first: 'Ism', last: 'Familiya', phone: 'Telefon raqam (ixtiyoriy)', email: 'Email (ixtiyoriy)', password: 'Parol', passwordHint: 'Kamida 8 belgi',
        next: "Ro'yxatdan o'tish", sending: 'Yaratilmoqda…', have: "Hisobingiz bormi?", signin: 'Kirish',
        codeTitle: 'Kodni kiriting', codeSub: (p) => `${p} raqamiga 6 xonali kod yubordik.`, code: 'SMS kod', confirm: 'Tasdiqlash va boshlash', confirming: 'Tekshirilmoqda…',
        resend: 'Kodni qayta yuborish', resendIn: (s) => `Qayta yuborish: ${s}s`, change: "Raqamni o'zgartirish", dev: 'Test rejimi: kod',
        terms: "Davom etib, foydalanish shartlariga rozilik bildirasiz.", google: 'Google', or: 'yoki quyidagi maʻlumotlar bilan',
        oauthWelcome: (n) => `Xush kelibsiz, ${n}! Ma'lumotlaringizni tasdiqlang.`
    },
    ru: {
        back: 'На главную', title: 'Регистрация', sub: 'Создайте аккаунт за несколько секунд.',
        student: 'Студент', teacher: 'Учитель', studentHint: 'Вступите в класс по коду', teacherHint: 'Создавайте тесты, 3 дня Pro',
        first: 'Имя', last: 'Фамилия', phone: 'Номер телефона (необязательно)', email: 'Email (необязательно)', password: 'Пароль', passwordHint: 'Минимум 8 символов',
        next: 'Зарегистрироваться', sending: 'Создание…', have: 'Уже есть аккаунт?', signin: 'Войти',
        codeTitle: 'Введите код', codeSub: (p) => `Мы отправили 6-значный код на ${p}.`, code: 'SMS-код', confirm: 'Подтвердить и начать', confirming: 'Проверка…',
        resend: 'Отправить код снова', resendIn: (s) => `Повторно через ${s}с`, change: 'Изменить номер', dev: 'Тестовый режим: код',
        terms: 'Продолжая, вы принимаете условия использования.', google: 'Google', or: 'или заполните данные ниже',
        oauthWelcome: (n) => `Добро пожаловать, ${n}! Проверьте данные.`
    },
    en: {
        back: 'Home', title: 'Create your account', sub: 'Set up your account in a few seconds.',
        student: 'Student', teacher: 'Teacher', studentHint: 'Join a class with a code', teacherHint: 'Create tests, 3 days of Pro',
        first: 'First name', last: 'Last name', phone: 'Phone number (optional)', email: 'Email (optional)', password: 'Password', passwordHint: 'At least 8 characters',
        next: 'Create account', sending: 'Creating…', have: 'Already have an account?', signin: 'Sign in',
        codeTitle: 'Enter the code', codeSub: (p) => `We sent a 6-digit code to ${p}.`, code: 'SMS code', confirm: 'Verify and start', confirming: 'Checking…',
        resend: 'Resend code', resendIn: (s) => `Resend in ${s}s`, change: 'Change number', dev: 'Test mode: code',
        terms: 'By continuing you accept the terms of use.', google: 'Google', or: 'or fill in the details below',
        oauthWelcome: (n) => `Welcome, ${n}! Review your details.`
    }
};

const inputCls = 'w-full h-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-base text-gray-900 dark:text-white outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

const Register = () => {
    const c = useCopy(COPY);
    const { startSession } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const ticket = params.get('ticket');

    const [role, setRole] = useState(params.get('role') === 'teacher' ? 'teacher' : 'student');
    const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', password: '' });
    const [step, setStep] = useState('form');
    const [code, setCode] = useState('');
    const [devCode, setDevCode] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [oauthName, setOauthName] = useState('');

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    // Coming back from Google: prefill what they told us
    useEffect(() => {
        if (!ticket) return;
        axios.get(`${API_BASE}/account/oauth-ticket`, { params: { ticket } }).then(r => {
            setForm(f => ({ ...f, first_name: r.data.first_name || '', last_name: r.data.last_name || '', email: r.data.email || '' }));
            setOauthName(r.data.first_name || '');
        }).catch(() => setError('Sign-up session expired. Please start again.'));
    }, [ticket]);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const t = setTimeout(() => setCooldown(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    // Only a fully-typed 9-digit number is sent; an empty field means "no phone" (allowed).
    const phoneOk = form.phone.length === 0 || form.phone.length === 9;
    const phoneFull = form.phone ? `+998${form.phone}` : undefined;

    const start = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE}/account/register/start`, { role, ...form, phone: phoneFull, ticket: ticket || undefined });
            if (res.data.accessToken) {
                // No SMS gateway configured: the account was created immediately, no code to enter.
                startSession(res.data);
                navigate(res.data.role === 'teacher' ? '/teacher/account' : '/student');
                return;
            }
            setDevCode(res.data.dev_code || '');
            setCooldown(res.data.resend_in || 60);
            setStep('code');
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setBusy(false);
        }
    };

    const resend = async () => {
        setError('');
        try {
            const res = await axios.post(`${API_BASE}/account/register/resend`, { phone: phoneFull });
            setDevCode(res.data.dev_code || '');
            setCooldown(res.data.resend_in || 60);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            if (err.response?.data?.retry_after) setCooldown(err.response.data.retry_after);
        }
    };

    const verify = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE}/account/register/verify`, { phone: phoneFull, code });
            startSession(res.data);
            navigate(res.data.role === 'teacher' ? '/teacher/account' : '/student');
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setBusy(false);
        }
    };

    const roleBtn = (value, Icon, label, hint) => (
        <button type="button" onClick={() => setRole(value)} aria-pressed={role === value}
            className={`flex-1 text-left rounded-xl border p-3.5 transition ${role === value ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-600/20' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400'}`}>
            <Icon className={`w-5 h-5 ${role === value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`} />
            <div className="mt-2 font-semibold text-gray-900 dark:text-white">{label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{hint}</div>
        </button>
    );

    const errorBox = error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">{error}</div>
    );

    if (step === 'code') {
        return (
            <AuthLayout backLabel={c.back} title={c.codeTitle} subtitle={c.codeSub(phoneFull)}>
                {devCode && <p className="mb-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 px-3 py-2 text-sm font-mono">{c.dev}: {devCode}</p>}
                <form onSubmit={verify} className="space-y-5">
                    <div>
                        <label htmlFor="otp" className={labelCls}>{c.code}</label>
                        <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                            className={`${inputCls} text-center font-mono text-2xl tracking-[0.5em]`} required autoFocus />
                    </div>
                    <button type="submit" disabled={busy || code.length !== 6} className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition">
                        {busy ? c.confirming : c.confirm}
                    </button>
                </form>
                {errorBox}
                <div className="mt-5 flex items-center justify-between text-sm">
                    <button onClick={resend} disabled={cooldown > 0} className="font-semibold text-blue-700 dark:text-blue-400 disabled:text-gray-400 dark:disabled:text-gray-600">
                        {cooldown > 0 ? c.resendIn(cooldown) : c.resend}
                    </button>
                    <button onClick={() => { setStep('form'); setCode(''); setError(''); }} className="font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">{c.change}</button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout backLabel={c.back} title={c.title} subtitle={oauthName ? c.oauthWelcome(oauthName) : c.sub} wide>
            <div className="flex gap-3">
                {roleBtn('student', GraduationCap, c.student, c.studentHint)}
                {roleBtn('teacher', School, c.teacher, c.teacherHint)}
            </div>

            {!ticket && <OAuthButtons label={c.google} divider={c.or} />}

            <form onSubmit={start} className="mt-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div><label htmlFor="first_name" className={labelCls}>{c.first}</label><input id="first_name" autoComplete="given-name" value={form.first_name} onChange={set('first_name')} className={inputCls} required minLength={2} /></div>
                    <div><label htmlFor="last_name" className={labelCls}>{c.last}</label><input id="last_name" autoComplete="family-name" value={form.last_name} onChange={set('last_name')} className={inputCls} required minLength={2} /></div>
                </div>
                <PhoneField value={form.phone} onChange={(v) => setForm(f => ({ ...f, phone: v }))} label={c.phone} required={false} />
                <div><label htmlFor="email" className={labelCls}>{c.email}</label><input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} className={inputCls} /></div>
                {!ticket && (
                    <div>
                        <label htmlFor="password" className={labelCls}>{c.password}</label>
                        <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} className={inputCls} required minLength={8} />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{c.passwordHint}</p>
                    </div>
                )}
                <button type="submit" disabled={busy || !phoneOk} className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition">
                    {busy ? c.sending : c.next}
                </button>
            </form>
            {errorBox}
            <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">{c.terms}</p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{c.have} <Link to={role === 'teacher' ? '/teacher/login' : '/login'} className="font-semibold text-blue-700 dark:text-blue-400 hover:underline">{c.signin}</Link></p>
        </AuthLayout>
    );
};

export default Register;
