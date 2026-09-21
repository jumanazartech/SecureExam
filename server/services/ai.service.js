const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

// Initialize Gemini
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Initialize OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('FATAL: No AI API keys (GEMINI or OPENAI) found in environment!');
}

const parseDocument = async (filePath) => {
    console.log(`[AI Service] Parsing document: ${filePath}`);
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        console.log(`[AI Service] PDF parsed, text length: ${data.text?.length || 0}`);
        return data.text;
    } else if (ext === '.docx' || ext === '.doc') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await mammoth.extractRawText({ buffer: dataBuffer });
        console.log(`[AI Service] DOCX parsed, text length: ${data.value?.length || 0}`);
        return data.value;
    }
    throw new Error('Unsupported file format');
};

// Models are tried in order. An overloaded model (503/429/5xx) is skipped immediately and the next one
// is tried; after a full pass with no success we back off and try the whole chain again.
const GEMINI_MODELS = (process.env.GEMINI_MODELS || 'gemini-flash-latest,gemini-3.5-flash,gemini-3.1-flash-lite,gemini-flash-lite-latest')
    .split(',').map(m => m.trim()).filter(Boolean);
const ROUNDS = 3;
const COOLDOWN_MS = 90 * 1000; // a model that just returned 503/429 is skipped for a while
const cooldownUntil = new Map();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isTransient = (err) => {
    const status = err.status || err.statusCode;
    if (status === 429 || (status >= 500 && status < 600)) return true;
    return /overloaded|high demand|unavailable|quota|rate|timeout|ECONNRESET|fetch failed/i.test(err.message || '');
};

const callGemini = async (prompt) => {
    let lastError;
    const unusable = new Set(); // models that failed permanently (e.g. 404 / retired)
    for (let round = 1; round <= ROUNDS; round++) {
        // Prefer models that are not cooling down; if all are, try them anyway.
        const ready = GEMINI_MODELS.filter(m => (cooldownUntil.get(m) || 0) <= Date.now());
        const order = ready.length ? ready : GEMINI_MODELS;
        for (const modelName of order) {
            if (unusable.has(modelName)) continue;
            try {
                console.log(`[AI Service] Gemini ${modelName} (round ${round}/${ROUNDS})`);
                const model = genAI.getGenerativeModel(
                    { model: modelName, generationConfig: { responseMimeType: 'application/json' } },
                    { apiVersion: 'v1beta' }
                );
                const result = await model.generateContent(prompt);
                return result.response.text();
            } catch (err) {
                lastError = err;
                console.error(`[AI Service] Gemini ${modelName} failed: ${(err.message || '').slice(0, 160)}`);
                if (isTransient(err)) cooldownUntil.set(modelName, Date.now() + COOLDOWN_MS);
                else unusable.add(modelName);
            }
        }
        if (unusable.size === GEMINI_MODELS.length) break;
        if (round < ROUNDS) await sleep(2000 * round);
    }
    throw lastError || new Error('Gemini request failed');
};

const callOpenAI = async (prompt) => {
    console.log('[AI Service] Calling OpenAI (gpt-4o-mini)...');
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: 'You are an expert exam generator that strictly returns JSON.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });
    return response.choices[0].message.content;
};

// Gemini first (free tier), OpenAI as a fallback when configured.
const generateJSON = async (prompt) => {
    const providers = [];
    if (genAI) providers.push(callGemini);
    if (openai) providers.push(callOpenAI);
    if (providers.length === 0) {
        throw new Error('No AI provider configured. Please provide Gemini or OpenAI API key.');
    }
    let lastError;
    for (const provider of providers) {
        try {
            return await provider(prompt);
        } catch (err) {
            lastError = err;
        }
    }
    throw new Error(`AI service is busy or unavailable, please try again in a minute. (${(lastError.message || '').slice(0, 120)})`);
};


const SECTIONS = ['subject', 'pedagogy', 'standards', 'ict'];
const PARALLEL_BATCHES = 3;
const BATCH_SIZE = 15;          // questions generated per AI call (keeps responses small and reliable)
const MAX_SOURCE_CHARS = 60000; // source text sent per call

const SECTION_HINTS = {
    subject: "the teacher's own subject area (content knowledge and subject-teaching methodology)",
    pedagogy: 'pedagogy, psychology, teaching methods, classroom management, assessment',
    standards: "Uzbekistan education legislation, teacher professional standards, state education standards, teacher ethics",
    ict: 'digital competence: ICT in education, online tools, digital safety, e-learning'
};

const RULES = `
### CRITICAL RENDERING RULES:
- Use LaTeX for ALL mathematical, chemical and physical formulas. Use '$' inline and '$$' for block formulas.
- Do NOT use Unicode math characters. Use LaTeX (e.g. $v$, $\\rho$, $\\alpha$).
- Keep the same language as the source material (Uzbek, Russian or English).
- Every question has exactly one correct option; "correct_answer" must be copied verbatim from "options".
- If a question needs a diagram that is not available, put [IMAGE_REQUIRED: description] in the content and set "has_image": true.

### OUTPUT FORMAT (STRICT JSON, no explanations):
{
  "questions": [
    {
      "content": "Question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A) ...",
      "marks": 1,
      "has_image": false,
      "type": "mcq",
      "section": "subject",
      "question_type": "type1_mcq_4"
    }
  ]
}`;

