// Daily-practice streak: consecutive calendar days (server-local date) with at least one activity.
const todayStr = () => new Date().toISOString().slice(0, 10);

const bumpStreak = async (user) => {
    const today = todayStr();
    if (user.streak_last_date === today) return user; // already counted today
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const continuing = user.streak_last_date === yesterday;
    user.streak_count = continuing ? user.streak_count + 1 : 1;
    user.streak_best = Math.max(user.streak_best || 0, user.streak_count);
    user.streak_last_date = today;
    await user.save();
    return user;
};

module.exports = { bumpStreak, todayStr };
