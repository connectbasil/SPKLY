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
- [x] Phase 5: Deploy live ✅
  - Frontend: https://spkly.vercel.app (Vercel)
  - Backend: https://spkly-backend-production.up.railway.app (Railway)
  - CORS resolved: `allow_credentials=False` + `Origin` header required by middleware (not a bug)
- [ ] Phase 4: Email campaign (deferred — not part of MVP)

**MVP is complete.** Now building productionisation features.

### Productionisation build order
1. [x] Survey creation form — rich wizard (type, intent, audience, tone, scoring, questions)
2. [x] Contacts management — CSV upload, per-respondent status tracking, RespondentDrawer with timeline + audio playback
3. [ ] Campaign view — invited vs responded, response rate
4. [x] Individual response view — transcript + analysis per respondent (RespondentDrawer slide-in)
5. [x] Dynamic voice agent prompting — GET /api/prompt/{survey_uuid} generates system prompt from survey metadata; passed as assistantOverrides to vapi.start()
6. [ ] Email/SMS delivery via Resend.com
7. [ ] Multi-user support — login, workspaces, team access
8. [ ] Export — CSV or PDF report

### Dynamic prompting notes
- `backend/routes/prompt.py`: builds prompt from title, intent, audience, tone, survey_type, scoring_enabled, custom_questions
- Tone mapping: formal → professional, casual → conversational, empathetic → warm/supportive
- Questions: uses custom_questions JSON if set; falls back to type-specific defaults for all 8 types (csat/nps/enps/star/product/personal/event/research)
- Scoring block appended only when scoring_enabled=true and type is csat/nps/enps/star (correct scale per type)
- `Survey.jsx` fetches prompt before call start; falls back silently if fetch fails (demo mode safe)

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

---

## Next Phase — Voice Feedback Intelligence Platform

### Vision

SPKLY is evolving into a generic voice-first feedback intelligence platform. Any organisation can create structured feedback campaigns, deploy them via voice AI, and get back rich analysed insights.

### Survey Types

Scored: CSAT (1-5), NPS (0-10), eNPS, Star Rating

Unscored: Product Feedback, Personal/Peer Feedback, Event Feedback, Research Interviews

### Survey Creation

Fields: name, type, intent, audience, tone, scoring toggle, custom questions

SPKLY uses metadata to dynamically generate voice agent prompts automatically.

### Campaign Management

Campaign = survey + contact list

Features: CSV upload, schedule, delivery channel, expiry, reminders

Status: Draft → Active → Paused → Closed

### Contacts & Respondents

- Per-respondent status: Invited → Started → Completed → Bounced

- Individual view: transcript, sentiment, score, themes, quotes

### Dashboard Levels

- Platform: all surveys aggregate

- Survey: drill down with respondent list and individual response view

### Intelligence Layer

Trend alerts, theme clustering, quote extraction, comparison view, benchmarks

### Build Priority

1. Survey creation form

2. Contacts management

3. Campaign view

4. Individual response view

5. Dynamic voice agent prompting

6. Email/SMS via Resend.com

7. Multi-user support

8. Export (CSV/PDF)

### Deployment

- Frontend: spkly.vercel.app (Vercel)

- Backend: spkly-backend-production.up.railway.app (Railway)

- GitHub: connectbasil/SPKLY


---

## Phase 2 Progress Update

### Completed
- Priority 1: Survey creation wizard (3-step: Basics → Context → Configure)
  - Survey types: CSAT, NPS, eNPS, Star Rating, Product Feedback, Personal, Event, Research
  - Fields: name, type, intent, audience, tone, scoring toggle, custom questions
  - Success state with shareable link
- Priority 2: Contacts management
  - Contact model: name, email, phone, status (Invited/Started/Completed/Bounced)
  - CSV import, single contact add, per-contact unique survey link (/survey/{uuid}?c={id})
  - Auto-status update via Vapi webhook when call ends (contact_id passed in metadata)
  - Contacts page built (Contacts.jsx still exists but not linked in sidebar)
- UI/UX: Surveys page restructured
  - Default state = survey list; wizard moved into full-screen modal (+ Create Survey button)
  - Survey rows are clickable → drill-down detail view (inline, no new route)
  - Drill-down: tabbed layout — Analytics tab + Audience tab
    - Analytics tab: stats bar (Invited/Started/Completed/Bounced/Response Rate), Avg Score card (scored types only), Sentiment pie chart, Word Cloud, Top Themes
    - Audience tab: Respondents table with inline status dropdown + Copy Link, "+ Add Contacts" CTA (top-right)
    - Add Contacts is a modal with two tabs: Single Contact form + CSV drag-drop import
  - Contacts page functionality fully absorbed into survey drill-down
  - Sidebar: "Contacts" nav item removed; only Dashboard + Surveys remain
- Priority 3: Individual response view (RespondentDrawer)
  - GET /contacts/{contact_id} endpoint — returns contact + derived timeline + best-match SurveyResponse
  - RespondentDrawer.jsx component: slide-in panel from right (420px), dims background
  - Drawer contents: name/email/status header, Activity timeline (Invited → Started → Completed → Response Recorded), Response section (score, sentiment badge, summary, themes, key insights), Transcript (collapsible, last 6 lines default, expand to full)
  - Clicking any respondent row in Audience tab opens the drawer
  - Falls back to MOCK_CONTACT_DETAIL in demo mode

### Deployed
- Frontend: spkly.vercel.app (Vercel)
- Backend: spkly-backend-production.up.railway.app (Railway)
- DB reset done on Railway (new schema with Contact model live)

