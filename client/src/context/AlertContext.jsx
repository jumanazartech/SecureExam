import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // 'success', 'error', 'warning', 'info'
    });

    const showAlert = useCallback((title, message, type = 'info') => {
        setAlert({ isOpen: true, title, message, type });
        // Auto close success alerts
        if (type === 'success') {
            setTimeout(() => setAlert(prev => ({ ...prev, isOpen: false })), 3000);
        }
    }, []);

    const closeAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            {alert.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 text-center animate-in fade-in duration-200" onClick={closeAlert}>
                    <div
                        className="bg-white dark:bg-gray-900 rounded-[32px] p-10 max-w-sm w-full border dark:border-gray-800 shadow-2xl transform transition-all animate-in zoom-in duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${alert.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                                alert.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                    alert.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            }`}>
                            {alert.type === 'success' ? <CheckCircle className="w-10 h-10" /> :
                                alert.type === 'error' ? <AlertCircle className="w-10 h-10" /> :
                                    <Info className="w-10 h-10" />}
                        </div>
                        <h2 className="text-3xl font-black mb-4 dark:text-white uppercase tracking-tighter">{alert.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold leading-relaxed">{alert.message}</p>
                        <button
                            onClick={closeAlert}
                            className={`w-full p-5 rounded-2xl font-black text-xl text-white shadow-xl transition-all active:scale-95 ${alert.type === 'success' ? 'bg-emerald-600 shadow-emerald-500/20' :
                                    alert.type === 'error' ? 'bg-red-600 shadow-red-500/20' :
                                        alert.type === 'warning' ? 'bg-amber-600 shadow-amber-500/20' :
                                            'bg-blue-600 shadow-blue-500/20'
                                }`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};
