import json
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import SurveyResponse

router = APIRouter()


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    responses = (
        db.query(SurveyResponse)
        .order_by(SurveyResponse.created_at.desc())
        .all()
    )

    if not responses:
        return _empty_analytics()

    total = len(responses)

    scores = [r.csat_score for r in responses if r.csat_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    sentiment_counts = Counter(r.sentiment for r in responses if r.sentiment)

    all_themes = []
    for r in responses:
        if r.themes:
            try:
                all_themes.extend(json.loads(r.themes))
            except Exception:
                pass

    theme_counts = Counter(all_themes)
    top_themes = [
        {"theme": t, "count": c} for t, c in theme_counts.most_common(10)
    ]

    recent_responses = []
    for r in responses[:10]:
        themes = []
        if r.themes:
            try:
                themes = json.loads(r.themes)
            except Exception:
                pass
        recent_responses.append({
            "id": r.id,
            "csat_score": r.csat_score,
            "sentiment": r.sentiment,
            "themes": themes,
            "summary": r.summary,
            "created_at": r.created_at.isoformat(),
        })

    return {
        "total_responses": total,
        "avg_csat_score": avg_score,
        "sentiment_breakdown": {
            "positive": sentiment_counts.get("positive", 0),
            "neutral": sentiment_counts.get("neutral", 0),
            "negative": sentiment_counts.get("negative", 0),
        },
        "top_themes": top_themes,
        "recent_responses": recent_responses,
    }


def _empty_analytics():
    return {
        "total_responses": 0,
        "avg_csat_score": 0,
        "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
        "top_themes": [],
        "recent_responses": [],
    }
