import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, Folder, MessageSquare, LogOut, Sun, Moon, Globe, GraduationCap, Award, Sparkles, Menu, X } from 'lucide-react';
import NotificationCenter from '../../components/NotificationCenter';

const TeacherLayout = ({ children }) => {
    const { logout, t, theme, toggleTheme, language, changeLanguage } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const navItems = [
        { path: '/teacher/exams', icon: <FileText className="w-5 h-5" />, label: t('exams') },
        { path: '/teacher/classes', icon: <Folder className="w-5 h-5" />, label: t('classes') },
        { path: '/teacher/mystudent', icon: <GraduationCap className="w-5 h-5" />, label: t('my_students') || 'My Students' },
        { path: '/teacher/attestation', icon: <Award className="w-5 h-5" />, label: t('attestation') },
        { path: '/teacher/account', icon: <Sparkles className="w-5 h-5" />, label: t('nav_account') },
        { path: '/teacher/applications', icon: <MessageSquare className="w-5 h-5" />, label: t('applications') },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-nearblack transition-colors lg:flex">
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar: off-canvas drawer on mobile, permanent column from lg up */}
            <aside
                className={`w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col fixed inset-y-0 shadow-xl z-40 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter uppercase">{t('teacher_console')}</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Educator Portal</p>
                    </div>
                    <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t dark:border-gray-800">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold transition-all">
                        <LogOut className="w-5 h-5" />
                        {t('logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 lg:ml-64 flex flex-col">
                <header className="h-16 sm:h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 sticky top-0 z-20 px-4 sm:px-8 flex justify-between items-center gap-2 transition-colors">
                    <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 shrink-0">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="hidden lg:flex items-center gap-4 flex-1" />

                    <div className="flex items-center gap-2 sm:gap-6 min-w-0">
                        <NotificationCenter />
                        <button onClick={toggleTheme} className="p-2 sm:p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:scale-110 transition-all shrink-0">
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                        <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl border dark:border-gray-700 shrink-0">
                            <Globe className="w-4 h-4 text-gray-500" />
                            <select
                                value={language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                className="bg-transparent text-sm font-black focus:outline-none dark:text-gray-300 cursor-pointer"
                            >
                                <option value="en">EN</option>
                                <option value="ru">RU</option>
                                <option value="uz">UZ</option>
                            </select>
                        </div>
                        <select
                            value={language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            aria-label="Language"
                            className="sm:hidden bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-xl px-2 py-2 text-xs font-black focus:outline-none dark:text-gray-300 cursor-pointer shrink-0"
                        >
                            <option value="en">EN</option>
                            <option value="ru">RU</option>
                            <option value="uz">UZ</option>
                        </select>
                    </div>
                </header>

                <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default TeacherLayout;
