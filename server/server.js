require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth.routes');
const examRoutes = require('./routes/exam.routes');
const submissionRoutes = require('./routes/submission.routes');
const classRoutes = require('./routes/class.routes');
const appealRoutes = require('./routes/appeal.routes');
const accountRoutes = require('./routes/account.routes');
const tutorRoutes = require('./routes/tutor.routes');
const notificationRoutes = require('./routes/notification.routes');
const seedAdmin = require('./seeders/seed-admin');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// CLIENT_ORIGIN: comma-separated list of allowed frontends, e.g. https://secureexam.vercel.app
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/tutor', tutorRoutes);

app.get('/healthz', (req, res) => res.json({ ok: true }));

// One-service deployment: if the client has been built (client/dist), serve it from this server.
// API routes above keep working; every other path falls back to index.html (React Router).
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
    app.get('/', (req, res) => {
        res.send('Secure Exam System API Running');
    });
}


// Sync Database and Start Server
// Class names used to be globally unique; they are now unique per teacher.
const preMigrate = () => sequelize.query('ALTER TABLE IF EXISTS "Classes" DROP CONSTRAINT IF EXISTS "Classes_name_key"');

// Give classes created before join codes existed a code.
const backfillJoinCodes = async () => {
    const crypto = require('crypto');
    const { Class } = require('./models');
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (const cls of await Class.findAll({ where: { join_code: null } })) {
        await cls.update({ join_code: [...crypto.randomBytes(6)].map(b => alphabet[b % alphabet.length]).join('') });
    }
};

preMigrate().then(() => sequelize.sync({ alter: true })).then(async () => {
    console.log('Database synced');
    await backfillJoinCodes();

    // Seed default admin user
    await seedAdmin();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Database sync error:', err);
});
