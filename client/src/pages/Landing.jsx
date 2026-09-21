import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, FileText, Lock, MonitorOff, Sparkles, Timer, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CONTACT } from '../config';
import Brand, { BrandMark } from '../components/Brand';
import ThemeLangControls from '../components/ThemeLangControls';

const COPY = {
    uz: {
        pricing: 'Narxlar', signup: "Ro'yxatdan o'tish", signin: 'Kirish',
        priceTitle: 'Bepul boshlang, Pro bilan kengayting',
        priceText: "Talabalar doim bepul. O'qituvchilar 30 talabagacha va oyiga 30 AI savol bilan bepul boshlaydi. Haqiqiy o'qituvchilarga 3 kunlik Pro sovg'a.",
        priceCta: 'Tariflarni solishtirish',
        priceFacts: [['0', "so'm — Bepul"], ['3 kun', 'Pro sinov (tasdiqlangan ustozlarga)'], ['59 000', "so'm / oy — Pro"]],
        contactTitle: "Loyihangizga SecureExam kerakmi?",
        contactText: "Demo, narx va o'z muassasangiz uchun sozlash bo'yicha yozing — tez javob beramiz.",
        contactLabels: ['Telegram', 'Telefon', 'Email'],
        nav2: 'Aloqa',
        nav: ['Imtihon turlari', 'Xavfsizlik', 'AI yordamchi'],
        heroTitle: "Imtihon — halol, tez va nazoratli.",
        heroText: "Maktab, litsey va o'quv markazlari uchun imtihon platformasi: CHSB, Rasch, DTM va o'qituvchilar attestatsiyasi bir joyda. Savollarni AI tayyorlaydi, natijalar avtomatik hisoblanadi.",
        ctaStudent: 'Talaba kirishi', ctaTeacher: "O'qituvchi kirishi",
        mockTitle: 'Matematika · 11-sinf', mockQ: "Agar f(x) = 2x² − 3x + 1 bo'lsa, f(3) nechaga teng?",
        mockAnswered: '18 / 30 javob berildi', mockFocus: "Fokus yo'qolsa — ekran bloklanadi",
        modelsTitle: 'To‘rt imtihon modeli, bitta tizim',
        modelsText: "Har bir model o'zining baholash qoidasiga ega. Tizim ballarni o'zi hisoblaydi.",
        models: [
            ['CHSB', "B / Q / M qiyinlik toifalari bo'yicha ballar", '40 ball'],
            ['Rasch', "Qobiliyat θ → 0–100 ball → sertifikat darajasi", 'A+ … C'],
            ['DTM', "3 majburiy fan (1.1), 1-asosiy (3.1), 2-asosiy (2.1)", '90 savol · 189 ball'],
            ['Attestatsiya', "Fan, pedagogika, qonunchilik, AKT bo'yicha toifa", 'Oliy · 1 · 2 · Mutaxassis']
        ],
        secTitle: 'Imtihon davomida faqat savol va talaba',
        sec: [
            ['Butun ekran majburiy', "Talaba to'liq ekrandan chiqsa, imtihon darhol to'xtaydi."],
            ['Fokus nazorati', "Boshqa oyna yoki yorliqqa o'tish qayd etiladi va ekran bloklanadi."],
            ['PIN bilan ochish', "Faqat nazoratchi PIN kodni kiritib imtihonni davom ettiradi."]
        ],
        aiTitle: "PDF yoki Word yuklang — savollar tayyor",
        aiText: "AI hujjatdan savollarni ajratib oladi yoki materialdan 100 tagacha yangi savol yozadi. Formulalar to'g'ri ko'rsatiladi, siz esa faqat tekshirasiz.",
        aiSteps: ['Hujjatni yuklang', 'AI savollarni yozadi', 'Tekshiring va e’lon qiling'],
        rolesTitle: 'Kim uchun',
        roles: [
            ['Talaba', "Login va parol bilan kiring, imtihonni topshiring, natija va apellyatsiyani ko'ring.", '/login', 'Kirish'],
            ["O'qituvchi", "Sinflar, imtihonlar, talabalar ro'yxati va attestatsiyaga tayyorlov.", '/teacher/login', 'Kirish'],
            ['Administrator', "O'qituvchilar, sinflar va barcha natijalar ustidan nazorat.", '/admin', 'Kirish']
        ],
        footer: "Barcha huquqlar himoyalangan."
    },
    ru: {
        pricing: 'Тарифы', signup: 'Регистрация', signin: 'Войти',
        priceTitle: 'Начните бесплатно, растите с Pro',
        priceText: 'Студентам всегда бесплатно. Учителя стартуют бесплатно: до 30 студентов и 30 ИИ-вопросов в месяц. Настоящим учителям — 3 дня Pro в подарок.',
        priceCta: 'Сравнить тарифы',
        priceFacts: [['0', 'сум — Бесплатно'], ['3 дня', 'пробный Pro (подтверждённым учителям)'], ['59 000', 'сум / мес — Pro']],
        contactTitle: 'Нужен SecureExam для вашего проекта?',
        contactText: 'Напишите нам о демо, стоимости и настройке под вашу организацию — ответим быстро.',
        contactLabels: ['Telegram', 'Телефон', 'Email'],
        nav2: 'Контакты',
        nav: ['Форматы экзаменов', 'Безопасность', 'ИИ-помощник'],
        heroTitle: 'Экзамен — честный, быстрый и под контролем.',
        heroText: 'Платформа для школ, лицеев и учебных центров: CHSB, Rasch, DTM и аттестация учителей в одном месте. ИИ готовит вопросы, результаты считаются автоматически.',
        ctaStudent: 'Вход для студентов', ctaTeacher: 'Вход для учителей',
        mockTitle: 'Математика · 11 класс', mockQ: 'Если f(x) = 2x² − 3x + 1, чему равно f(3)?',
        mockAnswered: 'Отвечено 18 из 30', mockFocus: 'Потеря фокуса — экран блокируется',
        modelsTitle: 'Четыре модели экзамена, одна система',
        modelsText: 'У каждой модели свои правила оценивания. Баллы считаются автоматически.',
        models: [
            ['CHSB', 'Баллы по категориям сложности B / Q / M', '40 баллов'],
            ['Rasch', 'Способность θ → 0–100 баллов → уровень сертификата', 'A+ … C'],
            ['DTM', '3 обязательных предмета (1.1), 1-й профильный (3.1), 2-й (2.1)', '90 вопросов · 189 баллов'],
            ['Аттестация', 'Предмет, педагогика, законодательство, ИКТ → категория', 'Высшая · 1 · 2 · Специалист']
        ],
        secTitle: 'Во время экзамена — только вопрос и студент',
        sec: [
            ['Только полный экран', 'Если студент выходит из полноэкранного режима, экзамен сразу приостанавливается.'],
            ['Контроль фокуса', 'Переключение окна или вкладки фиксируется, экран блокируется.'],
            ['Разблокировка по PIN', 'Продолжить экзамен может только наблюдатель, введя PIN-код.']
        ],
        aiTitle: 'Загрузите PDF или Word — вопросы готовы',
        aiText: 'ИИ извлекает вопросы из документа или пишет до 100 новых по материалу. Формулы отображаются корректно, вам остаётся проверить.',
        aiSteps: ['Загрузите документ', 'ИИ пишет вопросы', 'Проверьте и опубликуйте'],
        rolesTitle: 'Для кого',
        roles: [
            ['Студент', 'Войдите по логину и паролю, сдайте экзамен, смотрите результат и подавайте апелляцию.', '/login', 'Войти'],
            ['Учитель', 'Классы, экзамены, списки студентов и подготовка к аттестации.', '/teacher/login', 'Войти'],
            ['Администратор', 'Учителя, классы и контроль всех результатов.', '/admin', 'Войти']
        ],
        footer: 'Все права защищены.'
    },
    en: {
        pricing: 'Pricing', signup: 'Sign up', signin: 'Sign in',
        priceTitle: 'Start free, grow with Pro',
        priceText: 'Students are always free. Teachers start free with up to 30 students and 30 AI questions a month. Verified teachers get 3 days of Pro on us.',
        priceCta: 'Compare plans',
        priceFacts: [['0', 'UZS — Free'], ['3 days', 'Pro trial (verified teachers)'], ['59,000', 'UZS / month — Pro']],
        contactTitle: 'Want SecureExam for your institution?',
        contactText: 'Reach out for a demo, pricing or a setup tailored to your organisation. We reply fast.',
        contactLabels: ['Telegram', 'Phone', 'Email'],
        nav2: 'Contact',
        nav: ['Exam models', 'Security', 'AI assistant'],
        heroTitle: 'Exams that are fair, fast and supervised.',
        heroText: 'An exam platform for schools, lyceums and learning centres: CHSB, Rasch, DTM and teacher attestation in one place. AI drafts the questions, results are scored automatically.',
        ctaStudent: 'Student sign in', ctaTeacher: 'Teacher sign in',
        mockTitle: 'Mathematics · Grade 11', mockQ: 'If f(x) = 2x² − 3x + 1, what is f(3)?',
        mockAnswered: '18 of 30 answered', mockFocus: 'Lose focus — the screen locks',
        modelsTitle: 'Four exam models, one system',
        modelsText: 'Each model has its own scoring rules. The system calculates the marks for you.',
        models: [
            ['CHSB', 'Points by B / Q / M difficulty categories', '40 points'],
            ['Rasch', 'Ability θ → 0–100 score → certificate level', 'A+ … C'],
            ['DTM', '3 mandatory subjects (1.1), 1st major (3.1), 2nd major (2.1)', '90 questions · 189 pts'],
            ['Attestation', 'Subject, pedagogy, law and ICT → qualification category', 'Highest · 1st · 2nd · Specialist']
        ],
        secTitle: 'During the exam, only the question and the student',
        sec: [
            ['Fullscreen required', 'If the student leaves fullscreen, the exam pauses immediately.'],
            ['Focus tracking', 'Switching window or tab is logged and the screen is locked.'],
            ['Unlock with a PIN', 'Only the invigilator can resume the exam by entering the PIN.']
        ],
        aiTitle: 'Upload a PDF or Word file — get questions',
        aiText: 'AI extracts questions from a document or writes up to 100 new ones from your material. Formulas render correctly; you only review.',
        aiSteps: ['Upload the document', 'AI writes the questions', 'Review and publish'],
        rolesTitle: 'Who it is for',
        roles: [
            ['Student', 'Sign in with your login, take exams, see results and file appeals.', '/login', 'Sign in'],
            ['Teacher', 'Classes, exams, student lists and attestation preparation.', '/teacher/login', 'Sign in'],
            ['Administrator', 'Teachers, classes and oversight of every result.', '/admin', 'Sign in']
        ],
        footer: 'All rights reserved.'
    }
};

