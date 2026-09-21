import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Minus } from 'lucide-react';
import axios from 'axios';
import { API_BASE, CONTACT } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCopy } from '../hooks/useCopy';
import Brand from '../components/Brand';
import ThemeLangControls from '../components/ThemeLangControls';

const COPY = {
    uz: {
        back: 'Bosh sahifa', title: 'Bepul boshlang. Kerak bo‘lganda Pro.',
        lead: "Talabalar har doim bepul. Tariflar faqat o'qituvchilar va muassasalar uchun.",
        free: 'Bepul', pro: 'Pro', perMonth: "so'm / oy", perYear: "so'm / yil (2 oy tekin)", forever: 'doimo',
        ctaFree: "Bepul ro'yxatdan o'tish", ctaPro: "3 kun Pro sinab ko'rish", ctaContact: "Pro sotib olish — Telegram",
        unlimited: 'cheksiz', compare: 'Tariflar taqqoslash',
        rows: {
            students: "Talabalar soni", classes: 'Sinflar', exams: 'Imtihonlar', qpe: 'Bir imtihondagi savollar', ai: 'AI savollar (oyiga)',
            aiReq: 'AI: bir so‘rovda', upload: 'Yuklanadigan fayl hajmi', types: 'Imtihon turlari', attest: 'Attestatsiya tayyorlov testlari',
            excel: 'Excel eksport', results: "Batafsil natijalar (bo'limlar bo'yicha)", appeals: 'Apellyatsiyalar', proctor: 'Imtihon nazorati'
        },
        proctorFree: 'Asosiy (to‘liq ekran, fokus)', proctorPro: "To'liq",
        trialTitle: "3 kunlik Pro — faqat haqiqiy o'qituvchilarga",
        trialSteps: ["Telefon raqam bilan ro'yxatdan o'ting (SMS kod keladi)", "Ish joyingiz va hujjatingizni yuboring (ID, sertifikat yoki maktab xati)", "Tekshiruvdan so'ng 3 kunlik Pro avtomatik yoqiladi"],
        trialNote: "Sinov muddati tugagach hisob Bepul tarifga qaytadi, ma'lumotlaringiz saqlanadi. Har bir telefon raqamga sinov bir marta beriladi.",
        faqTitle: 'Ko‘p so‘raladigan savollar',
        faq: [
            ["Nega tasdiqlash kerak?", "Sinov faqat haqiqiy o'qituvchilar uchun. Tasdiqlash suiiste'molning oldini oladi."],
            ["Sinov tugagach nima bo'ladi?", "Pro imkoniyatlari qulflanadi, mavjud imtihon va natijalaringiz saqlanib qoladi. Limitdan oshgan qismi faqat ko'rish rejimida bo'ladi."],
            ["Qanday to'layman?", "Hozircha Telegram orqali (Payme/Click/o'tkazma). Onlayn to'lov tez orada qo'shiladi."],
            ["Talabalar ham to'lovmi?", "Yo'q. Talabalar har doim bepul: ro'yxatdan o'tadi, sinf kodi bilan qo'shiladi va imtihon topshiradi."]
        ]
    },
    ru: {
        back: 'На главную', title: 'Начните бесплатно. Pro — когда понадобится.',
        lead: 'Студентам всегда бесплатно. Тарифы — только для учителей и организаций.',
        free: 'Бесплатно', pro: 'Pro', perMonth: 'сум / мес', perYear: 'сум / год (2 месяца в подарок)', forever: 'навсегда',
        ctaFree: 'Зарегистрироваться бесплатно', ctaPro: 'Попробовать Pro 3 дня', ctaContact: 'Купить Pro — Telegram',
        unlimited: 'без ограничений', compare: 'Сравнение тарифов',
        rows: {
            students: 'Студентов', classes: 'Классов', exams: 'Экзаменов', qpe: 'Вопросов в экзамене', ai: 'ИИ-вопросов (в месяц)',
            aiReq: 'ИИ: за один запрос', upload: 'Размер загружаемого файла', types: 'Типы экзаменов', attest: 'Тесты для аттестации',
            excel: 'Экспорт в Excel', results: 'Подробные результаты (по разделам)', appeals: 'Апелляции', proctor: 'Контроль экзамена'
        },
        proctorFree: 'Базовый (полный экран, фокус)', proctorPro: 'Полный',
        trialTitle: '3 дня Pro — только для настоящих учителей',
        trialSteps: ['Зарегистрируйтесь по номеру телефона (придёт SMS-код)', 'Отправьте место работы и документ (ID, сертификат или письмо из школы)', 'После проверки Pro включится автоматически на 3 дня'],
        trialNote: 'После пробного периода аккаунт вернётся на Бесплатный тариф, данные сохранятся. Пробный период даётся один раз на номер телефона.',
        faqTitle: 'Частые вопросы',
        faq: [
            ['Зачем подтверждение?', 'Пробный период — только для настоящих учителей. Проверка защищает от злоупотреблений.'],
            ['Что после пробного периода?', 'Функции Pro блокируются, ваши экзамены и результаты сохраняются. То, что сверх лимита, доступно только для просмотра.'],
            ['Как оплатить?', 'Пока через Telegram (Payme/Click/перевод). Онлайн-оплата скоро появится.'],
            ['Студенты тоже платят?', 'Нет. Студенты всегда бесплатно: регистрируются, вступают в класс по коду и сдают экзамены.']
        ]
    },
    en: {
        back: 'Home', title: 'Start free. Go Pro when you need it.',
        lead: 'Students are always free. Plans are for teachers and institutions.',
        free: 'Free', pro: 'Pro', perMonth: 'UZS / month', perYear: 'UZS / year (2 months free)', forever: 'forever',
        ctaFree: 'Sign up free', ctaPro: 'Try Pro for 3 days', ctaContact: 'Buy Pro — Telegram',
        unlimited: 'unlimited', compare: 'Compare plans',
        rows: {
            students: 'Students', classes: 'Classes', exams: 'Exams', qpe: 'Questions per exam', ai: 'AI questions (per month)',
            aiReq: 'AI: per request', upload: 'Upload size', types: 'Exam types', attest: 'Attestation prep tests',
            excel: 'Excel export', results: 'Detailed results (by section)', appeals: 'Appeals', proctor: 'Exam proctoring'
        },
        proctorFree: 'Basic (fullscreen, focus)', proctorPro: 'Full',
        trialTitle: '3 days of Pro — for real teachers only',
        trialSteps: ['Sign up with your phone number (an SMS code is sent)', 'Submit your workplace and a document (ID, certificate or a school letter)', 'After review, Pro switches on automatically for 3 days'],
        trialNote: 'After the trial your account returns to Free and your data is kept. The trial is granted once per phone number.',
        faqTitle: 'Questions',
        faq: [
            ['Why verification?', 'The trial is for genuine teachers. Verification prevents abuse.'],
            ['What happens after the trial?', 'Pro features lock; your exams and results stay. Anything over the Free limits becomes view-only.'],
            ['How do I pay?', 'For now via Telegram (Payme/Click/transfer). Online payment is coming soon.'],
            ['Do students pay?', 'No. Students are always free: they sign up, join a class with a code and take exams.']
        ]
    }
};

