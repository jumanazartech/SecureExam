const express = require('express');
const router = express.Router();
const { Appeal, User, Class, Question, Exam, Notification } = require('../models');
const { authenticateToken, requireAdmin, requireTeacherOrAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'appeal-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Create Appeal (Student)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { subject, title, message, question_id, exam_id } = req.body;
        if (!subject || !title || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const appeal = await Appeal.create({
            subject,
            title,
            message,
            student_id: req.user.id,
            question_id: question_id || null,
            exam_id: exam_id || null,
            status: 'pending'
        });

        // Notify the student's teacher (if assigned) and every admin, so a new appeal is never missed.
        const student = await User.findByPk(req.user.id);
        const recipients = [];
        if (student?.class_id) {
            const cls = await Class.findByPk(student.class_id);
            if (cls?.teacher_id) recipients.push({ user_id: cls.teacher_id, link: '/teacher/applications' });
        }
        const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
        admins.forEach(a => recipients.push({ user_id: a.id, link: '/admin/applications' }));

        const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || student?.username || 'Student';
        await Notification.bulkCreate(recipients.map(r => ({
            user_id: r.user_id,
            link: r.link,
            type: 'info',
            is_read: false,
            message: {
                en: `New application from ${studentName}: "${title}"`,
                ru: `Новая заявка от ${studentName}: "${title}"`,
                uz: `${studentName} dan yangi ariza: "${title}"`
            }
        })));

        res.status(201).json(appeal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get My Appeals (Student)
router.get('/my-appeals', authenticateToken, async (req, res) => {
    try {
        const appeals = await Appeal.findAll({
            where: { student_id: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(appeals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Appeals for Teacher (Matches Subject)
router.get('/teacher', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });

    try {
        const { Class, User } = require('../models');

        // 1. Find all classes where this user is the teacher
        const myClasses = await Class.findAll({
            where: { teacher_id: req.user.id },
            attributes: ['id']
        });
        const classIds = myClasses.map(c => c.id);

        // 2. Find appeals from students belonging to these classes
        const appeals = await Appeal.findAll({
            include: [
                {
                    model: User,
                    as: 'Student',
                    attributes: ['first_name', 'last_name', 'username', 'id', 'class_id'],
                    include: [{ model: Class, attributes: ['name'] }],
                    where: {
                        class_id: { [Op.in]: classIds }
                    }
                },
                { model: Question },
                { model: Exam, attributes: ['id', 'title'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(appeals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Response Image (Teacher)
router.post('/upload-response-image', authenticateToken, requireTeacherOrAdmin, upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
        const imagePath = `/uploads/${req.file.filename}`;
        res.json({ imagePath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Resolve Appeal (Teacher)
router.put('/:id/resolve', authenticateToken, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });

    try {
        const { status, response, response_image } = req.body;
        const appeal = await Appeal.findByPk(req.params.id);

        if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

        appeal.status = status;
        appeal.response = response;
        appeal.response_image = response_image;
        appeal.teacher_id = req.user.id;
        await appeal.save();

        // Create notification for student
        const { Notification } = require('../models');
        await Notification.create({
            user_id: appeal.student_id,
            message: {
                en: `Your application "${appeal.title}" has been ${status}.`,
                ru: `Ваша заявка "${appeal.title}" была ${status === 'resolved' ? 'одобрена' : 'отклонена'}.`,
                uz: `Sizning "${appeal.title}" arizangiz ${status === 'resolved' ? 'hal qilindi' : 'rad etildi'}.`
            },
            is_read: false
        });

        res.json(appeal);
    } catch (err) {
        console.error('Appeal resolve error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get All Appeals (Admin)
router.get('/admin/appeals', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const appeals = await Appeal.findAll({
            include: [
                {
                    model: User,
                    as: 'Student',
                    attributes: ['first_name', 'last_name', 'username'],
                    include: [
                        {
                            model: Class,
                            attributes: ['name'],
                            include: [
                                {
                                    model: User,
                                    as: 'Teacher',
                                    attributes: ['first_name', 'last_name']
                                }
                            ]
                        }
                    ]
                },
                { model: Question },
                { model: Exam, attributes: ['id', 'title'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(appeals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
