const jwt = require('jsonwebtoken');

// Starts a session: stores the session id (single-session rule) and returns the login response body.
const issueSession = async (user) => {
    const sessionId = Math.random().toString(36).substring(7);
    const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role, sessionId }, process.env.JWT_SECRET);
    await user.update({ last_session_id: sessionId, last_active_at: new Date() });
    return { accessToken, role: user.role, sessionId };
};

module.exports = { issueSession };
