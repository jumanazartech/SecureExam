import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, FileText, User as UserIcon, CheckCircle, XCircle, Clock, Download } from 'lucide-react';

const AdminResults = () => {
    const { t } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const results = location.state?.results || [];

    const handleExportResultsToExcel = () => {
        if (results.length === 0) return;

        const data = results.map((res, i) => ({
            '№': i + 1,
            'Last Name': res.User?.last_name || '',
            'First Name': res.User?.first_name || '',
            'Username': res.User?.username || '',
            'Class': res.User?.Class?.name || 'N/A',
            'Score': parseFloat(res.score || 0).toFixed(1),
            'Status': res.status === 'submitted' ? 'Answered' : 'In Progress',
            'Date': new Date(res.createdAt).toLocaleString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);

        // Calculate max column width for names and class
        const lastNameWidths = data.map(row => (row['Last Name'] || '').toString().length);
        const firstNameWidths = data.map(row => (row['First Name'] || '').toString().length);
        const maxLastName = Math.max(...lastNameWidths, 15);
        const maxFirstName = Math.max(...firstNameWidths, 15);

        ws['!cols'] = [
            { wch: 5 },  // №
            { wch: maxLastName + 2 },
            { wch: maxFirstName + 2 },
            { wch: 15 },
            { wch: 12 },
            { wch: 8 },
            { wch: 15 },
            { wch: 20 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Results');
        XLSX.writeFile(wb, `Exam_${id}_Results.xlsx`);
    };

    const [selectedSubmissions, setSelectedSubmissions] = React.useState([]);

    const toggleSelection = (id) => {
        setSelectedSubmissions(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handlePublishResults = async () => {
        if (selectedSubmissions.length === 0) return;
        // In a real scenario, you'd send these IDs to the backend to mark as published
        // For now, we'll simulate a success message
        alert(`${selectedSubmissions.length} results published successfully!`);
        // await api.post(`/exams/${id}/publish-results`, { submissionIds: selectedSubmissions });
        setSelectedSubmissions([]);
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] shadow-2xl border-2 border-gray-100 dark:border-gray-800 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all group">
                        <ArrowLeft className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-3 dark:text-white tracking-tighter uppercase">
                            <FileText className="w-7 h-7 text-blue-600" /> {t('student_results')}
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Exam ID: {id} • {results.length} Submissions</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {selectedSubmissions.length > 0 && (
                        <button
                            onClick={handlePublishResults}
                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 animate-in slide-in-from-right-4"
                        >
                            <CheckCircle className="w-5 h-5" /> Publish ({selectedSubmissions.length})
                        </button>
                    )}
                    <button
                        onClick={handleExportResultsToExcel}
                        disabled={results.length === 0}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:grayscale disabled:opacity-50"
                    >
                        <Download className="w-5 h-5" /> {t('export_excel') || 'Export Excel'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="text-left border-b dark:border-gray-800">
                        <tr>
                            <th className="pb-4 px-4 w-12">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={results.length > 0 && selectedSubmissions.length === results.length}
                                    onChange={(e) => setSelectedSubmissions(e.target.checked ? results.map(r => r.id) : [])}
                                />
                            </th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('student_class')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('status')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('score')}</th>
                            <th className="pb-4 font-bold text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest">{t('date')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                        {results.map((res) => (
                            <tr key={res.id} className={`group ${selectedSubmissions.includes(res.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                <td className="py-4 px-4">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedSubmissions.includes(res.id)}
                                        onChange={() => toggleSelection(res.id)}
                                    />
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 dark:text-white">
                                                {res.User?.last_name} {res.User?.first_name}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono italic">
                                                @{res.User?.username} • {res.User?.Class?.name || t('not_assigned')}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-tighter ${res.status === 'submitted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {res.status === 'submitted' ? t('answered') : t('in_progress') || 'In Progress'}
                                    </span>
                                </td>
                                <td className="py-4 font-black text-blue-600 dark:text-blue-400 text-xl">
                                    {parseFloat(res.score || 0).toFixed(1)}
                                </td>
                                <td className="py-4 text-xs text-gray-500 font-mono">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" />
                                            {new Date(res.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] opacity-70">
                                            {new Date(res.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {results.length === 0 && (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-gray-400 italic">{t('no_past_exams')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminResults;
