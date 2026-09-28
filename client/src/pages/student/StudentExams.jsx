import React from 'react';
import JoinClass from '../../components/JoinClass';
import WeakTopics from '../../components/WeakTopics';
import { useOutletContext, Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight, Sparkles } from 'lucide-react';

const ExamCard = ({ exam, index, t }) => (
    <div
        className="group relative bg-white dark:bg-gray-900 rounded-[24px] p-1 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${index * 100}ms` }}
    >
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="h-full bg-gray-50/50 dark:bg-gray-800/20 rounded-[20px] p-6 flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 shadow-sm">
                        <Clock className="w-3 h-3 text-blue-500" />
                        {exam.duration_minutes}m
                    </span>
                    {exam.open_access && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                            <Sparkles className="w-2.5 h-2.5" /> {t('open_access_title')?.split(' ')[0] || 'Open'}
                        </span>
                    )}
                </div>
            </div>

            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {exam.title}
            </h3>

            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                {exam.description || t('exam_fallback_desc') || 'No description provided for this exam.'}
            </p>

            {exam.Class && (
                <div className="mt-auto mb-6 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    {exam.Class.name}
                </div>
            )}

            <Link
                to={`/student/exam/${exam.id}`}
                className={`${exam.Class ? '' : 'mt-auto'} w-full group/btn relative overflow-hidden rounded-xl bg-gray-900 dark:bg-white p-4 text-center font-black text-white dark:text-gray-900 transition-all hover:bg-blue-600 dark:hover:bg-blue-50 dark:hover:text-blue-600 active:scale-[0.98]`}
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {t('start_exam')}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
            </Link>
        </div>
    </div>
);

const StudentExams = () => {
    const { exams, loading, t } = useOutletContext();
    const openExams = exams.filter(e => e.open_access);
    const classExams = exams.filter(e => !e.open_access);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <JoinClass onJoined={() => window.location.reload()} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-8 items-start">
                <div>
                    {openExams.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-500" /> {t('practice_exams')}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-4">{t('practice_exams_hint')}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {openExams.map((exam, index) => <ExamCard key={exam.id} exam={exam} index={index} t={t} />)}
                            </div>
                        </div>
                    )}

                    <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                                {t('available_exams') || 'Available Exams'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {t('exam_dashboard_subtitle') || 'Select an exam to begin your assessment.'}
                            </p>
                        </div>
                        <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0">
                            <BookOpen className="w-4 h-4" /> {classExams.length} {t('exams_count') || 'Exams'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {classExams.map((exam, index) => <ExamCard key={exam.id} exam={exam} index={index} t={t} />)}

                        {!loading && classExams.length === 0 && (
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

                <div className="lg:sticky lg:top-24">
                    <WeakTopics />
                </div>
            </div>
        </div>
    );
};

export default StudentExams;
