import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useCopy } from '../hooks/useCopy';

const COPY = { uz: 'Sinf kodi', ru: 'Код класса', en: 'Class code', hint: { uz: "Talabalar shu kod bilan sinfga qo'shiladi", ru: 'Студенты вступают в класс по этому коду', en: 'Students join this class with this code' } };

// Students type this code after signing up to join the class.
const JoinCode = ({ code }) => {
    const copy = useCopy({ uz: COPY.uz, ru: COPY.ru, en: COPY.en });
    const hint = useCopy(COPY.hint);
    const [done, setDone] = useState(false);
    if (!code) return null;

    const onCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(code);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
        } catch (err) { /* clipboard unavailable */ }
    };

    return (
        <button type="button" onClick={onCopy} title={hint}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 hover:border-blue-600">
            <span className="text-gray-500 dark:text-gray-400">{copy}</span>
            <span className="font-mono font-semibold tracking-wider">{code}</span>
            {done ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
        </button>
    );
};

export default JoinCode;
