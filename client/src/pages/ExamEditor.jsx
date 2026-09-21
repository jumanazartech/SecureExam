import { assetUrl } from '../config';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { ArrowLeft, Plus, Image as ImageIcon, Save, Sun, Moon, Globe, Trash2, Upload, Send, Check, X, Clock, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import AIImportModal from '../components/AIImportModal';
import FormulaRenderer from '../components/FormulaRenderer';

const ExamEditor = () => {
    const { user, api, t, theme, toggleTheme, language, changeLanguage, logout, account } = useAuth();
    // Exam types the current plan may create (admins and Pro: all)
    const allowedTypes = account?.usage?.limits?.examTypes || ['chsb', 'rasch_national_cert', 'dtm', 'attestation'];
    const lockedType = (type) => {
        if (allowedTypes.includes(type)) return false;
        window.dispatchEvent(new CustomEvent('plan-limit', { detail: { message: t('pro_type_locked') } }));
        return true;
    };
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID if editing
    const [exam, setExam] = useState({
        title: '',
        duration_minutes: 60,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        exam_type: 'chsb', // Default to CHSB
        subject: '',
        total_questions: 0,
        description: '',
        translations: {
            title: { uz: '', ru: '', en: '' },
            instructions: { uz: '', ru: '', en: '' },
            description: { uz: '', ru: '', en: '' }
        }
    });
    const [questions, setQuestions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [currentQ, setCurrentQ] = useState({
        type: 'mcq',
        content: '',
        image_url: '',
        local_image_path: '',
        options: ['', '', '', ''],
        correct_answer: '',
        correct_answer_2: '', // For Rasch Type 3
        answer_variants: [], // For Rasch Type 3
        points: 0,
        category: 'B', // For CHSB only
        section: 'subject', // For attestation only
        question_type: 'type1_mcq_4', // For Rasch only
        translations: {
            content: { uz: '', ru: '', en: '' },
            options: { uz: [], ru: [], en: [] },
            correct_answer: { uz: '', ru: '', en: '' },
            correct_answer_2: { uz: '', ru: '', en: '' }
        }
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [savedExamId, setSavedExamId] = useState(null);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [editLang, setEditLang] = useState('uz'); // Current language being edited in the form
    const [examLangs, setExamLangs] = useState({ uz: true, ru: false, en: false }); // Active languages for this exam
    const fileInputRef = React.useRef(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishData, setPublishData] = useState({
        class_id: '',
        pin_code: '',
        active_start: '',
        active_end: ''
    });
    const [showAIModal, setShowAIModal] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => {
        fetchClasses();
        if (id) {
            fetchExamDetails(id);
        }
    }, [id]);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
    };

    const fetchExamDetails = async (examId) => {
        try {
            const res = await api.get(`/exams/${examId}`);
            const data = res.data;
            setExam({
                title: data.title,
                duration_minutes: data.duration_minutes,
                is_active: data.is_active,
                shuffle_questions: data.shuffle_questions,
                shuffle_options: data.shuffle_options,
                exam_type: data.exam_type || 'chsb',
                subject: data.subject || '',
                total_questions: data.total_questions || 0,
                description: data.description || '',
                translations: data.translations || {
                    title: { uz: '', ru: '', en: '' },
                    instructions: { uz: '', ru: '', en: '' },
                    description: { uz: '', ru: '', en: '' }
                }
            });
            setQuestions(data.Questions || []);
            setSavedExamId(data.id);

            // Pre-fill publish data if available
            if (data.status === 'published') {
                const toLocalISO = (dateStr) => {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return '';
                    const offset = date.getTimezoneOffset() * 60000;
                    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
                };

                setPublishData({
                    class_id: data.class_id,
                    pin_code: data.pin_code,
                    active_start: toLocalISO(data.active_start),
                    active_end: toLocalISO(data.active_end)
                });
            }
        } catch (err) {
            console.error('Failed to fetch exam details:', err);
            showAlert('Error', t('load_exam_failed'), 'error');
            setTimeout(() => navigate(user?.role === 'teacher' ? '/teacher' : '/admin'), 1500);
        }
    };

    // DTM: 1-30 mandatory subjects (1.1), 31-60 first major subject (3.1), 61-90 second major subject (2.1)
    const dtmPointsFor = (index) => (index < 30 ? 1.1 : index < 60 ? 3.1 : 2.1);

    const calculatePoints = (currentQuestions) => {
        if (exam.exam_type === 'dtm') {
            return currentQuestions.map((q, i) => ({ ...q, points: dtmPointsFor(i) }));
        }
        if (exam.exam_type === 'attestation') {
            // every question is worth the same; the exam totals 100
            const each = currentQuestions.length ? parseFloat((100 / currentQuestions.length).toFixed(3)) : 0;
            return currentQuestions.map(q => ({ ...q, points: each }));
        }
        const weights = { B: 2, Q: 2.8, M: 4 };
        let totalWeight = 0;
        currentQuestions.forEach(q => {
            totalWeight += weights[q.category || 'B'];
        });

        if (totalWeight === 0) return currentQuestions;

        const multiplier = 40 / totalWeight;
        return currentQuestions.map(q => ({
            ...q,
            points: parseFloat((weights[q.category || 'B'] * multiplier).toFixed(1))
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('image', file);

            const res = await api.post('/exams/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setCurrentQ({ ...currentQ, local_image_path: res.data.imagePath, image_url: '' });
            showAlert(t('reported'), t('image_uploaded'), 'success');
        } catch (err) {
            console.error('Upload failed:', err);
            showAlert('Error', t('upload_image_failed') + ': ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const saveDraft = async () => {
        try {
            if (!exam.title.trim()) { showAlert('Error', t('enter_exam_title'), 'error'); return; }
            if (questions.length === 0) { showAlert('Error', t('add_at_least_one_question'), 'error'); return; }

            let examId = savedExamId;
            if (!examId) {
                const examRes = await api.post('/exams', exam);
                examId = examRes.data.id;
                setSavedExamId(examId);
            } else {
                await api.put(`/exams/${examId}`, exam);
            }

            // Sync questions (delete old, add new to ensure no dups/orphans)
            if (questions.length > 0) {
                const questionsWithExamId = questions.map(q => ({
                    ...q,
                    exam_id: examId
                }));
                // The backend sync endpoint returns the updated list of questions with IDs
                const res = await api.post(`/exams/${examId}/questions`, { questions: questionsWithExamId });
                setQuestions(res.data);
            }

            showAlert(t('reported'), t('draft_saved_success'), 'success');
            return examId;
        } catch (err) {
            console.error('Error:', err);
            showAlert('Error', (err.response?.data?.error || err.message), 'error');
        }
    };

    const publishAttestation = async (examId) => {
        try {
            await api.post(`/exams/${examId}/publish`, {});
            showAlert(t('reported'), t('attestation_published'), 'success');
            setTimeout(() => navigate(user.role === 'teacher' ? '/teacher' : '/admin'), 1500);
        } catch (err) {
            showAlert('Error', t('publish_error') + ': ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const openPublishModal = () => {
        if (exam.exam_type === 'attestation') {
            if (!exam.title.trim() || questions.length === 0) {
                showAlert('Error', t('add_at_least_one_question'), 'error');
                return;
            }
            saveDraft().then(examId => { if (examId) publishAttestation(examId); });
            return;
        }
        if (!savedExamId) {
            showAlert(t('reported'), t('save_draft_first'), 'info');
            saveDraft().then(() => {
                if (exam.title.trim() && questions.length > 0) {
                    setShowPublishModal(true);
                }
            });
        } else {
            setShowPublishModal(true);
        }
    };

    const publishExam = async () => {
        if (!publishData.class_id) {
            showAlert('Error', t('select_class'), 'error');
            return;
        }
        if (!publishData.pin_code || publishData.pin_code.trim().length === 0) {
            showAlert('Error', t('enter_pin_code'), 'error');
            return;
        }

        try {
            // Convert local datetime-local strings to ISO/UTC for server
            const payload = { ...publishData };

            if (payload.active_start) {
                payload.active_start = new Date(payload.active_start).toISOString();
            }
            if (payload.active_end) {
                payload.active_end = new Date(payload.active_end).toISOString();
            }

            await api.post(`/exams/${savedExamId}/publish`, payload);
            showAlert(t('reported'), t('exam_published_success'), 'success');
            setTimeout(() => navigate(user.role === 'teacher' ? '/teacher' : '/admin'), 1500);
        } catch (err) {
            console.error('Publish error:', err);
            showAlert('Error', t('publish_error') + ': ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const addQuestion = () => {
        if (!currentQ.content.trim()) return;

        let updated;
        if (editingIndex >= 0) {
            // Update existing
            updated = [...questions];
            updated[editingIndex] = currentQ;
            setEditingIndex(-1);
        } else {
            // Add new
            updated = [...questions, currentQ];
        }

        const balanced = calculatePoints(updated);
        setQuestions(balanced);

        // Reset form
        setCurrentQ({
            type: 'mcq',
            content: '',
            image_url: '',
            local_image_path: '',
            options: exam.exam_type === 'rasch_national_cert' ? ['', '', '', '', '', ''] : ['', '', '', ''],
            correct_answer: '',
            correct_answer_2: '',
            answer_variants: [],
            points: 0,
            category: 'B',
            section: 'subject',
            question_type: 'type1_mcq_4',
            translations: {
                content: { uz: '', ru: '', en: '' },
                options: { uz: [], ru: [], en: [] },
                correct_answer: { uz: '', ru: '', en: '' },
                correct_answer_2: { uz: '', ru: '', en: '' }
            }
        });

        // Clear file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const deleteQuestion = (index) => {
        const updated = questions.filter((_, i) => i !== index);
        const balanced = calculatePoints(updated);
        setQuestions(balanced);
    };

    const editQuestion = (index) => {
        setCurrentQ(questions[index]);
        setEditingIndex(index);
        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingIndex(-1);
        setCurrentQ({
            type: 'mcq',
            content: '',
            image_url: '',
            local_image_path: '',
            options: exam.exam_type === 'rasch_national_cert' ? ['', '', '', '', '', ''] : ['', '', '', ''],
            correct_answer: '',
            correct_answer_2: '',
            answer_variants: [],
            points: 0,
            category: 'B',
            section: 'subject',
            question_type: 'type1_mcq_4',
            translations: {
                content: { uz: '', ru: '', en: '' },
                options: { uz: [], ru: [], en: [] },
                correct_answer: { uz: '', ru: '', en: '' },
                correct_answer_2: { uz: '', ru: '', en: '' }
            }
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAIImported = (aiQuestions) => {
        const formatted = aiQuestions.map(q => {
            const base = {
                ...q,
                points: 0,
                translations: q.translations || {
                    content: { uz: q.content, ru: '', en: '' },
                    options: { uz: q.options || [], ru: [], en: [] },
                    correct_answer: { uz: q.correct_answer || '', ru: '', en: '' },
                    correct_answer_2: { uz: q.correct_answer_2 || '', ru: '', en: '' }
                }
            };

            // Force model specific fields if provided by AI
            if (q.question_type) {
                base.type = 'mcq'; // internal type for list logic
                base.question_type = q.question_type;
            }

            return base;
        });

        const newQuestions = [...questions, ...formatted];
        setQuestions(calculatePoints(newQuestions));
        showAlert(t('reported'), `${aiQuestions.length} questions imported!`, 'success');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-nearblack transition-colors">
            <header className="bg-white dark:bg-nearblack border-b dark:border-gray-800 p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(user?.role === 'teacher' ? '/teacher' : '/admin')} className="text-blue-600 dark:text-blue-400 hover:opacity-80 flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" /> {t('back')}
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{id ? t('edit_exam') : t('new_exam')}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <select
                            value={language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="bg-transparent text-sm font-medium focus:outline-none dark:text-gray-300"
                        >
                            <option value="en">EN</option>
                            <option value="ru">RU</option>
                            <option value="uz">UZ</option>
                        </select>
                    </div>
                    <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">{t('logout')}</button>

                    <button
                        onClick={() => setShowAIModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-xl font-black text-sm uppercase tracking-tighter shadow-xl shadow-blue-500/20 active:scale-95 transition-all animate-in slide-in-from-right-10 duration-700"
                    >
                        <Sparkles className="w-4 h-4" /> AI Exam Creation
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-8">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg mb-8 transition-colors border dark:border-gray-800">
                    <h2 className="text-xl font-black mb-6 dark:text-gray-100 flex items-center gap-2">
                        <Save className="text-blue-500 w-6 h-6" /> {t('exam_configuration')}
                    </h2>
                    <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                        {['uz', 'ru', 'en'].map(l => (
                            <button
                                key={l}
                                onClick={() => setEditLang(l)}
                                className={`px-4 py-1.5 rounded-md text-xs font-black uppercase transition-all ${editLang === l ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {t('exam_title')} ({editLang.toUpperCase()})
                            </label>
                            <input
                                placeholder={t('exam_title_placeholder')}
                                className="border-2 dark:border-gray-700 p-4 w-full rounded-xl dark:bg-gray-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold mb-4"
                                value={exam.translations?.title?.[editLang] || (editLang === 'uz' ? exam.title : '')}
                                onChange={e => {
                                    const newTrans = { ...exam.translations };
                                    if (!newTrans.title) newTrans.title = { uz: exam.title || '', ru: '', en: '' };
                                    newTrans.title[editLang] = e.target.value;
                                    setExam({
                                        ...exam,
                                        title: editLang === 'uz' ? e.target.value : exam.title,
                                        translations: newTrans
                                    });
                                }}
                            />
                            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {t('exam_description')} ({editLang.toUpperCase()})
                            </label>
                            <textarea
                                placeholder={t('exam_description_placeholder') || "Enter exam description..."}
                                className="border-2 dark:border-gray-700 p-4 w-full rounded-xl dark:bg-gray-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold min-h-[80px]"
                                value={exam.translations?.description?.[editLang] || (editLang === 'uz' ? exam.description : '')}
                                onChange={e => {
                                    const newTrans = { ...exam.translations };
                                    if (!newTrans.description) newTrans.description = { uz: exam.description || '', ru: '', en: '' };
                                    newTrans.description[editLang] = e.target.value;
                                    setExam({
                                        ...exam,
                                        description: editLang === 'uz' ? e.target.value : exam.description,
                                        translations: newTrans
                                    });
                                }}
                            />
                        </div>
                    </div>

                    {/* Exam Type Selector */}
                    <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl border-2 border-blue-200 dark:border-gray-700">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-4">
                            📋 {t('exam_type_lock_hint')}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* CHSB Option */}
                            <button
                                type="button"
                                onClick={() => !id && setExam({ ...exam, exam_type: 'chsb' })}
                                disabled={!!id}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${exam.exam_type === 'chsb'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                                    } ${id ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${exam.exam_type === 'chsb'
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {exam.exam_type === 'chsb' && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-lg text-gray-800 dark:text-white mb-2">CHSB</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('exam_type_chsb_desc')}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Rasch Model Option */}
                            <button
                                type="button"
                                onClick={() => !id && !lockedType('rasch_national_cert') && setExam({ ...exam, exam_type: 'rasch_national_cert' })}
                                disabled={!!id}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${exam.exam_type === 'rasch_national_cert'
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300'
                                    } ${id ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${exam.exam_type === 'rasch_national_cert'
                                        ? 'border-purple-500 bg-purple-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {exam.exam_type === 'rasch_national_cert' && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-lg text-gray-800 dark:text-white mb-2">Rasch Model National Certificate{!allowedTypes.includes('rasch_national_cert') && <span className="ml-2 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded bg-saffron-300/40 text-saffron-600">PRO</span>}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('exam_type_rasch_desc')}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* DTM Option */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (id || lockedType('dtm')) return;
                                    setExam({ ...exam, exam_type: 'dtm', total_questions: 90 });
                                    setQuestions(qs => qs.map((q, i) => ({ ...q, points: dtmPointsFor(i) })));
                                }}
                                disabled={!!id}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${exam.exam_type === 'dtm'
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300'
                                    } ${id ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${exam.exam_type === 'dtm'
                                        ? 'border-emerald-500 bg-emerald-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {exam.exam_type === 'dtm' && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-lg text-gray-800 dark:text-white mb-2">{t('exam_type_dtm_title')}{!allowedTypes.includes('dtm') && <span className="ml-2 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded bg-saffron-300/40 text-saffron-600">PRO</span>}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('exam_type_dtm_desc')}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Teacher attestation Option */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (id || lockedType('attestation')) return;
                                    setExam({ ...exam, exam_type: 'attestation' });
                                    setQuestions(qs => {
                                        const each = qs.length ? parseFloat((100 / qs.length).toFixed(3)) : 0;
                                        return qs.map(q => ({ ...q, points: each, section: q.section || 'subject' }));
                                    });
                                }}
                                disabled={!!id}
                                className={`p-6 rounded-xl border-2 transition-all text-left ${exam.exam_type === 'attestation'
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300'
                                    } ${id ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${exam.exam_type === 'attestation'
                                        ? 'border-amber-500 bg-amber-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {exam.exam_type === 'attestation' && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-lg text-gray-800 dark:text-white mb-2">{t('exam_type_attestation_title')}{!allowedTypes.includes('attestation') && <span className="ml-2 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded bg-saffron-300/40 text-saffron-600">PRO</span>}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('exam_type_attestation_desc')}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                        {id && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
                                ⚠️ {t('exam_type_locked_warning')}
                            </p>
                        )}
                    </div>

                    {/* Subject and Total Questions (for Rasch exams) */}
                    {exam.exam_type === 'rasch_national_cert' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{t('subject')}</label>
                                <input
                                    placeholder={t('subject_placeholder')}
                                    className="border-2 dark:border-gray-700 p-4 w-full rounded-xl dark:bg-gray-800 dark:text-white focus:border-purple-500 outline-none transition-all font-bold"
                                    value={exam.subject || ''}
                                    onChange={e => setExam({ ...exam, subject: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{t('total_questions')}</label>
                                <input
                                    type="number"
                                    placeholder={t('total_questions_placeholder')}
                                    className="border-2 dark:border-gray-700 p-4 w-full rounded-xl dark:bg-gray-800 dark:text-white focus:border-purple-500 outline-none transition-all font-bold"
                                    value={exam.total_questions || ''}
                                    onChange={e => setExam({ ...exam, total_questions: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-800">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${exam.shuffle_questions ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                {exam.shuffle_questions && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={exam.shuffle_questions}
                                onChange={e => setExam({ ...exam, shuffle_questions: e.target.checked })}
                            />
                            <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">{t('shuffle_questions')}</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${exam.shuffle_options ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                {exam.shuffle_options && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={exam.shuffle_options}
                                onChange={e => setExam({ ...exam, shuffle_options: e.target.checked })}
                            />
                            <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition-colors">{t('shuffle_answers')}</span>
                        </label>
                    </div>
                </div>

                {/* Points Summary Dashboard */}
                {questions.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg mb-8 border-2 border-blue-100 dark:border-blue-900/30 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> {t('points_summary')}
                            </h3>
                            <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                                {t('total_score')}: 40.0
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('total_qs')}</p>
                                <p className="text-xl font-black text-blue-600">{questions.length}</p>
                            </div>
                            {['B', 'Q', 'M'].map(cat => {
                                const count = questions.filter(q => (q.category || 'B') === cat).length;
                                const pts = questions.find(q => (q.category || 'B') === cat)?.points || 0;
                                return (
                                    <div key={cat} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t(cat === 'B' ? 'category_b' : cat === 'Q' ? 'category_q' : 'category_m')}</p>
                                        <p className="text-xl font-black text-gray-800 dark:text-white">
                                            {count} <span className="text-[10px] text-gray-400 ml-1">({parseFloat(pts).toFixed(1)} pts)</span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg mb-8 transition-colors border dark:border-gray-800">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-gray-100">
                        <Plus className="text-blue-500" /> {t('question')} #{questions.length + 1}
                    </h2>

                    <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                        {['uz', 'ru', 'en'].map(l => (
                            <button
                                key={l}
                                onClick={() => setEditLang(l)}
                                className={`px-4 py-1.5 rounded-md text-xs font-black uppercase transition-all ${editLang === l ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    <textarea
                        placeholder={`${t('question_text_placeholder')} (${editLang.toUpperCase()})`}
                        className="w-full border dark:border-gray-700 p-4 mb-4 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                        value={currentQ.translations?.content?.[editLang] || (editLang === 'uz' ? currentQ.content : '')}
                        onChange={e => {
                            const newTrans = { ...currentQ.translations };
                            if (!newTrans.content) newTrans.content = { uz: currentQ.content || '', ru: '', en: '' };
                            newTrans.content[editLang] = e.target.value;
                            setCurrentQ({
                                ...currentQ,
                                content: editLang === 'uz' ? e.target.value : currentQ.content,
                                translations: newTrans
                            });
                        }}
                    />

                    <div className="mb-6">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                            <ImageIcon className="w-4 h-4" /> {t('upload_image')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                className="flex-1 border dark:border-gray-700 p-3 rounded-lg dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {uploadingImage && <span className="text-sm text-blue-600 dark:text-blue-400 self-center">{t('uploading')}</span>}
                        </div>
                        {currentQ.local_image_path && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-700 dark:text-green-400">{t('image_uploaded')}</span>
                            </div>
                        )}
                    </div>

                    {/* Options for MCQ types */}
                    {currentQ.question_type !== 'type3_open_dual' && (
                        <div className="space-y-3 mb-6">
                            {currentQ.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={currentQ.correct_answer === opt && opt !== ''}
                                        onChange={() => setCurrentQ({ ...currentQ, correct_answer: opt })}
                                        className="w-5 h-5 text-blue-600"
                                    />
                                    <input
                                        placeholder={`${t('option_placeholder')} ${String.fromCharCode(65 + i)} (${editLang.toUpperCase()})`}
                                        className={`border dark:border-gray-700 p-3 rounded-lg flex-1 transition-all dark:bg-gray-800 dark:text-white ${currentQ.correct_answer === opt && opt !== '' ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : ''}`}
                                        value={currentQ.translations?.options?.[editLang]?.[i] || (editLang === 'uz' ? opt : '')}
                                        onChange={e => {
                                            const newTrans = { ...currentQ.translations };
                                            if (!newTrans.options) newTrans.options = { uz: [...currentQ.options], ru: [], en: [] };
                                            if (!newTrans.options[editLang]) newTrans.options[editLang] = [...currentQ.options].map(() => '');
                                            newTrans.options[editLang][i] = e.target.value;

                                            const newOpts = [...currentQ.options];
                                            if (editLang === 'uz') newOpts[i] = e.target.value;

                                            setCurrentQ({
                                                ...currentQ,
                                                options: newOpts,
                                                translations: newTrans
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Dual Answer Fields for Type 3 (Open-ended) */}
                    {currentQ.question_type === 'type3_open_dual' && (
                        <div className="space-y-4 mb-6 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border-2 border-purple-200 dark:border-purple-800/30">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <h4 className="text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest">
                                    {t('open_ended_dual_answers')} ({editLang.toUpperCase()})
                                </h4>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{t('answer_1')}</label>
                                    <input
                                        placeholder={`${t('answer_1_placeholder')} (${editLang})`}
                                        className="border-2 dark:border-purple-700 p-3 rounded-lg w-full dark:bg-gray-800 dark:text-white focus:border-purple-500 outline-none transition-all font-bold"
                                        value={currentQ.translations?.correct_answer?.[editLang] || (editLang === 'uz' ? currentQ.correct_answer : '')}
                                        onChange={e => {
                                            const newTrans = { ...currentQ.translations };
                                            if (!newTrans.correct_answer) newTrans.correct_answer = { uz: currentQ.correct_answer || '', ru: '', en: '' };
                                            newTrans.correct_answer[editLang] = e.target.value;
                                            setCurrentQ({
                                                ...currentQ,
                                                correct_answer: editLang === 'uz' ? e.target.value : currentQ.correct_answer,
                                                translations: newTrans
                                            });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{t('answer_2')}</label>
                                    <input
                                        placeholder={`${t('answer_2_placeholder')} (${editLang})`}
                                        className="border-2 dark:border-purple-700 p-3 rounded-lg w-full dark:bg-gray-800 dark:text-white focus:border-purple-500 outline-none transition-all font-bold"
                                        value={currentQ.translations?.correct_answer_2?.[editLang] || (editLang === 'uz' ? currentQ.correct_answer_2 : '')}
                                        onChange={e => {
                                            const newTrans = { ...currentQ.translations };
                                            if (!newTrans.correct_answer_2) newTrans.correct_answer_2 = { uz: currentQ.correct_answer_2 || '', ru: '', en: '' };
                                            newTrans.correct_answer_2[editLang] = e.target.value;
                                            setCurrentQ({
                                                ...currentQ,
                                                correct_answer_2: editLang === 'uz' ? e.target.value : currentQ.correct_answer_2,
                                                translations: newTrans
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        {exam.exam_type === 'attestation' ? (
                            <div className="flex flex-col gap-2">
                                <label className="font-black text-xs text-gray-400 uppercase tracking-widest italic">{t('section')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {['subject', 'pedagogy', 'standards', 'ict'].map(k => (
                                        <button
                                            key={k}
                                            type="button"
                                            onClick={() => setCurrentQ({ ...currentQ, section: k })}
                                            className={`px-4 py-3 rounded-xl font-black text-sm transition-all border-2 ${(currentQ.section || 'subject') === k
                                                ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-300'
                                                }`}
                                        >
                                            {t(`section_${k}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : exam.exam_type === 'dtm' ? (
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                DTM · #{(editingIndex >= 0 ? editingIndex : questions.length) + 1} → {dtmPointsFor(editingIndex >= 0 ? editingIndex : questions.length)} ball
                            </div>
                        ) : exam.exam_type === 'chsb' ? (
                            <div className="flex flex-col gap-2">
                                <label className="font-black text-xs text-gray-400 uppercase tracking-widest italic">{t('difficulty_category')}</label>
                                <div className="flex gap-2">
                                    {['B', 'Q', 'M'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCurrentQ({ ...currentQ, category: cat })}
                                            className={`px-6 py-3 rounded-xl font-black text-lg transition-all border-2 ${currentQ.category === cat
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-blue-200'
                                                }`}
                                        >
                                            {cat === 'B' ? 'B (Bilish)' : cat === 'Q' ? 'Q (Qo\'llash)' : 'M (Mulohaza)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <label className="font-black text-xs text-gray-400 uppercase tracking-widest italic">{t('question_type')}:</label>
                                <div className="flex gap-2">
                                    <button
                                        key="type1"
                                        type="button"
                                        onClick={() => setCurrentQ({ ...currentQ, question_type: 'type1_mcq_4', options: ['', '', '', ''] })}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${currentQ.question_type === 'type1_mcq_4'
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-purple-200'
                                            }`}
                                    >
                                        {t('rasch_type1')}
                                    </button>
                                    <button
                                        key="type2"
                                        type="button"
                                        onClick={() => setCurrentQ({ ...currentQ, question_type: 'type2_mcq_6', options: ['', '', '', '', '', ''] })}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${currentQ.question_type === 'type2_mcq_6'
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-purple-200'
                                            }`}
                                    >
                                        {t('rasch_type2')}
                                    </button>
                                    <button
                                        key="type3"
                                        type="button"
                                        onClick={() => setCurrentQ({ ...currentQ, question_type: 'type3_open_dual', options: [] })}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${currentQ.question_type === 'type3_open_dual'
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-purple-200'
                                            }`}
                                    >
                                        {t('rasch_type3')}
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                            {editingIndex >= 0 && (
                                <button
                                    onClick={cancelEdit}
                                    className="bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90"
                                >
                                    {t('cancel')}
                                </button>
                            )}
                            <button
                                onClick={addQuestion}
                                disabled={!currentQ.content.trim()}
                                className={`px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 text-white ${editingIndex >= 0 ? 'bg-orange-500' : 'bg-gray-800 dark:bg-blue-600'}`}
                            >
                                {editingIndex >= 0 ? t('update_question') : t('add_question')}
                            </button>
                        </div>
                    </div>
                </div>

                {questions.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h3 className="text-lg font-bold dark:text-gray-200">{t('added_questions')} ({questions.length})</h3>
                        {questions.map((q, idx) => (
                            <div key={idx} className={`bg-white dark:bg-gray-900 p-6 rounded-xl border shadow-sm flex gap-4 transition-all ${editingIndex === idx ? 'border-orange-500 ring-2 ring-orange-100 dark:ring-orange-900' : 'dark:border-gray-800'}`}>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-blue-600 dark:text-blue-400">{t('question')} {idx + 1}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${q.category === 'M' ? 'bg-purple-100 text-purple-600' : q.category === 'Q' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {t('type')}: {q.category || 'B'}
                                            </span>
                                            {editingIndex === idx && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase">{t('editing')}...</span>}
                                        </div>
                                        <span className="text-blue-600 dark:text-blue-400 font-black text-sm">{parseFloat(q.points || 0).toFixed(1)} {t('points')}</span>
                                    </div>
                                    <div className="dark:text-gray-100 mb-2"><FormulaRenderer content={q.content} /></div>
                                    {(q.image_url || q.local_image_path) && (
                                        <img
                                            src={q.local_image_path ? assetUrl(q.local_image_path) : q.image_url}
                                            alt="Question"
                                            className="h-24 w-24 object-cover rounded mb-2"
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => editQuestion(idx)} className="text-blue-500 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                                        <Upload className="w-5 h-5" /> {/* Using Upload icon as generic edit/action for now, or finding Edit icon */}
                                    </button>
                                    <button onClick={() => deleteQuestion(idx)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-4 sticky bottom-8">
                    <button
                        onClick={saveDraft}
                        className="flex-1 bg-gray-600 text-white p-4 rounded-xl font-black text-xl hover:bg-gray-700 shadow-xl shadow-gray-500/20 flex items-center justify-center gap-2"
                        disabled={questions.length === 0}
                    >
                        <Save className="w-6 h-6" /> {t('save_draft')}
                    </button>
                    <button
                        onClick={openPublishModal}
                        className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                        disabled={questions.length === 0}
                    >
                        <Send className="w-6 h-6" /> {t('publish_exam')}
                    </button>
                </div>
            </main>

            {/* Publish Modal */}
            {showPublishModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border dark:border-gray-800 transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                                <Send className="w-6 h-6 text-blue-600" /> {t('publish_modal_title')}
                            </h3>
                            <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{t('target_class')}</label>
                                    <select
                                        value={publishData.class_id}
                                        onChange={(e) => setPublishData({ ...publishData, class_id: e.target.value })}
                                        className="w-full border-2 dark:border-gray-700 p-3 rounded-xl dark:bg-gray-800 dark:text-white font-bold outline-none focus:border-blue-500 transition-all"
                                    >
                                        <option value="">{t('choose_class_placeholder')}</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{t('access_pin')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('pin_placeholder')}
                                        value={publishData.pin_code}
                                        onChange={(e) => setPublishData({ ...publishData, pin_code: e.target.value })}
                                        className="w-full border-2 dark:border-gray-700 p-3 rounded-xl dark:bg-gray-800 dark:text-white font-mono font-black outline-none focus:border-blue-500 transition-all"
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border dark:border-gray-800/50">
                                <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">{t('availability_window')}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t('start_time')}</label>
                                        <input
                                            type="datetime-local"
                                            value={publishData.active_start}
                                            onChange={e => setPublishData({ ...publishData, active_start: e.target.value })}
                                            className="w-full bg-white dark:bg-gray-900 p-2 rounded-lg border dark:border-gray-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t('end_time')}</label>
                                        <input
                                            type="datetime-local"
                                            value={publishData.active_end}
                                            onChange={e => setPublishData({ ...publishData, active_end: e.target.value })}
                                            className="w-full bg-white dark:bg-gray-900 p-2 rounded-lg border dark:border-gray-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-3 italic">{t('availability_hint')}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex gap-4">
                            <button
                                onClick={() => setShowPublishModal(false)}
                                className="px-6 py-3 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-800 dark:hover:text-white transition-colors"
                            >
                                {t('not_yet')}
                            </button>
                            <button
                                onClick={publishExam}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {t('publish_now')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Alert Modal removed as it's now handled by useAlert */}

            <AIImportModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onImported={handleAIImported}
                examType={exam.exam_type}
            />
        </div>
    );
};

export default ExamEditor;
