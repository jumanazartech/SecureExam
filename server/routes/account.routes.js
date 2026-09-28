const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Op } = require('sequelize');
const { User, TeacherVerification, Notification } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { normalizePhone } = require('../utils/phone');
const { toLatin, uniqueUsername, titleCaseName } = require('../utils/credentials');
const { issueOtp, verifyOtp, OtpError } = require('../services/otp.service');
const { issueSession } = require('../services/session.service');
const { usageSnapshot } = require('../services/limits');
const { PLANS, TRIAL_DAYS, getPlanId } = require('../config/plans');
const { provider: smsProvider } = require('../services/sms.service');

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (err) {
        if (err instanceof OtpError) {
            return res.status(err.status).json({ error: err.message, retry_after: err.retry_after });
        }
        console.error('[account]', err);
        res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
};

/* ---------- helpers ---------- */

const OAUTH_BASE = () => (process.env.OAUTH_REDIRECT_BASE || 'http://localhost:5173').replace(/\/$/, '');
const redirectUri = (provider) => `${OAUTH_BASE()}/api/account/oauth/${provider}/callback`;

const OAUTH = {
    google: {
        enabled: () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        authorizeUrl: (state) => 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri('google'), response_type: 'code',
            scope: 'openid email profile', state, prompt: 'select_account'
        }),
        profile: async (code) => {
            let tok;
            try {
                tok = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
                    code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: redirectUri('google'), grant_type: 'authorization_code'
                }));
            } catch (err) {
                // Surface Google's own error_description (e.g. redirect_uri_mismatch, invalid_grant) instead of axios's generic "Request failed with status code 400"
                throw new Error(`token exchange failed: ${err.response?.data?.error_description || err.response?.data?.error || err.message}`);
            }
            let info;
            try {
                info = (await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
                    headers: { Authorization: `Bearer ${tok.data.access_token}` }
                })).data;
            } catch (err) {
                throw new Error(`userinfo fetch failed: ${err.response?.data?.error_description || err.response?.data?.error || err.message}`);
            }
            return { id: info.sub, email: info.email_verified ? info.email : null, name: info.name || '' };
        }
    }
};

const publicUser = (u) => ({
    id: u.id, username: u.username, role: u.role, first_name: u.first_name, last_name: u.last_name,
    phone: u.phone, email: u.email, teacher_status: u.teacher_status,
    hide_from_leaderboard: u.hide_from_leaderboard, streak_count: u.streak_count, streak_best: u.streak_best,
    brand_name: u.brand_name
});

const makeUsername = async (first, last) => {
    const base = [toLatin(first), toLatin(last)].filter(Boolean).join('.') || 'user';
    const rows = await User.findAll({ where: { username: { [Op.iLike]: `${base}%` } }, attributes: ['username'] });
    return uniqueUsername(base, new Set(rows.map(r => r.username.toLowerCase())));
};

const splitName = (full) => {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || '', last: parts.slice(1).join(' ') };
};

// Shared by the instant sign-up path (no SMS gateway configured) and the SMS-verified path.
const createAccount = async (payload, phone, phoneVerified) => User.create({
    username: await makeUsername(payload.first_name, payload.last_name),
    password_hash: payload.password_hash,
    plain_password: null,
    role: payload.role,
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    email_verified: !!payload.email_verified,
    phone: phone || null,
    phone_verified: !!phoneVerified,
    auth_provider: payload.provider || 'local',
    provider_id: payload.provider_id || null,
    self_registered: true,
    plan: 'free',
    teacher_status: 'none'
});

/* ---------- public config ---------- */

router.get('/providers', (req, res) => {
    res.json({
        google: OAUTH.google.enabled(),
        sms: smsProvider() // 'eskiz' | 'console'
    });
});

router.get('/plans', (req, res) => res.json({ plans: PLANS, trialDays: TRIAL_DAYS }));

/* ---------- registration (SMS-verified when Eskiz is configured; instant otherwise) ---------- */

