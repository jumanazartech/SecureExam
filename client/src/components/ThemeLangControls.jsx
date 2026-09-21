import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ThemeLangControls = ({ className = '' }) => {
    const { theme, toggleTheme, language, changeLanguage } = useAuth();
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <select
                id="lang-select"
                aria-label="Language"
                value={language}
                onChange={e => changeLanguage(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                <option value="uz">UZ</option>
                <option value="ru">RU</option>
                <option value="en">EN</option>
            </select>
            <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="h-9 w-9 grid place-items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
        </div>
    );
};

export default ThemeLangControls;
