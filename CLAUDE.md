# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Interactive API docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build
```

### Environment setup

```bash
# Backend
cp backend/.env.example backend/.env
# Set: OPENAI_API_KEY, VAPI_API_KEY, VAPI_ASSISTANT_ID

# Frontend
cp frontend/.env.example frontend/.env
# Set: VITE_VAPI_API_KEY, VITE_VAPI_ASSISTANT_ID
```

Both services run in **demo/mock mode** without API keys configured.

## Architecture

### Data flow

1. Admin creates a survey via `POST /surveys` → gets a unique UUID link `/survey/:uuid`
2. End-user opens the link, starts a Vapi voice call with `survey_uuid` set in call metadata
3. Vapi sends an end-of-call webhook to `POST /webhook/vapi`
4. `analyzer.py` sends the transcript to GPT-4o → returns `csat_score`, `sentiment`, `themes[]`, `summary`
5. Result is stored in SQLite as a `SurveyResponse` linked to the `SurveySession` via `session_id`
6. Frontend polls `GET /analytics` to display aggregated data on the dashboard

### Backend (`backend/`)

- **`main.py`** — FastAPI app; mounts CORS middleware and three routers
- **`database.py`** — SQLite engine and `get_db` session dependency
- **`models.py`** — Two ORM models: `SurveySession` (survey config) and `SurveyResponse` (per-call result with transcript + analysis). `themes` is stored as a JSON string in a `Text` column.
- **`analyzer.py`** — Calls GPT-4o with `response_format: json_object`; falls back to randomized mock data when `OPENAI_API_KEY` is absent or the call fails
- **`routes/webhook.py`** — Parses Vapi's end-of-call payload; extracts transcript from `message.artifact.messages[]` or falls back to a flat `transcript` field; resolves session by `survey_uuid` in call metadata
- **`routes/surveys.py`** — CRUD for `SurveySession`
- **`routes/analytics.py`** — Aggregates all responses: avg CSAT, sentiment breakdown, top themes (via `Counter`), last 10 responses

### Frontend (`frontend/src/`)

- **`App.jsx`** — React Router setup; `/survey/:id` renders full-screen (no sidebar); `/dashboard` and `/admin` use `AppLayout` with `Sidebar`
- **`pages/Survey.jsx`** — Voice call UI; uses the Vapi Web SDK (`VITE_VAPI_API_KEY` + `VITE_VAPI_ASSISTANT_ID`); passes `survey_uuid` in call metadata; runs in demo mode without keys
- **`pages/Dashboard.jsx`** — Fetches `GET /api/analytics`; falls back to `mockData.js` when the backend is unreachable
- **`pages/Admin.jsx`** — Fetches `GET /api/surveys` and calls `POST /api/surveys`; falls back to `mockData.js`
- **`mockData.js`** — Realistic placeholder data used when the backend is unavailable

### Vapi integration

- Configured in "Assistant speaks first with model generated message" mode
- The opening message is dynamically generated based on `survey_context` passed in call metadata
- No hardcoded first message — fully driven by survey configuration
- One Vapi assistant handles all survey types via dynamic system prompt injection

### API proxy

Vite proxies `/api/*` → `http://localhost:8000` (strips the `/api` prefix), so frontend fetch calls use `/api/surveys`, `/api/analytics`, `/api/webhook/vapi`.

### Design system

Dark-mode only. CSS variables defined in `src/index.css`:
- `--bg-base: #0F1115`, `--bg-surface: #16191F`, `--accent: #2DD4BF`
- Geist font family, glassmorphism on the survey hero card

## Project Context
**SPKLY** — a template-based voice feedback platform that collects feedback on anything through conversational AI voice agents.
Built by Basil Roy as a learning project using Claude Code.

Survey types are fully configurable: CSAT, NPS, product feedback, event feedback, employee surveys, or any custom use case. Each survey is defined by a name, goal, tone (formal/casual/empathetic), and a list of custom questions. A single Vapi assistant handles all survey types via dynamic system prompt injection — survey config is passed at call time to drive agent behaviour.

## Current Build Status
- [x] Phase 1: Project scaffold, UI, mock data
- [x] Phase 2: Vapi voice agent integration complete
  - Voice calls working end-to-end with real Vapi API
  - Survey context passed dynamically via call metadata
  - Thank you state shows correctly after call ends
- [x] Phase 3: OpenAI transcript analysis complete (gpt-4.1-nano)
- [x] UI improvements: SPKLY rebrand, collapsible sidebar, smart All Surveys vs per-survey dashboard views, word cloud aggregated analytics
- [ ] Phase 4: Email campaign (deferred)
- [ ] Phase 5: Deploy live ← NEXT

### Dashboard view notes
- Sidebar collapse state managed via `useState` in `Sidebar.jsx`
- All Surveys view: Survey Count stat, Response Volume bar chart, Word Cloud (full-width), Sentiment pie, Themes, Recent Responses
- Per-survey view: Avg Score (nullable), Word Cloud in left chart panel, Sentiment pie, Themes, All Responses

## Product Vision

### Survey-Level Aggregate Analytics
Each survey should have its own analytics view showing insights across ALL participants of that survey, not just individual responses.

This includes:
- Word cloud generated from themes and key insights across all respondents (word size = frequency of mention across participants)
- Aggregate sentiment breakdown for that specific survey
- Top themes ranked by how many participants mentioned them
- Overall summary of what people are saying about that topic
- Individual response explorer filtered by survey

### Data Model Intent
- `SurveySession` = one survey campaign (e.g. "Q1 Onboarding Feedback")
- `SurveyResponse` = one participant's response within that survey
- Analytics should be available at both levels:
  - Global (all surveys combined) → current dashboard
  - Per-survey (one survey, all participants) → to be built

## Key Conventions
- No TypeScript, plain JavaScript only
- One component per file
- Use fetch() for all API calls, no axios
- Mock data fallback when backend/APIs unavailable
- All new backend routes go in /backend/routes/
- All React pages go in /frontend/src/pages/
- All reusable components go in /frontend/src/components/

## Design Decisions
- Accent color: Teal (#2DD4BF) — used sparingly for CTAs and active states only
- Font: Geist
- Dark theme only, never add light mode
- Follow existing elevation pattern: bg-base → bg-surface → bg-elevated