router.post('/register/start', handle(async (req, res) => {
    const { role, password, ticket } = req.body;
    let { first_name, last_name, email } = req.body;
    // Phone is optional: only enforced as a valid Uzbek number when the caller actually provided one.
    const phone = req.body.phone ? normalizePhone(req.body.phone) : null;
    if (req.body.phone && !phone) return res.status(400).json({ error: 'Enter a valid Uzbek phone number (+998 XX XXX XX XX)' });

    if (!['student', 'teacher'].includes(role)) return res.status(400).json({ error: 'Choose student or teacher' });

    let oauth = null;
    if (ticket) {
        try { oauth = jwt.verify(ticket, process.env.JWT_SECRET); } catch (e) { return res.status(400).json({ error: 'Sign-up session expired. Start again.' }); }
        if (oauth.kind !== 'oauth') return res.status(400).json({ error: 'Invalid sign-up session' });
    } else if (!password || String(password).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    first_name = String(first_name || '').trim();
    last_name = String(last_name || '').trim();
    if (first_name.length < 2 || last_name.length < 2) return res.status(400).json({ error: 'Enter your first and last name' });

    email = email ? String(email).trim().toLowerCase() : (oauth?.email || null);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });

    if (phone && (await User.findOne({ where: { phone } }))) return res.status(409).json({ error: 'This phone number is already registered. Sign in instead.' });
    if (email && (await User.findOne({ where: { email } }))) return res.status(409).json({ error: 'This email is already registered. Sign in instead.' });

    const payload = {
        role, first_name: titleCaseName(first_name), last_name: titleCaseName(last_name), email,
        password_hash: await bcrypt.hash(password || crypto.randomBytes(16).toString('hex'), 10),
        provider: oauth?.provider || 'local', provider_id: oauth?.provider_id || null,
        email_verified: !!(oauth && oauth.email && oauth.email === email)
    };

    // No SMS gateway configured (the common case today): create the account right away, no code to wait for.
    if (smsProvider() !== 'eskiz') {
        const user = await createAccount(payload, phone, false);
        return res.status(201).json({ ...(await issueSession(user)), user: publicUser(user) });
    }

    if (!phone) return res.status(400).json({ error: 'Enter a valid Uzbek phone number (+998 XX XXX XX XX)' });
    const sent = await issueOtp(phone, 'register', payload);
    res.json({ ok: true, phone, ...sent });
}));

router.post('/register/resend', handle(async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Invalid phone number' });
    const { Otp } = require('../models');
    const pending = await Otp.findOne({ where: { phone, purpose: 'register', consumed: false }, order: [['createdAt', 'DESC']] });
    if (!pending) return res.status(400).json({ error: 'Start registration again' });
    res.json({ ok: true, ...(await issueOtp(phone, 'register', pending.payload)) });
}));

router.post('/register/verify', handle(async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Invalid phone number' });
    const p = await verifyOtp(phone, 'register', req.body.code);

    // Race guard: someone could have registered the same phone/email meanwhile
    if (await User.findOne({ where: { phone } })) return res.status(409).json({ error: 'This phone number is already registered' });

    const user = await createAccount(p, phone, true);
    res.status(201).json({ ...(await issueSession(user)), user: publicUser(user) });
}));

/* ---------- forgot password (SMS) — only available once an SMS gateway is configured ---------- */

router.post('/forgot/start', handle(async (req, res) => {
    if (smsProvider() !== 'eskiz') return res.status(503).json({ error: 'Password reset by SMS is not available yet. Please contact your teacher or administrator.' });
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Invalid phone number' });
    const user = await User.findOne({ where: { phone } });
    // Same response whether or not the phone exists, so numbers cannot be probed.
    if (!user) return res.json({ ok: true, resend_in: 60 });
    res.json({ ok: true, ...(await issueOtp(phone, 'reset', { user_id: user.id })) });
}));

