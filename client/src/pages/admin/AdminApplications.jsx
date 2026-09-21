import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { MessageSquare, Image } from 'lucide-react';

const AdminApplications = () => {
    const { appeals, t } = useOutletContext();
    return (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border dark:border-gray-800 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black flex items-center gap-2 dark:text-white">
                    <MessageSquare className="w-6 h-6 text-blue-600" /> {t('my_applications')}
                </h2>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-xs font-bold">
                    {appeals.length} {t('total')}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b dark:border-gray-800">
                            <th className="p-4 font-bold text-gray-400 text-xs uppercase tracking-widest whitespace-nowrap">{t('student_class')}</th>
                            <th className="p-4 font-bold text-gray-400 text-xs uppercase tracking-widest whitespace-nowrap">{t('assigned_teacher')}</th>
                            <th className="p-4 font-bold text-gray-400 text-xs uppercase tracking-widest whitespace-nowrap">{t('app_details')}</th>
                            <th className="p-4 font-bold text-gray-400 text-xs uppercase tracking-widest whitespace-nowrap">{t('status')}</th>
                            <th className="p-4 font-bold text-gray-400 text-xs uppercase tracking-widest whitespace-nowrap text-right">{t('date')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                        {appeals.map(appeal => (
                            <tr key={appeal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900 dark:text-white whitespace-nowrap">{appeal.Student?.last_name} {appeal.Student?.first_name}</div>
                                    <div className="text-xs text-gray-500">{appeal.Student?.Class?.name || t('no_class')}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                                        {appeal.Student?.Class?.Teacher ? `${appeal.Student.Class.Teacher.last_name} ${appeal.Student.Class.Teacher.first_name}` : t('not_assigned')}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-bold dark:text-gray-200 mb-1">
                                        {appeal.title.startsWith('Error in question #')
                                            ? `${t('error_in_question')} #${appeal.title.split('#')[1]}`
                                            : appeal.title}
                                    </div>
                                    <div className="text-xs text-gray-500 max-w-xs line-clamp-2 mb-2" title={appeal.message}>{appeal.message}</div>
                                    <div className="flex items-center gap-2">
                                        {appeal.response_image && (
                                            <a
                                                href={`${import.meta.env.VITE_API_TARGET || 'http://localhost:5000'}${appeal.response_image}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                                            >
                                                <Image className="w-3 h-3" /> {t('view_solution')}
                                            </a>
                                        )}
                                        {appeal.exam_id && appeal.question_id && (
                                            <Link
                                                to={`/admin/edit-exam/${appeal.exam_id}#question-${appeal.question_id}`}
                                                className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold hover:bg-blue-100 transition-colors"
                                            >
                                                {t('view_question') || 'Go to Question'}
                                            </Link>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${appeal.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                        {appeal.status === 'resolved' ? t('answered') : t('pending')}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(appeal.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {appeals.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-gray-500 italic">No applications found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminApplications;
