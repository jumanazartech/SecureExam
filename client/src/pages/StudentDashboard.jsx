import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { X, Send } from 'lucide-react';
import StudentLayout from './student/StudentLayout';

const StudentDashboard = () => {
    const { api, user, t } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [showAppealModal, setShowAppealModal] = useState(false);
    const [appealForm, setAppealForm] = useState({ subject: '', title: '', message: '' });
    const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        fetchData();
    }, [api]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [examsRes, resultsRes, appealsRes] = await Promise.all([
                api.get('/exams'),
                api.get('/submissions/my-results'),
                api.get('/appeals/my-appeals')
            ]);
            setExams(examsRes.data);
            setResults(resultsRes.data);
            setAppeals(appealsRes.data);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            setError('Failed to load data. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAppeal = async (e) => {
        e.preventDefault();
        try {
            await api.post('/appeals', appealForm);
            setShowAppealModal(false);
            setAppealForm({ subject: '', title: '', message: '' });
            setCustomAlert({
                isOpen: true,
                title: t('reported'),
                message: t('application_submitted_success'),
                type: 'success'
            });
            const res = await api.get('/appeals/my-appeals');
            setAppeals(res.data);
            navigate('/student/applications');
        } catch (err) {
            alert(t('save_error') || 'Failed to submit application');
        }
    };

    return (
        <StudentLayout>
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <Outlet context={{
                exams, results, appeals, loading,
                setShowAppealModal, t, api, user
            }} />

            {/* Create Appeal Modal */}
            {showAppealModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black dark:text-white">{t('new_application')}</h3>
                            <button onClick={() => setShowAppealModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAppeal} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Mathematics"
                                    value={appealForm.subject}
                                    onChange={e => setAppealForm({ ...appealForm, subject: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none dark:text-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title/Topic</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Question about Grade"
                                    value={appealForm.title}
                                    onChange={e => setAppealForm({ ...appealForm, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none dark:text-white font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('message')}</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="..."
                                    value={appealForm.message}
                                    onChange={e => setAppealForm({ ...appealForm, message: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none dark:text-white font-medium"
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                <Send className="w-4 h-4" /> {t('submit_application')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Alert Modal */}
            {customAlert.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4 text-center">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-10 max-w-sm w-full border dark:border-gray-800 shadow-2xl animate-in zoom-in duration-300">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${customAlert.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black mb-4 dark:text-white uppercase tracking-tighter">{customAlert.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold leading-relaxed">{customAlert.message}</p>
                        <button
                            onClick={() => setCustomAlert({ ...customAlert, isOpen: false })}
                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                        >
                            {t('back')}
                        </button>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
};

export default StudentDashboard;
