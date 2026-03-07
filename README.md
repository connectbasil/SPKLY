# VoicePulse — Voice CSAT Survey Application

A portfolio-grade, AI-powered CSAT survey platform that collects customer feedback through conversational voice calls, then analyses and visualises the results.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Recharts |
| Backend | Python 3.11+, FastAPI, SQLAlchemy |
| Voice | Vapi.ai (webhook + Web SDK) |
| AI Analysis | OpenAI GPT-4o |
| Database | SQLite |

---

## Project Structure

```
Voice-Survey/
├── backend/
│   ├── main.py            # FastAPI app entry point
│   ├── models.py          # SQLAlchemy ORM models
│   ├── database.py        # SQLite engine + session
│   ├── analyzer.py        # OpenAI transcript analysis
│   ├── routes/
│   │   ├── webhook.py     # POST /webhook/vapi
│   │   ├── surveys.py     # POST/GET /surveys
│   │   └── analytics.py   # GET /analytics
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Survey.jsx     # /survey/:id — voice call page
    │   │   ├── Dashboard.jsx  # /dashboard — analytics
    │   │   └── Admin.jsx      # /admin — survey management
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── WaveformAnimation.jsx
    │   │   ├── ThemePills.jsx
    │   │   └── ResponseExplorer.jsx
    │   ├── mockData.js        # Realistic placeholder data
    │   ├── App.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── .env.example
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- Python 3.11+
- pip

### 1. Clone & install

```bash
git clone <your-repo-url>
cd Voice-Survey
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your keys (optional — app runs with mock data without keys)

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your Vapi public key (optional — demo mode works without it)

# Start dev server
npm run dev
```

The app will be live at `http://localhost:5173`.

---

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Analytics dashboard with charts and response explorer |
| `/admin` | Create surveys and copy shareable links |
| `/survey/:id` | End-user voice survey page |

The app runs fully with **mock/placeholder data** when no API keys are configured.

---

## API Keys

### OpenAI (for transcript analysis)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add a payment method
3. Navigate to **API Keys** → **Create new secret key**
4. Copy the key into `backend/.env` as `OPENAI_API_KEY`

Without this key the backend uses randomised mock analysis scores.

### Vapi.ai (for voice calls)

1. Go to [vapi.ai](https://vapi.ai) and create an account
2. In the dashboard, create a new **Assistant** and note the **Assistant ID**
3. From **Account Settings** copy your **Public API Key**
4. Create a webhook pointing to your backend: `https://your-domain/webhook/vapi`
5. Set the call metadata `survey_uuid` to the survey UUID so responses are linked

Add these to `frontend/.env`:
```
VITE_VAPI_API_KEY=your_public_key
VITE_VAPI_ASSISTANT_ID=your_assistant_id
```

Without these keys the survey page runs in **demo mode** — you can click through all states without a real call.

---

## How It Works

1. Admin creates a survey in `/admin` → receives a unique link `/survey/:uuid`
2. Client clicks the link and taps **Start Voice Survey**
3. Vapi initiates a voice call using your configured assistant
4. When the call ends, Vapi sends a webhook to `POST /webhook/vapi`
5. The backend extracts the transcript, sends it to GPT-4o for analysis
6. The analysis (CSAT score, sentiment, themes, summary) is saved to SQLite
7. The dashboard at `/dashboard` displays aggregated analytics in real time

---

## Design System

Dark-mode first, using the Geist font family. Key CSS variables are defined in `src/index.css`:

- `--bg-base: #0F1115` — app shell background
- `--bg-surface: #16191F` — card backgrounds
- `--accent: #2DD4BF` — primary teal accent
- Glassmorphism on the survey hero card
- Subtle top-edge card highlights via `box-shadow: inset 0 1px 0`
- Hover elevation via `translateY(-2px)`
