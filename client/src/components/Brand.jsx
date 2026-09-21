import React from 'react';

// Eight-pointed star (two overlapping squares, a common motif in Central Asian tilework) with a check mark.
export const BrandMark = ({ className = 'w-9 h-9' }) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="6" y="6" width="28" height="28" rx="3" fill="currentColor" />
        <rect x="6" y="6" width="28" height="28" rx="3" transform="rotate(45 20 20)" fill="currentColor" />
        <path d="M13.5 20.5l4.5 4.5 8.5-9.5" stroke="var(--brand-check, #fff)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Brand = ({ className = '' }) => (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <BrandMark className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <span className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white">Secure<span className="text-blue-600 dark:text-blue-400">Exam</span></span>
    </span>
);

export default Brand;
