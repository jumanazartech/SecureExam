import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, PlusCircle, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';

const AdminTeachers = () => {
    const { teachers, handleDeleteTeacher, setShowTeacherModal, t, handleQuickSelectTeacher } = useOutletContext();
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [copiedId, setCopiedId] = useState(null);

    const togglePassword = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = async (id, text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(`${id}-${type}`);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const onQuickSelect = (teacher) => {
        if (!teacher) return;
        handleQuickSelectTeacher(teacher);
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-[40px] shadow-2xl border-2 border-gray-100 dark:border-gray-800 transition-colors animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-10">
                <div className="flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3 dark:text-white tracking-tighter uppercase">
                        <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 shrink-0" /> {t('teachers')}
                    </h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{teachers.length} {t('total')} {t('teachers')}</p>
                </div>
                <button onClick={() => setShowTeacherModal(true)} className="self-start sm:self-auto bg-blue-600 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-[24px] font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 group">
                    <PlusCircle className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300" /> {t('add_teacher_btn')}
                </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-separate border-spacing-y-4">
                    <thead>
                        <tr className="text-left">
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{t('name')} / {t('surname')}</th>
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-center">{t('subject')}</th>
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{t('login')}</th>
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{t('password')}</th>
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-center">{t('classes')}</th>
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.map(teacher => (
                            <tr key={teacher.id} className="group bg-gray-50/50 dark:bg-gray-800/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all">
                                <td className="py-6 px-6 rounded-l-[32px] border-y border-l border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl">
                                            {(teacher.first_name || '?')[0]}{(teacher.last_name || '')[0]}
                                        </div>
                                        <div className="font-black text-gray-800 dark:text-white text-lg tracking-tighter">
                                            {teacher.last_name} {teacher.first_name}
                                        </div>
                                    </div>
                                </td>

                                <td className="py-6 px-6 text-center border-y border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                                    <span className="px-4 py-2 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest border dark:border-gray-700 shadow-sm">
                                        {teacher.subject || 'Not Assigned'}
                                    </span>
                                </td>

                                <td className="py-6 px-6 border-y border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                                    <div className="flex items-center gap-2 group/login">
                                        <span className="font-mono text-sm font-bold dark:text-gray-200">{teacher.username}</span>
                                        {copiedId === `${teacher.id}-login` ? (
                                            <span className="text-[10px] uppercase font-black text-green-500 animate-in fade-in slide-in-from-left-1">Copied!</span>
                                        ) : (
                                            <button
                                                onClick={() => copyToClipboard(teacher.id, teacher.username, 'login')}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                title={t('copy_login')}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>

                                <td className="py-6 px-6 border-y border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                                    <div className="flex items-center gap-3 group/pass">
                                        <span className="font-mono text-sm font-bold dark:text-gray-200">
                                            {visiblePasswords[teacher.id] ? teacher.plain_password : '••••••••'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => togglePassword(teacher.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                                {visiblePasswords[teacher.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            {copiedId === `${teacher.id}-password` ? (
                                                <span className="text-[10px] uppercase font-black text-green-500 animate-in fade-in slide-in-from-left-1">Copied!</span>
                                            ) : (
                                                <button
                                                    onClick={() => copyToClipboard(teacher.id, teacher.plain_password, 'password')}
                                                    className="text-gray-400 hover:text-blue-600"
                                                    title={t('copy_password')}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                <td className="py-6 px-6 text-center border-y border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                                    <div className="inline-flex flex-col items-center">
                                        <span className="text-xs font-black text-gray-800 dark:text-gray-200">{teacher.TeachingClasses?.length || 0}</span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('classes')}</span>
                                    </div>
                                </td>

                                <td className="py-6 px-6 text-right rounded-r-[32px] border-y border-r border-transparent group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-all">
                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => onQuickSelect(teacher)}
                                            className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            {t('quick_select') || 'Assign Class'}
                                        </button>
                                        <button onClick={() => handleDeleteTeacher(teacher.id)} className="p-3 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all border dark:border-gray-700">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {teachers.length === 0 && (
                    <div className="py-20 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-[40px] border-4 border-dashed dark:border-gray-800">
                        <Users className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold italic">No teachers added yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTeachers;
