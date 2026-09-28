import JoinCode from '../../components/JoinCode';
import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Folder, Users, PlusCircle, Trash2, Download, Edit2, AlertTriangle } from 'lucide-react';

const AdminClasses = () => {
    const {
        classes,
        handleCreateClass,
        handleRenameClass,
        handleDeleteClass,
        handleExportClassToExcel,
        handleOpenAssignTeacher,
        handleOpenClassStudents,
        setActiveTab,
        t
    } = useOutletContext();

    return (
        <div className="bg-warm-100 dark:bg-gray-900 p-4 sm:p-8 rounded-[40px] shadow-warm-xl border-2 border-gray-100 dark:border-gray-800 transition-colors animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-10">
                <div className="flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3 dark:text-white tracking-tighter uppercase">
                        <Folder className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 shrink-0" /> {t('class_management')}
                    </h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{classes.length} {t('total')} {t('classes')}</p>
                </div>
                <button onClick={() => handleCreateClass()} className="self-start sm:self-auto bg-purple-600 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-[24px] font-black flex items-center gap-2 hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 active:scale-95 group">
                    <PlusCircle className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300" /> {t('new_class')}
                </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-separate border-spacing-y-4">
                    <thead>
                        <tr className="text-left">
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{t('class_name')}</th>
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-center">{t('teacher')}</th>
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-center">{t('students_count')}</th>
                            <th className="pb-4 px-6 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map(cls => (
                            <tr key={cls.id} className="group bg-warm-200/50 dark:bg-gray-800/30 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all">
                                <td className="py-6 px-6 rounded-l-[32px] border-y border-l border-transparent group-hover:border-purple-100 dark:group-hover:border-purple-900/30 transition-all">
                                    <h3 className="font-black text-xl text-gray-900 dark:text-white tracking-tighter uppercase">{cls.name}</h3>
                                </td>

                                <td className="py-6 px-6 text-center border-y border-transparent group-hover:border-purple-100 dark:group-hover:border-purple-900/30 transition-all">
                                    {cls.teacher ? (
                                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-warm-100 dark:bg-gray-900 rounded-xl border dark:border-gray-700 shadow-sm transition-all hover:border-blue-500 cursor-pointer" onClick={() => handleOpenAssignTeacher(cls)}>
                                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-[10px]">
                                                {(cls.teacher.name || cls.teacher.first_name || '?')[0]}
                                            </div>
                                            <span className="font-bold text-xs dark:text-white">{cls.teacher.name || `${cls.teacher.first_name || ''} ${cls.teacher.last_name || ''}`}</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleOpenAssignTeacher(cls)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 rounded-lg text-[10px] font-black uppercase tracking-tighter animate-pulse"
                                        >
                                            <AlertTriangle className="w-3 h-3" /> No Teacher
                                        </button>
                                    )}
                                </td>

                                <td className="py-6 px-6 text-center border-y border-transparent group-hover:border-purple-100 dark:group-hover:border-purple-900/30 transition-all">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-warm-100 dark:bg-gray-900 rounded-xl border dark:border-gray-700 shadow-sm">
                                        <Users className="w-4 h-4 text-purple-600" />
                                        <span className="font-black text-sm dark:text-gray-100">{cls.studentCount}</span>
                                    </div>
                                    <div className="mt-2"><JoinCode code={cls.join_code} /></div>
                                </td>

                                <td className="py-6 px-6 text-right rounded-r-[32px] border-y border-r border-transparent group-hover:border-purple-100 dark:group-hover:border-purple-900/30 transition-all">
                                    <div className="flex gap-2 justify-end opacity-40 group-hover:opacity-100 transition-all">
                                        <button onClick={(e) => { e.stopPropagation(); handleExportClassToExcel(cls.id); }} className="p-3 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm hover:bg-emerald-600 hover:text-white transition-all border dark:border-gray-700" title={t('export_excel')}>
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenClassStudents(cls); }} className="p-3 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-xl shadow-sm hover:bg-purple-600 hover:text-white transition-all border dark:border-gray-700" title={t('manage')}>
                                            <Users className="w-5 h-5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleRenameClass(cls.id, cls.name); }} className="p-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all border dark:border-gray-700" title={t('rename')}>
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} className="p-3 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all border dark:border-gray-700" title={t('delete')}>
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {classes.length === 0 && (
                    <div className="py-20 text-center bg-warm-200/50 dark:bg-gray-800/30 rounded-[40px] border-4 border-dashed dark:border-gray-800">
                        <Folder className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold italic">No classes created yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminClasses;
