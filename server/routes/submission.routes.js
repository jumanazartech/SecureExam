const express = require('express');
const router = express.Router();
const { Submission, Answer, ViolationLog, Question, Exam, User, Class } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Start Submission (on exam start)
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const { exam_id } = req.body;
        const submission = await Submission.create({
            student_id: req.user.id,
            exam_id,
            start_time: new Date(),
            status: 'in_progress'
        });
        res.json(submission);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Log Violation
router.post('/log-violation', authenticateToken, async (req, res) => {
    try {
        const { submission_id, event_type } = req.body;
        await ViolationLog.create({
            submission_id,
            event_type,
            timestamp: new Date()
        });
        // Check if we need to auto-fail or just flag? For now, just log.
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Qualification category thresholds (percent) for teacher attestation
const getAttestationCategory = (percent) => {
    if (percent >= 86) return 'highest';
    if (percent >= 71) return 'first';
    if (percent >= 56) return 'second';
    return 'specialist';
};

// Submit Exam
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        const { submission_id, answers } = req.body; // answers: [{ question_id, student_answer, student_answer_2 }]
        const submission = await Submission.findByPk(submission_id, {
            include: [{ model: Exam }]
        });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const exam = submission.Exam;
        const examType = exam.exam_type || 'chsb'; // Default to CHSB for backward compatibility
        // DTM uses per-question points (1.1 / 3.1 / 2.1), so it is scored like CHSB.
        const isPointsBased = ['chsb', 'dtm', 'attestation'].includes(examType);
        const isAttestation = examType === 'attestation';
        const sectionStats = {}; // attestation: per-section correct/total

        let totalScore = 0;
        const answerRecords = [];
        const responses = []; // For Rasch scoring

        // Process each answer
        for (const ans of answers) {
            const question = await Question.findByPk(ans.question_id);

            if (!question) {
                console.warn(`Question ${ans.question_id} not found for submission ${submission_id}`);
                continue;
            }

            if (isPointsBased) {
                // CHSB/DTM Scoring: Simple percentage-based (NO CHANGES)
                const isCorrect = question.correct_answer === ans.student_answer;
                if (isCorrect) totalScore += parseFloat(question.points || 0);

                if (isAttestation) {
                    const key = question.section || 'subject';
                    sectionStats[key] = sectionStats[key] || { correct: 0, total: 0 };
                    sectionStats[key].total += 1;
                    if (isCorrect) sectionStats[key].correct += 1;
                }

                answerRecords.push({
                    submission_id,
                    question_id: ans.question_id,
                    student_answer: ans.student_answer,
                    is_correct: isCorrect
                });
            } else if (examType === 'rasch_national_cert') {
                // Rasch Scoring: Handle different question types
                const questionType = question.question_type;
                let isCorrect = false;
                let isCorrect2 = null;
                let partialCredit = 0.0;

                if (questionType === 'type3_open_dual') {
                    // Type 3: Dual-answer questions
                    const { checkAnswerVariant } = require('../utils/rasch-scorer');

                    // Check first answer
                    isCorrect = question.correct_answer === ans.student_answer ||
                        checkAnswerVariant(ans.student_answer, question.answer_variants || []);

                    // Check second answer
                    isCorrect2 = question.correct_answer_2 === ans.student_answer_2 ||
                        checkAnswerVariant(ans.student_answer_2, question.answer_variants || []);

                    // Calculate partial credit
                    const { calculatePartialCredit } = require('../utils/rasch-scorer');
                    partialCredit = calculatePartialCredit(isCorrect, isCorrect2);

                    answerRecords.push({
                        submission_id,
                        question_id: ans.question_id,
                        student_answer: ans.student_answer,
                        student_answer_2: ans.student_answer_2,
                        is_correct: isCorrect,
                        is_correct_2: isCorrect2,
                        partial_credit: partialCredit
                    });

                    // For Rasch calculation, treat partial credit as weighted correctness
                    responses.push({
                        isCorrect: partialCredit >= 0.5, // Consider correct if at least 0.5 credit
                        difficulty: parseFloat(question.difficulty_param || 0)
                    });
                } else {
                    // Type 1 (A-D) and Type 2 (A-F): Standard multiple choice
                    isCorrect = question.correct_answer === ans.student_answer;

                    answerRecords.push({
                        submission_id,
                        question_id: ans.question_id,
                        student_answer: ans.student_answer,
                        is_correct: isCorrect
                    });

                    responses.push({
                        isCorrect,
                        difficulty: parseFloat(question.difficulty_param || 0)
                    });
                }

                // Update calibration data
                const { RaschCalibration } = require('../models');
                const calibration = await RaschCalibration.findOne({ where: { question_id: question.id } });

                if (calibration) {
                    calibration.response_count += 1;
                    if (isCorrect || (isCorrect2 !== null && (isCorrect || isCorrect2))) {
                        calibration.correct_count += 1;
                    }

                    // Recalibrate difficulty
                    const { updateDifficultyParameter } = require('../utils/rasch-scorer');
                    calibration.estimated_difficulty = updateDifficultyParameter(
                        calibration.correct_count,
                        calibration.response_count
                    );
                    calibration.last_calibrated = new Date();
                    await calibration.save();
                } else {
                    // Create new calibration record
                    await RaschCalibration.create({
                        question_id: question.id,
                        response_count: 1,
                        correct_count: isCorrect ? 1 : 0,
                        estimated_difficulty: 0.0,
                        last_calibrated: new Date()
                    });
                }
            }
        }

        await Answer.bulkCreate(answerRecords);

        if (isPointsBased) {
            // CHSB/DTM: Use summed points
            submission.score = totalScore;
            if (isAttestation) {
                const sectionScores = {};
                for (const [key, v] of Object.entries(sectionStats)) {
                    sectionScores[key] = { ...v, percent: Math.round((v.correct / v.total) * 1000) / 10 };
                }
                // Qualification category is derived from the overall percentage of correct answers
                submission.section_scores = sectionScores;
                const all = Object.values(sectionStats);
                const answered = all.reduce((a, v) => a + v.total, 0);
                const correct = all.reduce((a, v) => a + v.correct, 0);
                submission.certificate_level = getAttestationCategory(answered ? (correct / answered) * 100 : 0);
            }
            submission.end_time = new Date();
            submission.status = 'submitted';
            await submission.save();

            // Create notification
            const { Notification } = require('../models');
            await Notification.create({
                user_id: req.user.id,
                message: {
                    en: `Exam "${exam.title}" submitted successfully. Results will be available pending teacher review.`,
                    ru: `Экзамен "${exam.title}" успешно сдан. Результаты будут доступны после проверки учителем.`,
                    uz: `"${exam.title}" imtihoni muvaffaqiyatli topshirildi. Natijalar o'qituvchi tekshiruvidan so'ng e'lon qilinadi.`
                },
                is_read: false
            });

            res.json({ message: 'Exam submitted', score: totalScore, examType, category: submission.certificate_level, sectionScores: submission.section_scores });
        } else if (examType === 'rasch_national_cert') {
            // Rasch: Calculate ability and standardized score
            const { estimateAbility, convertToStandardScore, getCertificateLevel } = require('../utils/rasch-scorer');

            const theta = estimateAbility(responses);
            const raschScore = convertToStandardScore(theta);
            const certificateLevel = getCertificateLevel(raschScore);

            submission.rasch_theta = theta;
            submission.rasch_score = raschScore;
            submission.certificate_level = certificateLevel;
            submission.end_time = new Date();
            submission.status = 'submitted';
            await submission.save();

            // Create notification
            const { Notification } = require('../models');
            await Notification.create({
                user_id: req.user.id,
                message: {
                    en: `Rasch Exam "${exam.title}" submitted. Level: ${certificateLevel}`,
                    ru: `Rasch экзамен "${exam.title}" сдан. Уровень: ${certificateLevel}`,
                    uz: `"${exam.title}" Rasch imtihoni topshirildi. Daraja: ${certificateLevel}`
                },
                is_read: false
            });

            res.json({
                message: 'Exam submitted',
                examType: 'rasch_national_cert',
                theta,
                raschScore,
                certificateLevel
            });
        }
    } catch (err) {
        console.error('Submission error:', err);
        res.status(500).json({ error: err.message });
    }
});



