from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import webhook, surveys, analytics, contacts

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Voice CSAT Survey API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://spkly.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook.router, tags=["Webhook"])
app.include_router(surveys.router, tags=["Surveys"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(contacts.router, tags=["Contacts"])


@app.get("/")
def root():
    return {"message": "Voice CSAT Survey API is running"}
