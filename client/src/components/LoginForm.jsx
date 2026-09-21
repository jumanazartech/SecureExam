import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import OAuthButtons from './OAuthButtons';
import { ArrowLeft, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CONTACT } from '../config';
import Brand, { BrandMark } from './Brand';
import ThemeLangControls from './ThemeLangControls';

const ROLES = {
    student: {
        allowed: ['student', 'teacher'],
        home: { student: '/student', teacher: '/teacher' },
        title: { uz: 'Talaba kirishi', ru: 'Вход для студентов', en: 'Student sign in' },
        sub: { uz: "Ustoz bergan login va parol bilan kiring.", ru: 'Войдите с логином и паролем от учителя.', en: 'Use the login and password from your teacher.' },
        other: [['/teacher/login', { uz: "O'qituvchiman", ru: 'Я учитель', en: "I'm a teacher" }]],
        pitch: { uz: 'Imtihon vaqtida faqat savol va siz.', ru: 'Во время экзамена — только вопрос и вы.', en: 'During the exam, it is just you and the question.' }
    },
    teacher: {
        allowed: ['teacher', 'admin'],
        home: { teacher: '/teacher', admin: '/teacher' },
        title: { uz: "O'qituvchi kirishi", ru: 'Вход для учителей', en: 'Teacher sign in' },
        sub: { uz: "Sinflar, imtihonlar va attestatsiya tayyorlovi.", ru: 'Классы, экзамены и подготовка к аттестации.', en: 'Classes, exams and attestation prep.' },
        other: [['/login', { uz: 'Talabaman', ru: 'Я студент', en: "I'm a student" }]],
        pitch: { uz: "Testni yuklang, AI savollarni tayyorlaydi.", ru: 'Загрузите материал — ИИ подготовит вопросы.', en: 'Upload your material and let AI draft the questions.' }
    },
    admin: {
        allowed: ['admin'],
        home: { admin: '/admin' },
        title: { uz: 'Administrator', ru: 'Администратор', en: 'Administrator' },
        sub: { uz: 'Faqat vakolatli xodimlar uchun.', ru: 'Только для уполномоченных сотрудников.', en: 'Authorised staff only.' },
        other: [],
        pitch: { uz: 'Sinflar, o‘qituvchilar va natijalar bir joyda.', ru: 'Классы, учителя и результаты в одном месте.', en: 'Classes, teachers and results in one place.' }
    }
};

const TEXT = {
    username: { uz: 'Login', ru: 'Логин', en: 'Username' },
    password: { uz: 'Parol', ru: 'Пароль', en: 'Password' },
    submit: { uz: 'Kirish', ru: 'Войти', en: 'Sign in' },
    loading: { uz: 'Kirilmoqda…', ru: 'Вход…', en: 'Signing in…' },
    back: { uz: 'Bosh sahifa', ru: 'На главную', en: 'Home' },
    denied: { uz: "Bu sahifa orqali kirish mumkin emas.", ru: 'Вход через эту страницу недоступен.', en: 'This account cannot sign in here.' },
    failed: { uz: "Kirib bo'lmadi. Login va parolni tekshiring.", ru: 'Не удалось войти. Проверьте логин и пароль.', en: 'Sign in failed. Check your login and password.' },
    activeTitle: { uz: 'Hisob boshqa qurilmada ochiq', ru: 'Аккаунт открыт на другом устройстве', en: 'Account is open elsewhere' },
    activeBody: { uz: "Bu hisobga boshqa qurilmadan kirilgan. Agar bu siz bo'lmasangiz, o'qituvchi yoki administratorga murojaat qiling.", ru: 'В этот аккаунт уже выполнен вход на другом устройстве. Если это не вы, обратитесь к учителю или администратору.', en: 'This account is signed in on another device. If that was not you, contact your teacher or administrator.' },
    kick: { uz: 'Boshqa seansni yopib kirish', ru: 'Завершить другой сеанс и войти', en: 'End other session and sign in' },
    close: { uz: 'Yopish', ru: 'Закрыть', en: 'Close' },
    identifier: { uz: 'Login, telefon yoki email', ru: 'Логин, телефон или email', en: 'Login, phone or email' },
    forgot: { uz: 'Parolni unutdingizmi?', ru: 'Забыли пароль?', en: 'Forgot password?' },
    noAccount: { uz: "Hisobingiz yo'qmi?", ru: 'Нет аккаунта?', en: 'No account yet?' },
    register: { uz: "Ro'yxatdan o'tish", ru: 'Регистрация', en: 'Sign up' },
    or: { uz: 'yoki login bilan', ru: 'или по логину', en: 'or with your login' },
    oauthFailed: { uz: "Google/GitHub orqali kirib bo'lmadi. Qayta urinib ko'ring.", ru: 'Не удалось войти через Google/GitHub. Попробуйте снова.', en: 'Google/GitHub sign-in failed. Please try again.' }
};

