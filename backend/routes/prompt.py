import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SurveySession

router = APIRouter()

TONE_INSTRUCTIONS = {
    "formal":    "Use professional, precise language. Be respectful and structured.",
    "casual":    "Use conversational, friendly language. Keep it relaxed and natural.",
    "empathetic": "Use warm, supportive language. Acknowledge the respondent's feelings and show genuine care.",
}

SCORE_SCALES = {
    "csat":  ("1 to 5", "where 1 is very dissatisfied and 5 is very satisfied"),
    "nps":   ("0 to 10", "where 0 is not at all likely and 10 is extremely likely to recommend"),
    "enps":  ("0 to 10", "where 0 is not at all likely and 10 is extremely likely to recommend"),
    "star":  ("1 to 5", "where 1 is very poor and 5 is excellent"),
}

DEFAULT_QUESTIONS = {
    "csat":     ["How would you describe your overall experience with us?",
                 "What did we do well that you'd like to see us continue?",
                 "Is there anything that frustrated you or could be improved?"],
    "nps":      ["What prompted you to give us that rating?",
                 "What would make you more likely to recommend us?"],
    "enps":     ["What's the main reason for your score?",
                 "What would make this a better place to work?"],
    "star":     ["What stood out most about your experience?",
                 "Is there anything we could have done better?"],
    "product":  ["What problem were you trying to solve when you started using this product?",
                 "What features do you find most valuable?",
                 "Is there anything missing or frustrating about the product?"],
    "personal": ["What specific behaviours or contributions would you like to highlight?",
                 "What areas do you think there is room for growth?",
                 "What's one thing that would make working together even better?"],
    "event":    ["How would you describe the overall event experience?",
                 "What sessions or moments stood out to you?",
                 "What could be improved for next time?"],
    "research": ["Can you walk me through how you currently approach this problem?",
                 "What tools or methods are you using today, and how well are they working?",
                 "If you could change one thing about your current process, what would it be?"],
}


def _build_prompt(session: SurveySession) -> str:
    tone_key = (session.tone or "empathetic").lower()
    tone_text = TONE_INSTRUCTIONS.get(tone_key, TONE_INSTRUCTIONS["empathetic"])

    survey_type = (session.survey_type or "csat").lower()
    audience = session.audience or "participants"
    intent = session.intent or f"collect feedback about {session.title or 'your experience'}"

    # Questions: use custom ones if provided, else fall back to defaults
    questions = []
    if session.custom_questions:
        try:
            questions = json.loads(session.custom_questions)
        except Exception:
            pass
    if not questions:
        questions = DEFAULT_QUESTIONS.get(survey_type, DEFAULT_QUESTIONS["csat"])

    numbered = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))

    # Scoring instructions
    scoring_block = ""
    if session.scoring_enabled and survey_type in SCORE_SCALES:
        scale, description = SCORE_SCALES[survey_type]
        scoring_block = (
            f"\nAfter the questions, ask the respondent to rate their experience "
            f"on a scale of {scale}, {description}. "
            f"Wait for their number before closing the call."
        )

    prompt = f"""You are a voice feedback agent conducting a survey called "{session.title or 'Feedback Survey'}".

Your goal is to {intent}.
You are speaking with: {audience}.
Tone: {tone_text}

Ask the following questions in order, one at a time. Wait for the respondent to finish answering before moving on. Do not rush.

{numbered}
{scoring_block}

After covering all questions, thank the respondent warmly and let them know their feedback is valued. Then end the call.

Important:
- Keep your questions exactly as written — do not paraphrase or add new ones.
- If a respondent goes off-topic, gently guide them back to the next question.
- Never reveal that you are an AI unless directly asked.
- Do not summarise responses back to the user unless asked."""

    return prompt.strip()


@router.get("/prompt/{survey_uuid}")
def get_survey_prompt(survey_uuid: str, db: Session = Depends(get_db)):
    session = db.query(SurveySession).filter(SurveySession.uuid == survey_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Survey not found")

    return {"prompt": _build_prompt(session)}