const FALLBACK = {
    free: { priceMonthly: 0, limits: { maxStudents: 30, maxClasses: 2, maxExams: 5, maxQuestionsPerExam: 30, aiQuestionsPerMonth: 30, aiQuestionsPerRequest: 10, maxUploadMb: 5, examTypes: ['chsb'] }, features: { excelExport: false, attestation: false, advancedResults: false, appeals: true } },
    pro: { priceMonthly: 59000, priceYearly: 590000, limits: { maxStudents: 500, maxClasses: 30, maxExams: 1000, maxQuestionsPerExam: 200, aiQuestionsPerMonth: 1500, aiQuestionsPerRequest: 100, maxUploadMb: 25, examTypes: ['chsb', 'rasch_national_cert', 'dtm', 'attestation'] }, features: { excelExport: true, attestation: true, advancedResults: true, appeals: true } }
};

const TYPE_LABEL = { chsb: 'CHSB', rasch_national_cert: 'Rasch', dtm: 'DTM', attestation: 'Attestation' };
const fmt = (n) => new Intl.NumberFormat('ru-RU').format(n);

const Cell = ({ value }) => {
    if (value === true) return <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 inline" aria-label="yes" />;
    if (value === false) return <Minus className="w-5 h-5 text-gray-400 inline" aria-label="no" />;
    return <span>{value}</span>;
};

