import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Bulk student creation with a live preview of the exact login/password that will be created,
 * so a wrong name order or a duplicate is visible before anything is saved.
 * The server is the single source of truth for username generation (/auth/preview-students).
 */
const BulkStudentModal = ({ isOpen, onClose, endpoint, classId = null, onCreated }) => {
    const { api, t } = useAuth();
    const [text, setText] = useState('');
    const [order, setOrder] = useState('first_last');
    const [plan, setPlan] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    useEffect(() => {
        if (!isOpen || lines.length === 0) { setPlan([]); return undefined; }
        const timer = setTimeout(async () => {
            try {
                const res = await api.post('/auth/preview-students', { students: lines, order });
                setPlan(res.data.plan);
            } catch (err) { console.error(err); }
        }, 350);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, order, isOpen]);

    if (!isOpen) return null;

    const close = () => { setText(''); setPlan([]); setError(''); onClose(); };

    const submit = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await api.post(endpoint, { students: lines, order, class_id: classId });
            onCreated?.(res.data);
            setText('');
            setPlan([]);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setSaving(false);
        }
    };

    const valid = plan.filter(p => !p.error).length;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-2xl w-full border dark:border-gray-800 shadow-2xl max-h-[92vh] overflow-y-auto">
                <h2 className="text-2xl font-black mb-1 text-gray-900 dark:text-white tracking-tight">{t('add_students_btn')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('student_names_placeholder')}</p>

                <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    {[['first_last', t('name_order_first_last')], ['last_first', t('name_order_last_first')]].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setOrder(value)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${order === value ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={order === 'first_last' ? "Jumanazar Xolmatov\nOzodbek Nurullayev" : "Xolmatov Jumanazar Ulug'bek o'g'li"}
                    className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-gray-900 dark:text-white mb-4"
                />

                {plan.length > 0 && (
                    <div className="mb-4 rounded-2xl border dark:border-gray-800 overflow-hidden">
                        <div className="grid grid-cols-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/60 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <span>{t('full_name')}</span><span>{t('login')}</span><span>{t('password')}</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto divide-y dark:divide-gray-800">
                            {plan.map((p, i) => (
                                <div key={i} className="grid grid-cols-3 px-4 py-2 text-sm">
                                    {p.error ? (
                                        <span className="col-span-3 flex items-center gap-2 text-red-600 dark:text-red-400"><AlertTriangle className="w-4 h-4" />{p.input}: {p.error}</span>
                                    ) : (
                                        <>
                                            <span className="font-bold text-gray-900 dark:text-white truncate">{p.last_name} {p.first_name}</span>
                                            <span className="font-mono text-gray-700 dark:text-gray-300 truncate">{p.username}</span>
                                            <span className="font-mono text-gray-700 dark:text-gray-300 truncate">{p.password}</span>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}

                <button
                    onClick={submit}
                    disabled={saving || valid === 0}
                    className="w-full bg-emerald-600 disabled:opacity-50 text-white p-4 rounded-xl font-black text-lg hover:bg-emerald-700 transition-all"
                >
                    {t('submit')} {valid > 0 && `(${valid})`}
                </button>
                <button onClick={close} className="w-full text-gray-500 dark:text-gray-400 font-bold p-2 mt-2">{t('cancel')}</button>
            </div>
        </div>
    );
};

export default BulkStudentModal;
