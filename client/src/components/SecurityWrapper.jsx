import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SecurityWrapper = ({ children, onViolation }) => {
    const { api } = useAuth();
    const [isBlocked, setIsBlocked] = useState(false);
    const [violationType, setViolationType] = useState(null);
    const [adminPin, setAdminPin] = useState('');
    const [error, setError] = useState('');
    const [lastUnblockTime, setLastUnblockTime] = useState(0); // Grace period tracking

    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        const handleCopy = (e) => e.preventDefault();
        const handleCut = (e) => e.preventDefault();
        const handlePaste = (e) => e.preventDefault();

        const enterFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.error("Fullscreen blocked", err);
            }
        };

        const logViolation = async (type) => {
            try {
                // In a real app, we need the active submission ID here.
                // For MVP passing it via props or context would be better, 
                // but assuming 'onViolation' handles the API call or context has it.
                if (onViolation) onViolation(type);
                setViolationType(type);
                setIsBlocked(true);
            } catch (err) {
                console.error("Log failed", err);
            }
        };

        const handleFocus = () => {
            // Optional: Resume warning or check integrity
        };

        const handleBlur = () => {
            const now = Date.now();
            if (now - lastUnblockTime < 3000) return; // Prevent immediate re-block after unlock (browser popup grace)
            logViolation('focus_lost');
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                const now = Date.now();
                if (now - lastUnblockTime < 3000) return;
                logViolation('tab_switch');
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                const now = Date.now();
                if (now - lastUnblockTime < 3000) return;
                logViolation('fullscreen_exit');
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('paste', handlePaste);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus); // Just to tracking return
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Force execution
        enterFullscreen();

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('paste', handlePaste);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [onViolation, lastUnblockTime]);

    const handleUnlock = async () => {
        try {
            const res = await api.post('/submissions/verify-pin', { pin: adminPin });
            if (res.data.valid) {
                setIsBlocked(false);
                setAdminPin('');
                setError('');
                setLastUnblockTime(Date.now()); // Set grace period
                // Re-enter fullscreen
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } else {
                setError('Invalid PIN');
            }
        } catch (err) {
            setError('Verification failed');
        }
    };

    if (isBlocked) {
        return (
            <div className="fixed inset-0 z-50 bg-red-900 flex items-center justify-center text-white">
                <div className="bg-white text-black p-8 rounded-lg shadow-2xl max-w-md text-center">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Exam Blocked!</h2>
                    <p className="mb-4 text-gray-700">
                        Security violation detected: <strong>{violationType}</strong>.
                        <br />
                        Please call an invigilator to unlock your exam.
                    </p>
                    <input
                        type="text"
                        name="auth_challenge_code" // Randomized name to confuse password managers
                        autoComplete="new-password" // Explicitly tell browser not to use old passwords
                        data-lpignore="true"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                        placeholder="••••"
                        style={{ WebkitTextSecurity: 'disc' }} // Standard way to mask text without type="password"
                        className="w-full border-4 border-gray-100 dark:border-gray-800 p-4 rounded-2xl mb-4 text-center text-2xl tracking-[0.5em] font-bold focus:border-red-500 outline-none transition-all placeholder:tracking-normal"
                        autoFocus
                    />
                    {error && <p className="text-red-500 mb-4 font-bold">{error}</p>}
                    <button
                        onClick={handleUnlock}
                        className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 w-full"
                    >
                        Unlock Exam
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 select-none">
            {children}
        </div>
    );
};

export default SecurityWrapper;
