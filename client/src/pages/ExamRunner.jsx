import { assetUrl } from '../config';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import SecurityWrapper from '../components/SecurityWrapper';
import FormulaRenderer from '../components/FormulaRenderer';
import {
    Maximize2,
    Minimize2,
    Sun,
    Moon,
    Clock,
    ShieldCheck,
    AlertCircle,
    Send,
    MessageSquare,
    Flag,
    LogOut,
    Globe
} from 'lucide-react';

const ExamRunner = () => {
    const { id: examId } = useParams();
    const { api, user, t, theme, toggleTheme, language, changeLanguage } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [submissionId, setSubmissionId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [zoomedImage, setZoomedImage] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [appealModal, setAppealModal] = useState({ isOpen: false, questionId: null });
    const [appealMessage, setAppealMessage] = useState('');
    const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
    const [appealSuccess, setAppealSuccess] = useState(false);
    const [appealError, setAppealError] = useState('');
    const [submittedAppeals, setSubmittedAppeals] = useState(new Set());
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'error' });

    useEffect(() => {
        const initExam = async () => {
            try {
                const examRes = await api.get(`/exams/${examId}/take`);
                const questionsData = examRes.data.Questions || examRes.data.questions || [];
                const examData = { ...examRes.data, Questions: questionsData };
                setExam(examData);
                setTimeLeft(examRes.data.duration_minutes * 60);
                if (examData.pin_code) setShowPinModal(true);
                const subRes = await api.post('/submissions/start', { exam_id: examId });
                setSubmissionId(subRes.data.id);
                if (!examData.pin_code) setLoading(false);
            } catch (err) {
                console.error('Error loading exam:', err);
                setLoading(false); // CRITICAL: Clear loading state to show error
                if (err.response?.data?.code === 'EXAM_NOT_STARTED') {
                    const startTime = new Date(err.response.data.startTime).toLocaleString();
                    setCustomAlert({
                        isOpen: true,
                        title: t('exam'),
                        message: `${t('exam_not_started_yet')} ${startTime}`,
                        type: 'info'
                    });
                } else if (err.response?.data?.code === 'EXAM_ENDED') {
                    setCustomAlert({
                        isOpen: true,
                        title: t('exam'),
                        message: t('exam_session_ended'),
                        type: 'error'
                    });
                } else if (err.response?.data?.alreadyTaken) {
                    setCustomAlert({
                        isOpen: true,
                        title: t('exam'),
                        message: t('exam_already_taken'),
                        type: 'error'
                    });
                } else {
                    setCustomAlert({
                        isOpen: true,
                        title: 'Error',
                        message: err.response?.data?.message || err.response?.data?.error || 'Failed to load exam or exam not active.',
                        type: 'error'
                    });
                }
            }
        };
        initExam();
    }, [examId, api, navigate]);

    useEffect(() => {
        if (!timeLeft || loading) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    submitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, loading]);

    const handleViolation = async (type) => {
        if (!submissionId) return;
        try {
            await api.post('/submissions/log-violation', { submission_id: submissionId, event_type: type });
        } catch (e) {
            console.error(e);
        }
    };

    const submitExam = async () => {
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, val]) => {
                // Check if it's a Type 3 dual answer (object with answer1 and answer2)
                if (typeof val === 'object' && val.answer1 !== undefined) {
                    return {
                        question_id: qId,
                        student_answer: val.answer1 || '',
                        student_answer_2: val.answer2 || ''
                    };
                }
                // Otherwise it's a normal string answer (Type 1 or Type 2)
                return {
                    question_id: qId,
                    student_answer: val,
                    student_answer_2: null
                };
            });
            await api.post('/submissions/submit', { submission_id: submissionId, answers: formattedAnswers });
            showAlert(t('exam_finished'), t('exam_success_msg') || 'Your answers have been submitted successfully.', 'success');
            navigate(user?.role === 'teacher' ? '/teacher/attestation' : '/student');
        } catch (err) {
            console.error('Submission error:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Submission failed, please try again.';
            showAlert('Error', errorMsg, 'error');
        } finally {
            setShowSubmitConfirm(false);
        }
    };

    const handleAppealSubmit = async () => {
        if (!appealMessage.trim()) return;
        setIsSubmittingAppeal(true);
        setAppealError('');
        try {
            await api.post('/appeals', {
                subject: exam.title,
                title: `Error in question #${currentQuestionIndex + 1}`,
                message: appealMessage,
                question_id: appealModal.questionId,
                exam_id: examId
            });
            setAppealSuccess(true);
            setSubmittedAppeals(prev => new Set(prev).add(appealModal.questionId));
            setTimeout(() => {
                setAppealModal({ isOpen: false, questionId: null });
                setAppealMessage('');
                setAppealSuccess(false);
            }, 2000);
        } catch (err) {
            setAppealError(t('save_error') || 'Failed to submit application. Please try again.');
        } finally {
            setIsSubmittingAppeal(false);
        }
    };

    const handlePinSubmit = () => {
        if (!exam.pin_code || pinInput === exam.pin_code) {
            setPinError('');
            setShowPinModal(false);
            setLoading(false);
        } else {
            setPinError(t('incorrect_pin'));
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading && !showPinModal) return <div className="min-h-screen flex items-center justify-center dark:bg-nearblack dark:text-white font-black text-2xl animate-pulse">Initializing Exam...</div>;

    const currentQuestion = exam?.Questions?.[currentQuestionIndex];
    const totalQuestions = exam?.Questions?.length || 0;

    // An exam published without questions must not crash the runner.
    if (exam && totalQuestions === 0) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-nearblack p-6">
                <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
                    <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t('no_questions_yet')}</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('no_questions_hint')}</p>
                    <button onClick={() => navigate(user?.role === 'teacher' ? '/teacher/attestation' : '/student')} className="mt-6 h-11 px-5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">{t('exit')}</button>
                </div>
            </div>
        );
    }

    return (
        <SecurityWrapper onViolation={handleViolation}>
            {/* Modal Components (PIN, Submission, Appeal, Zoom) - Keep as is but ensured z-index */}
            {showPinModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110]">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full border dark:border-gray-800">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-center dark:text-white">{t('enter_pin')}</h2>
                        <input
                            type="text"
                            name="exam_access_q"
                            autoComplete="new-password"
                            placeholder="****"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                            style={{ WebkitTextSecurity: 'disc' }}
                            className="w-full border-2 dark:border-gray-700 p-4 rounded-xl mb-4 text-center text-2xl tracking-[0.5em] font-bold dark:bg-gray-800 dark:text-white focus:border-blue-500 outline-none transition-all"
                            autoFocus
                        />
                        {pinError && <p className="text-red-500 mb-4 text-center font-bold flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {pinError}
                        </p>}
                        <button
                            onClick={handlePinSubmit}
                            className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        >
                            {t('verify_pin')}
                        </button>
                    </div>
                </div>
            )}

            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-10 max-w-md w-full border dark:border-gray-800 shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-6">
                            <Send className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-3xl font-black mb-4 dark:text-white">{t('finish_exam_q')}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            {t('finish_confirm')}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={submitExam}
                                className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"
                            >
                                {t('yes_submit')}
                            </button>
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-5 rounded-2xl font-bold text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                {t('continue_exam')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {appealModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-10 max-w-lg w-full border dark:border-gray-800 shadow-2xl animate-in zoom-in duration-300">
                        {appealSuccess ? (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h2 className="text-3xl font-black dark:text-white mb-2">{t('reported')}!</h2>
                                <p className="text-gray-500 dark:text-gray-400">{t('application_submitted_success')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl">
                                            <MessageSquare className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black dark:text-white">{t('exam_issue')}</h2>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{t('question')} #{currentQuestionIndex + 1}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setAppealModal({ isOpen: false, questionId: null })} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
                                </div>
                                <textarea
                                    className={`w-full bg-gray-50 dark:bg-gray-800 border-2 ${appealError ? 'border-red-500' : 'dark:border-gray-700'} p-6 rounded-2xl mb-4 h-40 outline-none focus:border-amber-500 dark:text-white font-bold transition-all`}
                                    placeholder="..."
                                    value={appealMessage}
                                    onChange={(e) => setAppealMessage(e.target.value)}
                                    autoFocus
                                />
                                {appealError && (
                                    <div className="text-red-500 text-sm font-bold mb-4 flex items-center gap-2 px-2">
                                        <AlertCircle className="w-4 h-4" /> {appealError}
                                    </div>
                                )}
                                <button
                                    disabled={!appealMessage.trim() || isSubmittingAppeal}
                                    onClick={handleAppealSubmit}
                                    className="w-full bg-amber-600 text-white p-5 rounded-2xl font-black text-xl hover:bg-amber-700 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50"
                                >
                                    {isSubmittingAppeal ? t('saving') : t('submit_application')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {zoomedImage && (
                <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
                    <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                    <button className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full hover:bg-white/20">
                        <Minimize2 className="w-8 h-8" />
                    </button>
                </div>
            )}

            {/* Layout Wrapper: Fixed Viewport, Flex Column, No Scroll */}
            <div className={`h-screen flex flex-col bg-warm-50 dark:bg-nearblack transition-colors select-none overflow-hidden ${loading ? 'blur-sm' : ''} ${isFocusMode ? 'focus-mode-active' : ''}`} style={{ userSelect: 'none' }}>

                {/* Fixed Header: shrink-0 */}
                <header className="h-20 shrink-0 bg-warm-100 dark:bg-gray-900 border-b border-warm-gray-200 dark:border-gray-800 px-8 flex justify-between items-center shadow-warm-md z-10 transition-colors">
                    <div className="flex items-center gap-6">
                        <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black dark:text-white line-clamp-1 max-w-md">
                                {exam?.translations?.title?.[language] || exam?.title}
                            </h1>
                            <p className="text-[10px] text-gray-500 font-bold line-clamp-1">
                                {exam?.translations?.description?.[language] || exam?.description}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-400 font-bold uppercase tracking-widest leading-none">
                                    {t('question')} {currentQuestionIndex + 1} / {totalQuestions}
                                </span>
                                {exam?.Class && (
                                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest leading-none">
                                        {t('classes')}: {exam.Class.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            title={t('theme')}
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border dark:border-gray-700">
                            <Globe className="w-4 h-4 text-gray-700 dark:text-gray-500" />
                            <select
                                value={language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                className="bg-transparent text-sm font-black focus:outline-none text-gray-900 dark:text-gray-300"
                            >
                                <option value="uz">UZ</option>
                                <option value="ru">RU</option>
                                <option value="en">EN</option>
                            </select>
                        </div>
                        <div className={`px-4 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center`}>
                            <span className="text-[8px] font-black text-blue-500 uppercase leading-none mb-0.5">{t('time_left')}</span>
                            <div className={`text-xl font-black font-mono tracking-tighter transition-colors leading-none ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSubmitConfirm(true)}
                            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            <Send className="w-4 h-4" /> {t('submit_exam')}
                        </button>
                    </div>
                </header>

                {/* Main Content Area: flex-1, overflow-hidden */}
                <main className="flex-1 overflow-hidden flex flex-col items-center justify-center p-6 md:p-8">
                    <div className="w-full max-w-5xl h-full flex flex-col bg-warm-100 dark:bg-gray-900 rounded-[40px] shadow-warm-xl border border-warm-gray-200 dark:border-gray-800 p-8 pt-6 relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">

                        {/* Question Content: Layout ensures no scrolling */}
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Question Text and Image Container - Side by Side */}
                            <div className="shrink-0 mb-6">
                                {/* Question Header with Number and Points */}
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-amber-soft dark:text-blue-400 text-2xl font-black shrink-0 select-none">#{currentQuestionIndex + 1}</span>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-3 py-1 bg-warm-200 dark:bg-gray-800 rounded-full text-[10px] font-black text-warm-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                                {currentQuestion?.category || 'B'}
                                            </span>
                                            <span className="text-[10px] font-bold text-amber-soft dark:text-blue-500">{parseFloat(currentQuestion?.points || 0).toFixed(1)} Pts</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Question Text and Image Grid */}
                                <div className={`grid gap-6 ${(currentQuestion?.local_image_path || currentQuestion?.image_url) ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                                    {/* Question Text */}
                                    <div className="flex items-start overflow-y-auto max-h-[30vh] lg:max-h-full scrollbar-thin">
                                        <h3 className="exam-text text-base md:text-lg font-semibold text-warm-gray-800 dark:text-gray-100 leading-relaxed">
                                            <FormulaRenderer content={currentQuestion?.translations?.content?.[language] || currentQuestion?.content} />
                                        </h3>
                                    </div>

                                    {/* Image Container - Only if image exists */}
                                    {(currentQuestion?.local_image_path || currentQuestion?.image_url) && (
                                        <div className="flex items-center justify-center">
                                            <div className="relative w-full max-h-[40vh] group">
                                                <img
                                                    src={currentQuestion.local_image_path
                                                        ? assetUrl(currentQuestion.local_image_path.startsWith('/') ? currentQuestion.local_image_path : `/${currentQuestion.local_image_path}`)
                                                        : currentQuestion.image_url}
                                                    alt="Question illustration"
                                                    className="w-full h-auto max-h-[40vh] object-contain rounded-2xl border-2 border-warm-gray-200 dark:border-gray-800 shadow-warm-lg cursor-zoom-in group-hover:brightness-95 transition-all text-xs text-warm-gray-400"
                                                    onClick={() => setZoomedImage(currentQuestion.local_image_path
                                                        ? assetUrl(currentQuestion.local_image_path.startsWith('/') ? currentQuestion.local_image_path : `/${currentQuestion.local_image_path}`)
                                                        : currentQuestion.image_url)}
                                                    onError={(e) => {
                                                        console.error('Image failed to load:', e.target.src);
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Maximize2 className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Answer Options: shrink-0 or min-h-0 if options are long */}
                            <div className="shrink-0">
                                {/* Type 1: Radio Buttons */}
                                {currentQuestion?.question_type === 'type1_mcq_4' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                        {currentQuestion?.options?.map((opt, i) => (
                                            <label
                                                key={i}
                                                className={`flex items-center p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 ${answers[currentQuestion.id] === opt ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/10 dark:border-blue-500 dark:text-white' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:text-gray-200'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${answers[currentQuestion.id] === opt ? 'border-blue-600 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'border-gray-300 dark:border-gray-600'}`}>
                                                    {answers[currentQuestion.id] === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                <input type="radio" className="hidden" checked={answers[currentQuestion.id] === opt} onChange={() => setAnswers({ ...answers, [currentQuestion.id]: opt })} />
                                                <span className="text-lg font-bold truncate">
                                                    <FormulaRenderer content={currentQuestion?.translations?.options?.[language]?.[i] || opt} />
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Type 2: Dropdown */}
                                {currentQuestion?.question_type === 'type2_mcq_6' && (
                                    <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border-2 border-purple-200 dark:border-purple-800/30">
                                        <label className="block text-[10px] font-black text-purple-700 dark:text-purple-400 mb-3 uppercase tracking-[0.2em]">Select Matching Answer (A-F)</label>
                                        <select
                                            value={answers[currentQuestion.id] || ''}
                                            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                                            className="w-full border-2 dark:border-purple-700 p-4 rounded-xl dark:bg-gray-800 dark:text-white text-xl font-bold outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">-- {t('choose_option')} --</option>
                                            {currentQuestion?.options?.map((opt, i) => (
                                                <option key={i} value={opt}>
                                                    {currentQuestion?.translations?.options?.[language]?.[i] || opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Type 3: Dual Inputs */}
                                {currentQuestion?.question_type === 'type3_open_dual' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border-2 border-amber-200 dark:border-amber-800/30">
                                        <div className="col-span-full flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Enter Two Separate Answers</span>
                                        </div>
                                        <input
                                            placeholder="First Answer"
                                            value={answers[currentQuestion.id]?.answer1 || ''}
                                            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: { ...(answers[currentQuestion.id] || {}), answer1: e.target.value } })}
                                            className="w-full border-2 dark:border-amber-700 p-4 rounded-xl dark:bg-gray-800 dark:text-white text-lg font-bold outline-none focus:border-amber-500 transition-all"
                                        />
                                        <input
                                            placeholder="Second Answer"
                                            value={answers[currentQuestion.id]?.answer2 || ''}
                                            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: { ...(answers[currentQuestion.id] || {}), answer1: answers[currentQuestion.id]?.answer1 || '', answer2: e.target.value } })}
                                            className="w-full border-2 dark:border-amber-700 p-4 rounded-xl dark:bg-gray-800 dark:text-white text-lg font-bold outline-none focus:border-amber-500 transition-all"
                                        />
                                    </div>
                                )}

                                {/* Fallback Radio */}
                                {(!currentQuestion?.question_type || (currentQuestion.type === 'mcq' && !currentQuestion.question_type)) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                        {currentQuestion?.options?.map((opt, i) => (
                                            <label
                                                key={i}
                                                className={`flex items-center p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 ${answers[currentQuestion.id] === opt
                                                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/10 dark:border-blue-500 dark:text-white'
                                                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:text-gray-200'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${answers[currentQuestion.id] === opt
                                                    ? 'border-blue-600 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                    }`}>
                                                    {answers[currentQuestion.id] === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    className="hidden"
                                                    checked={answers[currentQuestion.id] === opt}
                                                    onChange={() => setAnswers({ ...answers, [currentQuestion.id]: opt })}
                                                />
                                                <span className="text-lg font-bold truncate">
                                                    <FormulaRenderer content={currentQuestion?.translations?.options?.[language]?.[i] || opt} />
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Question Application Button: Fixed Pos at bottom right of card */}
                        {/* Moved to footer */}
                    </div>
                </main>

                {/* Fixed Footer: shrink-0 */}
                <footer className="h-24 shrink-0 border-t border-warm-gray-200 bg-warm-100 dark:bg-gray-900 dark:border-gray-800 flex items-center justify-between px-10 z-10">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-sm border-2 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-20 disabled:pointer-events-none"
                    >
                        {t('previous')}
                    </button>

                    {/* Compact Navigation Pills */}
                    <div className="hidden lg:flex gap-1.5">
                        {exam.Questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all border-2 ${idx === currentQuestionIndex
                                    ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg'
                                    : (answers[exam.Questions[idx].id]
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
                                        : 'bg-white border-gray-100 text-gray-400 dark:bg-gray-800 dark:border-gray-800')
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => !submittedAppeals.has(currentQuestion.id) && setAppealModal({ isOpen: true, questionId: currentQuestion.id })}
                            disabled={submittedAppeals.has(currentQuestion.id)}
                            className={`px-3 py-2 rounded-xl font-bold text-[8px] uppercase tracking-widest flex items-center gap-2 transition-all border ${submittedAppeals.has(currentQuestion.id)
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 opacity-80'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-100 border-amber-100 dark:border-amber-800'
                                }`}
                            title={t('report_issue')}
                        >
                            {submittedAppeals.has(currentQuestion.id) ? <ShieldCheck className="w-3 h-3" /> : <Flag className="w-3 h-3" />}
                            <span className="hidden xl:inline">{submittedAppeals.has(currentQuestion.id) ? t('reported') : t('report_issue')}</span>
                        </button>

                        {currentQuestionIndex === totalQuestions - 1 ? (
                            <button
                                onClick={() => setShowSubmitConfirm(true)}
                                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 animate-bounce-short"
                            >
                                <Send className="w-5 h-5" /> {t('submit_exam')}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                                className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                            >
                                {t('next_question')}
                                <div className="w-2 h-0.5 bg-white/40 group-hover:w-4 transition-all" />
                            </button>
                        )}
                    </div>
                </footer>

                {/* Custom Alert Modal */}
                {customAlert.isOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[250] p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-[32px] p-10 max-w-md w-full border dark:border-gray-800 shadow-2xl animate-in zoom-in duration-300 text-center">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${customAlert.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black mb-4 dark:text-white">{customAlert.title}</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-bold">
                                {customAlert.message}
                            </p>
                            <button
                                onClick={() => navigate(user?.role === 'teacher' ? '/teacher/attestation' : '/student')}
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                            >
                                {t('exit')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SecurityWrapper>
    );
};

export default ExamRunner;
