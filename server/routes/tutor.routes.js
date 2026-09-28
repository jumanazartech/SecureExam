const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Submission } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/ai.service');
const { User } = require('../models');

const LANG_NAME = { uz: 'Uzbek', ru: 'Russian', en: 'English' };
const MAX_TURNS = 8; // keep prompts small and cheap

// Builds a short "you struggle with X, Y, Z" context from the student's real results, so the
// tutor's advice is grounded in their own weak spots instead of generic tutoring chatter.
const buildWeakTopicsContext = async (studentId) => {
    const submissions = await Submission.findAll({
        where: { student_id: studentId, status: 'submitted', topic_scores: { [Op.ne]: null } },
        attributes: ['topic_scores']
    });
    const agg = {};
    for (const s of submissions) {
        for (const [topic, v] of Object.entries(s.topic_scores || {})) {
            agg[topic] = agg[topic] || { correct: 0, total: 0 };
            agg[topic].correct += v.correct;
            agg[topic].total += v.total;
        }
    }
    const weak = Object.entries(agg)
        .map(([topic, v]) => ({ topic, percent: Math.round((v.correct / v.total) * 100) }))
        .filter(t => t.percent < 70)
        .sort((a, b) => a.percent - b.percent)
        .slice(0, 5);
    return weak;
};

router.post('/chat', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student') return res.status(403).json({ error: 'The AI tutor is for students' });

        const { message, history, language } = req.body;
        if (!message || !String(message).trim()) return res.status(400).json({ error: 'Message is required' });

        const weak = await buildWeakTopicsContext(req.user.id);
        const lang = LANG_NAME[language] || 'Uzbek';

        const system = `You are a friendly, encouraging AI tutor for a high-school student in Uzbekistan preparing for DTM/CHSB/attestation-style exams. ` +
            `Reply in ${lang}. Keep answers short (max ~120 words), clear, step-by-step for math/science, and end with one short encouraging line. ` +
            `Use $LaTeX$ for formulas. Never claim to be human.` +
            (weak.length ? `\nThe student's real weakest topics (from their own exam results) are: ${weak.map(w => `${w.topic} (${w.percent}%)`).join(', ')}. ` +
                `If they ask for help with their weak topics, or the message is vague, proactively address these.` : '');

        const turns = (Array.isArray(history) ? history : []).slice(-MAX_TURNS)
            .map(h => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`).join('\n');

        const prompt = `${system}\n\n${turns ? turns + '\n' : ''}Student: ${message}\nTutor:`;

        const reply = await aiService.chat(prompt, system);
        res.json({ reply: reply.trim(), weakTopics: weak });
    } catch (err) {
        console.error('[tutor]', err.message);
        res.status(err.status || 500).json({ error: err.message || 'AI tutor failed' });
    }
});

module.exports = router;
