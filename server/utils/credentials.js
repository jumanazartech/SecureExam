/**
 * Login/password generation for bulk-created accounts.
 *
 * - Names in Cyrillic or with diacritics are transliterated to plain a-z (Uzbek Latin rules).
 * - Apostrophe variants (', ’, ʻ, ʼ, `) are dropped: O'KTAMBEK -> oktambek.
 * - Logins are lowercase, so students never fail on caps/shift.
 */

const CYRILLIC = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
    м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h'
};

const toLatin = (value) => {
    const lower = String(value || '').toLowerCase();
    const transliterated = [...lower].map(ch => (ch in CYRILLIC ? CYRILLIC[ch] : ch)).join('');
    return transliterated
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')   // strip diacritics
        .replace(/[^a-z]/g, '');            // drops apostrophes, spaces, digits, symbols
};

const titleCase = (word) => word
    .toLocaleLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toLocaleUpperCase());

/**
 * order: 'first_last' -> "Ism Familiya [Sharif...]"   (default)
 *        'last_first' -> "Familiya Ism [Sharif...]"   (as in official lists)
 */
const parseFullName = (line, order = 'first_last') => {
    const parts = String(line || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;

    let first;
    let last;
    let rest;
    if (order === 'last_first') {
        [last, first, ...rest] = parts;
    } else {
        [first, last, ...rest] = parts;
    }

    const display = (v) => (v ? titleCase(v) : '');
    return {
        first_name: [display(first), ...(rest || []).map(display)].filter(Boolean).join(' '),
        last_name: display(last),
        base: toLatin(first) + toLatin(last) // e.g. jumanazarxolmatov
    };
};

// existing: Set of lowercase usernames already taken (DB + earlier lines of this batch)
const uniqueUsername = (base, existing) => {
    let candidate = base;
    let n = 2;
    while (existing.has(candidate)) candidate = `${base}${n++}`;
    existing.add(candidate);
    return candidate;
};

// Readable random password: no look-alike characters (0/O, 1/l/I)
const randomPassword = (length = 8) => {
    const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    const bytes = require('crypto').randomBytes(length);
    return [...bytes].map(b => alphabet[b % alphabet.length]).join('');
};

module.exports = { toLatin, parseFullName, uniqueUsername, randomPassword, titleCaseName: titleCase };
