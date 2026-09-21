const crypto = require('crypto');
const { Op } = require('sequelize');
const { Otp } = require('../models');
const { sendSms, provider } = require('./sms.service');

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_S = 60;
const MAX_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const hash = (phone, code) => crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev').update(`${phone}:${code}`).digest('hex');

class OtpError extends Error {
    constructor(message, status = 400, extra = {}) {
        super(message);
        this.status = status;
        Object.assign(this, extra);
    }
}

const generateCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

// Sends a fresh code (invalidating older ones for the phone+purpose). payload is stored with the code.
const issueOtp = async (phone, purpose, payload = null) => {
    const last = await Otp.findOne({ where: { phone, purpose }, order: [['createdAt', 'DESC']] });
    if (last) {
        const wait = RESEND_COOLDOWN_S - Math.floor((Date.now() - new Date(last.createdAt).getTime()) / 1000);
        if (wait > 0) throw new OtpError(`Please wait ${wait}s before requesting a new code`, 429, { retry_after: wait });
    }
    const sentLastHour = await Otp.count({ where: { phone, createdAt: { [Op.gt]: new Date(Date.now() - 3600 * 1000) } } });
    if (sentLastHour >= MAX_PER_HOUR) throw new OtpError('Too many codes requested. Try again in an hour.', 429);

    await Otp.update({ consumed: true }, { where: { phone, purpose, consumed: false } });

    const code = generateCode();
    await Otp.create({ phone, purpose, code_hash: hash(phone, code), payload, expires_at: new Date(Date.now() + CODE_TTL_MS) });
    await sendSms(phone, `SecureExam: tasdiqlash kodi ${code}. Kodni hech kimga bermang.`);

    // The code is only echoed back when no real SMS gateway is configured (local development).
    return { resend_in: RESEND_COOLDOWN_S, dev_code: provider() === 'console' && process.env.NODE_ENV !== 'production' ? code : undefined };
};

// Validates a code and consumes it. Returns the stored payload.
const verifyOtp = async (phone, purpose, code) => {
    const otp = await Otp.findOne({ where: { phone, purpose, consumed: false }, order: [['createdAt', 'DESC']] });
    if (!otp || new Date(otp.expires_at) < new Date()) throw new OtpError('Code expired. Request a new one.', 400);
    if (otp.attempts >= MAX_ATTEMPTS) throw new OtpError('Too many wrong attempts. Request a new code.', 429);

    if (hash(phone, String(code || '').trim()) !== otp.code_hash) {
        await otp.increment('attempts');
        throw new OtpError('Wrong code', 400);
    }
    await otp.update({ consumed: true });
    return otp.payload || {};
};

module.exports = { issueOtp, verifyOtp, OtpError };
