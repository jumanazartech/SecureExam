import React from 'react';

// Uzbek phone input: the +998 prefix is fixed, the user types the 9 remaining digits.
export const formatNational = (digits) => {
    const d = digits.replace(/\D/g, '').slice(0, 9);
    return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
};

const PhoneField = ({ id = 'phone', value, onChange, label, className = '', required = true }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
        <div className={`flex h-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/15 transition ${className}`}>
            <span className="grid place-items-center pl-4 pr-2 font-mono text-gray-500 dark:text-gray-400 select-none">+998</span>
            <input
                id={id}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="90 123 45 67"
                value={formatNational(value)}
                onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="flex-1 min-w-0 bg-transparent px-2 pr-4 font-mono text-base text-gray-900 dark:text-white outline-none"
                required={required}
            />
        </div>
    </div>
);

export default PhoneField;
