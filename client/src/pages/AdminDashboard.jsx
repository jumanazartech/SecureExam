import BulkStudentModal from '../components/BulkStudentModal';
import CredentialsModal from '../components/CredentialsModal';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import * as XLSX from 'xlsx';

// Components
import AdminLayout from './admin/AdminLayout';
import ExamAssignmentModal from '../components/ExamAssignmentModal';
import ConfirmModal from '../components/ConfirmModal';
import { CheckCircle, XCircle, FileText, Users, Folder, X } from 'lucide-react';

const AdminDashboard = () => {
    const { api, t } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [exams, setExams] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [appeals, setAppeals] = useState([]);

    // UI State
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedExamForAssignment, setSelectedExamForAssignment] = useState(null);
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [teacherForm, setTeacherForm] = useState({ first_name: '', last_name: '', subject: '' });
    const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
    const [showTeacherQuickClassModal, setShowTeacherQuickClassModal] = useState(false);
    const [selectedTeacherForClass, setSelectedTeacherForClass] = useState(null);
    const [selectedClassForTeacher, setSelectedClassForTeacher] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [newCredentials, setNewCredentials] = useState(null);
    const [studentNamesInput, setStudentNamesInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentSortBy, setStudentSortBy] = useState('time');
    const itemsPerPage = 24;

    // Modals config
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'danger', confirmText: 'Delete' });
    const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = () => {
        fetchExams();
        fetchStudents();
        fetchClasses();
        fetchTeachers();
        fetchAppeals();
    };

    const fetchAppeals = async () => {
        try { const res = await api.get('/appeals/admin/appeals'); setAppeals(res.data); } catch (err) { console.error(err); }
    };
    const fetchTeachers = async () => {
        try { const res = await api.get('/auth/admin/teachers'); setTeachers(res.data); } catch (err) { console.error(err); }
    };
    const fetchExams = async () => {
        try { const res = await api.get('/exams'); setExams(res.data); } catch (err) { console.error(err); }
    };
    const fetchStudents = async () => {
        try { const res = await api.get('/auth/admin/students'); setStudents(res.data); } catch (err) { console.error(err); }
    };
    const fetchClasses = async () => {
        try { const res = await api.get('/classes'); setClasses(res.data); } catch (err) { console.error(err); }
    };

    // UI Helpers
    const showAlert = (title, message, type = 'success') => {
        setCustomAlert({ isOpen: true, title, message, type });
        if (type === 'success') {
            setTimeout(() => setCustomAlert(prev => ({ ...prev, isOpen: false })), 2000);
        }
    };

    const [showClassStudentsModal, setShowClassStudentsModal] = useState(false);
    const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);

    // Actions
    const handleAssignExam = (exam) => {
        setSelectedExamForAssignment(exam);
        setShowAssignmentModal(true);
    };

    const handleAssignConfirm = async (examId, studentIds) => {
        try {
            await api.post(`/exams/${examId}/assign`, { student_ids: studentIds });
            setShowAssignmentModal(false);
            showAlert(t('reported'), t('exam_assigned_success'));
        } catch (err) {
            showAlert('Error', 'Failed to assign exam', 'error');
        }
    };

    const handleDeleteExam = (examId) => {
        setConfirmConfig({
            isOpen: true,
            title: t('delete'),
            message: 'Are you sure you want to delete this exam?',
            type: 'danger',
            confirmText: t('delete'),
            onConfirm: async () => {
                try {
                    await api.delete(`/exams/${examId}`);
                    setConfirmConfig(p => ({ ...p, isOpen: false }));
                    showAlert(t('reported'), 'Deleted');
                    fetchExams();
                } catch (err) { showAlert('Error', 'Failed', 'error'); }
            }
        });
    };

    const handleDeleteStudent = (id) => {
        setConfirmConfig({
            isOpen: true,
            title: t('delete'),
            message: 'Delete student?',
            type: 'danger',
            confirmText: t('delete'),
            onConfirm: async () => {
                try {
                    await api.delete(`/auth/admin/students/${id}`);
                    setConfirmConfig(p => ({ ...p, isOpen: false }));
                    fetchStudents();
                } catch (err) { showAlert('Error', 'Failed', 'error'); }
            }
        });
    };

    const handleUpdateStudent = async (id, data) => {
        try {
            await api.put(`/auth/admin/students/${id}`, data);
            fetchStudents();
            showAlert(t('reported'), 'Student updated');
            return true;
        } catch (err) {
            showAlert('Error', err.response?.data?.error || 'Failed to update student', 'error');
            return false;
        }
    };

    const handleStudentsCreated = (data) => {
        fetchStudents();
        if (data.created?.length) setNewCredentials({ title: t('add_students_btn'), list: data.created });
        if (data.errors?.length) showAlert('Error', data.errors.map(e => `${e.name}: ${e.error}`).join('\n'), 'error');
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/admin/teachers', teacherForm);
            setShowTeacherModal(false);
            setTeacherForm({ first_name: '', last_name: '', subject: '' });
            fetchTeachers();
            setNewCredentials({ title: t('teachers') || 'Teacher', list: [res.data.credentials] });
        } catch (err) {
            showAlert('Error', err.response?.data?.error || err.message, 'error');
        }
    };

    const handleDeleteTeacher = (id) => {
        setConfirmConfig({
            isOpen: true,
            title: t('delete'),
            message: 'Remove teacher?',
            type: 'danger',
            confirmText: t('delete'),
            onConfirm: async () => {
                try {
                    await api.delete(`/auth/admin/teachers/${id}`);
                    setConfirmConfig(p => ({ ...p, isOpen: false }));
                    fetchTeachers();
                } catch (err) { showAlert('Error', 'Failed', 'error'); }
            }
        });
    };

    const handleCreateClass = async (initialStudentIds = []) => {
        setConfirmConfig({
            isOpen: true,
            title: t('add_new_class') || 'Add New Class',
            message: t('enter_class_name') || 'Enter class name:',
            type: 'info',
            confirmText: t('add'),
            showInput: true,
            onConfirm: async (className) => {
                if (!className || !className.trim()) return;
                try {
                    const res = await api.post('/classes', { name: className.trim() });

                    // If we have initial students to add
                    if (initialStudentIds && initialStudentIds.length > 0) {
                        await api.post('/classes/assign-students', {
                            studentIds: initialStudentIds,
                            classId: res.data.id
                        });
                        setSelectedStudents([]); // Clear selection
                        fetchStudents();
                    }

                    setConfirmConfig(p => ({ ...p, isOpen: false }));
                    fetchClasses();
                    showAlert(t('reported'), t('class_created_success') || 'Class created');
                } catch (err) { showAlert('Error', err.response?.data?.error || 'Failed', 'error'); }
            }
        });
    };

    const handleDeleteClass = (id) => {
        setConfirmConfig({
            isOpen: true,
            title: t('delete'),
            message: t('delete_class_warning') || 'Are you sure you want to delete this class? All students will be unassigned.',
            type: 'danger',
            confirmText: t('delete'),
            onConfirm: async () => {
                try {
                    await api.delete(`/classes/${id}`);
                    setConfirmConfig(p => ({ ...p, isOpen: false }));
                    fetchClasses();
                    showAlert(t('reported'), t('deleted'));
                } catch (err) { showAlert('Error', 'Failed', 'error'); }
            }
        });
    };

    const handleRenameClass = (id, currentName) => {
        setConfirmConfig({
            isOpen: true,
            title: t('rename_class') || 'Rename Class',
            message: `${t('current_name') || 'Current name'}: ${currentName}`,
            type: 'info',
            confirmText: t('save') || 'Save',
            showInput: true,
            onConfirm: async (newName) => {
                if (!newName || !newName.trim()) return;
                try {
                    await api.put(`/classes/${id}`, { name: newName.trim() });
                    setConfirmConfig(p => ({ ...p, isOpen: false }));
                    fetchClasses();
                    showAlert(t('reported'), t('class_renamed_success') || 'Class renamed');
                } catch (err) { showAlert('Error', err.response?.data?.error || 'Failed', 'error'); }
            }
        });
    };

    const handleAssignToClass = async (classId) => {
        try {
            await api.post('/classes/assign-students', { studentIds: selectedStudents, classId });
            setSelectedStudents([]);
            fetchClasses();
            fetchStudents();
            showAlert(t('reported'), 'Assigned');
        } catch (err) { showAlert('Error', 'Failed', 'error'); }
    };

    // Manage Class Students
    const handleOpenClassStudents = (cls) => {
        setSelectedClassForStudents(cls);
        setShowClassStudentsModal(true);
    };

    const handleAddStudentsToClass = async (studentIds) => {
        if (!selectedClassForStudents) return;
        try {
            await api.post('/classes/assign-students', {
                studentIds: studentIds,
                classId: selectedClassForStudents.id
            });
            fetchClasses();
            fetchStudents();
            // Don't close modal, just refresh data
            showAlert(t('reported'), 'Students added');
        } catch (err) { showAlert('Error', 'Failed to add students', 'error'); }
    };

    const handleRemoveStudentFromClass = async (studentId) => {
        // Since we don't have a specific endpoint to remove from class, we can just assign to null?
        // Or if there is a remove endpoint. Usually assigning to null or a different class is the way.
        // Assuming update student or specialized endpoint. 
        // Let's assume we can use the same assign endpoint but finding a way to unassign?
        // Actually, many systems just let you overwrite.
        // Let's implement unassign by updating student class_id to null via student update if available,
        // or re-assigning. 
        // Limitation: Verify if `PUT /auth/profile` works for admins or if we need a specific one.
        // Let's check `server/routes/class.routes.js` if available or `server/routes/auth.routes.js`.
        // For now, I'll use a placeholder alert or try to set class to null via an assumed endpoint if one existed.
        // Wait, `handleDeleteStudent` deletes user. 
        // Let's try to update the student directly if possible. 
        // If not available, I will skip unassign for now to avoid breaking things, or just rely on re-assigning to another class.
        // Actually best way: The prompt asked for "Manage buttons... to add to class".
        // So adding is prioritized.
        // I will implement "Add" logic primarily.

        // However, to be complete: 
        // If I can't unassign, I'll just focus on adding.
    };

    const handleDeleteSelectedStudents = () => {
        setConfirmConfig({
            isOpen: true,
            title: t('delete'),
            message: `Delete ${selectedStudents.length} students?`,
            type: 'danger',
            confirmText: t('delete'),
            onConfirm: async () => {
                try {
                    await api.post('/auth/admin/delete-students', { ids: selectedStudents });
                    setSelectedStudents([]);
                    setConfirmConfig(p => ({ ...p, isOpen: false }));
                    fetchStudents();
                } catch (err) { showAlert('Error', 'Failed', 'error'); }
            }
        });
    };

    const handleToggleStudentSelection = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleQuickSelectTeacher = (teacher) => {
        setSelectedTeacherForClass(teacher);
        setShowTeacherQuickClassModal(true);
    };

    const handleTeacherAssignClassConfirm = async (classId) => {
        try {
            await api.put(`/classes/${classId}`, { teacher_id: selectedTeacherForClass.id });
            setShowTeacherQuickClassModal(false);
            fetchClasses();
            fetchTeachers();
            showAlert(t('reported'), 'Class assigned to teacher');
        } catch (err) { showAlert('Error', 'Failed', 'error'); }
    };

    const handleOpenAssignTeacher = (cls) => {
        setSelectedClassForTeacher(cls);
        setShowAssignTeacherModal(true);
    };

    const handleAssignTeacherConfirm = async (teacherId) => {
        try {
            // Need PUT /classes/:id to update teacher_id
            await api.put(`/classes/${selectedClassForTeacher.id}`, { teacher_id: teacherId });
            setShowAssignTeacherModal(false);
            fetchClasses();
            showAlert(t('reported'), 'Teacher assigned');
        } catch (err) { showAlert('Error', 'Failed', 'error'); }
    };

    const viewResults = async (examId) => {
        try {
            const res = await api.get(`/submissions/exam/${examId}`);
            navigate(`/admin/results/${examId}`, { state: { results: res.data } });
        } catch (err) { showAlert('Error', 'Failed', 'error'); }
    };

    const handleExportClassToExcel = (classId) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) return;
        const classStudents = students.filter(s => s.class_id === classId);
        const data = classStudents.map((s, i) => ({ '№': i + 1, 'Full Name': `${s.last_name || ''} ${s.first_name || ''}`.trim(), 'Login': s.username, 'Password': s.plain_password || '***' }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, cls.name);
        XLSX.writeFile(wb, `${cls.name}_credentials.xlsx`);
    };

    // Filter Logic
    const filteredStudents = useMemo(() => {
        let res = [...students];
        if (studentSearch) {
            const q = studentSearch.toLowerCase();
            res = res.filter(s => (s.username || '').toLowerCase().includes(q) || (s.first_name || '').toLowerCase().includes(q) || (s.last_name || '').toLowerCase().includes(q));
        }
        res.sort((a, b) => {
            if (studentSortBy === 'name') return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
            if (studentSortBy === 'class') return (classes.find(c => c.id === a.class_id)?.name || '').localeCompare(classes.find(c => c.id === b.class_id)?.name || '');
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        return res;
    }, [students, studentSearch, studentSortBy, classes]);

    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    return (
        <AdminLayout>
            <Outlet context={{
                exams, setExams, fetchExams,
                students, setStudents, fetchStudents,
                teachers, setTeachers, fetchTeachers,
                classes, setClasses, fetchClasses,
                appeals, setAppeals, fetchAppeals,
                selectedStudents, setSelectedStudents,
                filteredStudents, paginatedStudents,
                studentSearch, setStudentSearch,
                studentSortBy, setStudentSortBy,
                currentPage, setCurrentPage, totalPages,
                handleAssignExam, viewResults, handleDeleteExam,
                handleDeleteStudent, handleUpdateStudent,
                handleCreateTeacher, handleDeleteTeacher,
                handleCreateClass, handleAssignToClass,
                handleDeleteSelectedStudents, handleExportClassToExcel,
                handleAssignConfirm, handleDeleteClass, handleRenameClass,
                handleOpenAssignTeacher, handleToggleStudentSelection,
                handleQuickSelectTeacher, handleOpenClassStudents,
                setShowTeacherModal, setShowStudentModal,
                studentNamesInput, setStudentNamesInput,
                showAlert, t, api
            }} />

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                confirmText={confirmConfig.confirmText}
                showInput={confirmConfig.showInput}
            />

            <ExamAssignmentModal
                isOpen={showAssignmentModal}
                onClose={() => setShowAssignmentModal(false)}
                onAssign={handleAssignConfirm}
                exam={selectedExamForAssignment}
                api={api}
                showAlert={showAlert}
            />

            {/* Teacher Addition Modal - IMPROVED DESIGN */}
            {showTeacherModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[500] animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[40px] p-10 max-w-md w-full border dark:border-gray-800 shadow-2xl transform animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-black dark:text-white tracking-tighter uppercase">{t('add_teacher_btn')}</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">New educator profile</p>
                            </div>
                            <button onClick={() => setShowTeacherModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTeacher} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">First Name</label>
                                    <input type="text" required value={teacherForm.first_name} onChange={e => setTeacherForm({ ...teacherForm, first_name: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white transition-all" placeholder="Enter first name" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Last Name</label>
                                    <input type="text" required value={teacherForm.last_name} onChange={e => setTeacherForm({ ...teacherForm, last_name: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white transition-all" placeholder="Enter last name" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Subject</label>
                                    <input type="text" required value={teacherForm.subject} onChange={e => setTeacherForm({ ...teacherForm, subject: e.target.value })} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white transition-all" placeholder="e.g. Mathematics" />
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                    {t('add')}
                                </button>
                                <button type="button" onClick={() => setShowTeacherModal(false)} className="w-full py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold transition-colors">
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Teacher Assignment Modal */}
            {showAssignTeacherModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[500] animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[40px] p-10 max-w-md w-full border dark:border-gray-800 shadow-2xl transform animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black dark:text-white tracking-tighter uppercase">{t('assign_teacher')}</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">For Class: {selectedClassForTeacher?.name}</p>
                            </div>
                            <button onClick={() => setShowAssignTeacherModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                            {teachers.map(teacher => (
                                <button
                                    key={teacher.id}
                                    onClick={() => handleAssignTeacherConfirm(teacher.id)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent hover:border-blue-500 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black">
                                        {teacher.first_name[0]}{teacher.last_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black dark:text-white leading-none">{teacher.first_name} {teacher.last_name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{teacher.subject}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowAssignTeacherModal(false)} className="w-full mt-6 py-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold transition-colors border-t dark:border-gray-800">
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            )}

            {/* Teacher Quick Class Modal */}
            {showTeacherQuickClassModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[500] animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[40px] p-10 max-w-md w-full border dark:border-gray-800 shadow-2xl transform animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black dark:text-white tracking-tighter uppercase">{t('select_class')}</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">For Teacher: {selectedTeacherForClass?.first_name} {selectedTeacherForClass?.last_name}</p>
                            </div>
                            <button onClick={() => setShowTeacherQuickClassModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                            {classes.map(cls => (
                                <button
                                    key={cls.id}
                                    onClick={() => handleTeacherAssignClassConfirm(cls.id)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent hover:border-blue-500 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 font-black">
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black dark:text-white leading-none">{cls.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{cls.studentCount} students</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowTeacherQuickClassModal(false)} className="w-full mt-6 py-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold transition-colors border-t dark:border-gray-800">
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            )}

            {/* Class Students Management Modal */}
            {showClassStudentsModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[500] animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[40px] p-10 max-w-2xl w-full border dark:border-gray-800 shadow-2xl transform animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8 shrink-0">
                            <div>
                                <h2 className="text-2xl font-black dark:text-white tracking-tighter uppercase">{t('manage_class_students') || 'Manage Students'}</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">{selectedClassForStudents?.name}</p>
                            </div>
                            <button onClick={() => setShowClassStudentsModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Add Students Section */}
                        <div className="mb-6 shrink-0">
                            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-3">Add Students</h3>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar border rounded-2xl p-2 dark:border-gray-700">
                                {students
                                    .filter(s => s.class_id !== selectedClassForStudents?.id)
                                    .map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                            <span className="font-bold text-sm dark:text-gray-200">{s.last_name} {s.first_name}</span>
                                            <button
                                                onClick={() => handleAddStudentsToClass([s.id])}
                                                className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-black hover:bg-green-200 transition-colors"
                                            >
                                                ADD
                                            </button>
                                        </div>
                                    ))
                                }
                                {students.filter(s => s.class_id !== selectedClassForStudents?.id).length === 0 && (
                                    <p className="text-center text-gray-400 text-xs py-4">No available students to add</p>
                                )}
                            </div>
                        </div>

                        {/* Current Students Section */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-3">Current Students ({students.filter(s => s.class_id === selectedClassForStudents?.id).length})</h3>
                            <div className="space-y-2">
                                {students
                                    .filter(s => s.class_id === selectedClassForStudents?.id)
                                    .map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    {s.first_name[0]}{s.last_name[0]}
                                                </div>
                                                <span className="font-bold dark:text-gray-200">{s.last_name} {s.first_name}</span>
                                            </div>
                                            <span className="text-xs font-mono text-gray-400">{s.username}</span>
                                        </div>
                                    ))
                                }
                                {students.filter(s => s.class_id === selectedClassForStudents?.id).length === 0 && (
                                    <div className="text-center py-8 text-gray-400 italic">No students in this class yet</div>
                                )}
                            </div>
                        </div>

                        <button onClick={() => setShowClassStudentsModal(false)} className="w-full mt-6 py-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold transition-colors border-t dark:border-gray-800 shrink-0">
                            {t('close')}
                        </button>
                    </div>
                </div>
            )}

            <BulkStudentModal
                isOpen={showStudentModal}
                onClose={() => setShowStudentModal(false)}
                endpoint="/auth/admin/batch-create-students"
                onCreated={handleStudentsCreated}
            />
            {newCredentials && (
                <CredentialsModal credentials={newCredentials.list} title={newCredentials.title} onClose={() => setNewCredentials(null)} />
            )}

            {/* Custom Alert Modal */}
            {customAlert.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4 text-center">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-10 max-w-sm w-full border dark:border-gray-800 shadow-2xl animate-in zoom-in duration-300">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${customAlert.type === 'success' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                            {customAlert.type === 'success' ? (
                                <CheckCircle className="w-10 h-10" />
                            ) : (
                                <XCircle className="w-10 h-10" />
                            )}
                        </div>
                        <h2 className="text-3xl font-black mb-4 dark:text-white uppercase tracking-tighter">{customAlert.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold leading-relaxed">{customAlert.message}</p>
                        <button
                            onClick={() => setCustomAlert({ ...customAlert, isOpen: false })}
                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-5 rounded-2xl font-black text-xl"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

const AdminDashboardLayout = ({ children }) => <>{children}</>;

export default AdminDashboard;
