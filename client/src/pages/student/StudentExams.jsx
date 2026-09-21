import React from 'react';
import JoinClass from '../../components/JoinClass';
import { useOutletContext, Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight, Star, Calendar } from 'lucide-react';

const StudentExams = () => {
    const { exams, loading, t } = useOutletContext();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <JoinClass onJoined={() => window.location.reload()} />
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        {t('available_exams') || 'Available Exams'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {t('exam_dashboard_subtitle') || 'Select an exam to begin your assessment.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> {exams.length} {t('exams_count') || 'Exams'}
                    </span>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {exams.map((exam, index) => (
                    <div
                        key={exam.id}
                        className="group relative bg-white dark:bg-gray-900 rounded-[24px] p-1 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="h-full bg-gray-50/50 dark:bg-gray-800/20 rounded-[20px] p-6 flex flex-col">
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 shadow-sm">
                                        <Clock className="w-3 h-3 text-blue-500" />
                                        {exam.duration_minutes}m
                                    </span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {exam.title}
                            </h3>

                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                                {exam.description || t('exam_fallback_desc') || 'No description provided for this exam.'}
                            </p>

                            {/* Meta Info */}
                            {exam.Class && (
                                <div className="mt-auto mb-6 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                    {exam.Class.name}
                                </div>
                            )}

                            {/* Action Button */}
                            <Link
                                to={`/student/exam/${exam.id}`}
                                className="mt-auto w-full group/btn relative overflow-hidden rounded-xl bg-gray-900 dark:bg-white p-4 text-center font-black text-white dark:text-gray-900 transition-all hover:bg-blue-600 dark:hover:bg-blue-50 dark:hover:text-blue-600 active:scale-[0.98]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {t('start_exam')}
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                </span>
                            </Link>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {!loading && exams.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('no_exams_available')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm font-medium">
                            {t('check_back_later') || 'There are no exams assigned to you at the moment.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentExams;