// Get Student's Own Results
router.get('/my-results', authenticateToken, async (req, res) => {
    try {
        const submissions = await Submission.findAll({
            where: { student_id: req.user.id, status: 'submitted' },
            include: [{ model: Exam, attributes: ['title', 'duration_minutes', 'exam_type', 'subject', 'results_released'] }]
        });

        // Filter out scores if not released
        const formatted = submissions.map(s => {
            const data = s.toJSON();
            if (!s.Exam?.results_released && s.Exam?.exam_type !== 'attestation') {
                data.score = null;
                data.rasch_score = null;
                data.rasch_theta = null;
                data.certificate_level = null;
                data.results_pending = true;
            }
            return data;
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Detailed Submission Result (Student can view their own, Admin can view any)
router.get('/result/:submission_id', authenticateToken, async (req, res) => {
    try {
        const submission = await Submission.findByPk(req.params.submission_id, {
            include: [
                {
                    model: Exam,
                    include: [{ model: Question }]
                },
                {
                    model: User,
                    attributes: ['id', 'username', 'first_name', 'last_name']
                },
                {
                    model: Answer,
                    include: [{ model: Question }]
                }
            ]
        });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Check permissions: Student can only view their own, Admin/Teacher can view any
        if (req.user.role === 'student' && submission.student_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const data = submission.toJSON();
        if (req.user.role === 'student' && !submission.Exam?.results_released) {
            data.score = null;
            data.rasch_score = null;
            data.rasch_theta = null;
            data.certificate_level = null;
            data.Answers = []; // Hide answers if not released
            data.results_pending = true;
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get All Results for an Exam
router.get('/exam/:exam_id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const submissions = await Submission.findAll({
            where: { exam_id: req.params.exam_id, status: 'submitted' },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'first_name', 'last_name']
                },
                {
                    model: Exam,
                    attributes: ['id', 'title', 'exam_type', 'subject']
                },
                {
                    model: Answer,
                    include: [{ model: Question }]
                }
            ]
        });
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify PIN (Admin Unlock)
router.post('/verify-pin', authenticateToken, async (req, res) => {
    const { pin } = req.body;
    // Simple PIN check - in production use DB or hashed PIN
    if (pin === process.env.ADMIN_PIN) {
        res.json({ valid: true });
    } else {
        res.status(403).json({ valid: false });
    }
});

// Teacher: Get results for students in their classes
router.get('/teacher/my-results', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // 1. Get classes taught by this teacher
        const myClasses = await Class.findAll({
            where: { teacher_id: req.user.id },
            attributes: ['id', 'name']
        });

        const classIds = myClasses.map(c => c.id);

        // 2. Get students in these classes
        const students = await User.findAll({
            where: { class_id: classIds, role: 'student' },
            attributes: ['id', 'first_name', 'last_name', 'username', 'class_id']
        });

        const studentIds = students.map(s => s.id);

        // 3. Get submissions for these students
        const submissions = await Submission.findAll({
            where: { student_id: studentIds, status: 'submitted' },
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'first_name', 'last_name', 'class_id']
                },
                {
                    model: Exam,
                    attributes: ['id', 'title', 'exam_type', 'subject']
                }
            ],
            order: [['end_time', 'DESC']]
        });

        // 4. Format the response
        const formatted = submissions.map(s => ({
            id: s.id,
            score: s.score,
            rasch_score: s.rasch_score,
            certificate_level: s.certificate_level,
            end_time: s.end_time,
            student: {
                id: s.User.id,
                first_name: s.User.first_name,
                last_name: s.User.last_name,
                username: s.User.username,
                class_name: myClasses.find(c => c.id === s.User.class_id)?.name || 'N/A',
                class_id: s.User.class_id
            },
            exam: {
                id: s.Exam.id,
                title: s.Exam.title,
                exam_type: s.Exam.exam_type,
                subject: s.Exam.subject,
                results_released: s.Exam.results_released
            }
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Error in /teacher/my-results:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
