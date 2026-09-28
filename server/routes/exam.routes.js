const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Exam, Question, ExamAssignment, User, Class } = require('../models');
const { authenticateToken, requireAdmin, requireTeacherOrAdmin } = require('../middleware/auth');
const aiService = require('../services/ai.service');
const limits = require('../services/limits');
const { getPlan } = require('../config/plans');

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
        cb(null, 'exam-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'application/msword';

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image, PDF, and Word files are allowed!'));
        }
    }
});

// Get all exams (Admin sees all, Student sees exams published to their class)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const exams = await Exam.findAll({
                include: [{ model: Class, attributes: ['id', 'name'] }]
            });
            return res.json(exams);
        } else if (req.user.role === 'teacher') {
            // Teachers see exams they created OR exams published to their classes
            const myClasses = await Class.findAll({
                where: { teacher_id: req.user.id },
                attributes: ['id']
            });
            const classIds = myClasses.map(c => c.id);

            const { Op } = require('sequelize');
            const exams = await Exam.findAll({
                where: {
                    [Op.or]: [
                        { created_by: req.user.id },
                        { class_id: { [Op.in]: classIds } },
                        { exam_type: 'attestation', status: 'published' }
                    ]
                },
                include: [{ model: Class, attributes: ['id', 'name'] }]
            });
            const me = await User.findByPk(req.user.id);
            const canAttest = getPlan(me).features.attestation;
            return res.json(exams.map(e => {
                const j = e.toJSON();
                j.locked = e.exam_type === 'attestation' && e.created_by !== req.user.id && !canAttest;
                return j;
            }));
        } else {
            // Students see published exams for their class, plus every open-access practice exam
            const student = await User.findByPk(req.user.id);
            const { Op } = require('sequelize');
            const exams = await Exam.findAll({
                where: {
                    status: 'published',
                    [Op.or]: [
                        { open_access: true },
                        ...(student.class_id ? [{ class_id: student.class_id }] : [])
                    ]
                },
                include: [{ model: Class, attributes: ['id', 'name'] }]
            });
            return res.json(exams);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Exam by ID (Admin/Teacher) - For editing
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id, {
            include: [{ model: Question }]
        });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create or Save Draft Exam (Admin/Teacher)
router.post('/', authenticateToken, async (req, res) => {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const account = await User.findByPk(req.user.id);
        await limits.assertExamAllowed(account, req.body.exam_type);
        const examData = {
            ...req.body,
            created_by: req.user.id,
            status: 'draft' // Default to draft
        };
        const exam = await Exam.create(examData);
        console.log(`[Exam Route] Exam created: ${exam.id}`);
        res.json(exam);
    } catch (err) {
        console.error('[Exam Route] Create Exam Error:', err);
        res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
});

