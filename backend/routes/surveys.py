import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import SurveySession

router = APIRouter()


class SurveyCreate(BaseModel):
    client_name: str
    company: str
    email: str


@router.post("/surveys")
def create_survey(data: SurveyCreate, db: Session = Depends(get_db)):
    survey_uuid = str(uuid.uuid4())
    session = SurveySession(
        uuid=survey_uuid,
        client_name=data.client_name,
        company=data.company,
        email=data.email,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "id": session.id,
        "uuid": session.uuid,
        "client_name": session.client_name,
        "company": session.company,
        "email": session.email,
        "status": session.status,
        "created_at": session.created_at.isoformat(),
        "survey_link": f"/survey/{session.uuid}",
    }


@router.get("/surveys")
def list_surveys(db: Session = Depends(get_db)):
    sessions = (
        db.query(SurveySession)
        .order_by(SurveySession.created_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "uuid": s.uuid,
            "client_name": s.client_name,
            "company": s.company,
            "email": s.email,
            "status": s.status,
            "created_at": s.created_at.isoformat(),
            "survey_link": f"/survey/{s.uuid}",
            "response_count": len(s.responses),
        }
        for s in sessions
    ]
