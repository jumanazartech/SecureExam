import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Top scores for one exam. Students who opted out (hide_from_leaderboard) never appear —
// enforced server-side, this component just renders whatever it's given.
const Leaderboard = ({ examId }) => {
    const { api, t } = useAuth();
    const [rows, setRows] = useState(null);
    const [released, setReleased] = useState(true);

    useEffect(() => {
        if (!examId) return;
        api.get(`/submissions/leaderboard/${examId}`)
            .then(r => { setRows(r.data.rows || []); setReleased(r.data.released); })
            .catch(() => setRows([]));
    }, [api, examId]);

    if (rows === null || !released || rows.length === 0) return null;

    const medal = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5">
            <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" /> {t('leaderboard_title')}
            </h3>
            <ol className="space-y-1.5">
                {rows.map((r, i) => (
                    <li
                        key={i}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${r.you ? 'bg-blue-50 dark:bg-blue-900/20 font-black text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                        <span className="w-6 text-center font-mono text-xs text-gray-400 shrink-0">{medal(i) || r.rank}</span>
                        <span className="flex-1 truncate">{r.you ? t('leaderboard_you') : r.name}</span>
                        <span className="font-mono font-bold shrink-0">{r.score}{r.certificate_level ? ` · ${r.certificate_level}` : ''}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default Leaderboard;
