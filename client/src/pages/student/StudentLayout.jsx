import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, LayoutDashboard, MessageSquare, LogOut, Sun, Moon, Globe, Settings } from 'lucide-react';
import NotificationCenter from '../../components/NotificationCenter';

const StudentLayout = ({ children }) => {
    const { logout, t, theme, toggleTheme, language, changeLanguage } = useAuth();

    const navItems = [
        { path: '/student/exams', icon: <FileText className="w-5 h-5" />, label: t('available_exams') },
        { path: '/student/results', icon: <LayoutDashboard className="w-5 h-5" />, label: t('my_results') },
        { path: '/student/applications', icon: <MessageSquare className="w-5 h-5" />, label: t('my_applications') },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-nearblack transition-colors flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col fixed inset-y-0 shadow-xl z-30">
                <div className="p-6">
                    <h1 className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter uppercase">{t('portal')}</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Student Portal</p>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
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

                <div className="p-4 border-t dark:border-gray-800 space-y-2">
                    <Link to="/student/profile" className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-bold transition-all">
                        <Settings className="w-5 h-5" />
                        {t('profile')}
                    </Link>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold transition-all">
                        <LogOut className="w-5 h-5" />
                        {t('logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 sticky top-0 z-20 px-8 flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-4"></div>

                    <div className="flex items-center gap-6">
                        <NotificationCenter />
                        <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:scale-110 transition-all">
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl border dark:border-gray-700">
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
                    </div>
                </header>

                <main className="p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;