router.post('/forgot/reset', handle(async (req, res) => {
    if (smsProvider() !== 'eskiz') return res.status(503).json({ error: 'Password reset by SMS is not available yet. Please contact your teacher or administrator.' });
    const phone = normalizePhone(req.body.phone);
    const { code, password } = req.body;
    if (!phone) return res.status(400).json({ error: 'Invalid phone number' });
    if (!password || String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const p = await verifyOtp(phone, 'reset', code);
    const user = await User.findByPk(p.user_id);
    if (!user) return res.status(400).json({ error: 'Account not found' });
    await user.update({ password_hash: await bcrypt.hash(password, 10), plain_password: null, last_session_id: null });
    res.json({ ok: true });
}));

/* ---------- Google sign-in ---------- */

router.get('/oauth/:provider', (req, res) => {
    const cfg = OAUTH[req.params.provider];
    if (!cfg || !cfg.enabled()) return res.status(404).json({ error: 'Provider not configured' });
    const state = jwt.sign({ kind: 'state', n: crypto.randomBytes(8).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.redirect(cfg.authorizeUrl(state));
});

router.get('/oauth/:provider/callback', async (req, res) => {
    const provider = req.params.provider;
    const cfg = OAUTH[provider];
    const fail = (code) => res.redirect(`${OAUTH_BASE()}/login?error=${code}`);
    try {
        if (!cfg || !cfg.enabled()) return fail('oauth_unavailable');
        jwt.verify(String(req.query.state || ''), process.env.JWT_SECRET);
        if (!req.query.code) return fail('oauth_denied');

        const profile = await cfg.profile(req.query.code);
        let user = await User.findOne({ where: { auth_provider: provider, provider_id: profile.id } });

        // Same verified email already has an account -> link it
        if (!user && profile.email) {
            user = await User.findOne({ where: { email: profile.email } });
            if (user) await user.update({ auth_provider: provider, provider_id: profile.id, email_verified: true });
        }

        if (user) {
            const s = await issueSession(user);
            return res.redirect(`${OAUTH_BASE()}/auth/callback#token=${s.accessToken}&role=${s.role}&sessionId=${s.sessionId}`);
        }

        const { first, last } = splitName(profile.name);
        const ticket = jwt.sign({
            kind: 'oauth', provider, provider_id: profile.id, email: profile.email, first, last
        }, process.env.JWT_SECRET, { expiresIn: '20m' });
        res.redirect(`${OAUTH_BASE()}/register?ticket=${ticket}`);
    } catch (err) {
        console.error(`[oauth:${provider}]`, err?.message || err, err?.stack || '');
        fail('oauth_failed');
    }
});

// Lets the register page prefill the name from an OAuth ticket
router.get('/oauth-ticket', (req, res) => {
    try {
        const t = jwt.verify(String(req.query.ticket || ''), process.env.JWT_SECRET);
        if (t.kind !== 'oauth') throw new Error('bad');
        res.json({ provider: t.provider, email: t.email, first_name: t.first, last_name: t.last });
    } catch (e) {
        res.status(400).json({ error: 'Sign-up session expired' });
    }
});

/* ---------- current account, plan & usage ---------- */

router.get('/me', authenticateToken, handle(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const verification = user.role === 'teacher'
        ? await TeacherVerification.findOne({ where: { user_id: user.id }, order: [['createdAt', 'DESC']] })
        : null;
    const cls = user.class_id
        ? await require('../models').Class.findByPk(user.class_id, {
            attributes: ['id', 'name'],
            include: [{ model: User, as: 'Teacher', attributes: ['brand_name'] }]
        })
        : null;
    const snapshot = user.role === 'teacher' || user.role === 'admin' ? await usageSnapshot(user) : null;
    res.json({
        user: publicUser(user),
        plan: getPlanId(user),
        pro_until: user.pro_until,
        class: cls ? { id: cls.id, name: cls.name, brand_name: cls.Teacher?.brand_name || null } : null,
        trial_used: user.trial_used,
        trial_days: TRIAL_DAYS,
        verification: verification ? {
            status: verification.status, workplace: verification.workplace, note: verification.note
        } : null,
        usage: snapshot
    });
}));

// Self-service profile settings: students can opt out of leaderboards, teachers can set a brand name
// shown to their own students (lightweight white-label for tutoring centers).
router.put('/me', authenticateToken, handle(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updates = {};
    if (typeof req.body.hide_from_leaderboard === 'boolean') updates.hide_from_leaderboard = req.body.hide_from_leaderboard;
    if (typeof req.body.brand_name === 'string' && (user.role === 'teacher' || user.role === 'admin')) {
        // Custom branding is a Pro perk (part of the tutoring-center white-label pitch)
        if (user.role === 'teacher' && getPlanId(user) !== 'pro') {
            return res.status(403).json({ error: 'Custom branding is available on the Pro plan', code: 'PLAN_LIMIT', feature: 'brand_name' });
        }
        updates.brand_name = req.body.brand_name.trim().slice(0, 60) || null;
    }
    await user.update(updates);
    res.json({ user: publicUser(user) });
}));

/* ---------- teacher verification ---------- */

const PRIVATE_DIR = path.join(__dirname, '..', 'uploads', 'private');
const verificationUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => { fs.mkdirSync(PRIVATE_DIR, { recursive: true }); cb(null, PRIVATE_DIR); },
        filename: (req, file, cb) => cb(null, `verif-${req.user.id}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(/\.(jpe?g|png|pdf)$/i.test(file.originalname) ? null : new Error('Upload a JPG, PNG or PDF'), /\.(jpe?g|png|pdf)$/i.test(file.originalname))
});

router.post('/teacher/verification', authenticateToken, verificationUpload.single('document'), handle(async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Teachers only' });
    const user = await User.findByPk(req.user.id);
    if (['pending', 'verified'].includes(user.teacher_status)) {
        return res.status(409).json({ error: user.teacher_status === 'pending' ? 'Your request is already under review' : 'You are already verified' });
    }
    const workplace = String(req.body.workplace || '').trim();
    if (workplace.length < 3) return res.status(400).json({ error: 'Enter your school / institution' });
    if (!req.file) return res.status(400).json({ error: 'Attach a document (ID, certificate or a letter from your school)' });

    await TeacherVerification.create({
        user_id: user.id, workplace, subject: String(req.body.subject || '').trim() || null,
        document_path: req.file.path, status: 'pending'
    });
    await user.update({ teacher_status: 'pending', subject: req.body.subject || user.subject });
    res.status(201).json({ ok: true, status: 'pending' });
}));

/* ---------- admin: verification queue & plans ---------- */

router.get('/admin/verifications', authenticateToken, requireAdmin, handle(async (req, res) => {
    const status = req.query.status || 'pending';
    const rows = await TeacherVerification.findAll({
        where: status === 'all' ? {} : { status },
        include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'phone', 'email', 'username', 'subject', 'trial_used', 'createdAt'] }],
        order: [['createdAt', 'DESC']]
    });
    res.json(rows.map(r => ({ ...r.toJSON(), document_path: undefined, has_document: !!r.document_path })));
}));

router.get('/admin/verifications/:id/document', authenticateToken, requireAdmin, handle(async (req, res) => {
    const row = await TeacherVerification.findByPk(req.params.id);
    if (!row || !row.document_path || !fs.existsSync(row.document_path)) return res.status(404).json({ error: 'No document' });
    res.sendFile(path.resolve(row.document_path));
}));

const notify = (userId, en, ru, uz, type = 'info') =>
    Notification.create({ user_id: userId, message: { en, ru, uz }, type, is_read: false });

router.post('/admin/verifications/:id/approve', authenticateToken, requireAdmin, handle(async (req, res) => {
    const row = await TeacherVerification.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const user = await User.findByPk(row.user_id);

    await row.update({ status: 'approved', reviewed_by: req.user.id, note: req.body.note || null });
    const updates = { teacher_status: 'verified' };
    let trialStarted = false;
    if (!user.trial_used) {
        updates.plan = 'pro';
        updates.pro_until = new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000);
        updates.trial_used = true;
        trialStarted = true;
    }
    await user.update(updates);
    await notify(user.id,
        trialStarted ? `You are verified! Enjoy ${TRIAL_DAYS} days of Pro.` : 'You are verified as a teacher.',
        trialStarted ? `Вы подтверждены! ${TRIAL_DAYS} дня Pro в подарок.` : 'Вы подтверждены как учитель.',
        trialStarted ? `Tasdiqlandingiz! ${TRIAL_DAYS} kunlik Pro sovg'a.` : "Siz o'qituvchi sifatida tasdiqlandingiz.", 'success');
    res.json({ ok: true, trialStarted });
}));

