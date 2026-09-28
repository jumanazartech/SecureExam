const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    plain_password: { type: DataTypes.STRING, allowNull: true }, // For admin visibility
    role: { type: DataTypes.ENUM('admin', 'student', 'teacher'), allowNull: false, defaultValue: 'student' },
    first_name: { type: DataTypes.STRING, allowNull: true },
    last_name: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    class_id: { type: DataTypes.INTEGER, allowNull: true },
    subject: { type: DataTypes.STRING, allowNull: true }, // For teachers
    last_session_id: { type: DataTypes.STRING, allowNull: true },
    last_active_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    // --- Accounts & billing ---
    phone: { type: DataTypes.STRING, allowNull: true, unique: true },          // E.164, e.g. +998901234567
    phone_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    auth_provider: { type: DataTypes.STRING, defaultValue: 'local' },          // local | google | github
    provider_id: { type: DataTypes.STRING, allowNull: true },
    plan: { type: DataTypes.ENUM('free', 'pro'), defaultValue: 'free' },
    pro_until: { type: DataTypes.DATE, allowNull: true },                      // NULL + plan=pro => no expiry
    trial_used: { type: DataTypes.BOOLEAN, defaultValue: false },
    teacher_status: { type: DataTypes.ENUM('none', 'pending', 'verified', 'rejected'), defaultValue: 'none' },
    self_registered: { type: DataTypes.BOOLEAN, defaultValue: false },
    // --- Growth features ---
    hide_from_leaderboard: { type: DataTypes.BOOLEAN, defaultValue: false },       // student opt-out
    streak_count: { type: DataTypes.INTEGER, defaultValue: 0 },                    // consecutive days of daily practice
    streak_best: { type: DataTypes.INTEGER, defaultValue: 0 },
    streak_last_date: { type: DataTypes.DATEONLY, allowNull: true },
    brand_name: { type: DataTypes.STRING, allowNull: true },                       // teacher/center: shown to their own students
    parent_telegram_chat_id: { type: DataTypes.STRING, allowNull: true },          // set once a parent links via the bot
    parent_link_code: { type: DataTypes.STRING, allowNull: true, unique: true }    // shown to student/parent to link Telegram
});

// One-time codes sent by SMS (registration, password reset, phone change)
const Otp = sequelize.define('Otp', {
    phone: { type: DataTypes.STRING, allowNull: false },
    purpose: { type: DataTypes.STRING, allowNull: false },                     // register | reset | link
    code_hash: { type: DataTypes.STRING, allowNull: false },
    payload: { type: DataTypes.JSONB, allowNull: true },                       // pending registration data
    attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    consumed: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// A teacher proves they are a real teacher; approval starts the Pro trial.
const TeacherVerification = sequelize.define('TeacherVerification', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    workplace: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: true },
    document_path: { type: DataTypes.TEXT, allowNull: true },                  // photo/PDF of ID, certificate or letter
    note: { type: DataTypes.TEXT, allowNull: true },                           // reviewer note / rejection reason
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    reviewed_by: { type: DataTypes.INTEGER, allowNull: true }
});

// Monthly usage counters (AI questions generated, ...)
const UsageLog = sequelize.define('UsageLog', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    kind: { type: DataTypes.STRING, allowNull: false },                        // ai_questions
    amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
});

