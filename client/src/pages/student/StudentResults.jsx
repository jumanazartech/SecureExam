import React from 'react';
import { useOutletContext } from 'react-router-dom';

const StudentResults = () => {
    // Safety check for context
    const context = useOutletContext();
    const results = context?.results || [];
    const t = context?.t || ((key) => key);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">{t('my_results')}</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('exam')}</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('date')}</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('score')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                        {results.map((res) => {
                            const isRasch = res.Exam?.exam_type === 'rasch_national_cert';
                            const isPending = res.results_pending;

                            return (
                                <tr key={res.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {res.Exam?.title || 'Unknown Exam'}
                                        </div>
                                        {isRasch && (
                                            <div className="text-[10px] font-black text-blue-500 uppercase mt-1 tracking-wider">Rasch National Certification</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-center whitespace-nowrap">
                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                            {new Date(res.end_time || res.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right whitespace-nowrap">
                                        {isPending ? (
                                            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-200 dark:border-amber-800">
                                                {t('pending') || 'Pending Review'}
                                            </span>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <div className="font-black text-blue-600 dark:text-blue-400 text-xl tracking-tighter">
                                                    {isRasch ? (res.rasch_score || 0) : res.score}
                                                </div>
                                                {isRasch && res.certificate_level && (
                                                    <div className="mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black uppercase rounded tracking-widest">
                                                        Level {res.certificate_level}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {results.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-20 text-center">
                                    <div className="text-gray-300 dark:text-gray-700 mb-2">
                                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 italic tracking-tight">{t('no_past_exams')}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentResults;