const LoginForm = ({ role }) => {
    const { login, language } = useAuth();
    const navigate = useNavigate();
    const cfg = ROLES[role];
    const tr = (obj) => obj[language] || obj.en;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [conflict, setConflict] = useState(false);
    const [params] = useSearchParams();
    const oauthError = params.get('error');

    const submit = async (e, force = false) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(username.trim(), password, force);
            setConflict(false);
            const userRole = localStorage.getItem('role');
            if (!cfg.allowed.includes(userRole)) {
                localStorage.clear();
                setError(tr(TEXT.denied));
                return;
            }
            navigate(cfg.home[userRole]);
        } catch (err) {
            if (err.response?.data?.code === 'SESSION_ACTIVE') setConflict(true);
            else setError(tr(TEXT.failed));
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'w-full h-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-base text-gray-900 dark:text-white outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15';

    return (
        <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-gray-50 dark:bg-nearblack">
            {/* Brand panel */}
            <aside className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-blue-900 text-white p-12">
                <svg className="absolute inset-0 w-full h-full opacity-[0.09]" aria-hidden="true">
                    <defs>
                        <pattern id="tile" width="72" height="72" patternUnits="userSpaceOnUse">
                            <path d="M36 4l8 20 20-8-8 20 20 8-20 8 8 20-20-8-8 20-8-20-20 8 8-20-20-8 20-8-8-20 20 8z" fill="none" stroke="#fff" strokeWidth="1.2" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#tile)" />
                </svg>
                <Link to="/" className="relative inline-flex items-center gap-2.5 text-white">
                    <BrandMark className="w-9 h-9 text-saffron-400" />
                    <span className="font-display text-xl font-bold">SecureExam</span>
                </Link>
                <div className="relative max-w-md">
                    <p className="font-display text-4xl font-bold leading-[1.1] text-balance">{tr(cfg.pitch)}</p>
                    <div className="mt-8 flex gap-6 text-sm text-blue-100/80">
                        <span><b className="block font-mono text-xl text-white">189</b>DTM</span>
                        <span><b className="block font-mono text-xl text-white">θ</b>Rasch</span>
                        <span><b className="block font-mono text-xl text-white">4</b>{language === 'uz' ? 'toifa' : language === 'ru' ? 'категории' : 'categories'}</span>
                    </div>
                </div>
                <p className="relative text-xs text-blue-100/70">© SecureExam · <a href={CONTACT.telegramUrl} className="underline hover:text-white">{CONTACT.telegram}</a></p>
            </aside>

            {/* Form */}
            <main className="flex flex-col px-6 sm:px-12 py-6">
                <div className="flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="w-4 h-4" /> {tr(TEXT.back)}
                    </Link>
                    <ThemeLangControls />
                </div>

                <div className="flex-1 grid place-items-center">
                    <div className="w-full max-w-sm">
                        <Brand className="lg:hidden mb-8" />
                        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{tr(cfg.title)}</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{tr(cfg.sub)}</p>

                        {(error || oauthError) && (
                            <div role="alert" className="mt-6 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
                                {error || tr(TEXT.oauthFailed)}
                            </div>
                        )}

                        {role !== 'admin' && <OAuthButtons divider={tr(TEXT.or)} />}

                        <form onSubmit={submit} className={`${role === 'admin' ? 'mt-8' : 'mt-6'} space-y-5`}>
                            <div>
                                <label htmlFor="login-username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{tr(TEXT.identifier)}</label>
                                <input id="login-username" type="text" autoComplete="username" autoCapitalize="none" spellCheck="false"
                                    value={username} onChange={e => setUsername(e.target.value)} className={inputCls} required />
                            </div>
                            <div>
                                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{tr(TEXT.password)}</label>
                                <div className="relative">
                                    <input id="login-password" type={show ? 'text' : 'password'} autoComplete="current-password"
                                        value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-12`} required />
                                    <button type="button" onClick={() => setShow(s => !s)} aria-label="Show password"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30">
                                {loading ? tr(TEXT.loading) : tr(TEXT.submit)}
                            </button>
                        </form>

                        {role !== 'admin' && (
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
                                <Link to="/forgot-password" className="font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{tr(TEXT.forgot)}</Link>
                                <span className="text-gray-600 dark:text-gray-400">{tr(TEXT.noAccount)} <Link to={`/register?role=${role}`} className="font-semibold text-blue-700 dark:text-blue-400 hover:underline">{tr(TEXT.register)}</Link></span>
                            </div>
                        )}

                        {cfg.other.length > 0 && (
                            <div className="mt-6 text-sm">
                                {cfg.other.map(([to, label]) => (
                                    <Link key={to} to={to} className="font-semibold text-blue-700 dark:text-blue-400 hover:underline">{tr(label)}</Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {conflict && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
                    <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-7 shadow-2xl">
                        <div className="w-11 h-11 rounded-xl grid place-items-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 mb-4"><ShieldAlert className="w-6 h-6" /></div>
                        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{tr(TEXT.activeTitle)}</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{tr(TEXT.activeBody)}</p>
                        <div className="mt-6 flex flex-col gap-2">
                            {role === 'admin' && (
                                <button onClick={() => submit(null, true)} className="h-11 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">{tr(TEXT.kick)}</button>
                            )}
                            <button onClick={() => setConflict(false)} className="h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700">{tr(TEXT.close)}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginForm;
