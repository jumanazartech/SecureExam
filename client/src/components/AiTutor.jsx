import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormulaRenderer from './FormulaRenderer';

// Floating AI tutor chat, mounted once for every student page. Grounds its advice in the
// student's own weak topics (server-side), so "help me" isn't a generic chatbot answer.
const AiTutor = () => {
    const { api, t, language } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([{ role: 'assistant', content: t('ai_tutor_greeting') }]);
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, busy]);

    const send = async (e) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || busy) return;
        const history = messages.slice(-8);
        setMessages(m => [...m, { role: 'user', content: text }]);
        setInput('');
        setBusy(true);
        try {
            const res = await api.post('/tutor/chat', { message: text, history, language });
            setMessages(m => [...m, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(m => [...m, { role: 'assistant', content: t('ai_tutor_error') }]);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(o => !o)}
                aria-label={t('ai_tutor_title')}
                className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
                {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            </button>

            {open && (
                <div className="fixed bottom-24 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-sm h-[70vh] max-h-[560px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border dark:border-gray-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-2 shrink-0">
                        <Sparkles className="w-5 h-5" />
                        <div>
                            <div className="font-black text-sm leading-tight">{t('ai_tutor_title')}</div>
                            <div className="text-[10px] text-blue-100 leading-tight">{t('ai_tutor_intro_hint')}</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'}`}
                                >
                                    <FormulaRenderer content={m.content} />
                                </div>
                            </div>
                        ))}
                        {busy && (
                            <div className="flex justify-start">
                                <div className="px-3.5 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-bl-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <form onSubmit={send} className="p-3 border-t dark:border-gray-800 flex items-center gap-2 shrink-0">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={t('ai_tutor_placeholder')}
                            className="flex-1 min-w-0 h-11 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={busy || !input.trim()}
                            aria-label={t('ai_tutor_send')}
                            className="w-11 h-11 shrink-0 rounded-xl bg-blue-600 text-white grid place-items-center hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default AiTutor;
