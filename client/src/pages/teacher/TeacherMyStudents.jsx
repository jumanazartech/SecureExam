import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Search, Trash2, PlusCircle, ChevronLeft, ChevronRight, ArrowUpDown, Eye, EyeOff, Copy, Send, FileText, Check, Edit2, X } from 'lucide-react';

const TeacherMyStudents = () => {
    const {
        t,
        filteredStudents,
        paginatedStudents,
        selectedStudents,
        setSelectedStudents,
        studentSearch,
        setStudentSearch,
        studentSortBy,
        setStudentSortBy,
        currentPage,
        setCurrentPage,
        totalPages,
        handleToggleStudentSelection,
        handleDeleteStudent,
        handleUpdateStudent,
        handleDeleteSelectedStudents,
        handleCreateClass,
        handleAssignToClass,
        handleAssignConfirm,
        setShowStudentModal,
        myClasses,
        exams
    } = useOutletContext();

    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [editStudent, setEditStudent] = useState(null);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', username: '', password: '', class_id: '' });

    const togglePassword = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = async (id, text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(`${id}-${type}`);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handleEditClick = (student) => {
        setEditStudent(student);
        setEditForm({
            first_name: student.first_name || '',
            last_name: student.last_name || '',
            username: student.username || '',
            password: '',
            class_id: student.class_id || ''
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const success = await handleUpdateStudent(editStudent.id, editForm);
        if (success) setEditStudent(null);
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border dark:border-gray-800 transition-colors animate-in fade-in duration-500">
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black flex items-center gap-2 dark:text-white uppercase tracking-tighter">
                            <Users className="w-8 h-8 text-blue-600" /> {t('student_records') || 'Student Management'}
                            <span className="ml-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs font-black">
                                {filteredStudents.length} {t('total')}
                            </span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Manage logins and view performance.</p>
                    </div>
                    <button onClick={() => setShowStudentModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                        <PlusCircle className="w-5 h-5" /> {t('add_students_btn')}
                    </button>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border dark:border-gray-800">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('search_students') || 'Search students...'}
                            value={studentSearch}
                            onChange={(e) => {
                                setStudentSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all dark:text-white font-bold"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border dark:border-gray-700 p-2 rounded-2xl">
                            <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />
                            <select
                                value={studentSortBy}
                                onChange={(e) => setStudentSortBy(e.target.value)}
                                className="bg-transparent py-1 px-2 text-xs font-black dark:text-gray-200 outline-none uppercase tracking-widest"
                            >
                                <option value="time">{t('sort_by')}: {t('added')}</option>
                                <option value="name">{t('sort_by')}: {t('surname')}</option>
                                <option value="class">{t('sort_by')}: {t('classes')}</option>
                            </select>
                        </div>

                        <div className="flex items-center bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl disabled:opacity-30 dark:text-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-4 text-xs font-black dark:text-white uppercase tracking-widest">
                                {currentPage} / {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl disabled:opacity-30 dark:text-white"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedStudents.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-[28px] flex flex-col md:flex-row items-center gap-4 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-500/30">
                                {selectedStudents.length}
                            </div>
                            <p className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-tighter">
                                {selectedStudents.length} {t('selected') || 'Students Selected'}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            <button
                                onClick={() => handleCreateClass(selectedStudents)}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 uppercase tracking-widest"
                            >
                                <PlusCircle className="w-4 h-4" /> {t('new_class')}
                            </button>

                            <div className="relative group/exam">
                                <button className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-widest">
                                    <Send className="w-4 h-4" /> {t('assign_exam')}
                                </button>
                                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl opacity-0 invisible group-hover/exam:opacity-100 group-hover/exam:visible transition-all z-[100] p-3">
                                    <div className="p-2 border-b dark:border-gray-800 mb-2 font-black text-[10px] text-gray-400 uppercase tracking-widest">Select Exam</div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                                        {exams.filter(e => e.is_active).map(exam => (
                                            <button
                                                key={exam.id}
                                                onClick={() => {
                                                    handleAssignConfirm(exam.id, selectedStudents);
                                                    setSelectedStudents([]);
                                                }}
                                                className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
                                            >
                                                <p className="text-sm font-bold dark:text-white truncate">{exam.title}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{exam.duration_minutes}m</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-blue-200 dark:bg-blue-800 mx-1 hidden md:block"></div>

                            <div className="flex gap-1">
                                {myClasses.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => handleAssignToClass(cls.id)}
                                        className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 rounded-xl text-[10px] font-black hover:bg-purple-600 hover:text-white transition-all uppercase tracking-widest"
                                    >
                                        {cls.name}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleDeleteSelectedStudents}
                                className="px-5 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 uppercase tracking-widest"
                            >
                                <Trash2 className="w-4 h-4" /> {t('delete')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b dark:border-gray-800">
                            <th className="pb-4 px-4">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.includes(s.id))}
                                        onChange={(e) => {
                                            const currentIds = paginatedStudents.map(s => s.id);
                                            if (e.target.checked) {
                                                setSelectedStudents(prev => Array.from(new Set([...prev, ...currentIds])));
                                            } else {
                                                setSelectedStudents(prev => prev.filter(id => !currentIds.includes(id)));
                                            }
                                        }}
                                        className="w-5 h-5 rounded-lg border-2 dark:bg-gray-800 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                            </th>
                            <th className="pb-4 font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">{t('name')}</th>
                            <th className="pb-4 font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">{t('login')}</th>
                            <th className="pb-4 font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">{t('password')}</th>
                            <th className="pb-4 font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">{t('classes')}</th>
                            <th className="pb-4 font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">{t('created_by')}</th>
                            <th className="pb-4 font-black text-gray-400 uppercase text-[10px] tracking-[0.2em] text-right px-4">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                        {paginatedStudents.map(s => (
                            <tr key={s.id} className={`group hover:bg-gray-50 dark:hover:bg-blue-900/5 transition-colors ${selectedStudents.includes(s.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                <td className="py-5 px-4">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(s.id)}
                                            onChange={() => handleToggleStudentSelection(s.id)}
                                            className="w-5 h-5 rounded-lg border-2 dark:bg-gray-800 dark:border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                </td>
                                <td className="py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black">
                                            {s.first_name?.[0]}{s.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white leading-tight">{s.last_name} {s.first_name}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">ID: #{s.id.toString().padStart(4, '0')}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5 group/login">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{s.username}</span>
                                        <button
                                            onClick={() => copyToClipboard(s.id, s.username, 'login')}
                                            className="text-gray-400 hover:text-blue-600 opacity-0 group-hover/login:opacity-100 transition-all active:scale-95"
                                        >
                                            {copiedId === `${s.id}-login` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                                <td className="py-5 group/pass">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                                            {visiblePasswords[s.id] ? s.plain_password : '••••••••'}
                                        </span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover/pass:opacity-100 transition-all">
                                            <button onClick={() => togglePassword(s.id)} className="text-gray-400 hover:text-blue-600">
                                                {visiblePasswords[s.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(s.id, s.plain_password, 'password')}
                                                className="text-gray-400 hover:text-blue-600"
                                            >
                                                {copiedId === `${s.id}-password` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5">
                                    {s.class_id ? (
                                        <div className="flex flex-col">
                                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
                                                {s.Class?.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-400 italic font-black uppercase tracking-widest">Not Assigned</span>
                                    )}
                                </td>
                                <td className="py-5">
                                    <div className="flex flex-col min-w-[120px]">
                                        <span className="text-[11px] font-bold text-gray-900 dark:text-gray-300">
                                            {s.creator ? `${s.creator.last_name} ${s.creator.first_name}` : 'Admin'}
                                        </span>
                                        {s.creator && (
                                            <span className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">{s.creator.username}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-5 text-right px-4">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditClick(s)}
                                            className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            title="Edit Student"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStudent(s.id)}
                                            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                            title="Delete Student"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedStudents.length === 0 && (
                            <tr>
                                <td colSpan="7" className="py-20 text-center">
                                    <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-black uppercase tracking-[0.2em]">No students found</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Student Modal */}
            {editStudent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[40px] p-10 max-w-md w-full border dark:border-gray-800 shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-black dark:text-white tracking-tighter uppercase">{t('edit') || 'Edit Student'}</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">{editStudent.username}</p>
                            </div>
                            <button onClick={() => setEditStudent(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Surname</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white transition-all"
                                        value={editForm.last_name}
                                        onChange={e => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white transition-all"
                                        value={editForm.first_name}
                                        onChange={e => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    value={editForm.username}
                                    onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">New Password (leave blank to keep)</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    placeholder="Enter new password..."
                                    value={editForm.password}
                                    onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Assigned Class</label>
                                <select
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white transition-all appearance-none cursor-pointer"
                                    value={editForm.class_id}
                                    onChange={e => setEditForm(prev => ({ ...prev, class_id: e.target.value }))}
                                >
                                    <option value="">-- No Class --</option>
                                    {myClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 space-y-3">
                                <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                    {t('save') || 'Save Changes'}
                                </button>
                                <button type="button" onClick={() => setEditStudent(null)} className="w-full py-2 text-gray-400 font-bold">
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherMyStudents;
