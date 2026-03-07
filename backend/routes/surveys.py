import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import SurveySession

router = APIRouter()


class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    client_name: str
    company: str
    email: str


def _serialize_session(s):
    return {
        "id": s.id,
        "uuid": s.uuid,
        "title": s.title,
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
        description=data.description,
        client_name=data.client_name,
        company=data.company,
        email=data.email,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
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
