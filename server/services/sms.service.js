const axios = require('axios');

/**
 * SMS delivery. Provider is chosen by env:
 *   ESKIZ_EMAIL + ESKIZ_PASSWORD  -> Eskiz.uz (https://eskiz.uz, the most widely used Uzbek SMS gateway)
 *   otherwise                      -> "console": the message is printed in the server log (development only)
 *
 * Eskiz requires an approved sender/template. Set ESKIZ_FROM (default 4546) and keep the message text
 * identical to the template you registered, e.g. "SecureExam: tasdiqlash kodi {code}".
 */
const ESKIZ_URL = 'https://notify.eskiz.uz/api';
let eskizToken = null;

const provider = () => (process.env.ESKIZ_EMAIL && process.env.ESKIZ_PASSWORD ? 'eskiz' : 'console');

const eskizLogin = async () => {
    const form = new FormData();
    form.append('email', process.env.ESKIZ_EMAIL);
    form.append('password', process.env.ESKIZ_PASSWORD);
    const res = await axios.post(`${ESKIZ_URL}/auth/login`, form);
    eskizToken = res.data?.data?.token;
    if (!eskizToken) throw new Error('Eskiz login failed');
    return eskizToken;
};

const eskizSend = async (phone, message, retry = true) => {
    if (!eskizToken) await eskizLogin();
    const form = new FormData();
    form.append('mobile_phone', phone.replace('+', ''));
    form.append('message', message);
    form.append('from', process.env.ESKIZ_FROM || '4546');
    try {
        await axios.post(`${ESKIZ_URL}/message/sms/send`, form, { headers: { Authorization: `Bearer ${eskizToken}` } });
    } catch (err) {
        if (err.response?.status === 401 && retry) {
            eskizToken = null;
            return eskizSend(phone, message, false);
        }
        throw new Error(`SMS provider error: ${err.response?.data?.message || err.message}`);
    }
};

const sendSms = async (phone, message) => {
    if (provider() === 'eskiz') {
        await eskizSend(phone, message);
        return { provider: 'eskiz' };
    }
    console.log(`[SMS:console] -> ${phone}: ${message}`);
    return { provider: 'console' };
};

module.exports = { sendSms, provider };
