import { useAuth } from '../context/AuthContext';

// Picks the current language's copy from { uz, ru, en } (falls back to Uzbek, the primary market).
export const useCopy = (copy) => {
    const { language } = useAuth();
    return copy[language] || copy.uz;
};