const Notification = sequelize.define('Notification', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.JSONB, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    type: { type: DataTypes.ENUM('info', 'success', 'warning', 'error'), defaultValue: 'info' },
    link: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Class = sequelize.define('Class', {
    name: { type: DataTypes.STRING, allowNull: false },   // unique per teacher (checked in routes), not globally
    teacher_id: { type: DataTypes.INTEGER, allowNull: true }, // Assigned teacher
    join_code: { type: DataTypes.STRING, allowNull: true, unique: true } // students self-join with this
});

const Exam = sequelize.define('Exam', {
    title: { type: DataTypes.STRING, allowNull: false },
    duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
    instructions: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
    active_start: { type: DataTypes.DATE, allowNull: true },
    active_end: { type: DataTypes.DATE, allowNull: true },
    shuffle_questions: { type: DataTypes.BOOLEAN, defaultValue: true },
    shuffle_options: { type: DataTypes.BOOLEAN, defaultValue: true },
    security_strictness: { type: DataTypes.ENUM('high', 'medium'), defaultValue: 'high' },
    pin_code: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'published'), defaultValue: 'draft' },
    class_id: { type: DataTypes.INTEGER, allowNull: true },
    // New fields for Rasch Model support
    exam_type: {
        type: DataTypes.ENUM('chsb', 'rasch_national_cert', 'dtm', 'attestation'),
        allowNull: false,
        defaultValue: 'chsb' // Default to CHSB for backward compatibility
    },
    subject: { type: DataTypes.STRING, allowNull: true }, // e.g., "Mathematics"
    total_questions: { type: DataTypes.INTEGER, allowNull: true },
    translations: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
            title: { uz: '', ru: '', en: '' },
            instructions: { uz: '', ru: '', en: '' },
            description: { uz: '', ru: '', en: '' }
        }
    },
    results_released: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // Default to false so results are hidden until released
    },
    // Open-access practice exam: any signed-in student can take it, regardless of class.
    open_access: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Question = sequelize.define('Question', {
    type: { type: DataTypes.ENUM('mcq', 'true_false'), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    local_image_path: { type: DataTypes.TEXT, allowNull: true },
    options: { type: DataTypes.JSONB, allowNull: false }, // Store options as JSON array
    correct_answer: { type: DataTypes.STRING, allowNull: false },
    points: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    category: { type: DataTypes.ENUM('B', 'Q', 'M'), defaultValue: 'B' },
    // Attestation exams: subject | pedagogy | standards | ict (NULL for other exam types)
    section: { type: DataTypes.STRING, allowNull: true },
    // Short topic label (e.g. "Kvadrat tenglamalar") used for weakness analytics and the practice bank
    topic: { type: DataTypes.STRING, allowNull: true },
    exam_id: { type: DataTypes.INTEGER, allowNull: false },
    // Rasch Model specific fields (NULL for CHSB exams)
    question_type: {
        type: DataTypes.ENUM('type1_mcq_4', 'type2_mcq_6', 'type3_open_dual'),
        allowNull: true // NULL for CHSB exams
    },
    difficulty_param: {
        type: DataTypes.DECIMAL(10, 4),
        defaultValue: 0.0, // Initial difficulty parameter (b) for Rasch
        allowNull: true
    },
    correct_answer_2: {
        type: DataTypes.STRING,
        allowNull: true // For Type 3 dual-answer questions
    },
    answer_variants: {
        type: DataTypes.JSONB,
        allowNull: true // Acceptable answer variations for Type 3
    },
    translations: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
            content: { uz: '', ru: '', en: '' },
            options: { uz: [], ru: [], en: [] },
            correct_answer: { uz: '', ru: '', en: '' },
            correct_answer_2: { uz: '', ru: '', en: '' }
        }
    }
});

const Submission = sequelize.define('Submission', {
    score: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // CHSB percentage score
    start_time: { type: DataTypes.DATE },
    end_time: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('in_progress', 'submitted'), defaultValue: 'in_progress' },
    // Rasch Model specific fields (NULL for CHSB exams)
    rasch_theta: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true // Student ability estimate (θ)
    },
    rasch_score: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Standardized 0-100 Rasch score
    },
    certificate_level: {
        type: DataTypes.STRING,
        allowNull: true // A+, A, B+, B, C+, C, or Fail (attestation: highest/first/second/specialist)
    },
    section_scores: {
        type: DataTypes.JSONB,
        allowNull: true // Attestation: { subject: {correct, total, percent}, ... }
    },
    topic_scores: {
        type: DataTypes.JSONB,
        allowNull: true // Weakness analytics: { "Kvadrat tenglamalar": {correct, total, percent}, ... }
    },
    share_token: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true // Public shareable result card (/r/:token) — set once results are released
    }
});

