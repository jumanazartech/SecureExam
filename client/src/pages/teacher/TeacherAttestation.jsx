import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Award, Clock, Lock, Play } from 'lucide-react';

const SECTION_KEYS = ['subject', 'pedagogy', 'standards', 'ict'];
const CATEGORY_STYLES = {
    highest: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    first: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    second: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    specialist: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
};

const TeacherAttestation = () => {
    const { exams, api, t } = useOutletContext();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        api.get('/submissions/my-results')
            .then(res => setHistory(res.data.filter(r => r.Exam?.exam_type === 'attestation')))
            .catch(err => console.error(err));
    }, [api]);

    const available = exams.filter(e => e.exam_type === 'attestation' && e.status === 'published' && e.is_active);
    const lockExam = () => window.dispatchEvent(new CustomEvent('plan-limit', { detail: { message: t('pro_attestation_locked') } }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border dark:border-gray-800">
                <h2 className="text-xl font-black flex items-center gap-2 text-gray-900 dark:text-white">
                    <Award className="w-6 h-6 text-emerald-600" /> {t('attestation')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('attestation_subtitle')}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {available.map(exam => (
                        <div key={exam.id} className="p-5 rounded-2xl border dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex flex-col gap-3">
                            <div className="font-black text-gray-900 dark:text-white">{exam.title}</div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="w-4 h-4" /> {exam.duration_minutes} min
                            </div>
                            <button
                                onClick={() => (exam.locked ? lockExam() : navigate(`/teacher/exam/${exam.id}`))}
                                className="mt-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                {exam.locked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />} {exam.locked ? 'Pro' : t('start_exam')}
                            </button>
                        </div>
                    ))}
                    {available.length === 0 && (
                        <div className="col-span-full py-10 text-center text-gray-400 italic">{t('no_attestation_exams')}</div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border dark:border-gray-800">
                <h3 className="text-lg font-black mb-4 text-gray-900 dark:text-white">{t('attestation_history')}</h3>
                <div className="space-y-4">
                    {history.map(r => (
                        <div key={r.id} className="p-4 rounded-2xl border dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{r.Exam?.title}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.end_time || r.createdAt).toLocaleString()}</div>
                                </div>
                                {r.certificate_level && (
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${CATEGORY_STYLES[r.certificate_level] || CATEGORY_STYLES.specialist}`}>
                                        {t(`category_${r.certificate_level}`)}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {SECTION_KEYS.filter(k => r.section_scores?.[k]).map(k => {
                                    const sc = r.section_scores[k];
                                    return (
                                        <div key={k}>
                                            <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                                                <span>{t(`section_${k}`)}</span><span>{sc.correct}/{sc.total}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${sc.percent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <div className="py-6 text-center text-gray-400 italic">—</div>}
                </div>
            </div>
        </div>
    );
};

export default TeacherAttestation;
