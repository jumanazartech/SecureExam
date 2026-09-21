import { assetUrl } from '../../config';
import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { MessageSquare, Send, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';

const TeacherApplications = () => {
    const {
        appeals,
        replyText,
        setReplyText,
        responseImages,
        uploadingImage,
        handleResponseImageUpload,
        handleResolveAppeal,
        resolvingAppealIds,
        t
    } = useOutletContext();

    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [viewImage, setViewImage] = useState(null);

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border dark:border-gray-800 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
                <MessageSquare className="w-6 h-6 text-blue-600" /> {t('applications')}
            </h2>

            <div className="grid gap-6">
                {appeals.map(appeal => (
                    <div key={appeal.id} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border dark:border-gray-800">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase rounded border dark:border-gray-700">
                                        {appeal.subject}
                                    </span>
                                    <span className="text-gray-500 text-xs font-medium">
                                        from {appeal.Student?.last_name} {appeal.Student?.first_name} ({appeal.Student?.username}) • {appeal.Student?.Class?.name}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        • {new Date(appeal.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {appeal.title.startsWith('Error in question #')
                                            ? `${t('error_in_question')} #${appeal.title.split('#')[1]}`
                                            : appeal.title}
                                    </h3>
                                    {appeal.exam_id && appeal.question_id && (
                                        <Link
                                            to={`/teacher/edit-exam/${appeal.exam_id}#question-${appeal.question_id}`}
                                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            {t('view_question') || 'Go to Question'}
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${appeal.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                appeal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {t(appeal.status)}
                            </span>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800">
                            {appeal.message}
                        </p>

                        {appeal.status === 'pending' ? (
                            <div className="flex flex-col gap-3 animate-in fade-in">
                                <textarea
                                    placeholder={t('write_response_placeholder')}
                                    value={replyText[appeal.id] || ''}
                                    onChange={e => setReplyText({ ...replyText, [appeal.id]: e.target.value })}
                                    className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:border-blue-500 outline-none transition-colors"
                                    rows="3"
                                />

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm border border-blue-100 dark:border-blue-800">
                                            <ImageIcon className="w-4 h-4" />
                                            {uploadingImage[appeal.id] ? t('uploading') : t('upload_drawing')}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleResponseImageUpload(appeal.id, e.target.files[0])}
                                                disabled={uploadingImage[appeal.id]}
                                            />
                                        </label>
                                        {responseImages[appeal.id] && (
                                            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> {t('image_uploaded')}
                                            </span>
                                        )}
                                    </div>
                                    {responseImages[appeal.id] && (
                                        <div className="relative mt-2 w-48 group">
                                            <img
                                                src={responseImages[appeal.id]}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded-xl border-2 border-blue-100 dark:border-blue-900 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setViewImage(responseImages[appeal.id])}
                                            />
                                            <button
                                                onClick={() => setReplyText(prev => ({ ...prev, [appeal.id]: '' }))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 justify-end mt-2">
                                    <button
                                        onClick={() => handleResolveAppeal(appeal.id, 'rejected')}
                                        disabled={resolvingAppealIds?.has(appeal.id)}
                                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XCircle className="w-4 h-4" /> {t('reject')}
                                    </button>
                                    <button
                                        onClick={() => handleResolveAppeal(appeal.id, 'resolved')}
                                        disabled={resolvingAppealIds?.has(appeal.id)}
                                        className="px-4 py-2 bg-green-100 text-green-600 rounded-lg font-bold hover:bg-green-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {resolvingAppealIds?.has(appeal.id) ? (
                                            <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        {resolvingAppealIds?.has(appeal.id) ? t('saving') || 'Saving...' : t('resolve_reply')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-xl flex flex-col gap-4">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">{t('your_response')}:</p>
                                    <p className="text-gray-800 dark:text-gray-200">{appeal.response || `(${t('no_response_provided')})`}</p>
                                </div>
                                {appeal.response_image && (
                                    <div className="mt-2 text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 font-mono">{t('attached_image')}:</p>
                                        <div
                                            className="inline-block cursor-pointer group"
                                            onClick={() => setViewImage(appeal.response_image)}
                                        >
                                            <img
                                                src={appeal.response_image}
                                                alt="Teacher Drawing"
                                                className="max-w-md w-full h-auto rounded-xl border-2 border-white dark:border-gray-800 shadow-xl group-hover:scale-[1.01] transition-transform"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {appeals.length === 0 && (
                    <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">{t('no_applications_found')}</p>
                    </div>
                )}
            </div>

            {selectedQuestion && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedQuestion(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-2xl w-full border dark:border-gray-800 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-black dark:text-white">Question Content</h3>
                            <button onClick={() => setSelectedQuestion(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="prose dark:prose-invert max-w-none mb-6">
                            <p className="text-lg font-bold">{selectedQuestion.content}</p>
                        </div>

                        {(selectedQuestion.local_image_path || selectedQuestion.image_url) && (
                            <div className="mb-6 cursor-pointer" onClick={() => setViewImage(selectedQuestion.local_image_path || selectedQuestion.image_url)}>
                                <img
                                    src={assetUrl(selectedQuestion.local_image_path) || selectedQuestion.image_url}
                                    className="max-h-64 object-contain rounded-xl border dark:border-gray-800 hover:opacity-90 transition-opacity"
                                    alt="Question Visual"
                                />
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button onClick={() => setSelectedQuestion(null)} className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black hover:opacity-90 transition-opacity">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image View Overlay */}
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

export default TeacherApplications;