### Next up
- Priority 4: Dynamic voice agent prompting using survey metadata
- Priority 5: Email/SMS delivery via Resend.com
- Priority 6: Multi-user support (login, workspaces)

---

## Phase 3 Progress Update

### Completed
- Dashboard tab removed from sidebar; default route redirects to /surveys
- Surveys page: summary stats bar at top (Total Surveys, Active, Completed)
- Survey detail: tabbed layout — Analytics tab and Audience tab
  - Analytics tab: stats bar, avg score (scored surveys only), sentiment pie, word cloud, top themes, response volume chart, recent responses
  - Audience tab: respondents table + Add Contacts modal (single add + CSV import)
- Respondent drawer (RespondentDrawer.jsx): slide-in from right, audit trail timeline, response details
  - Transcript (collapsible), sentiment, themes, score
  - Audio playback: native HTML5 player with custom dark-themed controls
  - recording_url stored on SurveyResponse model, parsed from Vapi webhook
  - Falls back to "No recording available" when recording_url is null
- Per-survey analytics endpoint: GET /api/analytics/{survey_id}
  - Returns sentiment, word cloud themes, avg score, daily_volumes, recent_responses
- Per-contact detail endpoint: GET /api/contacts/{contact_id}
  - Returns contact info, timeline events, linked SurveyResponse with recording_url

### Next up
- Priority 5: Dynamic voice agent prompting — use survey metadata to generate questions at call time
- Priority 6: Email/SMS delivery via Resend.com
- Priority 7: Multi-user support — login, workspaces, team access
- Priority 8: Export — CSV or PDF report

---

## Phase 4 Progress Update

### Completed
- DB migration: run_migrations() in database.py checks for missing columns via pragma_table_info and runs ALTER TABLE safely on every deploy
  - recording_url column now live on Railway without a DB reset
  - Uses FastAPI lifespan handler (modern asynccontextmanager pattern, not deprecated on_event)

### Next up
- Dynamic voice agent prompting (prompt 2 — not yet run)
- Priority 6: Email/SMS delivery via Resend.com
- Priority 7: Multi-user support — login, workspaces, team access
- Priority 8: Export — CSV or PDF report
- Cleanup: delete Contacts.jsx (unlinked dead code)

---

## Test / Live Mode

### Concept
Two explicit modes replacing the implicit mock-data fallback pattern:
- **Test mode** — all data is mock, all actions are simulated (no real API calls)
- **Live mode** — all data from real backend, all actions hit real API

### Visual indicators
- Persistent amber border (`#F59E0B`) around entire viewport in test mode
- Green border (`#10B981`) flashes in momentarily on switch to live mode, then fades out
- Test/Live pill toggle in sidebar footer (replaces "API Connected" indicator)

### Implementation plan
- `src/context/ModeContext.jsx` — global mode state, persisted to localStorage, default = "test"
- All data-fetching pages check `useMode()` — test → mock data, live → real fetch
- Write operations (create survey, add contact) — test → simulated 600ms delay + success UI, live → real API call
- Screen border: `position: fixed, inset: 0, pointer-events: none, z-index: 9999, border: 3px solid`
- ModeProvider wraps App.jsx

### Status
- [ ] Not yet built

---

## Test / Live Mode — Completed

### Built
- `src/context/ModeContext.jsx` — mode state ("test" | "live"), persisted to localStorage key `spkly_mode`, defaults to "test". useMode() throws if used outside ModeProvider.
- `App.jsx` — wrapped in ModeProvider; ScreenBorder component (fixed overlay, pointer-events none, z-index 9999) — amber #F59E0B in test, green #10B981 on live switch (fades to 0 after 2s)
- `Sidebar.jsx` — TEST/LIVE pill toggle replaces "API Connected" badge
  - Collapsed: single amber/green dot
  - Expanded: two-button pill with active state highlight
- All data-fetching and write operations are mode-aware:
  - `Admin.jsx` — survey list, contacts, analytics, status update, add contact, CSV import, survey creation
  - `Dashboard.jsx` — analytics and survey list
  - `RespondentDrawer.jsx` — contact detail, re-fetches on mode switch
- Test mode behavior: mock data returned immediately, write operations simulate 600ms delay + success UI, no real API calls
- Live mode behavior: all real fetch/POST/PATCH calls, no mock fallback

### Status
- [x] Complete

---

## UI Fixes

### Surveys page + Sidebar layout (completed)
- Surveys page content now full width (removed maxWidth: 1200, uses width: 100% + boxSizing: border-box)
- Stats cards use flex: 1 — stretch equally across full row
- Sidebar collapse toggle moved from top to vertically centered on sidebar right edge (position: absolute, right: -13, top: 50%)
- Toggle is a 26x26px circle tab that sticks out on the sidebar border, with boxShadow for depth
- aside uses position: relative + overflow: visible so toggle tab can escape sidebar boundary
- Inner elements (logo, nav labels, mode pill) retain overflow: hidden for proper text clipping
- Main content area already correct — flex: 1 on <main> fills remaining width automatically

---

## Mode Switch Toast (completed)
- ModeToast component in App.jsx — fixed, bottom-center (bottom: 32px, left: 50%, translateX(-50%))
- Pill-shaped: --bg-surface background, mode-colored border at 25% opacity, colored glow dot + label
- Timing: appears on mode switch, stays 2s, fades out over 0.4s, unmounts at 2.4s
- prevMode ref guards against re-triggering on unrelated renders
- displayedMode snapshot keeps label/color stable during fade-out if mode switches again mid-animation
- No invisible DOM element when not shown — component is null until triggered
- Colors: amber #F59E0B (Test Mode), green #10B981 (Live)
