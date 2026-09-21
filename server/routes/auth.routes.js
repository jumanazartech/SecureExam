const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Class, Sequelize } = require('../models');
const { Op } = Sequelize;
const { normalizePhone } = require('../utils/phone');
const { toLatin, uniqueUsername, randomPassword, titleCaseName } = require('../utils/credentials');
const { createStudents, planAccounts } = require('../services/student.service');
const { authenticateToken, requireAdmin, requireTeacherOrAdmin } = require('../middleware/auth');

router.post('/login', async (req, res) => {
    try {
        const { password, force } = req.body;
        const identifier = String(req.body.username || '').trim();
        const phone = normalizePhone(identifier);
        // Sign in with username, phone number or email (all case-insensitive where it matters)
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('username')), identifier.toLowerCase()),
                    ...(phone ? [{ phone }] : []),
                    ...(identifier.includes('@') ? [Sequelize.where(Sequelize.fn('lower', Sequelize.col('email')), identifier.toLowerCase())] : [])
                ]
            }
        });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const validPassword = await bcrypt.compare(String(password || '').trim(), user.password_hash);
        if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

        // Single Session Check
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (user.last_session_id && user.last_active_at > fiveMinutesAgo && !force) {
            return res.status(401).json({
                code: 'SESSION_ACTIVE',
                message: 'Another session is active'
            });
        }

        const sessionId = Math.random().toString(36).substring(7);
        const accessToken = jwt.sign({
            id: user.id,
            username: user.username,
            role: user.role,
            sessionId
        }, process.env.JWT_SECRET);

        await user.update({
            last_session_id: sessionId,
            last_active_at: new Date()
        });

        res.json({ accessToken, role: user.role, sessionId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/heartbeat', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).end();

        // If session ID mismatch, force logout
        if (user.last_session_id !== req.user.sessionId) {
            return res.status(401).json({ code: 'SESSION_EXPIRED' });
        }

        await user.update({ last_active_at: new Date() });
        res.status(204).end();
    } catch (err) {
        res.status(500).end();
    }
});