// Update Exam (Admin/Teacher)
router.put('/:id', authenticateToken, async (req, res) => {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        if (req.user.role === 'teacher' && exam.created_by !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own exams' });
        }
        delete req.body.exam_type; // locked after creation (also keeps plan checks meaningful)
        delete req.body.created_by;

        const wasReleased = exam.results_released;
        const isReleasing = req.body.results_released;

        await exam.update(req.body);

        // If results just got released, notify students
        if (!wasReleased && isReleasing) {
            const { Submission, Notification } = require('../models');
            const submissions = await Submission.findAll({
                where: { exam_id: exam.id, status: 'submitted' },
                attributes: ['student_id'],
                raw: true
            });

            const studentIds = [...new Set(submissions.map(s => s.student_id))];

            if (studentIds.length > 0) {
                const notifications = studentIds.map(studentId => ({
                    user_id: studentId,
                    message: {
                        en: `Results for exam "${exam.title}" are now available.`,
                        ru: `Результаты экзамена "${exam.title}" теперь доступны.`,
                        uz: `"${exam.title}" imtihoni natijalari e'lon qilindi.`
                    },
                    type: 'success',
                    link: '/student/results'
                }));

                await Notification.bulkCreate(notifications);
            }
        }

        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Publish Exam to Class with PIN (Admin/Teacher)
router.post('/:id/publish', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const { class_id, pin_code, active_start, active_end, open_access } = req.body;

        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        if ((await Question.count({ where: { exam_id: exam.id } })) === 0) {
            return res.status(400).json({ error: 'Add at least one question before publishing' });
        }

        // Attestation (teacher certification prep) exams are open to all teachers: no class or PIN needed.
        if (exam.exam_type === 'attestation') {
            await exam.update({
                status: 'published',
                is_active: true,
                results_released: true,
                active_start: active_start || null,
                active_end: active_end || null
            });
            return res.json({ message: 'Exam published successfully', exam });
        }

        // Open-access practice exam: no class/PIN gate, results show immediately (demo/growth exams).
        if (open_access) {
            await exam.update({
                status: 'published',
                open_access: true,
                class_id: null,
                pin_code: null,
                is_active: true,
                results_released: true,
                active_start: active_start || null,
                active_end: active_end || null
            });
            return res.json({ message: 'Exam published successfully', exam });
        }

        if (!class_id) {
            return res.status(400).json({ error: 'Class ID is required to publish' });
        }

        if (!pin_code || pin_code.trim().length === 0) {
            return res.status(400).json({ error: 'PIN code is required to publish' });
        }

        const cls = await Class.findByPk(class_id);
        if (!cls) return res.status(404).json({ error: 'Class not found' });

        await exam.update({
            status: 'published',
            class_id: class_id,
            pin_code: pin_code.trim(),
            is_active: true,
            active_start: active_start || null,
            active_end: active_end || null
        });

        res.json({ message: 'Exam published successfully', exam });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload image for question
router.post('/upload-image', authenticateToken, requireTeacherOrAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        res.json({ imagePath });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Exam Import (Admin/Teacher)
router.post('/ai-import', authenticateToken, requireTeacherOrAdmin, upload.single('document'), async (req, res) => {
    try {
        const { flowType, questionCount, difficultyLevel, questionTypes, section, examType } = req.body;
        console.log(`[Exam Route] AI Import started, mode: ${flowType}, count: ${questionCount}`);

        if (!req.file) {
            console.warn('[Exam Route] No file uploaded');
            return res.status(400).json({ error: 'No document uploaded' });
        }

        // Plan enforcement: file size, questions per request, monthly AI quota
        const account = await User.findByPk(req.user.id);
        const requested = flowType === 'generate' ? (parseInt(questionCount, 10) || 10) : 0;
        const remaining = await limits.assertAiAllowed(account, { requested, fileBytes: req.file.size });
        if (flowType === 'generate' && requested > remaining) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ code: 'PLAN_LIMIT', feature: 'ai_month', error: `Only ${remaining} AI questions left this month on your plan.` });
        }

        // Parse doc
        console.log(`[Exam Route] Parsing file: ${req.file.originalname}`);
        const text = await aiService.parseDocument(req.file.path);

        // Process with AI
        console.log(`[Exam Route] Calling AI service...`);
        const questions = await aiService.processWithAI(text, flowType, {
            questionCount,
            difficultyLevel,
            questionTypes,
            section,
            examType
        });

        // Delete temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const delivered = remaining === Infinity ? questions : questions.slice(0, remaining);
        await limits.logAiUsage(req.user.id, delivered.length);

        console.log(`[Exam Route] AI Import Success: ${delivered.length} questions`);
        res.json({ questions: delivered });
    } catch (err) {
        console.error('[Exam Route] AI Import Fatal Error:', err);
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(err.status || 500).json({ error: err.message || 'Failed to process document with AI', code: err.code });
    }
});

// Add/Sync Questions to Exam (Admin/Teacher)
router.post('/:id/questions', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const { questions } = req.body; // Array of questions
        const examId = req.params.id;

        const examRow = await Exam.findByPk(examId);
        if (!examRow) return res.status(404).json({ error: 'Exam not found' });
        if (req.user.role === 'teacher' && examRow.created_by !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own exams' });
        }
        limits.assertQuestionCount(await User.findByPk(req.user.id), questions.length);

        // 1. Identify valid IDs in the payload
        const incomingIds = questions.filter(q => q.id).map(q => q.id);

        // 2. Delete questions not in the incoming list (Removal logic)
        const { Op } = require('sequelize');
        await Question.destroy({
            where: {
                exam_id: examId,
                id: { [Op.notIn]: incomingIds }
            }
        });

        // 3. Upsert (Update or Create)
        const savedQuestions = [];
        for (const q of questions) {
            if (q.id) {
                // Update existing
                const existing = await Question.findOne({ where: { id: q.id, exam_id: examId } });
                if (existing) {
                    await existing.update(q);
                    savedQuestions.push(existing);
                } else {
                    // ID sent but not found? Should treat as new or error? 
                    // Let's treat as new to be safe, or just skip ID.
                    const { id, ...data } = q;
                    const created = await Question.create({ ...data, exam_id: examId });
                    savedQuestions.push(created);
                }
            } else {
                // Create new
                const created = await Question.create({ ...q, exam_id: examId });
                savedQuestions.push(created);
            }
        }

        // Return full list sorted by creation or just the saved list
        res.json(savedQuestions);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
});

