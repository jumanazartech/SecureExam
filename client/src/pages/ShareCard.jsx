import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Award, Loader2 } from 'lucide-react';
import { API_BASE, CONTACT } from '../config';
import Brand, { BrandMark } from '../components/Brand';

const TYPE_LABEL = { chsb: 'CHSB', dtm: 'DTM', rasch_national_cert: 'Rasch', attestation: 'Attestation' };

// Public, no-login result card — the "prove I did this" page people share on Telegram/Instagram.
const ShareCard = () => {
    const { token } = useParams();
    const [card, setCard] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        axios.get(`${API_BASE}/submissions/card/${token}`)
            .then(r => setCard(r.data))
            .catch(() => setError(true));
    }, [token]);

    if (!card && !error) {
        return <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-nearblack"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    if (error) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-nearblack p-6">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">This result is not available.</p>
                    <Link to="/" className="mt-4 inline-block text-blue-600 dark:text-blue-400 font-semibold">Go to SecureExam →</Link>
                </div>
            </div>
        );
    }

    const scoreDisplay = card.exam_type === 'dtm' ? `${card.score} / 189` : card.score;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-nearblack flex flex-col">
            <header className="px-6 py-5">
                <Link to="/"><Brand /></Link>
            </header>

            <main className="flex-1 grid place-items-center px-4 pb-10">
                <div className="w-full max-w-md rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
                    <div className="bg-blue-900 text-white p-8 text-center relative overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" aria-hidden="true">
                            <defs>
                                <pattern id="tile2" width="64" height="64" patternUnits="userSpaceOnUse">
                                    <path d="M32 4l7 18 18-7-7 18 18 7-18 7 7 18-18-7-7 18-7-18-18 7 7-18-18-7 18-7-7-18 18 7z" fill="none" stroke="#fff" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#tile2)" />
                        </svg>
                        <BrandMark className="w-10 h-10 mx-auto text-saffron-400 relative" />
                        <p className="relative mt-4 text-xs font-semibold uppercase tracking-widest text-blue-200">{TYPE_LABEL[card.exam_type] || 'Exam'} Result</p>
                        <p className="relative mt-1 font-display text-lg font-bold">{card.exam_title}</p>
                        <div className="relative mt-6 font-mono text-6xl font-bold">{scoreDisplay}</div>
                        {card.certificate_level && (
                            <div className="relative mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-sm font-semibold">
                                <Award className="w-4 h-4" /> {card.certificate_level}
                            </div>
                        )}
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 text-center">
                        <p className="font-display text-xl font-bold text-gray-900 dark:text-white">{card.student_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(card.date).toLocaleDateString()}</p>
                        <Link to="/register" className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                            Try it yourself <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                <p className="mt-6 text-xs text-gray-400">SecureExam · <a href={CONTACT.telegramUrl} className="underline">{CONTACT.telegram}</a></p>
            </main>
        </div>
    );
};

export default ShareCard;
