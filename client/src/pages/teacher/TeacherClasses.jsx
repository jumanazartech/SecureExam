import JoinCode from '../../components/JoinCode';
import { useAuth } from '../../context/AuthContext';
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Folder, Users, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const TeacherClasses = () => {
    const { myClasses, expandedClass, setExpandedClass, t, results, fetchResults } = useOutletContext();
    const { account } = useAuth();
    const [classTabs, setClassTabs] = React.useState({}); // { classId: 'roster' | 'results' }

    React.useEffect(() => {
        fetchResults();
    }, []);

    const toggleTab = (classId, tab) => {
        setClassTabs(prev => ({ ...prev, [classId]: tab }));
    };

    const downloadToExcel = (cls) => {
        const classResults = results.filter(r => r.student.class_id === cls.id);

        const data = classResults.map((r, index) => ({
            [t('number') || 'Number']: index + 1,
            [t('first_name') || 'First Name']: r.student.first_name,
            [t('last_name') || 'Last Name']: r.student.last_name,
            [t('class') || 'Class']: r.student.class_name,
            [t('status') || 'Status']: r.exam.results_released ? (t('assigned') || 'Released') : (t('pending') || 'Pending'),
            [t('score') || 'Score']: r.exam.exam_type === 'rasch_national_cert' ? r.rasch_score : r.score,
            [t('exam_name') || 'Exam Name']: r.exam.title
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, cls.name);
        XLSX.writeFile(wb, `${cls.name}_results.xlsx`);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <Folder className="w-6 h-6 text-blue-600" /> {t('classes')}
                </h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {myClasses.map(cls => (
                    <div key={cls.id} className="group">
                        <div
                            className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg transition-all ${expandedClass === cls.id ? 'bg-blue-100 text-blue-600 rotate-90' : 'bg-gray-100 text-gray-500'}`}>
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{cls.name}</h3>
                                    <p className="text-sm text-gray-500">{cls.studentCount} {t('students_count')}</p>
                                </div>
                            </div>
                            <JoinCode code={cls.join_code} />
                        </div>

                        {expandedClass === cls.id && (
                            <div className="bg-gray-50 dark:bg-black/20 border-t dark:border-gray-800 animate-in slide-in-from-top-2">
                                {/* Tabs Header */}
                                <div className="flex border-b dark:border-gray-800">
                                    <button
                                        onClick={() => toggleTab(cls.id, 'roster')}
                                        className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${(!classTabs[cls.id] || classTabs[cls.id] === 'roster')
                                            ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {t('roster') || 'Student Roster'}
                                    </button>
                                    <button
                                        onClick={() => toggleTab(cls.id, 'results')}
                                        className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${classTabs[cls.id] === 'results'
                                            ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {t('results') || 'Exam Results'}
                                    </button>
                                </div>

                                <div className="p-6">
                                    {(!classTabs[cls.id] || classTabs[cls.id] === 'roster') ? (
                                        /* Roster View */
                                        <div>
                                            {cls.students && cls.students.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {cls.students.map(student => (
                                                        <div key={student.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800 flex items-center gap-3 shadow-sm">
                                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold text-gray-500">
                                                                {student.first_name?.[0]}{student.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-800 dark:text-gray-200">
                                                                    {student.last_name} {student.first_name}
                                                                </div>
                                                                <div className="text-xs text-gray-400 font-mono">
                                                                    {student.username}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-400 italic">No students in this class.</div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Results View */
                                        <div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('student_results') || 'Student Results'}</h4>
                                                <button
                                                    onClick={() => { if (account?.usage && !account.usage.features.excelExport) { window.dispatchEvent(new CustomEvent('plan-limit', { detail: { message: t('pro_excel_locked') } })); return; } downloadToExcel(cls); }}
                                                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    {t('download_excel')}
                                                </button>
                                            </div>

                                            {results.filter(r => r.student.class_id === cls.id).length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b dark:border-gray-800">
                                                                <th className="px-4 py-3">#</th>
                                                                <th className="px-4 py-3">{t('student_name') || 'Student'}</th>
                                                                <th className="px-4 py-3">{t('exam') || 'Exam'}</th>
                                                                <th className="px-4 py-3 text-center">{t('status') || 'Status'}</th>
                                                                <th className="px-4 py-3 text-right">{t('score') || 'Score'}</th>
                                                                <th className="px-4 py-3 text-right">{t('date') || 'Date'}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y dark:divide-gray-800">
                                                            {results.filter(r => r.student.class_id === cls.id).map((res, idx) => (
                                                                <tr key={res.id} className="text-sm hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                                    <td className="px-4 py-4 font-bold text-gray-400">{idx + 1}</td>
                                                                    <td className="px-4 py-4">
                                                                        <div className="font-bold text-gray-800 dark:text-gray-200">
                                                                            {res.student.last_name} {res.student.first_name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-400">{res.student.username}</div>
                                                                    </td>
                                                                    <td className="px-4 py-4">
                                                                        <div className="font-bold text-gray-700 dark:text-gray-300">{res.exam.title}</div>
                                                                        <div className="text-[10px] uppercase font-black text-blue-500">{res.exam.exam_type}</div>
                                                                    </td>
                                                                    <td className="px-4 py-4 text-center">
                                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${res.exam.results_released ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>
                                                                            {res.exam.results_released ? t('assigned') : t('pending') || 'Pending'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-4 text-right font-black text-blue-600 dark:text-blue-400 text-lg">
                                                                        {res.exam.exam_type === 'rasch_national_cert' ? res.rasch_score : res.score}
                                                                        {res.exam.exam_type === 'rasch_national_cert' && res.certificate_level && (
                                                                            <div className="text-[9px] text-blue-500 font-black uppercase">
                                                                                Level {res.certificate_level}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-4 text-right text-xs text-gray-500 font-medium">
                                                                        <div>{new Date(res.end_time).toLocaleDateString()}</div>
                                                                        <div className="text-[10px] opacity-70">{new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 text-gray-400 italic bg-white dark:bg-gray-900/20 rounded-2xl border-2 border-dashed dark:border-gray-800">
                                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p>{t('no_results_found') || 'No results found for this class.'}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {myClasses.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    No classes assigned to you yet.
                </div>
            )}
        </div>
    );
};

export default TeacherClasses;
