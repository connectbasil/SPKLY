import csv
import io
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import SurveySession, Contact, SurveyResponse

router = APIRouter()


def _serialize_contact(c, survey_uuid: str):
    return {
        "id": c.id,
        "survey_id": c.survey_id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "status": c.status,
        "invited_at": c.invited_at.isoformat() if c.invited_at else None,
        "completed_at": c.completed_at.isoformat() if c.completed_at else None,
        "created_at": c.created_at.isoformat(),
        "survey_link": f"/survey/{survey_uuid}?c={c.id}",
    }


class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str  # invited | started | completed | bounced


@router.get("/surveys/{survey_uuid}/contacts")
def list_contacts(survey_uuid: str, db: Session = Depends(get_db)):
    session = db.query(SurveySession).filter(SurveySession.uuid == survey_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Survey not found")
    return [_serialize_contact(c, survey_uuid) for c in session.contacts]


@router.post("/surveys/{survey_uuid}/contacts")
def add_contact(survey_uuid: str, data: ContactCreate, db: Session = Depends(get_db)):
    session = db.query(SurveySession).filter(SurveySession.uuid == survey_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Survey not found")
    contact = Contact(
        survey_id=session.id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        status="invited",
        invited_at=datetime.datetime.utcnow(),
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return _serialize_contact(contact, survey_uuid)


@router.post("/surveys/{survey_uuid}/contacts/import")
async def import_contacts(
    survey_uuid: str,
    request: Request,
    db: Session = Depends(get_db),
):
    session = db.query(SurveySession).filter(SurveySession.uuid == survey_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Survey not found")

    body = await request.body()
    text = body.decode("utf-8-sig")  # handles BOM from Excel exports
    reader = csv.DictReader(io.StringIO(text))

    created = []
    skipped = 0
    for row in reader:
        name = (row.get("name") or row.get("Name") or "").strip()
        email = (row.get("email") or row.get("Email") or "").strip()
        phone = (row.get("phone") or row.get("Phone") or "").strip() or None

        if not email:
            skipped += 1
            continue

        contact = Contact(
            survey_id=session.id,
            name=name or email,
            email=email,
            phone=phone,
            status="invited",
            invited_at=datetime.datetime.utcnow(),
        )
        db.add(contact)
        db.flush()
        created.append(_serialize_contact(contact, survey_uuid))

    db.commit()
    return {"imported": len(created), "skipped": skipped, "contacts": created}


@router.get("/contacts/{contact_id}")
def get_contact_detail(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    survey_uuid = contact.session.uuid

    # Build timeline from available timestamps
    timeline = []
    if contact.invited_at:
        timeline.append({"event": "invited", "label": "Added to survey", "ts": contact.invited_at.isoformat()})
    if contact.status == "bounced":
        ts = contact.completed_at or contact.created_at
        timeline.append({"event": "bounced", "label": "Marked as bounced", "ts": ts.isoformat() if ts else None})

    # Find best-match response: most recent for this session created after invited_at
    response_data = None
    if contact.status == "completed" and contact.invited_at:
        response = (
            db.query(SurveyResponse)
            .filter(
                SurveyResponse.session_id == contact.survey_id,
                SurveyResponse.created_at >= contact.invited_at,
            )
            .order_by(SurveyResponse.created_at.desc())
            .first()
        )
        if response:
            if contact.completed_at:
                timeline.append({"event": "started",   "label": "Call started",      "ts": contact.completed_at.isoformat()})
                timeline.append({"event": "completed", "label": "Call completed",     "ts": contact.completed_at.isoformat()})
            timeline.append({"event": "recorded",  "label": "Response recorded",  "ts": response.created_at.isoformat()})

            themes = []
            key_insights = []
            try:
                themes = json.loads(response.themes) if response.themes else []
            except Exception:
                pass
            try:
                key_insights = json.loads(response.key_insights) if response.key_insights else []
            except Exception:
                pass

            response_data = {
                "score": response.score,
                "score_context": response.score_context,
                "sentiment": response.sentiment,
                "themes": themes,
                "summary": response.summary,
                "key_insights": key_insights,
                "transcript": response.transcript,
                "recording_url": response.recording_url,
            }
        elif contact.completed_at:
            timeline.append({"event": "completed", "label": "Call completed", "ts": contact.completed_at.isoformat()})

    return {
        **_serialize_contact(contact, survey_uuid),
        "timeline": timeline,
        "response": response_data,
    }


@router.patch("/contacts/{contact_id}")
def update_contact_status(contact_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    valid = {"invited", "started", "completed", "bounced"}
    if data.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")

    contact.status = data.status
    if data.status == "completed" and not contact.completed_at:
        contact.completed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(contact)
    survey_uuid = contact.session.uuid
    return _serialize_contact(contact, survey_uuid)