const Pricing = () => {
    const c = useCopy(COPY);
    const { user } = useAuth();
    const [plans, setPlans] = useState(FALLBACK);

    useEffect(() => {
        axios.get(`${API_BASE}/account/plans`).then(r => setPlans(r.data.plans)).catch(() => {});
    }, []);

    const f = plans.free;
    const p = plans.pro;
    const rows = [
        [c.rows.students, fmt(f.limits.maxStudents), fmt(p.limits.maxStudents)],
        [c.rows.classes, f.limits.maxClasses, p.limits.maxClasses],
        [c.rows.exams, f.limits.maxExams, c.unlimited],
        [c.rows.qpe, f.limits.maxQuestionsPerExam, p.limits.maxQuestionsPerExam],
        [c.rows.ai, f.limits.aiQuestionsPerMonth, fmt(p.limits.aiQuestionsPerMonth)],
        [c.rows.aiReq, f.limits.aiQuestionsPerRequest, p.limits.aiQuestionsPerRequest],
        [c.rows.upload, `${f.limits.maxUploadMb} MB`, `${p.limits.maxUploadMb} MB`],
        [c.rows.types, f.limits.examTypes.map(x => TYPE_LABEL[x]).join(', '), p.limits.examTypes.map(x => TYPE_LABEL[x]).join(', ')],
        [c.rows.attest, f.features.attestation, p.features.attestation],
        [c.rows.excel, f.features.excelExport, p.features.excelExport],
        [c.rows.results, f.features.advancedResults, p.features.advancedResults],
        [c.rows.appeals, f.features.appeals, p.features.appeals],
        [c.rows.proctor, c.proctorFree, c.proctorPro]
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-nearblack text-gray-900 dark:text-gray-100">
            <header className="border-b border-gray-200 dark:border-gray-800">
                <div className="mx-auto max-w-5xl h-16 px-4 sm:px-6 flex items-center justify-between">
                    <Link to="/"><Brand /></Link>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><ArrowLeft className="w-4 h-4" />{c.back}</Link>
                        <ThemeLangControls />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
                <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.05] text-balance max-w-3xl">{c.title}</h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">{c.lead}</p>

                <h2 className="sr-only">{c.compare}</h2>
                <div className="mt-10 overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <table className="w-full min-w-[34rem] text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800">
                                <th className="p-5 w-[38%]"></th>
                                <th className="p-5 align-bottom">
                                    <div className="font-display text-xl font-bold">{c.free}</div>
                                    <div className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">0 {c.forever}</div>
                                </th>
                                <th className="p-5 align-bottom bg-blue-50 dark:bg-blue-950/40">
                                    <div className="font-display text-xl font-bold text-blue-800 dark:text-blue-300">{c.pro}</div>
                                    <div className="mt-1 font-mono text-sm text-gray-700 dark:text-gray-300">{fmt(p.priceMonthly)} {c.perMonth}</div>
                                    <div className="font-mono text-xs text-gray-500 dark:text-gray-400">{fmt(p.priceYearly)} {c.perYear}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                            {rows.map(([label, a, b]) => (
                                <tr key={label}>
                                    <th scope="row" className="p-4 pl-5 font-medium text-gray-700 dark:text-gray-300">{label}</th>
                                    <td className="p-4 font-mono text-gray-800 dark:text-gray-200"><Cell value={a} /></td>
                                    <td className="p-4 font-mono bg-blue-50/60 dark:bg-blue-950/30 text-gray-900 dark:text-white"><Cell value={b} /></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-gray-200 dark:border-gray-800">
                                <td className="p-5"></td>
                                <td className="p-5"><Link to="/register?role=teacher" className="inline-flex h-11 items-center rounded-xl border border-gray-300 dark:border-gray-700 px-4 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800">{user ? c.free : c.ctaFree}</Link></td>
                                <td className="p-5 bg-blue-50 dark:bg-blue-950/40 space-y-2">
                                    <Link to="/register?role=teacher" className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">{c.ctaPro}</Link>
                                    <a href={CONTACT.telegramUrl} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-blue-600/30 px-4 text-sm font-semibold text-blue-800 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/30">{c.ctaContact}</a>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <section className="mt-16 grid lg:grid-cols-[1fr_1.2fr] gap-10">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-balance">{c.trialTitle}</h2>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{c.trialNote}</p>
                    </div>
                    <ol className="space-y-3">
                        {c.trialSteps.map((s, i) => (
                            <li key={s} className="flex gap-4 items-start rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                                <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-blue-600 text-white font-mono text-sm">{i + 1}</span>
                                <span className="text-gray-800 dark:text-gray-200">{s}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="mt-16">
                    <h2 className="font-display text-2xl font-bold">{c.faqTitle}</h2>
                    <dl className="mt-6 grid md:grid-cols-2 gap-x-10 gap-y-6">
                        {c.faq.map(([q, a]) => (
                            <div key={q}>
                                <dt className="font-semibold text-gray-900 dark:text-white">{q}</dt>
                                <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </main>
        </div>
    );
};

export default Pricing;
