# CodeLens — AI Code Review Platform

A full-stack web app where developers paste code, pick a language, and get an instant AI-powered code review: scored out of 100, with strengths, issues (severity-tagged), concrete suggestions, and security notes. Includes auth, review history, shareable public links, downloadable reports, and team workspaces.

**Stack:** Node.js + Express + SQLite (backend) · React + Vite + Tailwind + Monaco Editor (frontend) · Gemini or OpenAI for the AI review.

---

## Features

- JWT authentication (register / login)
- Monaco-based online code editor with syntax highlighting, 14 languages
- AI code review via Gemini or OpenAI — pick one in `.env`
- Score out of 100 with a visual gauge, strengths, issues by severity, suggestions, security notes
- Review history per user
- Downloadable review report (`.md`)
- Shareable public read-only links (no login needed to view)
- Team workspaces: create a team, invite via code, share reviews with your team

---

## Project structure

```
ai-code-review/
├── backend/          # Express API + SQLite
│   ├── db/            database.js (schema, auto-created on first run)
│   ├── middleware/     auth.js (JWT check)
│   ├── routes/         auth.js, reviews.js, teams.js
│   ├── services/        aiService.js (Gemini/OpenAI abstraction)
│   ├── server.js
│   └── .env.example
└── frontend/          # React + Vite app
    ├── src/
    │   ├── pages/        Login, Register, Dashboard, History, ReviewDetail, SharedReview, Teams
    │   ├── components/    Navbar, ScoreGauge
    │   ├── context/       AuthContext
    │   └── lib/            api.js, languages.js
    └── .env.example
```

---

## Setup

### 1. Get an AI API key (free tier works)

- **Gemini (recommended, generous free tier):** https://aistudio.google.com/apikey
- **OpenAI:** https://platform.openai.com/api-keys

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
JWT_SECRET=make_this_a_long_random_string
AI_PROVIDER=gemini          # or "openai"
GEMINI_API_KEY=your_actual_key_here
```

Run it:
```bash
npm run dev      # nodemon, auto-restart
# or
npm start
```

Backend runs on `http://localhost:5000`. SQLite database (`db/app.db`) is created automatically on first run — no separate DB setup needed.

### 3. Frontend

In a new terminal:
```bash
cd frontend
npm install
cp .env.example .env    # default already points to localhost:5000/api
npm run dev
```

Frontend runs on `http://localhost:5173`. Open it, register an account, and start reviewing code.

---

## How the AI review works

The backend sends your code + language to Gemini or OpenAI with a structured prompt asking for a Markdown review (summary, score, strengths, issues by severity, suggestions, security notes). The response is stored as-is in SQLite alongside your code, so history and shared links replay the exact original review without re-calling the API.

If you see `"GEMINI_API_KEY is not configured on the server"` — you haven't added your key to `backend/.env` yet, or the placeholder value is still there.

---

## Notes on production use

- SQLite is great for a resume project / demo; for real multi-user production traffic, swap in Postgres (the `db/database.js` file is the only place that would need to change).
- JWT tokens are stored in `localStorage` on the frontend — fine for a project like this; for production-grade security you'd move to httpOnly cookies.
- Rate limiting is already wired in (`express-rate-limit`, 300 req/15min per IP) as a basic safeguard on the API.
- CORS is restricted to `CLIENT_URL` from `.env` — update it if you deploy the frontend elsewhere.

---

## Resume bullet ideas

- Built a full-stack AI code review platform (Node.js/Express, React, SQLite) with JWT auth, a Monaco-based online editor, and Gemini/OpenAI integration for automated, scored code reviews across 14 languages.
- Designed shareable public review links and team workspaces with role-based membership, enabling collaborative code review workflows.
- Implemented review history, downloadable Markdown reports, and a custom score-visualization component using SVG.
