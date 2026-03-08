import json
import datetime
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SurveyResponse, SurveySession, Contact

router = APIRouter()


def _serialize_response(r):
    themes = []
    key_insights = []
    word_frequencies = {}
    try:
        themes = json.loads(r.themes) if r.themes else []
    except Exception:
        pass
    try:
        key_insights = json.loads(r.key_insights) if r.key_insights else []
    except Exception:
        pass
    try:
        word_frequencies = json.loads(r.word_frequencies) if r.word_frequencies else {}
    except Exception:
        pass
    return {
        "id": r.id,
        "score": r.score,
        "score_context": r.score_context,
        "sentiment": r.sentiment,
        "themes": themes,
        "summary": r.summary,
        "key_insights": key_insights,
        "word_frequencies": word_frequencies,
        "created_at": r.created_at.isoformat(),
    }


def _aggregate_word_frequencies(responses):
    totals = {}
    for r in responses:
        try:
            wf = json.loads(r.word_frequencies) if r.word_frequencies else {}
            for word, weight in wf.items():
                totals[word] = totals.get(word, 0) + weight
        except Exception:
            pass
    return totals


def _aggregate_themes(responses):
    all_themes = []
    for r in responses:
        try:
            all_themes.extend(json.loads(r.themes) if r.themes else [])
        except Exception:
            pass
    return [
        {"theme": t, "count": c}
        for t, c in Counter(all_themes).most_common(10)
    ]


def _avg_score(responses):
    scores = [r.score for r in responses if r.score is not None]
    return round(sum(scores) / len(scores), 1) if scores else None


def _daily_volumes(responses):
    today = datetime.date.today()
    counts = {}
    for r in responses:
        d = r.created_at.date()
        counts[d] = counts.get(d, 0) + 1
    result = []
    for i in range(29, -1, -1):
        d = today - datetime.timedelta(days=i)
        result.append({"date": d.strftime("%b %-d"), "count": counts.get(d, 0)})
    return result


def _recent_responses_with_names(responses, session_id, db):
    # Try to match each response to a contact by proximity of timestamps
    contacts = db.query(Contact).filter(
        Contact.survey_id == session_id,
        Contact.status == "completed",
        Contact.completed_at.isnot(None),
    ).all()

    used = set()
    result = []
    for r in responses[:5]:
        name = "Anonymous"
        best_id, best_diff = None, None
        for c in contacts:
            if c.id in used:
                continue
            if c.invited_at and c.invited_at <= r.created_at:
                diff = abs((r.created_at - c.completed_at).total_seconds())
                if best_diff is None or diff < best_diff:
                    best_diff, best_id = diff, c.id
        if best_id is not None and best_diff < 7200:  # within 2 hours
            name = next(c.name for c in contacts if c.id == best_id)
            used.add(best_id)
        result.append({
            "name": name,
            "score": r.score,
            "sentiment": r.sentiment,
            "date": r.created_at.isoformat(),
        })
    return result


def _sentiment_breakdown(responses):
    counts = Counter(r.sentiment for r in responses if r.sentiment)
    return {
        "positive": counts.get("positive", 0),
        "neutral": counts.get("neutral", 0),
        "negative": counts.get("negative", 0),
    }


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    responses = (
        db.query(SurveyResponse)
        .order_by(SurveyResponse.created_at.desc())
        .all()
    )

    if not responses:
        return _empty_analytics()

    return {
        "total_responses": len(responses),
        "avg_score": _avg_score(responses),
        "sentiment_breakdown": _sentiment_breakdown(responses),
        "top_themes": _aggregate_themes(responses),
        "word_frequencies": _aggregate_word_frequencies(responses),
        "recent_responses": [_serialize_response(r) for r in responses[:10]],
    }


@router.get("/analytics/survey/{survey_id}")
def get_survey_analytics(survey_id: str, db: Session = Depends(get_db)):
    session = db.query(SurveySession).filter(SurveySession.uuid == survey_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Survey not found")

    responses = (
        db.query(SurveyResponse)
        .filter(SurveyResponse.session_id == session.id)
        .order_by(SurveyResponse.created_at.desc())
        .all()
    )

    return {
        "survey_id": session.uuid,
        "survey_title": session.title,
        "survey_description": session.description,
        "total_responses": len(responses),
        "avg_score": _avg_score(responses),
        "sentiment_breakdown": _sentiment_breakdown(responses),
        "top_themes": _aggregate_themes(responses),
        "word_frequencies": _aggregate_word_frequencies(responses),
        "daily_volumes": _daily_volumes(responses),
        "recent_responses": _recent_responses_with_names(responses, session.id, db),
        "responses": [_serialize_response(r) for r in responses],
    }


def _empty_analytics():
    return {
        "total_responses": 0,
        "avg_score": None,
        "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
        "top_themes": [],
        "word_frequencies": {},
        "recent_responses": [],
    }