// Assign Exam to Students (Admin) - Legacy, may not be needed with class-based system
router.post('/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { student_ids } = req.body; // Array of student IDs
        const exam_id = req.params.id;

        // Check if exam exists
        const exam = await Exam.findByPk(exam_id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Create assignments for each student
        const assignments = await ExamAssignment.bulkCreate(
            student_ids.map(student_id => ({ exam_id, student_id }))
        );

        res.json({ message: `Exam assigned to ${student_ids.length} students`, assignments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all students (for assignment)
router.get('/admin/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const students = await User.findAll({ where: { role: 'student' } });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get assigned students for an exam
router.get('/:id/assigned-students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const assignments = await ExamAssignment.findAll({
            where: { exam_id: req.params.id },
            include: [{ model: User, attributes: ['id', 'username'] }]
        });
        const students = assignments.map(a => a.User);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Exam (Admin/Teacher)
router.delete('/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Delete all questions associated with this exam
        await Question.destroy({ where: { exam_id: req.params.id } });

        // Delete all assignments
        await ExamAssignment.destroy({ where: { exam_id: req.params.id } });

        // Delete the exam
        await exam.destroy();

        res.json({ message: 'Exam deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Take Exam: Get Questions (Student)
router.get('/:id/take', authenticateToken, async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id, {
            include: [{
                model: Question,
                attributes: ['id', 'type', 'content', 'options', 'points', 'image_url', 'local_image_path', 'category', 'question_type', 'section', 'translations']
            }]
        });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Check if student is assigned to this exam (via class or direct assignment)
        if (req.user.role === 'student') {
            const { Submission } = require('../models');

            // Check for existing submission
            const existingSubmission = await Submission.findOne({
                where: {
                    exam_id: exam.id,
                    student_id: req.user.id,
                    status: 'submitted'
                }
            });

            if (existingSubmission) {
                return res.status(403).json({
                    message: 'You have already taken this exam.',
                    alreadyTaken: true
                });
            }

            const student = await User.findByPk(req.user.id);

            // Open-access practice exams: any signed-in student may take them, class or not.
            if (!exam.open_access) {
                // Check if exam is published to student's class
                if (exam.status === 'published' && exam.class_id) {
                    if (student.class_id !== exam.class_id) {
                        console.log(`[Take Exam] Class mismatch. Student Class: ${student.class_id}, Exam Class: ${exam.class_id}`);
                        return res.status(403).json({ message: 'You are not assigned to this exam' });
                    }
                } else {
                    // Fallback to old assignment system
                    const assignment = await ExamAssignment.findOne({
                        where: { exam_id: exam.id, student_id: req.user.id }
                    });
                    if (!assignment) return res.status(403).json({ message: 'You are not assigned to this exam' });
                }
            }
        }

        if (exam.exam_type === 'attestation' && req.user.role === 'teacher') {
            const me = await User.findByPk(req.user.id);
            if (!getPlan(me).features.attestation) {
                return res.status(403).json({ code: 'PLAN_LIMIT', feature: 'attestation', message: 'Attestation prep is available on the Pro plan' });
            }
        }

        if (!exam.is_active && req.user.role !== 'admin') return res.status(403).json({ message: 'Exam is not active' });

        // Check time constraints
        const now = new Date();
        if (req.user.role === 'student') {
            if (exam.active_start && now < new Date(exam.active_start)) {
                return res.status(403).json({
                    message: 'Exam is not yet started',
                    code: 'EXAM_NOT_STARTED',
                    startTime: exam.active_start
                });
            }
            if (exam.active_end && now > new Date(exam.active_end)) {
                return res.status(403).json({
                    message: 'Exam session has ended',
                    code: 'EXAM_ENDED',
                    endTime: exam.active_end
                });
            }
        }

        // Shuffling Logic
        let questions = JSON.parse(JSON.stringify(exam.Questions)); // Deep copy

        if (exam.shuffle_questions) {
            // SKIP shuffling if exam is "Rasch" or "Mock" model
            // Check exam_type field first, then fallback to title/description
            const examType = (exam.exam_type || '').toLowerCase();
            const title = (exam.title || '').toLowerCase();
            const desc = (exam.description || '').toLowerCase();

            const isRaschOrMock = examType.includes('rasch') ||
                examType.includes('mock') ||
                title.includes('rasch') ||
                title.includes('mock') ||
                desc.includes('rasch') ||
                desc.includes('mock');

            if (isRaschOrMock) {
                console.log(`[Take Exam] Shuffling SKIPPED for Rasch/Mock exam: ${exam.title}`);
            } else {
                questions = shuffleArray(questions);
            }
        }

        if (exam.shuffle_options) {
            questions = questions.map(q => {
                if (q.options && Array.isArray(q.options)) {
                    q.options = shuffleArray(q.options);
                }
                return q;
            });
        }

        const response = exam.toJSON();
        response.Questions = questions;

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

module.exports = router;
