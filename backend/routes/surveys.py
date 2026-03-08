import uuid
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import SurveySession

router = APIRouter()


class SurveyCreate(BaseModel):
    title: str
    survey_type: Optional[str] = None
    intent: Optional[str] = None
    audience: Optional[str] = None
    tone: Optional[str] = None
    scoring_enabled: Optional[bool] = True
    custom_questions: Optional[List[str]] = []
    # Legacy optional fields
    description: Optional[str] = None
    client_name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None


def _serialize_session(s):
    custom_questions = []
    try:
        custom_questions = json.loads(s.custom_questions) if s.custom_questions else []
    except Exception:
        pass
    return {
        "id": s.id,
        "uuid": s.uuid,
        "title": s.title,
        "survey_type": s.survey_type,
        "intent": s.intent,
        "audience": s.audience,
        "tone": s.tone,
        "scoring_enabled": s.scoring_enabled,
        "custom_questions": custom_questions,
        "description": s.description,
        "client_name": s.client_name,
        "company": s.company,
        "email": s.email,
        "status": s.status,
        "created_at": s.created_at.isoformat(),
        "survey_link": f"/survey/{s.uuid}",
    }


@router.post("/surveys")
def create_survey(data: SurveyCreate, db: Session = Depends(get_db)):
    survey_uuid = str(uuid.uuid4())
    session = SurveySession(
        uuid=survey_uuid,
        title=data.title,
        survey_type=data.survey_type,
        intent=data.intent,
        audience=data.audience,
        tone=data.tone,
        scoring_enabled=data.scoring_enabled,
        custom_questions=json.dumps(data.custom_questions or []),
        description=data.description,
        client_name=data.client_name,
        company=data.company,
        email=data.email,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _serialize_session(session)


@router.get("/surveys/{survey_uuid}")
def get_survey(survey_uuid: str, db: Session = Depends(get_db)):
    session = db.query(SurveySession).filter(SurveySession.uuid == survey_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Survey not found")
    return _serialize_session(session)


@router.get("/surveys")
def list_surveys(db: Session = Depends(get_db)):
    sessions = (
        db.query(SurveySession)
        .order_by(SurveySession.created_at.desc())
        .all()
    )
    return [
        {**_serialize_session(s), "response_count": len(s.responses)}
        for s in sessions
    ]