router.post('/admin/verifications/:id/reject', authenticateToken, requireAdmin, handle(async (req, res) => {
    const row = await TeacherVerification.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.update({ status: 'rejected', reviewed_by: req.user.id, note: req.body.note || null });
    await User.update({ teacher_status: 'rejected' }, { where: { id: row.user_id } });
    await notify(row.user_id,
        `Verification was not approved${req.body.note ? `: ${req.body.note}` : ''}. You can submit again.`,
        `Подтверждение не одобрено${req.body.note ? `: ${req.body.note}` : ''}. Можно подать заново.`,
        `Tasdiqlash rad etildi${req.body.note ? `: ${req.body.note}` : ''}. Qayta yuborishingiz mumkin.`, 'warning');
    res.json({ ok: true });
}));

router.get('/admin/teacher-plans', authenticateToken, requireAdmin, handle(async (req, res) => {
    const teachers = await User.findAll({
        where: { role: 'teacher' },
        attributes: ['id', 'first_name', 'last_name', 'username', 'phone', 'plan', 'pro_until', 'teacher_status', 'self_registered', 'createdAt'],
        order: [['createdAt', 'DESC']]
    });
    res.json(teachers.map(t => ({ ...t.toJSON(), effective_plan: getPlanId(t) })));
}));

// Manual upgrade (until online payments are connected): days=0 -> Free, days>0 -> Pro for N days, days=null -> Pro without expiry
router.post('/admin/users/:id/plan', authenticateToken, requireAdmin, handle(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { days } = req.body;
    if (days === 0) await user.update({ plan: 'free', pro_until: null });
    else if (days === null || days === undefined) await user.update({ plan: 'pro', pro_until: null });
    else await user.update({ plan: 'pro', pro_until: new Date(Date.now() + Number(days) * 24 * 3600 * 1000) });
    res.json({ ok: true });
}));

module.exports = router;