const buildPrompt = ({ mode, text, count, difficulty, qType, section, alreadyAsked, isRasch }) => {
    const sectionLine = section && section !== 'auto'
        ? `All questions belong to the section "${section}": ${SECTION_HINTS[section] || ''}.`
        : `Assign each question a "section" from: ${SECTIONS.map(k => `${k} (${SECTION_HINTS[k]})`).join('; ')}.`;

    const task = mode === 'extract'
        ? `Extract EVERY question that already exists in the document below, verbatim, with its options and correct answer (infer the correct answer if it is not marked). Do not invent new questions.`
        : `Using the material below as the knowledge source, write ${count} NEW, original, distinct exam questions. Difficulty: ${difficulty}. Question style: ${qType} (${qType === 'Mixed' ? 'mix of recall, application and reasoning' : qType}). ${sectionLine}${alreadyAsked.length ? `\nDo NOT repeat or rephrase these questions that were already written:\n- ${alreadyAsked.slice(-40).join('\n- ')}` : ''}`;

    const formatNote = isRasch
        ? 'Use 6 options (A-F) for matching-style questions and set "question_type": "type2_mcq_6"; otherwise 4 options.'
        : 'Use exactly 4 options (A-D).';

    return `You are a professional educational content creator. ${task}\n${formatNote}\n${RULES}\n\nDOCUMENT CONTENT:\n${text.slice(0, MAX_SOURCE_CHARS)}`;
};

const parseQuestions = (jsonText) => {
    const cleaned = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    let parsed = JSON.parse(start !== -1 && end > start ? cleaned.substring(start, end + 1) : cleaned);
    if (!Array.isArray(parsed) && parsed.questions) parsed = parsed.questions;
    if (!Array.isArray(parsed)) throw new Error('AI response is not an array of questions.');

    return parsed.filter(q => q && q.content).map(q => ({
        content: q.content || '',
        options: q.options || [],
        correct_answer: q.correct_answer || '',
        marks: q.marks || null,
        has_image: q.has_image || false,
        type: q.type || 'mcq',
        section: SECTIONS.includes(q.section) ? q.section : null,
        translations: q.translations || {
            content: { uz: q.content || '', ru: '', en: '' },
            options: { uz: q.options || [], ru: [], en: [] },
            correct_answer: { uz: q.correct_answer || '', ru: '', en: '' }
        }
    }));
};

const logRawFailure = (rawResponse, error) => {
    try {
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        fs.writeFileSync(path.join(logDir, 'ai_error_raw.json'), JSON.stringify({
            timestamp: new Date().toISOString(), rawResponse, error: error.message
        }, null, 2));
    } catch (e) {
        console.error('[AI Service] Failed to write raw response log:', e.message);
    }
};

/**
 * flowType: 'extract' (pull existing questions out of the document) or 'generate' (write new ones).
 * options: { questionCount (5-100), difficultyLevel, questionTypes, section, examType }
 */
const processWithAI = async (text, flowType, options = {}) => {
    console.log(`[AI Service] Processing starting for flow: ${flowType}`);

    if (!text || text.trim().length === 0) {
        throw new Error('Document seems to be empty or contains no readable text.');
    }

    const mode = flowType === 'generate' ? 'generate' : 'extract';
    const total = Math.min(Math.max(parseInt(options.questionCount, 10) || 10, 1), 100);
    const common = {
        text,
        difficulty: options.difficultyLevel || 'Medium',
        qType: options.questionTypes || 'Mixed',
        section: options.section || null,
        isRasch: options.examType === 'rasch_national_cert'
    };

    if (mode === 'extract') {
        const raw = await generateJSON(buildPrompt({ ...common, mode, alreadyAsked: [] }));
        try {
            return parseQuestions(raw);
        } catch (e) {
            logRawFailure(raw, e);
            throw new Error('AI returned an invalid response format. Please try again.');
        }
    }

    // generate: split into small batches that run in parallel (each focused on a different part of the
    // material), then top up any shortfall caused by duplicates.
    const collected = [];
    const seen = new Set();
    const addUnique = (list) => {
        for (const q of list) {
            const key = q.content.trim().toLowerCase();
            if (!seen.has(key) && collected.length < total) {
                seen.add(key);
                collected.push(q);
            }
        }
    };
    const runBatch = async (count, focus) => {
        const raw = await generateJSON(buildPrompt({
            ...common, mode, count, alreadyAsked: collected.map(q => q.content.slice(0, 120)),
            text: focus ? `${text.slice(0, MAX_SOURCE_CHARS)}\n\n(${focus})` : text
        }));
        try {
            addUnique(parseQuestions(raw));
        } catch (e) {
            logRawFailure(raw, e);
            throw e;
        }
    };

    const batches = [];
    for (let left = total, i = 1; left > 0; i++) {
        const count = Math.min(BATCH_SIZE, left);
        batches.push({ count, focus: `Batch ${i}: cover different topics from other batches` });
        left -= count;
    }

    let firstError;
    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
        const results = await Promise.allSettled(
            batches.slice(i, i + PARALLEL_BATCHES).map(b => runBatch(b.count, b.focus))
        );
        results.filter(r => r.status === 'rejected').forEach(r => { firstError = firstError || r.reason; });
    }

    // Top-up passes for missing questions (duplicates / failed batches)
    for (let pass = 0; pass < 2 && collected.length < total; pass++) {
        try {
            await runBatch(Math.min(BATCH_SIZE, total - collected.length), 'Top-up: write questions on new angles');
        } catch (e) {
            firstError = firstError || e;
        }
    }

    if (collected.length === 0) {
        throw firstError || new Error('AI returned an invalid response format. Please try again.');
    }
    return collected;
};

module.exports = {
    parseDocument,
    processWithAI,
    SECTIONS
};
