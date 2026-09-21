const { Op } = require('sequelize');
const { User, Class, Exam, Question, UsageLog } = require('../models');
const { getPlan, getPlanId } = require('../config/plans');

class PlanLimitError extends Error {
    constructor(message, extra = {}) {
        super(message);
        this.status = 403;
        this.code = 'PLAN_LIMIT';
        Object.assign(this, extra);
    }
}

const monthStart = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
};

const aiUsedThisMonth = async (userId) =>
    (await UsageLog.sum('amount', { where: { user_id: userId, kind: 'ai_questions', createdAt: { [Op.gte]: monthStart() } } })) || 0;

const logAiUsage = (userId, amount) => UsageLog.create({ user_id: userId, kind: 'ai_questions', amount });

// Students that count against a teacher's cap: created by them or sitting in one of their classes.
const studentCountFor = async (teacherId) => {
    const classes = await Class.findAll({ where: { teacher_id: teacherId }, attributes: ['id'], raw: true });
    const classIds = classes.map(c => c.id);
    return User.count({
        where: {
            role: 'student',
            [Op.or]: [{ created_by: teacherId }, ...(classIds.length ? [{ class_id: { [Op.in]: classIds } }] : [])]
        }
    });
};

// Snapshot shown in the teacher panel (usage vs. limits)
const usageSnapshot = async (user) => {
    const plan = getPlan(user);
    const [students, classes, exams, ai] = await Promise.all([
        studentCountFor(user.id),
        Class.count({ where: { teacher_id: user.id } }),
        Exam.count({ where: { created_by: user.id } }),
        aiUsedThisMonth(user.id)
    ]);
    return {
        plan: plan.id,
        limits: plan.limits,
        features: plan.features,
        used: { students, classes, exams, aiQuestions: ai }
    };
};

// Each assert* throws PlanLimitError; admins are never limited (getPlan returns Pro for them).
const assertExamAllowed = async (user, examType) => {
    const plan = getPlan(user);
    if (!plan.limits.examTypes.includes(examType || 'chsb')) {
        throw new PlanLimitError(`The "${examType}" exam type is available on the Pro plan`, { feature: 'exam_type' });
    }
    if (user.role !== 'admin' && (await Exam.count({ where: { created_by: user.id } })) >= plan.limits.maxExams) {
        throw new PlanLimitError(`Free plan allows ${plan.limits.maxExams} exams. Upgrade to Pro for more.`, { feature: 'exams' });
    }
};

const assertQuestionCount = (user, count) => {
    const plan = getPlan(user);
    if (count > plan.limits.maxQuestionsPerExam) {
        throw new PlanLimitError(`Your plan allows up to ${plan.limits.maxQuestionsPerExam} questions per exam.`, { feature: 'questions' });
    }
};

const assertClassAllowed = async (user) => {
    const plan = getPlan(user);
    if (user.role !== 'admin' && (await Class.count({ where: { teacher_id: user.id } })) >= plan.limits.maxClasses) {
        throw new PlanLimitError(`Your plan allows ${plan.limits.maxClasses} classes.`, { feature: 'classes' });
    }
};

// adding: number of students about to be added
const assertStudentSlots = async (teacher, adding = 1) => {
    const plan = getPlan(teacher);
    if (teacher.role === 'admin') return;
    const current = await studentCountFor(teacher.id);
    if (current + adding > plan.limits.maxStudents) {
        throw new PlanLimitError(
            `Student limit reached (${current}/${plan.limits.maxStudents}). Upgrade to Pro to add more.`,
            { feature: 'students' }
        );
    }
};

const assertAiAllowed = async (user, { requested, fileBytes }) => {
    const plan = getPlan(user);
    if (fileBytes > plan.limits.maxUploadMb * 1024 * 1024) {
        throw new PlanLimitError(`File too large. Your plan allows ${plan.limits.maxUploadMb} MB.`, { feature: 'upload' });
    }
    if (requested > plan.limits.aiQuestionsPerRequest) {
        throw new PlanLimitError(`Your plan allows up to ${plan.limits.aiQuestionsPerRequest} AI questions per request.`, { feature: 'ai_request' });
    }
    if (user.role !== 'admin') {
        const used = await aiUsedThisMonth(user.id);
        if (used >= plan.limits.aiQuestionsPerMonth) {
            throw new PlanLimitError(`Monthly AI limit reached (${plan.limits.aiQuestionsPerMonth}). Upgrade to Pro for more.`, { feature: 'ai_month' });
        }
        return plan.limits.aiQuestionsPerMonth - used; // remaining
    }
    return Infinity;
};

module.exports = {
    PlanLimitError, usageSnapshot, studentCountFor, aiUsedThisMonth, logAiUsage,
    assertExamAllowed, assertQuestionCount, assertClassAllowed, assertStudentSlots, assertAiAllowed, getPlanId
};
