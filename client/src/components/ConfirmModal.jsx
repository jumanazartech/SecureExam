import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', type = 'danger', showInput = false }) => {
    const [inputValue, setInputValue] = React.useState('');

    if (!isOpen) return null;

    const colors = {
        danger: 'bg-red-600 hover:bg-red-700 shadow-red-500/30',
        warning: 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-500/30',
        info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
    };

    const handleConfirm = () => {
        onConfirm(showInput ? inputValue : null);
        setInputValue('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300 border dark:border-gray-800" onClick={e => e.stopPropagation()}>
                <div className="p-8 pb-4 flex justify-between items-center">
                    <h3 className="text-2xl font-black dark:text-white flex items-center gap-3 tracking-tighter uppercase">
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 pt-4">
                    <p className="text-gray-500 dark:text-gray-400 font-bold mb-6">
                        {message}
                    </p>

                    {showInput && (
                        <input
                            type="text"
                            autoFocus
                            placeholder="Type here..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white transition-all mb-2"
                        />
                    )}
                </div>

                <div className="p-8 pt-0 flex flex-col gap-3">
                    <button
                        onClick={handleConfirm}
                        className={`w-full py-4 text-white rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all ${colors[type]}`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
