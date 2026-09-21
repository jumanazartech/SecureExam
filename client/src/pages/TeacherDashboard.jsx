import BulkStudentModal from '../components/BulkStudentModal';
import CredentialsModal from '../components/CredentialsModal';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';
import TeacherLayout from './teacher/TeacherLayout';
import ConfirmModal from '../components/ConfirmModal';
import { useAlert } from '../context/AlertContext';

const TeacherDashboard = () => {
    const { user, api, t } = useAuth();
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    // Data State
    const [myClasses, setMyClasses] = useState([]);
    const [expandedClass, setExpandedClass] = useState(null);
    const [exams, setExams] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [replyText, setReplyText] = useState({});
    const [responseImages, setResponseImages] = useState({});
    const [uploadingImage, setUploadingImage] = useState({});
    const [resolvingAppealIds, setResolvingAppealIds] = useState(new Set());

    // New Student Management State
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [newCredentials, setNewCredentials] = useState(null);
    const [studentNamesInput, setStudentNamesInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentSortBy, setStudentSortBy] = useState('time');

    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'danger', confirmText: 'Confirm' });

    useEffect(() => {
        fetchMyClasses();
        fetchExams();
        fetchAppeals();
        fetchResults();
        fetchStudents();
    }, []);

    const fetchMyClasses = async () => {
        try {
            const res = await api.get('/classes/my-classes');
            setMyClasses(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchResults = async () => {
        try {
            const res = await api.get('/submissions/teacher/my-results');
            setResults(res.data);
        } catch (err) { console.error('Failed to fetch results:', err); }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/auth/teacher/my-students');
            setStudents(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchExams = async () => {
        try {
            const res = await api.get('/exams');
            setExams(res.data);
        } catch (err) { console.error(err); }
    };

    const deleteExam = async (id) => {
        if (!window.confirm(t('delete_confirm_msg'))) return;
        try {
            await api.delete(`/exams/${id}`);
            fetchExams();
        } catch (err) { console.error(err); }
    };

    const fetchAppeals = async () => {
        try {
            const res = await api.get('/appeals/teacher');
            setAppeals(res.data);
        } catch (err) { console.error(err); }
    };

    const handleResolveAppeal = async (id, status) => {
        const response = replyText[id];
        const response_image = responseImages[id];

        if (!response && !response_image && status === 'resolved') {
            showAlert('Warning', t('provide_response_msg'), 'warning');
            return;
        }

        try {
            setResolvingAppealIds(prev => new Set(prev).add(id));

            await api.put(`/appeals/${id}/resolve`, { status, response, response_image });

            // Immediate UI update
            setAppeals(prev => prev.map(a =>
                a.id === id ? { ...a, status, response, response_image } : a
            ));

            setReplyText(prev => ({ ...prev, [id]: '' }));
            setResponseImages(prev => ({ ...prev, [id]: '' }));
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.message || 'Failed to update appeal';
            showAlert('Error', errorMsg, 'error');
        } finally {
            setResolvingAppealIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleResponseImageUpload = async (appealId, file) => {
        if (!file) return;
        try {
            setUploadingImage(prev => ({ ...prev, [appealId]: true }));
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.post('/appeals/upload-response-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResponseImages(prev => ({ ...prev, [appealId]: res.data.imagePath }));
        } catch (err) { console.error('Upload failed:', err); }
        finally { setUploadingImage(prev => ({ ...prev, [appealId]: false })); }
    };

    const handleStudentsCreated = (data) => {
        fetchStudents();
        fetchMyClasses();
        if (data.created?.length) setNewCredentials({ title: t('add_students_btn'), list: data.created });
        if (data.errors?.length) showAlert('Error', data.errors.map(e => `${e.name}: ${e.error}`).join('\n'), 'error');
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
                    showAlert(t('reported'), 'Deleted');
                } catch (err) { showAlert('Error', 'Failed', 'error'); }
            }
        });
    };

    const handleUpdateStudent = async (id, data) => {
        try {
            await api.put(`/auth/admin/students/${id}`, data);
            fetchStudents();
            showAlert(t('reported'), 'Updated');
            return true;
        } catch (err) {
            showAlert('Error', err.response?.data?.error || 'Failed', 'error');
            return false;
        }
    };

    const handleToggleStudentSelection = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleAssignToClass = async (classId) => {
        try {
            await api.post('/classes/assign-students', { studentIds: selectedStudents, classId });
            setSelectedStudents([]);
            fetchStudents();
            fetchMyClasses();
            showAlert(t('reported'), 'Assigned');
        } catch (err) { showAlert('Error', 'Failed', 'error'); }
    };

    const handleAssignConfirm = async (examId, studentIds) => {
        try {
            await api.post(`/exams/${examId}/assign`, { student_ids: studentIds });
            showAlert(t('reported'), t('exam_assigned_success'));
        } catch (err) {
            showAlert('Error', 'Failed to assign exam', 'error');
        }
    };

    const handleCreateClass = async (initialStudentIds = []) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Add New Class',
            message: 'Enter class name:',
            type: 'info',
            confirmText: 'Create',
            showInput: true,
            onConfirm: async (className) => {
                if (!className || !className.trim()) return;
                try {
                    const res = await api.post('/classes', { name: className.trim() });
                    if (initialStudentIds && initialStudentIds.length > 0) {
                        await api.post('/classes/assign-students', {
                            studentIds: initialStudentIds,
                            classId: res.data.id
                        });
                        setSelectedStudents([]);
                    }
                    setConfirmConfig(p => ({ ...p, isOpen: false }));
                    fetchMyClasses();
                    fetchStudents();
                    showAlert(t('reported'), 'Class created');
                } catch (err) { showAlert('Error', 'Failed', 'error'); }
            }
        });
    };

    const handleDeleteSelectedStudents = async () => {
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
                    showAlert(t('reported'), 'Deleted');
                } catch (err) { showAlert('Error', 'Failed', 'error'); }
            }
        });
    }

    // Filter Logic
    const filteredStudents = useMemo(() => {
        let res = [...students];
        if (studentSearch) {
            const q = studentSearch.toLowerCase();
            res = res.filter(s => (s.username || '').toLowerCase().includes(q) || (s.first_name || '').toLowerCase().includes(q) || (s.last_name || '').toLowerCase().includes(q));
        }
        res.sort((a, b) => {
            if (studentSortBy === 'name') return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
            if (studentSortBy === 'class') return (myClasses.find(c => c.id === a.class_id)?.name || '').localeCompare(myClasses.find(c => c.id === b.class_id)?.name || '');
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        return res;
    }, [students, studentSearch, studentSortBy, myClasses]);

    const itemsPerPage = 24;
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    return (
        <TeacherLayout>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border dark:border-gray-800 flex items-center gap-4">
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m12 1a3 3 0 01-6 0V7m6 1v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8m6 0h6" /></svg>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-800 dark:text-white">{myClasses.length}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t('classes_assigned')}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border dark:border-gray-800 flex items-center gap-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-800 dark:text-white">{exams.length}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t('exams')}</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
                    <h3 className="text-white font-black text-lg uppercase tracking-widest">{t('quick_actions')}</h3>
                    <button
                        onClick={() => setShowStudentModal(true)}
                        className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white rounded-xl py-2 px-4 font-bold flex items-center justify-center gap-2 transition-all backdrop-blur-md border border-white/30"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> {t('add_students_btn')}
                    </button>
                </div>
            </div>

            <Outlet context={{
                myClasses, expandedClass, setExpandedClass,
                exams, deleteExam,
                appeals, replyText, setReplyText,
                responseImages, setResponseImages,
                uploadingImage, handleResponseImageUpload,
                handleResolveAppeal, t, api, user,
                results, fetchResults,
                resolvingAppealIds,
                students, setStudents, fetchStudents,
                selectedStudents, setSelectedStudents,
                filteredStudents, paginatedStudents,
                studentSearch, setStudentSearch,
                studentSortBy, setStudentSortBy,
                currentPage, setCurrentPage, totalPages,
                handleDeleteStudent, handleUpdateStudent,
                handleAssignToClass,
                handleAssignConfirm, handleCreateClass,
                handleDeleteSelectedStudents, handleToggleStudentSelection,
                setShowStudentModal, studentNamesInput, setStudentNamesInput
            }} />

            <BulkStudentModal
                isOpen={showStudentModal}
                onClose={() => setShowStudentModal(false)}
                endpoint="/auth/teacher/batch-create-students"
                onCreated={handleStudentsCreated}
            />
            {newCredentials && (
                <CredentialsModal credentials={newCredentials.list} title={newCredentials.title} onClose={() => setNewCredentials(null)} />
            )}

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
        </TeacherLayout>
    );
};

export default TeacherDashboard;
