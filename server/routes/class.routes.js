const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const crypto = require('crypto');
const { Class, User } = require('../models');
const limits = require('../services/limits');

// Short, unambiguous join code students type to enter a class (no 0/O/1/I)
const newJoinCode = async () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 10; i++) {
        const code = [...crypto.randomBytes(6)].map(b => alphabet[b % alphabet.length]).join('');
        if (!(await Class.findOne({ where: { join_code: code } }))) return code;
    }
    throw new Error('Could not generate a join code');
};

// Teachers may only touch their own classes; admins may touch any.
const canManage = (user, cls) => user.role === 'admin' || (user.role === 'teacher' && cls.teacher_id === user.id);

// Get all classes with student counts (Admin & Teacher)
router.get('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const classes = await Class.findAll({
            where: req.user.role === 'teacher' ? { teacher_id: req.user.id } : {},
            include: [
                {
                    model: User,
                    attributes: ['id'],
                    where: { role: 'student' },
                    required: false
                },
                {
                    model: User,
                    as: 'Teacher',
                    attributes: ['id', 'first_name', 'last_name', 'username'],
                    required: false
                }
            ]
        });

        const formatted = classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            join_code: cls.join_code,
            teacher: cls.Teacher ? {
                id: cls.Teacher.id,
                name: `${cls.Teacher.first_name} ${cls.Teacher.last_name}`,
                username: cls.Teacher.username
            } : null,
            studentCount: cls.Users ? cls.Users.length : 0,
            createdAt: cls.createdAt
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Teacher: Get my classes
router.get('/my-classes', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const classes = await Class.findAll({
            where: { teacher_id: req.user.id },
            include: [{
                model: User,
                attributes: ['id', 'first_name', 'last_name', 'username', 'subject'],
                where: { role: 'student' },
                required: false
            }]
        });

        // Basic formatting
        const formatted = classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            join_code: cls.join_code,
            studentCount: cls.Users ? cls.Users.length : 0,
            students: cls.Users || []
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new class (admin: any teacher; teacher: for themselves, within their plan)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
        const name = String(req.body.name || '').trim();
        if (!name) return res.status(400).json({ error: 'Class name is required' });

        let teacherId = req.body.teacher_id || null;
        if (req.user.role === 'teacher') {
            teacherId = req.user.id;
            await limits.assertClassAllowed(await User.findByPk(req.user.id));
        } else if (teacherId) {
            const teacher = await User.findByPk(teacherId);
            if (!teacher || teacher.role !== 'teacher') return res.status(400).json({ error: 'Invalid teacher selected' });
        }

        // Names only need to be unique per teacher ("11A" can exist in two schools)
        if (await Class.findOne({ where: { name, teacher_id: teacherId } })) {
            return res.status(409).json({ error: 'Class name already exists' });
        }

        const newClass = await Class.create({ name, teacher_id: teacherId, join_code: await newJoinCode() });
        res.status(201).json(newClass);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
});

// Student: join a class with the teacher's code (counts against the teacher's plan)
router.post('/join', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' });
        const code = String(req.body.code || '').trim().toUpperCase();
        const cls = await Class.findOne({ where: { join_code: code } });
        if (!cls) return res.status(404).json({ error: 'Class code not found. Check it with your teacher.' });

        const student = await User.findByPk(req.user.id);
        if (student.class_id === cls.id) return res.json({ ok: true, class: { id: cls.id, name: cls.name } });

        if (cls.teacher_id) {
            const teacher = await User.findByPk(cls.teacher_id);
            await limits.assertStudentSlots(teacher, 1);
        }
        await student.update({ class_id: cls.id });
        res.json({ ok: true, class: { id: cls.id, name: cls.name } });
    } catch (err) {
        const full = err.code === 'PLAN_LIMIT';
        res.status(err.status || 500).json({ error: full ? 'This class is full. Ask your teacher to upgrade the plan.' : err.message, code: err.code });
    }
});

router.post('/:id/regenerate-code', authenticateToken, async (req, res) => {
    try {
        const cls = await Class.findByPk(req.params.id);
        if (!cls) return res.status(404).json({ error: 'Class not found' });
        if (!canManage(req.user, cls)) return res.status(403).json({ error: 'Access denied' });
        await cls.update({ join_code: await newJoinCode() });
        res.json({ join_code: cls.join_code });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a class (Rename or Assign Teacher)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, teacher_id } = req.body;
        const cls = await Class.findByPk(req.params.id);

        if (!cls) {
            return res.status(404).json({ error: 'Class not found' });
        }
        if (!canManage(req.user, cls)) return res.status(403).json({ error: 'Access denied' });
        if (req.user.role === 'teacher') delete req.body.teacher_id; // teachers cannot reassign classes

        if (name !== undefined) {
            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Class name is required' });
            }
            const existingClass = await Class.findOne({
                where: { name: name.trim(), teacher_id: cls.teacher_id }
            });
            if (existingClass && existingClass.id !== parseInt(req.params.id)) {
                return res.status(409).json({ error: 'Class name already exists' });
            }
            cls.name = name.trim();
        }

        if (req.body.teacher_id !== undefined) {
            if (teacher_id !== null) {
                const teacher = await User.findByPk(teacher_id);
                if (!teacher || teacher.role !== 'teacher') {
                    return res.status(400).json({ error: 'Invalid teacher selected' });
                }
            }
            cls.teacher_id = teacher_id;
        }

        await cls.save();

        // Return updated class with teacher info
        const updated = await Class.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'Teacher',
                attributes: ['id', 'first_name', 'last_name', 'username'],
                required: false
            }]
        });

        res.json({
            id: updated.id,
            name: updated.name,
            teacher: updated.Teacher ? {
                id: updated.Teacher.id,
                name: `${updated.Teacher.first_name} ${updated.Teacher.last_name}`,
                username: updated.Teacher.username
            } : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a class
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const cls = await Class.findByPk(req.params.id);
        if (!cls) {
            return res.status(404).json({ error: 'Class not found' });
        }
        if (!canManage(req.user, cls)) return res.status(403).json({ error: 'Access denied' });

        // Unassign all students from this class
        await User.update(
            { class_id: null },
            { where: { class_id: req.params.id } }
        );

        await cls.destroy();
        res.json({ message: 'Class deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign multiple students to a class
router.post('/assign-students', authenticateToken, async (req, res) => {
    try {
        const { studentIds, classId } = req.body;
        console.log('Assigning students:', { studentIds, classId, user: req.user.id });

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'Student IDs array is required' });
        }

        // If classId is null, we're unassigning students
        if (classId !== null) {
            const cls = await Class.findByPk(classId);
            if (!cls) {
                return res.status(404).json({ error: 'Class not found' });
            }

            // Teacher check: only allowed to assign to their own class
            if (req.user.role === 'teacher' && cls.teacher_id !== req.user.id) {
                return res.status(403).json({ error: 'You can only assign students to your own classes.' });
            }
        } else {
            // Unassigning: check if user is admin or teacher (extra safety)
            if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        await User.update(
            { class_id: classId },
            {
                where: {
                    id: studentIds,
                    role: 'student'
                }
            }
        );

        res.json({ message: 'Students assigned successfully' });
    } catch (err) {
        console.error('Error in assign-students:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
