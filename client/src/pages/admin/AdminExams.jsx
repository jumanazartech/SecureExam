import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { FileText, PlusCircle, Clock, Users, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';

const AdminExams = () => {
    const { exams, t, handleAssignExam, viewResults, handleDeleteExam, api, fetchExams } = useOutletContext();

    const toggleRelease = async (examId, currentStatus) => {
        try {
            await api.put(`/exams/${examId}`, { results_released: !currentStatus });
            fetchExams();
        } catch (err) {
            console.error('Failed to toggle results release:', err);
        }
    };

    return (
        <div className="bg-warm-100 dark:bg-gray-900 p-6 rounded-[32px] shadow-warm-xl border-2 border-warm-gray-200 dark:border-gray-800 transition-colors animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 dark:text-white tracking-tighter uppercase">
                        <FileText className="w-6 h-6 text-blue-600 shrink-0" /> {t('exam_management')}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{exams.length} {t('total')} {t('exams')}</p>
                </div>
                <Link to="/admin/create-exam" className="self-start sm:self-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 group text-sm">
                    <PlusCircle className="w-4 h-4 transform group-hover:rotate-90 transition-transform duration-300" /> {t('new_exam')}
                </Link>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-left">
                            <th className="pb-2 px-4 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{t('exam_title')}</th>
                            <th className="pb-2 px-4 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-center">{t('duration')}</th>
                            <th className="pb-2 px-4 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-center">{t('status')}</th>
                            <th className="pb-2 px-4 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-center">{t('results')}</th>
                            <th className="pb-2 px-4 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map(exam => (
                            <tr key={exam.id} className="group bg-warm-200/50 dark:bg-gray-800/30 hover:bg-amber-soft/10 dark:hover:bg-blue-900/10 transition-all">
                                <td className="py-3 px-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-amber-soft/30 dark:group-hover:border-blue-900/30 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold tracking-tight line-clamp-1 dark:text-gray-100">{exam.title}</span>
                                        <span className="text-[8px] text-gray-400 font-mono uppercase">ID: EX-{exam.id.toString().padStart(4, '0')}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center border-y border-transparent group-hover:border-amber-soft/30 dark:group-hover:border-blue-900/30 transition-all">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-warm-50 dark:bg-black/20 rounded-lg border border-warm-gray-300 dark:border-gray-700 shadow-warm-sm">
                                        <Clock className="w-3 h-3 text-blue-600" />
                                        <span className="font-mono text-xs font-black dark:text-gray-200">{exam.duration_minutes}m</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center border-y border-transparent group-hover:border-amber-soft/30 dark:group-hover:border-blue-900/30 transition-all">
                                    <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-md border shadow-sm ${exam.is_active ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800/50 dark:text-gray-500 dark:border-gray-700'}`}>
                                        {exam.is_active ? t('active') : t('draft')}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center border-y border-transparent group-hover:border-amber-soft/30 dark:group-hover:border-blue-900/30 transition-all">
                                    <button
                                        onClick={() => toggleRelease(exam.id, exam.results_released)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all shadow-sm border ${exam.results_released ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 hover:scale-105' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 hover:scale-105'}`}
                                    >
                                        {exam.results_released ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {exam.results_released ? t('assigned') : t('results_hidden')}
                                    </button>
                                </td>
                                <td className="py-3 px-4 text-right rounded-r-2xl border-y border-r border-transparent group-hover:border-amber-soft/30 dark:group-hover:border-blue-900/30 transition-all">
                                    <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleAssignExam(exam)} className="p-2 bg-warm-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-warm-sm hover:bg-blue-600 hover:text-white transition-all border border-warm-gray-300 dark:border-gray-700" title={t('assign_exam')}>
                                            <Users className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => viewResults(exam.id)} className="p-2 bg-warm-50 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-warm-sm hover:bg-emerald-600 hover:text-white transition-all border border-warm-gray-300 dark:border-gray-700" title={t('results')}>
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <Link to={`/admin/edit-exam/${exam.id}`} className="p-2 bg-warm-50 dark:bg-gray-800 text-amber-600 dark:text-amber-400 rounded-xl shadow-warm-sm hover:bg-amber-600 hover:text-white transition-all border border-warm-gray-300 dark:border-gray-700" title={t('edit')}>
                                            <Edit2 className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDeleteExam(exam.id)} className="p-2 bg-warm-50 dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-xl shadow-warm-sm hover:bg-red-600 hover:text-white transition-all border border-warm-gray-300 dark:border-gray-700" title={t('delete')}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {exams.length === 0 && (
                    <div className="py-12 text-center bg-warm-200/50 dark:bg-gray-800/30 rounded-[32px] border-2 border-dashed border-warm-gray-300 dark:border-gray-800">
                        <FileText className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-xs text-gray-400 font-bold italic">No exams created yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminExams;
