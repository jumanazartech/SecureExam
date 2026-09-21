import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Brand from './Brand';
import ThemeLangControls from './ThemeLangControls';

// Simple centred shell shared by register / forgot-password / callback pages.
const AuthLayout = ({ back = '/', backLabel, title, subtitle, children, wide = false }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-nearblack">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to={back} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
            <ThemeLangControls />
        </div>
        <main className="px-4 sm:px-6 pb-16 pt-4 grid place-items-start justify-center">
            <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-sm'}`}>
                <Brand className="mb-8" />
                <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                {subtitle && <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>}
                <div className="mt-6">{children}</div>
            </div>
        </main>
    </div>
);

export default AuthLayout;