// Admin: Generate Student Accounts
router.post('/admin/generate-students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { count, prefix, password } = req.body;
        const students = [];
        const hashedPassword = await bcrypt.hash(password, 10);

        for (let i = 0; i < count; i++) {
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const username = `${prefix}${randomNum}`;
            students.push({
                username,
                password_hash: hashedPassword,
                plain_password: password, // Store for admin visibility
                role: 'student'
            });
        }

        await User.bulkCreate(students);
        res.json({
            message: `${count} students generated successfully`,
            students: students.map(s => s.username)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Batch Create Students (from list). order: 'first_last' (default) | 'last_first'
router.post('/admin/batch-create-students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { students, order, class_id } = req.body;
        const result = await createStudents(students || [], { order, class_id: class_id || null, created_by: req.user.id });
        res.json({ message: 'Batch processing complete', ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Preview the logins/passwords that would be generated (no DB writes)
router.post('/preview-students', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const { students, order } = req.body;
        res.json({ plan: await planAccounts(students || [], order) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Teacher: Get students created by this teacher OR in their assigned classes
router.get('/teacher/my-students', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const myClasses = await Class.findAll({
            where: { teacher_id: req.user.id },
            attributes: ['id']
        });
        const classIds = myClasses.map(c => c.id);

        const students = await User.findAll({
            where: {
                role: 'student',
                [Op.or]: [
                    { created_by: req.user.id },
                    { class_id: { [Op.in]: classIds } }
                ]
            },
            attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'plain_password', 'class_id', 'createdAt', 'created_by'],
            include: [
                { model: Class, attributes: ['id', 'name'] },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['first_name', 'last_name', 'username']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Teacher: Batch Create Students (same logic, accessible to teachers)
router.post('/teacher/batch-create-students', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const { students, class_id, order } = req.body;
        const owner = await User.findByPk(req.user.id);
        if (class_id && req.user.role === 'teacher') {
            const cls = await Class.findByPk(class_id);
            if (!cls || cls.teacher_id !== req.user.id) return res.status(403).json({ error: 'You can only add students to your own classes.' });
        }
        const result = await createStudents(students || [], { order, class_id: class_id || null, created_by: req.user.id, owner });
        res.json({ message: 'Batch processing complete', ...result });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
});

// Get Student Profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'role', 'first_name', 'last_name', 'email']
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Student Profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { first_name, last_name, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        if (email && !email.endsWith('@gmail.com')) {
            return res.status(400).json({ error: 'Email must be a @gmail.com address' });
        }

        await user.update({
            first_name: first_name !== undefined ? first_name : user.first_name,
            last_name: last_name !== undefined ? last_name : user.last_name,
            email: email !== undefined ? email : user.email
        });

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Setup initial admin (remove in production or secure)
router.post('/setup-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password_hash: hashedPassword, role: 'admin' });
        res.json({ message: 'Admin created', userId: user.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get All Students with Scores
router.get('/admin/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { Submission } = require('../models');
        const students = await User.findAll({
            where: { role: 'student' },
            attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'plain_password', 'class_id', 'createdAt', 'created_by'],
            include: [
                {
                    model: Submission,
                    attributes: ['score']
                },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['first_name', 'last_name', 'username']
                }
            ]
        });

        // Format to include total score
        const formatted = students.map(s => {
            const totalScore = s.Submissions?.reduce((acc, sub) => acc + parseFloat(sub.score || 0), 0) || 0;
            return {
                id: s.id,
                username: s.username,
                first_name: s.first_name,
                last_name: s.last_name,
                email: s.email,
                plain_password: s.plain_password,
                class_id: s.class_id,
                createdAt: s.createdAt,
                created_by: s.created_by,
                creator: s.Creator,
                totalScore
            };
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin/Teacher: Delete Student (Single)
router.delete('/admin/students/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user || user.role !== 'student') {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Permission check for teachers
        if (req.user.role === 'teacher') {
            const hasAccess = await checkTeacherStudentAccess(req.user.id, user);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        await user.destroy();
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin/Teacher: Update Student Details
router.put('/admin/students/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const { username, password, first_name, last_name, class_id } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user || user.role !== 'student') {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Permission check for teachers
        if (req.user.role === 'teacher') {
            const hasAccess = await checkTeacherStudentAccess(req.user.id, user);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
        }

        const updates = { first_name, last_name, username, class_id };
        if (password && password.trim()) {
            updates.password_hash = await bcrypt.hash(password, 10);
            updates.plain_password = password;
        }

        await user.update(updates);
        res.json({ message: 'Student updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper for permission checks
async function checkTeacherStudentAccess(teacherId, student) {
    if (student.created_by === teacherId) return true;
    const cls = await Class.findOne({ where: { id: student.class_id, teacher_id: teacherId } });
    return !!cls;
}

// Admin: Delete Students (Batch)
router.post('/admin/delete-students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ids } = req.body; // Array of IDs
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'Invalid IDs' });
        }

        await User.destroy({
            where: {
                id: ids,
                role: 'student' // Safety: only delete students
            }
        });

        res.json({ message: `${ids.length} students deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all teachers
router.get('/admin/teachers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const teachers = await User.findAll({
            where: { role: 'teacher' },
            attributes: ['id', 'username', 'plain_password', 'subject', 'first_name', 'last_name', 'role', 'createdAt'],
            include: [{ model: Class, as: 'TeachingClasses', attributes: ['id', 'name'] }]
        });
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Create Teacher. Login is generated as "firstname.lastname" (latin, lowercase, unique);
// the password is random unless the caller supplies one. The credentials are returned once for the admin.
router.post('/admin/teachers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { first_name, last_name, subject } = req.body;
        if (!String(first_name || '').trim() || !String(last_name || '').trim()) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        const first = toLatin(first_name);
        const last = toLatin(last_name);
        if (!first || !last) {
            return res.status(400).json({ error: 'Names must contain letters' });
        }

        let username = req.body.username ? String(req.body.username).trim().toLowerCase() : `${first}.${last}`;
        const taken = new Set(
            (await User.findAll({ where: { username: { [Op.iLike]: `${username}%` } }, attributes: ['username'] }))
                .map(u => u.username.toLowerCase())
        );
        username = uniqueUsername(username, taken);

        const password = String(req.body.password || '').trim() || randomPassword(8);
        const newTeacher = await User.create({
            username,
            password_hash: await bcrypt.hash(password, 10),
            plain_password: password,
            first_name: titleCaseName(first_name),
            last_name: titleCaseName(last_name),
            subject,
            role: 'teacher',
            plan: 'pro',            // created by an administrator = institutional account, no expiry
            teacher_status: 'verified'
        });

        res.status(201).json({
            message: 'Teacher created successfully',
            teacher: { id: newTeacher.id, username, first_name: newTeacher.first_name, last_name: newTeacher.last_name },
            credentials: { username, password, first_name: newTeacher.first_name, last_name: newTeacher.last_name }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete Teacher
router.delete('/admin/teachers/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user || user.role !== 'teacher') {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        await user.destroy();
        res.json({ message: 'Teacher deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Bulk Delete Teachers
router.post('/admin/bulk-delete-teachers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs array is required' });
        }
        await User.destroy({
            where: {
                id: ids,
                role: 'teacher'
            }
        });
        res.json({ message: 'Teachers deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (user) {
            await user.update({
                last_session_id: null,
                last_active_at: null
            });
        }
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
