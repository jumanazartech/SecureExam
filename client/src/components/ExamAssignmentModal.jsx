import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const ExamAssignmentModal = ({ exam, isOpen, onClose, onAssign, api, showAlert }) => {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/exams/admin/students');
            setStudents(res.data);
            setSelectedStudents([]);
            setSearchTerm('');
        } catch (err) {
            console.error('Failed to fetch students:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAll = () => {
        const allIds = filteredStudents.map(s => s.id);
        setSelectedStudents(prev => Array.from(new Set([...prev, ...allIds])));
    };

    const clearAll = () => {
        const filteredIds = filteredStudents.map(s => s.id);
        setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
    };

    const handleAssign = async () => {
        if (selectedStudents.length === 0) {
            if (showAlert) showAlert('Error', 'Please select at least one student', 'error');
            else alert('Please select at least one student');
            return;
        }
        try {
            setLoading(true);
            await onAssign(exam.id, selectedStudents);
            onClose();
        } catch (err) {
            console.error('Failed to assign exam:', err);
            if (showAlert) showAlert('Error', 'Failed to assign exam', 'error');
            else alert('Failed to assign exam');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students
        .filter(student =>
            student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border dark:border-gray-800 transform animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">
                            Assign Exam: <span className="text-blue-600 dark:text-blue-400">{exam?.title}</span>
                        </h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Select students for this session</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col p-6">
                    {/* Search & Actions */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search by name or username..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-3 outline-none font-bold dark:text-white transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black uppercase hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-800"
                            >
                                Select All
                            </button>
                            <button
                                onClick={clearAll}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl text-xs font-black uppercase hover:bg-gray-200 transition-all border dark:border-gray-700"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading students...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-2xl border-2 border-dashed dark:border-gray-800">
                                <p className="text-gray-400 font-bold italic">
                                    {students.length === 0 ? 'No students found in the system' : 'No matching students found'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredStudents.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => toggleStudentSelection(student.id)}
                                        className={`flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-all ${selectedStudents.includes(student.id)
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-500'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student.id)
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                            {selectedStudents.includes(student.id) && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-gray-800 dark:text-white truncate">
                                                {student.last_name} {student.first_name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">@{student.username}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selection Summary */}
                    {selectedStudents.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 animate-in slide-in-from-bottom duration-300">
                            <p className="text-white font-black uppercase tracking-tighter text-center">
                                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} ready for assignment
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-xs hover:text-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || selectedStudents.length === 0}
                        className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
                    >
                        {loading ? 'Assigning...' : 'Complete Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExamAssignmentModal;
