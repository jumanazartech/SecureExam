import React, { useState } from 'react';
import { Upload, X, FileText, BookOpen, Sparkles, AlertCircle, CheckCircle2, Loader2, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormulaRenderer from './FormulaRenderer';

const AIImportModal = ({ isOpen, onClose, onImported, examType }) => {
    const { api, t, account } = useAuth();
    const maxPerRequest = account?.usage?.limits?.aiQuestionsPerRequest || 100;
    const [step, setStep] = useState(1); // 1: Choose Type, 2: Upload, 3: Processing, 4: Results
    const [flowType, setFlowType] = useState(''); // 'extract' or 'generate'
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [extractedQuestions, setExtractedQuestions] = useState([]);
    const [options, setOptions] = useState({
        questionCount: 10,
        difficultyLevel: 'Medium',
        questionTypes: 'Mixed',
        section: 'auto'
    });

    const resetState = () => {
        setStep(1);
        setFlowType('');
        setFile(null);
        setLoading(false);
        setError(null);
        setExtractedQuestions([]);
        setOptions({
            questionCount: 10,
            difficultyLevel: 'Medium',
            questionTypes: 'Mixed',
            section: 'auto'
        });
    };

    // Reset when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            resetState();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (flowType === 'generate') {
                setStep(2.5); // New step for options
            } else {
                setStep(3);
                processFile(selectedFile);
            }
        }
    };

    const processFile = async (selectedFile) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('document', selectedFile || file);
            formData.append('flowType', flowType);
            formData.append('questionCount', Math.min(options.questionCount, maxPerRequest));
            formData.append('difficultyLevel', options.difficultyLevel);
            formData.append('questionTypes', options.questionTypes);
            formData.append('section', options.section || 'auto');
            formData.append('examType', examType || 'chsb');

            const res = await api.post('/exams/ai-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 600000 // generating many questions runs several AI batches
            });

            setExtractedQuestions(res.data.questions);
            setStep(4);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to process document');
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalImport = () => {
        onImported(extractedQuestions);
        handleClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
            <div className="bg-white dark:bg-nearblack rounded-[40px] p-10 max-w-2xl w-full border dark:border-gray-800 shadow-2xl relative overflow-hidden transition-all duration-500">
                {/* Close Button */}
                <button onClick={handleClose} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>

                {step === 1 && (
                    <div className="animate-in slide-in-from-bottom-10 fade-in duration-500">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-blue-600 animate-pulse">
                                <Sparkles className="w-10 h-10" />
                            </div>
                            <h2 className="text-4xl font-black dark:text-white tracking-tighter uppercase mb-2">AI Exam Creation</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-widest">Select your import method</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => { setFlowType('extract'); setStep(2); }}
                                className="group p-8 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all text-left"
                            >
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-xl dark:text-white mb-2 uppercase tracking-tighter">Extract from Mock</h3>
                                <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded inline-block mb-3 tracking-widest uppercase">Target: Rasch Model</div>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">Upload a test paper. AI will extract and convert questions strictly for the Rasch National Certificate model.</p>
                            </button>

                            <button
                                onClick={() => { setFlowType('generate'); setStep(2); }}
                                className="group p-8 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all text-left"
                            >
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <h3 className="font-black text-xl dark:text-white mb-2 uppercase tracking-tighter">Generate from Book</h3>
                                <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-1 rounded inline-block mb-3 tracking-widest uppercase">Target: CHSB Model</div>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">Upload a textbook or article. AI will generate brand new original questions for the standard CHSB model.</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in zoom-in duration-500 text-center">
                        <button onClick={() => { setStep(1); setFlowType(''); }} className="mb-6 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-blue-500 transition-colors">← Back to selection</button>
                        <h2 className="text-3xl font-black dark:text-white tracking-tighter uppercase mb-6">
                            {flowType === 'extract' ? 'Upload Mock Test' : 'Upload Study Material'}
                        </h2>

                        <label className="block w-full cursor-pointer">
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                            <div className="p-20 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[40px] group hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-gray-400 group-hover:text-blue-600 transition-colors">
                                    <Upload className="w-10 h-10" />
                                </div>
                                <p className="text-xl font-black dark:text-white uppercase tracking-tighter mb-2">Click to Upload</p>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">PDF or DOCX (Max 10MB)</p>
                            </div>
                        </label>

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-100 dark:border-red-900/30 flex items-center justify-center gap-3 text-red-600 font-bold">
                                <AlertCircle className="w-5 h-5" /> {error}
                            </div>
                        )}
                    </div>
                )}

                {step === 2.5 && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <button onClick={() => setStep(2)} className="mb-6 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-blue-500 transition-colors">← Back to upload</button>
                        <h2 className="text-3xl font-black dark:text-white tracking-tighter uppercase mb-6 text-center">Generation Options</h2>

                        <div className="space-y-6 bg-gray-50 dark:bg-gray-800/20 p-8 rounded-[32px] border dark:border-gray-800">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Number of Questions</label>
                                <input
                                    type="range" min="5" max={maxPerRequest} step="5"
                                    value={Math.min(options.questionCount, maxPerRequest)}
                                    onChange={(e) => setOptions({ ...options, questionCount: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase mt-2">
                                    <span>5 Questions</span>
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full">{options.questionCount} Selected</span>
                                    <span>{maxPerRequest} Questions</span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">{t('ai_more_hint')}</p>
                            </div>

                            {examType === 'attestation' && (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{t('section')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['auto', 'subject', 'pedagogy', 'standards', 'ict'].map(k => (
                                            <button
                                                key={k}
                                                type="button"
                                                onClick={() => setOptions({ ...options, section: k })}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border-2 ${options.section === k ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}
                                            >
                                                {t(`section_${k}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Difficulty Level</label>
                                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                                        {['Easy', 'Medium', 'Hard'].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setOptions({ ...options, difficultyLevel: d })}
                                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${options.difficultyLevel === d ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-400'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Question Types</label>
                                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                                        {['MCQ', 'Mixed'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setOptions({ ...options, questionTypes: t })}
                                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${options.questionTypes === t ? 'bg-white dark:bg-gray-700 shadow-md text-emerald-600' : 'text-gray-400'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => { setStep(3); processFile(); }}
                            className="w-full mt-8 bg-black dark:bg-white dark:text-black text-white py-5 rounded-[28px] font-black text-xl hover:scale-[1.02] shadow-xl transition-all flex items-center justify-center gap-3 group"
                        >
                            <Play className="w-6 h-6 fill-current" />
                            START GENERATION
                            <Sparkles className="w-5 h-5 text-yellow-400 group-hover:rotate-12 transition-transform" />
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="py-20 text-center animate-in zoom-in duration-300">
                        <div className="relative w-32 h-32 mx-auto mb-10 text-blue-600">
                            <Loader2 className="w-full h-full animate-spin stroke-[1]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-12 h-12" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black dark:text-white tracking-tighter uppercase mb-4 animate-pulse">AI is Thinking...</h2>
                        <div className="max-w-xs mx-auto space-y-3">
                            <div className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Analyzing Document</div>
                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full w-2/3 animate-[loading_2s_ease-in-out_infinite]"></div>
                            </div>
                            <p className="text-sm text-gray-400 font-bold italic">This might take up to 30 seconds for large files</p>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in slide-in-from-bottom-10 fade-in duration-500 flex flex-col max-h-[75vh]">
                        <div className="shrink-0 mb-6 flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-black dark:text-white tracking-tighter uppercase leading-none">AI Extraction Success</h2>
                                <p className="text-green-500 font-black text-xs uppercase tracking-widest mt-2">{extractedQuestions.length} Questions Found & Formatted</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
                            {extractedQuestions.map((q, i) => (
                                <div key={i} className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border dark:border-gray-800 group hover:border-blue-500/50 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">{i + 1}</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{q.type === 'mcq' ? 'Multiple Choice' : 'Open Ended'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-600' :
                                                q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {q.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="font-bold text-gray-800 dark:text-white leading-relaxed mb-4">
                                        <FormulaRenderer content={q.content} />
                                    </div>
                                    {q.options && q.options.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className={`p-3 rounded-xl border text-xs font-bold transition-all ${opt === q.correct_answer ? 'border-green-500 bg-green-50/50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'border-gray-100 dark:border-gray-700 dark:text-gray-400'
                                                    }`}>
                                                    <span className="mr-2 opacity-50">{String.fromCharCode(65 + oi)}.</span>
                                                    <FormulaRenderer content={opt} className="inline" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="shrink-0 mt-8 pt-6 border-t dark:border-gray-800 flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-4 text-gray-500 font-bold uppercase tracking-widest hover:text-gray-700 transition-colors">Abort</button>
                            <button onClick={handleFinalImport} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                <CheckCircle2 className="w-6 h-6" /> IMPORT ALL QUESTIONS
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}} />
        </div>
    );
};

export default AIImportModal;
