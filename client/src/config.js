// Backend location. Empty in local dev (Vite proxies /api and /uploads to the server).
// In production set VITE_API_URL to the backend origin, e.g. https://exam-api.onrender.com
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE = `${API_ORIGIN}/api`;
export const assetUrl = (path) => (path && path.startsWith('/') ? `${API_ORIGIN}${path}` : path);

export const BRAND = 'SecureExam';

export const CONTACT = {
    phone: '+998992261721',
    phoneLabel: '+998 99 226 17 21',
    email: 'jumanazar.tech@gmail.com',
    telegram: '@jumanazar_xolmatov',
    telegramUrl: 'https://t.me/jumanazar_xolmatov'
};
