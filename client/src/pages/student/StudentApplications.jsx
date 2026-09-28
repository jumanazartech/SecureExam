import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { MessageSquare, Plus } from 'lucide-react';

const StudentApplications = () => {
    const { appeals, setShowAppealModal, t } = useOutletContext();
    const [viewImage, setViewImage] = React.useState(null);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold dark:text-white">{t('my_applications')}</h2>
                <button
                    onClick={() => setShowAppealModal(true)}
                    className="self-start sm:self-auto bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" /> {t('new_application')}
                </button>
            </div>

            <div className="grid gap-4">
                {appeals.map(appeal => (
                    <div key={appeal.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border dark:border-gray-800">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold uppercase rounded-md">
                                        {appeal.subject}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(appeal.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {appeal.title.startsWith('Error in question #')
                                        ? `${t('error_in_question')} #${appeal.title.split('#')[1]}`
                                        : appeal.title}
                                </h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${appeal.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                appeal.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                {t(appeal.status)}
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                            {appeal.message}
                        </p>
                        {(appeal.response || appeal.response_image) && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex flex-col gap-3">
                                {appeal.response && (
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">{t('teacher_response')}:</p>
                                        <p className="text-gray-800 dark:text-gray-200">{appeal.response}</p>
                                    </div>
                                )}
                                {appeal.response_image && (
                                    <div className="mt-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Attached Solution/Image:</p>
                                        <div
                                            className="inline-block cursor-pointer group"
                                            onClick={() => setViewImage(appeal.response_image)}
                                        >
                                            <img
                                                src={appeal.response_image}
                                                alt="Teacher Solution"
                                                className="max-w-xs max-h-48 w-auto object-contain rounded-lg border dark:border-gray-800 shadow-sm group-hover:opacity-80 transition-opacity"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {appeals.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">{t('no_applications_found')}</p>
                    </div>
                )}
            </div>

            {/* Image Overlay */}
            {viewImage && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-8 cursor-pointer animate-in fade-in duration-300"
                    onClick={() => setViewImage(null)}
                >
                    <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
                        <img
                            src={viewImage}
                            alt="Full Preview"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in duration-300"
                            onClick={e => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setViewImage(null)}
                            className="absolute top-0 right-0 m-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentApplications;
