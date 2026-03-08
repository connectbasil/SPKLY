import json
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SurveySession, SurveyResponse, Contact
from analyzer import analyze_transcript

router = APIRouter()


@router.post("/webhook/vapi")
async def vapi_webhook(payload: dict, db: Session = Depends(get_db)):
    try:
        # Extract transcript from Vapi payload structure
        transcript = ""
        message = payload.get("message", {})

        # Try artifact messages array (end-of-call report)
        messages = message.get("artifact", {}).get("messages", [])
        if messages:
            parts = []
            for msg in messages:
                role = msg.get("role", "unknown")
                content = msg.get("message", msg.get("content", ""))
                if content:
                    parts.append(f"{role}: {content}")
            transcript = "\n".join(parts)

        # Fallback: flat transcript field
        if not transcript:
            transcript = (
                message.get("transcript")
                or payload.get("transcript")
                or ""
            )

        if not transcript:
            return {"status": "ignored", "reason": "no transcript found"}

        # Resolve survey session from metadata
        call_data = message.get("call", {})
        metadata = call_data.get("metadata", {})
        survey_uuid = metadata.get("survey_uuid")
        contact_id = metadata.get("contact_id")

        session = None
        if survey_uuid:
            session = db.query(SurveySession).filter(
                SurveySession.uuid == survey_uuid
            ).first()

        # Mark contact as completed if present
        if contact_id:
            contact = db.query(Contact).filter(Contact.id == int(contact_id)).first()
            if contact:
                contact.status = "completed"
                contact.completed_at = datetime.datetime.utcnow()
                db.add(contact)

        # Analyze transcript
        analysis = analyze_transcript(transcript)

        # Persist response
        response = SurveyResponse(
            session_id=session.id if session else None,
            transcript=transcript,
            sentiment=analysis["sentiment"],
            themes=json.dumps(analysis["themes"]),
            summary=analysis["summary"],
            key_insights=json.dumps(analysis["key_insights"]),
            score=analysis["score"],
            score_context=analysis.get("score_context"),
            word_frequencies=json.dumps(analysis["word_frequencies"]),
        )
        db.add(response)
        db.commit()
        db.refresh(response)

        return {
            "status": "success",
            "response_id": response.id,
            "analysis": analysis,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
