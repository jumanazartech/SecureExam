# SecureExam

Secure online exam platform (admin / teacher / student roles) with a fullscreen, focus-tracked exam runner,
AI-assisted test import (Gemini / OpenAI), and three exam models:

| Model | Scoring |
|-------|---------|
| **CHSB** | Points per question by difficulty category (B/Q/M), balanced to 40 |
| **Rasch National Certificate** | Rasch ability (θ) → 0–100 score → certificate level (A+ … C) |
| **Teacher attestation** | Teacher-certification prep: sections (subject / pedagogy / standards & law / ICT), 100 pts total, result = qualification category (≥86% highest, ≥71% first, ≥56% second, else specialist). Open to all teachers under *Attestation* in the teacher console; no class/PIN needed |
| **DTM** | 90 questions, max 189 pts: Q1–30 mandatory subjects (1.1), Q31–60 first major subject (3.1), Q61–90 second major subject (2.1) |

## Project structure

```
client/                 React + Vite + Tailwind (light/dark themes, UZ/RU/EN)
  src/pages/            admin/, teacher/, student/ areas + exam editor & runner
  src/components/       shared UI (modals, formula renderer, security wrapper)
  src/context/          Auth (+ i18n) and Alert providers
  src/translations*.js  UI strings
server/                 Node.js + Express + Sequelize (PostgreSQL)
  routes/               auth, exams, submissions, classes, appeals, notifications
  services/ai.service.js  Gemini/OpenAI question generation with model fallback + retry
  utils/rasch-scorer.js   Rasch scoring engine
  seeders/              default admin seeding (runs on startup)
  scripts/              maintenance scripts (create-admin, check-db)
docs/                   Admin and student guides
docker-compose.yml      Postgres + server + client
```

## Run locally

Requirements: Node.js 18+, PostgreSQL 14+.

```bash
# 1. Database (matches server/.env: port 15432, db "examdb")
# 2. Server
cd server && cp .env.example .env   # fill in DB + GEMINI_API_KEY
npm install && npm start            # http://localhost:5001

# 3. Client
cd client && npm install && npm run dev   # http://localhost:5173
```

Default admin (created on first start): `admin` / `admin123` — change it after first login.

Free Gemini API key: https://aistudio.google.com/apikey → put in `server/.env` as `GEMINI_API_KEY`.
Model order can be overridden with `GEMINI_MODELS=model1,model2,...`.

## Docker

```bash
docker-compose up --build   # client :3000, server :5000
```

## Security notes
- Never commit `.env` files or API keys.
- Exam runner enforces fullscreen, tracks focus loss, blocks copy/paste and requires an admin PIN to resume.

## Where the data lives

All users, exams, questions and results are stored in **PostgreSQL** (tables created automatically by Sequelize on server start).
Locally that is the database from `server/.env` (`DB_HOST`/`DB_PORT`/`DB_NAME`). Uploaded question images go to `server/uploads/`.

## Deploying to production

**Easiest (one service):** the server serves the built client, so a single Node host plus a Postgres database is enough.
`render.yaml` is a ready Render Blueprint (New -> Blueprint). Manually: build `npm run build`, start `npm start`,
env `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PIN`, `GEMINI_API_KEY`. Leave `VITE_API_URL` empty in this mode.

**Split hosting (Vercel frontend + separate API):** see below.


Vercel and Lovable host the *frontend* only. This project also needs a Node server and a PostgreSQL database:

1. **Database**: create a free Postgres on Neon or Supabase and copy its connection string.
2. **Backend** (Render / Railway / Fly.io): deploy the `server/` folder, start command `npm start`, env vars:
   `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PIN`, `GEMINI_API_KEY`, `CLIENT_ORIGIN=https://<your-frontend>`.
   Uploaded images need a persistent disk (or move them to object storage).
3. **Frontend** (Vercel): root directory `client/`, build `npm run build`, output `dist`,
   env var `VITE_API_URL=https://<your-backend>`. `client/vercel.json` already rewrites all routes to `index.html`.
4. Change the default admin password after first login, and do not commit `.env` files.

## Contact

Telegram [@jumanazar_xolmatov](https://t.me/jumanazar_xolmatov) · +998 99 226 17 21 · jumanazar.tech@gmail.com

## Accounts, plans and sign-in

- **Sign-up** (`/register`): students and teachers register with a phone number verified by SMS (Eskiz.uz), optionally
  via Google or GitHub. Login accepts username, phone or email. Password reset works by SMS (`/forgot-password`).
- **Plans** live in `server/config/plans.js` (limits, features, prices) and are enforced on the server.
  Free: 30 students, 2 classes, 5 exams, 30 AI questions/month. Pro: 500 students, all exam types, 1500 AI questions/month, Excel, attestation prep.
- **Teacher trial**: a teacher uploads a document at *Account & plan*; an admin approves it under *Verification*,
  which starts a 3-day Pro trial (once per phone number).
- **Students join classes** with the teacher's class code; seats count against the teacher's plan.
