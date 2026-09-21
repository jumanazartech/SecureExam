// Normalises Uzbek phone numbers to E.164 (+998XXXXXXXXX). Returns null when invalid.
const normalizePhone = (input) => {
    const digits = String(input || '').replace(/\D/g, '');
    let national;
    if (digits.length === 9) national = digits;
    else if (digits.length === 12 && digits.startsWith('998')) national = digits.slice(3);
    else return null;
    // Uzbek mobile/landline national numbers start with a 2-digit operator/region code (no leading 0 or 1)
    if (!/^[3-9]\d{8}$/.test(national)) return null;
    return `+998${national}`;
};

module.exports = { normalizePhone };
