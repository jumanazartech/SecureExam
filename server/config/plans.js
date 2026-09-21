/**
 * Subscription plans. Everything a plan allows lives here so pricing, enforcement (server)
 * and the pricing page (client, via GET /api/billing/plans) can never disagree.
 *
 * Prices are in UZS. Change them here; nothing else needs editing.
 */
const PLANS = {
    free: {
        id: 'free',
        priceMonthly: 0,
        priceYearly: 0,
        limits: {
            maxStudents: 30,             // students across all of the teacher's classes
            maxClasses: 2,
            maxExams: 5,                 // total exams (drafts included)
            maxQuestionsPerExam: 30,
            aiQuestionsPerMonth: 30,     // AI-generated / extracted questions per calendar month
            aiQuestionsPerRequest: 10,
            maxUploadMb: 5,              // document size for AI import
            examTypes: ['chsb'],
        },
        features: {
            excelExport: false,
            attestation: false,          // teacher-attestation prep tests
            advancedResults: false,      // per-question analytics, section scores
            appeals: true,
            proctoring: 'basic',         // fullscreen + focus lock
        },
    },
    pro: {
        id: 'pro',
        priceMonthly: 59000,
        priceYearly: 590000,             // two months free
        limits: {
            maxStudents: 500,
            maxClasses: 30,
            maxExams: 1000,
            maxQuestionsPerExam: 200,
            aiQuestionsPerMonth: 1500,
            aiQuestionsPerRequest: 100,
            maxUploadMb: 25,
            examTypes: ['chsb', 'rasch_national_cert', 'dtm', 'attestation'],
        },
        features: {
            excelExport: true,
            attestation: true,
            advancedResults: true,
            appeals: true,
            proctoring: 'full',
        },
    },
};

const TRIAL_DAYS = 3;

// Effective plan of a user row: admins are unlimited; Pro lapses when pro_until has passed.
const getPlanId = (user) => {
    if (!user) return 'free';
    if (user.role === 'admin') return 'pro';
    if (user.plan === 'pro' && (!user.pro_until || new Date(user.pro_until) > new Date())) return 'pro';
    return 'free';
};

const getPlan = (user) => PLANS[getPlanId(user)];

module.exports = { PLANS, TRIAL_DAYS, getPlanId, getPlan };