const Appeal = sequelize.define('Appeal', {
    status: { type: DataTypes.ENUM('pending', 'resolved', 'rejected'), defaultValue: 'pending' },
    subject: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    response: { type: DataTypes.TEXT }, // Teacher's response
    response_image: { type: DataTypes.STRING }, // Path to drawing/image from teacher
    teacher_id: { type: DataTypes.INTEGER, allowNull: true }, // ID of teacher who resolved it
    // Updated for explicit sync
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const ViolationLog = sequelize.define('ViolationLog', {
    event_type: { type: DataTypes.STRING, allowNull: false }, // 'focus_lost', 'fullscreen_exit'
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Answer = sequelize.define('Answer', {
    student_answer: { type: DataTypes.STRING },
    is_correct: { type: DataTypes.BOOLEAN },
    // Rasch Type 3 dual-answer fields (NULL for CHSB and Type 1/2 questions)
    student_answer_2: {
        type: DataTypes.STRING,
        allowNull: true // Second answer for Type 3 questions
    },
    is_correct_2: {
        type: DataTypes.BOOLEAN,
        allowNull: true // Correctness of second answer
    },
    partial_credit: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.0, // 0.0, 0.5, or 1.0 for Type 3 questions
        allowNull: true
    }
});

const ExamAssignment = sequelize.define('ExamAssignment', {
    assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Rasch Calibration: Tracks question difficulty calibration data
const RaschCalibration = sequelize.define('RaschCalibration', {
    question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true // One calibration record per question
    },
    response_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // Total number of responses
    },
    correct_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // Number of correct responses
    },
    estimated_difficulty: {
        type: DataTypes.DECIMAL(10, 4),
        defaultValue: 0.0 // Calibrated difficulty parameter (b)
    },
    last_calibrated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

// Associations
User.belongsTo(User, { as: 'Creator', foreignKey: 'created_by' });
User.hasMany(User, { as: 'CreatedUsers', foreignKey: 'created_by' });

User.hasMany(Exam, { as: 'CreatedExams', foreignKey: 'created_by' });
Exam.hasMany(Question, { foreignKey: 'exam_id', onDelete: 'CASCADE' });
Question.belongsTo(Exam, { foreignKey: 'exam_id' });

User.hasMany(Submission, { foreignKey: 'student_id' });
Submission.belongsTo(User, { foreignKey: 'student_id' });
Submission.belongsTo(Exam, { foreignKey: 'exam_id' });
Exam.hasMany(Submission, { foreignKey: 'exam_id' });

Submission.hasMany(ViolationLog, { foreignKey: 'submission_id' });
ViolationLog.belongsTo(Submission, { foreignKey: 'submission_id' });

Submission.hasMany(Answer, { foreignKey: 'submission_id' });
Answer.belongsTo(Submission, { foreignKey: 'submission_id' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

// ExamAssignment: Links Students to Exams
Exam.hasMany(ExamAssignment, { foreignKey: 'exam_id', onDelete: 'CASCADE' });
ExamAssignment.belongsTo(Exam, { foreignKey: 'exam_id' });
User.hasMany(ExamAssignment, { foreignKey: 'student_id' });
ExamAssignment.belongsTo(User, { foreignKey: 'student_id' });

// Class Associations
Class.hasMany(User, { foreignKey: 'class_id' });
User.belongsTo(Class, { foreignKey: 'class_id' });

Class.belongsTo(User, { as: 'Teacher', foreignKey: 'teacher_id' }); // Link class to teacher
User.hasMany(Class, { as: 'TeachingClasses', foreignKey: 'teacher_id' });

Class.hasMany(Exam, { foreignKey: 'class_id' });
Exam.belongsTo(Class, { foreignKey: 'class_id' });

// Appeal Associations
Appeal.belongsTo(User, { as: 'Student', foreignKey: 'student_id' });
User.hasMany(Appeal, { foreignKey: 'student_id' });
Appeal.belongsTo(Question, { foreignKey: 'question_id' });
Question.hasMany(Appeal, { foreignKey: 'question_id' });
Appeal.belongsTo(Exam, { foreignKey: 'exam_id' });
Exam.hasMany(Appeal, { foreignKey: 'exam_id' });

// Rasch Calibration Associations
RaschCalibration.belongsTo(Question, { foreignKey: 'question_id' });
Question.hasOne(RaschCalibration, { foreignKey: 'question_id' });

User.hasMany(TeacherVerification, { foreignKey: 'user_id' });
TeacherVerification.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { Otp, TeacherVerification, UsageLog, sequelize, Sequelize, User, Exam, Question, Submission, ViolationLog, Answer, ExamAssignment, Class, Appeal, RaschCalibration, Notification };
