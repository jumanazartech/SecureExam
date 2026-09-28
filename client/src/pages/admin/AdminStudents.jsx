import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Search, Trash2, PlusCircle, ChevronLeft, ChevronRight, ArrowUpDown, Eye, EyeOff, Copy, Check, Send, FileText, Edit2, X } from 'lucide-react';

const AdminStudents = () => {
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
        classes,
        exams
    } = useOutletContext();

    const [visiblePasswords, setVisiblePasswords] = React.useState({});
    const [copiedId, setCopiedId] = React.useState(null);
    const [editStudent, setEditStudent] = React.useState(null);
    const [editForm, setEditForm] = React.useState({ first_name: '', last_name: '', username: '', password: '', class_id: '' });

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
        <div className="bg-warm-100 dark:bg-gray-900 p-6 rounded-lg shadow-warm-lg border border-warm-gray-200 dark:border-gray-800 transition-colors">
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black flex items-center gap-2 flex-wrap dark:text-white">
                            <Users className="w-6 h-6 text-green-600 shrink-0" /> {t('student_records')}
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-xs">
                                {filteredStudents.length} {t('total')}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('manage_logins')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowStudentModal(true)} className="self-start sm:self-auto bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-500/20">
                            <PlusCircle className="w-5 h-5" /> {t('add_students_btn')}
                        </button>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-warm-200 dark:bg-gray-800/50 p-4 rounded-2xl border border-warm-gray-200 dark:border-gray-800">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('search_username')}
                            value={studentSearch}
                            onChange={(e) => {
                                setStudentSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-warm-50 dark:bg-gray-900 border border-warm-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-soft transition-all dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-warm-50 dark:bg-gray-900 border border-warm-gray-300 dark:border-gray-700 p-1 rounded-xl">
                            <ArrowUpDown className="w-4 h-4 ml-2 text-gray-400" />
                            <select
                                value={studentSortBy}
                                onChange={(e) => setStudentSortBy(e.target.value)}
                                className="bg-transparent py-1 px-2 text-sm font-bold dark:text-gray-200 outline-none"
                            >
                                <option value="time">{t('sort_by')}: {t('added')}</option>
                                <option value="name">{t('sort_by')}: {t('surname')}</option>
                                <option value="class">{t('sort_by')}: {t('classes')}</option>
                            </select>
                        </div>

                        <div className="flex items-center bg-warm-50 dark:bg-gray-900 border border-warm-gray-300 dark:border-gray-700 rounded-xl p-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 dark:text-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-3 text-sm font-black dark:text-white">
                                {currentPage} / {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 dark:text-white"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedStudents.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col md:flex-row items-center gap-4 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black">
                                {selectedStudents.length}
                            </div>
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                {selectedStudents.length} {t('students_count')} {t('selected') || 'selected'}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            <button
                                onClick={() => handleCreateClass(selectedStudents)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <PlusCircle className="w-4 h-4" /> {t('new_class')}
                            </button>
                            <div className="h-6 w-px bg-blue-200 dark:bg-blue-800 mx-2 hidden md:block"></div>

                            {/* Bulk Assign Exam Dropdown - PREMIUM DESIGN */}
                            <div className="relative group/assign">
                                <button
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    <Send className="w-4 h-4" /> {t('assign_exam')}
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl opacity-0 invisible group-hover/assign:opacity-100 group-hover/assign:visible transition-all z-[100] p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between p-3 border-b dark:border-gray-800 mb-2">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('select_exam') || 'Select Exam'}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                                        {exams && exams
                                            .filter(e => e.is_active)
                                            .sort((a, b) => b.id - a.id)
                                            .map(exam => (
                                                <button
                                                    key={exam.id}
                                                    onClick={() => {
                                                        handleAssignConfirm(exam.id, selectedStudents);
                                                        setSelectedStudents([]);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all group/item border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover/item:text-blue-600">{exam.title}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-gray-400 font-black uppercase">{exam.duration_minutes}m</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                <span className="text-[10px] text-blue-500 font-bold uppercase">{exam.exam_type || 'General'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        {(!exams || exams.filter(e => e.is_active).length === 0) && (
                                            <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed dark:border-gray-800">
                                                <p className="text-xs text-gray-400 font-bold italic">{t('no_active_exams') || 'No active exams'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="h-6 w-px bg-blue-200 dark:bg-blue-800 mx-2 hidden md:block"></div>
                            <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mr-2">{t('assign_to_existing') || 'Assign to existing'}:</span>
                            <div className="flex gap-1 flex-wrap">
                                {classes && classes.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => handleAssignToClass(cls.id)}
                                        className="px-3 py-1.5 bg-purple-600/10 text-purple-600 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-black hover:bg-purple-600 hover:text-white transition-all"
                                    >
                                        {cls.name}
                                    </button>
                                ))}
                            </div>
                            <div className="h-6 w-px bg-blue-200 dark:bg-blue-800 mx-2 hidden md:block"></div>
                            <button
                                onClick={handleDeleteSelectedStudents}
                                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-black hover:bg-red-200 dark:hover:bg-red-900/50 transition-all flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> {t('delete')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="text-left border-b dark:border-gray-800">
                        <tr>
                            <th className="pb-4 px-4">
                                <input
                                    type="checkbox"
                                    checked={paginatedStudents && paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.includes(s.id))}
                                    onChange={(e) => {
                                        if (!paginatedStudents) return;
                                        const currentIds = paginatedStudents.map(s => s.id);
                                        if (e.target.checked) {
                                            setSelectedStudents(prev => Array.from(new Set([...prev, ...currentIds])));
                                        } else {
                                            setSelectedStudents(prev => prev.filter(id => !currentIds.includes(id)));
                                        }
                                    }}
                                    className="w-4 h-4 cursor-pointer"
                                />
                            </th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('name')} / {t('surname')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('login')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('password')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('classes')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('created_by') || 'Created By'}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('added')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest text-right px-4">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                        {paginatedStudents.map(s => (
                            <tr key={s.id} className={`group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${selectedStudents.includes(s.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                <td className="py-4 px-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(s.id)}
                                        onChange={() => handleToggleStudentSelection(s.id)}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                </td>
                                <td className="py-4 min-w-[200px]">
                                    <div className="font-bold text-gray-800 dark:text-white truncate">
                                        {s.last_name} {s.first_name}
                                    </div>
                                </td>
                                <td className="py-4 group/login">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm dark:text-gray-300">{s.username}</span>
                                        {copiedId === `${s.id}-login` ? (
                                            <span className="text-[10px] uppercase font-black text-green-500 animate-in fade-in slide-in-from-left-1">Copied!</span>
                                        ) : (
                                            <button
                                                onClick={() => copyToClipboard(s.id, s.username, 'login')}
                                                className="text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover/login:opacity-100"
                                                title={t('copy_login')}
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 group/pass">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm dark:text-gray-300">
                                            {visiblePasswords[s.id] ? s.plain_password : '••••••••'}
                                        </span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover/pass:opacity-100 transition-opacity">
                                            <button onClick={() => togglePassword(s.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                                {visiblePasswords[s.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            {copiedId === `${s.id}-password` ? (
                                                <span className="text-[10px] uppercase font-black text-green-500 animate-in fade-in slide-in-from-left-1">Copied!</span>
                                            ) : (
                                                <button
                                                    onClick={() => copyToClipboard(s.id, s.plain_password, 'password')}
                                                    className="text-gray-400 hover:text-blue-600"
                                                    title={t('copy_password')}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${s.class_id ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'text-gray-400 italic tracking-widest'}`}>
                                        {classes.find(c => c.id === s.class_id)?.name || t('not_assigned')}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-900 dark:text-gray-300">
                                            {s.creator ? `${s.creator.last_name} ${s.creator.first_name}` : 'Admin'}
                                        </span>
                                        {s.creator && (
                                            <span className="text-[9px] text-gray-400 uppercase font-black">{s.creator.username}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 text-xs text-gray-500 font-mono">
                                    {new Date(s.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-right px-4">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditClick(s)}
                                            className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStudent(s.id)}
                                            className="p-2 rounded-lg bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedStudents.length === 0 && (
                            <tr>
                                <td colSpan="7" className="py-12 text-center text-gray-400 italic">{t('no_students_found')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Student Modal */}
            {editStudent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300 text-left">
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
                            <div className="grid grid-cols-2 gap-4 text-left">
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
                                <div className="col-span-1 text-left">
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

                            <div className="text-left">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    value={editForm.username}
                                    onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                />
                            </div>

                            <div className="text-left">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">New Password (leave blank to keep)</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    placeholder="Enter new password..."
                                    value={editForm.password}
                                    onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                />
                            </div>

                            <div className="text-left">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Assigned Class</label>
                                <select
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white transition-all appearance-none cursor-pointer"
                                    value={editForm.class_id}
                                    onChange={e => setEditForm(prev => ({ ...prev, class_id: e.target.value }))}
                                >
                                    <option value="">-- No Class --</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 space-y-3">
                                <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest">
                                    {t('save') || 'Save Changes'}
                                </button>
                                <button type="button" onClick={() => setEditStudent(null)} className="w-full py-2 text-gray-400 font-bold uppercase tracking-widest text-xs">
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

export default AdminStudents;