const SEC_ICONS = [MonitorOff, Eye, Lock];

const ExamMock = ({ c }) => (
    <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_24px_60px_-24px_rgba(20,44,88,0.35)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.mockTitle}</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-blue-700 dark:text-blue-300"><Timer className="w-4 h-4" />42:18</span>
        </div>
        <div className="grid sm:grid-cols-[1fr_auto]">
            <div className="p-5">
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mb-2">Q 19 / 30</p>
                <p className="font-display text-lg font-semibold text-gray-900 dark:text-white leading-snug">{c.mockQ}</p>
                <ul className="mt-4 space-y-2">
                    {['A) 10', 'B) 12', 'C) 14', 'D) 16'].map((o, i) => (
                        <li key={o} className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium ${i === 2 ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200' : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}>{o}</li>
                    ))}
                </ul>
            </div>
            <div className="hidden sm:grid grid-cols-5 gap-1.5 content-start p-5 border-l border-gray-200 dark:border-gray-800">
                {Array.from({ length: 30 }, (_, i) => (
                    <span key={i} className={`w-6 h-6 rounded grid place-items-center font-mono text-[10px] ${i < 18 ? 'bg-blue-600 text-white' : i === 18 ? 'ring-2 ring-blue-600 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{i + 1}</span>
                ))}
            </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-950/60 border-t border-gray-200 dark:border-gray-800 text-xs">
            <span className="font-mono text-gray-600 dark:text-gray-400">{c.mockAnswered}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2.5 py-1 font-semibold"><Lock className="w-3 h-3" />{c.mockFocus}</span>
        </div>
    </div>
);

const Landing = () => {
    const { language } = useAuth();
    const c = COPY[language] || COPY.uz;
    const anchors = ['models', 'security', 'ai'];
    const contactLinks = [
        [CONTACT.telegram, CONTACT.telegramUrl],
        [CONTACT.phoneLabel, `tel:${CONTACT.phone}`],
        [CONTACT.email, `mailto:${CONTACT.email}`]
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-nearblack text-gray-900 dark:text-gray-100">
            <header className="sticky top-0 z-30 border-b border-gray-200/80 dark:border-gray-800/80 bg-gray-50/85 dark:bg-nearblack/85 backdrop-blur">
                <div className="mx-auto max-w-6xl h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
                    <Brand />
                    <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {c.nav.map((label, i) => <a key={label} href={`#${anchors[i]}`} className="hover:text-gray-900 dark:hover:text-white">{label}</a>)}
                        <Link to="/pricing" className="hover:text-gray-900 dark:hover:text-white">{c.pricing}</Link>
                        <a href="#contact" className="hover:text-gray-900 dark:hover:text-white">{c.nav2}</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <ThemeLangControls />
                        <Link to="/login" className="hidden sm:inline-flex h-9 items-center px-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white">{c.signin}</Link>
                        <Link to="/register" className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">{c.signup}</Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-20 grid lg:grid-cols-[1fr_1.05fr] gap-12 items-center">
                    <div>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.05] tracking-tight text-balance">{c.heroTitle}</h1>
                        <p className="mt-5 max-w-xl text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{c.heroText}</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to="/register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">{c.signup} <ArrowRight className="w-4 h-4" /></Link>
                            <Link to="/teacher/login" className="inline-flex h-12 items-center rounded-xl border border-gray-300 dark:border-gray-700 px-6 font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900">{c.ctaTeacher}</Link>
                            <Link to="/login" className="inline-flex h-12 items-center px-2 font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">{c.ctaStudent}</Link>
                        </div>
                    </div>
                    <ExamMock c={c} />
                </section>

                {/* Exam models */}
                <section id="models" className="border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid lg:grid-cols-[0.8fr_1.4fr] gap-10">
                        <div>
                            <h2 className="font-display text-3xl font-bold text-balance">{c.modelsTitle}</h2>
                            <p className="mt-3 text-gray-600 dark:text-gray-400">{c.modelsText}</p>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
                            {c.models.map(([name, desc, spec]) => (
                                <li key={name} className="grid sm:grid-cols-[8rem_1fr_auto] gap-x-6 gap-y-1 py-4 items-baseline">
                                    <span className="font-display text-lg font-bold text-blue-700 dark:text-blue-300">{name}</span>
                                    <span className="text-gray-700 dark:text-gray-300">{desc}</span>
                                    <span className="font-mono text-sm text-gray-500 dark:text-gray-400 sm:text-right">{spec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Security */}
                <section id="security" className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
                    <h2 className="font-display text-3xl font-bold max-w-2xl text-balance">{c.secTitle}</h2>
                    <div className="mt-10 grid md:grid-cols-3 gap-x-10 gap-y-8">
                        {c.sec.map(([title, text], i) => {
                            const Icon = SEC_ICONS[i];
                            return (
                                <div key={title}>
                                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
                                    <p className="mt-1.5 text-gray-600 dark:text-gray-400 leading-relaxed">{text}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* AI */}
                <section id="ai" className="bg-blue-900 text-white">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-saffron-300"><Sparkles className="w-4 h-4" />AI</span>
                            <h2 className="mt-3 font-display text-3xl font-bold text-white text-balance">{c.aiTitle}</h2>
                            <p className="mt-3 text-blue-100/85 leading-relaxed max-w-lg">{c.aiText}</p>
                        </div>
                        <ol className="space-y-3">
                            {c.aiSteps.map((s, i) => (
                                <li key={s} className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 px-5 py-4">
                                    <span className="grid place-items-center w-8 h-8 rounded-full bg-saffron-400 text-blue-950 font-mono font-semibold">{i + 1}</span>
                                    <span className="font-medium">{s}</span>
                                    {i === 0 && <FileText className="ml-auto w-5 h-5 text-blue-200" />}
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Roles */}
                <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
                    <h2 className="font-display text-3xl font-bold flex items-center gap-3"><Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />{c.rolesTitle}</h2>
                    <div className="mt-8 grid md:grid-cols-3 gap-4">
                        {c.roles.map(([name, text, to, cta]) => (
                            <Link key={name} to={to} className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-blue-600 dark:hover:border-blue-500 transition-colors">
                                <h3 className="font-display text-xl font-bold">{name}</h3>
                                <p className="mt-2 flex-1 text-gray-600 dark:text-gray-400 leading-relaxed">{text}</p>
                                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400">{cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Pricing teaser */}
                <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
                    <div>
                        <h2 className="font-display text-3xl font-bold text-balance">{c.priceTitle}</h2>
                        <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">{c.priceText}</p>
                        <Link to="/pricing" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 px-5 font-semibold hover:bg-gray-100 dark:hover:bg-gray-900">{c.priceCta} <ArrowRight className="w-4 h-4" /></Link>
                    </div>
                    <dl className="grid grid-cols-3 gap-4 text-center">
                        {c.priceFacts.map(([n, l]) => (
                            <div key={l} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                                <dt className="font-mono text-xl sm:text-2xl font-semibold text-blue-700 dark:text-blue-300">{n}</dt>
                                <dd className="mt-1 text-xs text-gray-600 dark:text-gray-400">{l}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* Contact */}
                <section id="contact" className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
                        <div>
                            <h2 className="font-display text-3xl font-bold text-balance">{c.contactTitle}</h2>
                            <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">{c.contactText}</p>
                        </div>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
                            {contactLinks.map(([label, href], i) => (
                                <li key={href}>
                                    <a href={href} target={i === 0 ? '_blank' : undefined} rel="noreferrer" className="group flex items-center justify-between gap-4 py-4">
                                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 w-24">{c.contactLabels[i]}</span>
                                        <span className="flex-1 font-mono text-base sm:text-lg text-gray-900 dark:text-white break-all group-hover:text-blue-700 dark:group-hover:text-blue-300">{label}</span>
                                        <ArrowRight className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-1" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </main>

            <footer className="border-t border-gray-200 dark:border-gray-800">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-2"><BrandMark className="w-5 h-5 text-blue-600 dark:text-blue-400" />SecureExam © {new Date().getFullYear()}</span>
                    <span>{c.footer}</span>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
