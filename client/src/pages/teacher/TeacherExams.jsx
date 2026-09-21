import React from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { FileText, PlusCircle, Trash2, Edit2, Clock } from 'lucide-react';

const TeacherExams = () => {
    const { exams, deleteExam, t } = useOutletContext();
    const navigate = useNavigate();

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border dark:border-gray-800 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black flex items-center gap-2 dark:text-white">
                    <FileText className="w-6 h-6 text-blue-600" /> {t('exam_management')}
                </h2>
                <button
                    onClick={() => navigate('/teacher/create-exam')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                    <PlusCircle className="w-5 h-5" /> {t('new_exam')}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="text-left border-b dark:border-gray-800">
                        <tr>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('exam_title')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('duration')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('status')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                        {exams.map(exam => (
                            <tr key={exam.id} className="group">
                                <td className="py-4 font-bold text-gray-800 dark:text-gray-100">{exam.title}</td>
                                <td className="py-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        {exam.duration_minutes}m
                                    </div>
                                </td>
                                <td className="py-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-black uppercase ${exam.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}>
                                        {exam.is_active ? t('active') : t('draft')}
                                    </span>
                                </td>
                                <td className="py-4 flex gap-2 justify-end">
                                    <button
                                        onClick={() => deleteExam(exam.id)}
                                        className="p-2 rounded-lg bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                                        title={t('delete')}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => navigate(`/teacher/edit-exam/${exam.id}`)}
                                        className="p-2 rounded-lg bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors"
                                        title={t('edit')}
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {exams.length === 0 && (
                            <tr>
                                <td colSpan="4" className="py-12 text-center text-gray-400 italic">No exams created yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherExams;
