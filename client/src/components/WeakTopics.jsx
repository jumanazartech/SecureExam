import React, { useEffect, useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Shows the student's lowest-scoring topics across every graded exam so far — the
// concrete, personalised "what to study next" widget (feeds the AI tutor's context too).
const WeakTopics = () => {
    const { api, t } = useAuth();
    const [topics, setTopics] = useState(null);

    useEffect(() => {
        api.get('/submissions/weak-topics').then(r => setTopics(r.data.topics || [])).catch(() => setTopics([]));
    }, [api]);

    if (topics === null) return null;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" /> {t('weak_topics_title')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">{t('weak_topics_hint')}</p>

            {topics.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">{t('no_weak_topics')}</p>
            ) : (
                <div className="space-y-2.5">
                    {topics.slice(0, 5).map(w => (
                        <div key={w.topic}>
                            <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                <span className="truncate">{w.topic}</span>
                                <span className="shrink-0 ml-2">{w.correct}/{w.total}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <div
                                    className={`h-full ${w.percent < 40 ? 'bg-red-500' : w.percent < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${w.percent}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WeakTopics;
