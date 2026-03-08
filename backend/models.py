import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base


class SurveySession(Base):
    __tablename__ = "survey_sessions"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True)

    # Core identity
    title = Column(String)
    survey_type = Column(String)           # csat | nps | enps | star | product | personal | event | research

    # Rich creation metadata
    intent = Column(Text)                  # plain English: what do you want to learn?
    audience = Column(String)              # Customers | Employees | Event Attendees | General Public
    tone = Column(String)                  # Formal | Casual | Empathetic
    scoring_enabled = Column(Boolean, default=True)
    custom_questions = Column(Text)        # JSON array of question strings

    # Legacy contact fields (kept for backward compat, optional)
    description = Column(Text)
    client_name = Column(String)
    company = Column(String)
    email = Column(String)

    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    responses = relationship("SurveyResponse", back_populates="session")
    contacts = relationship("Contact", back_populates="session")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("survey_sessions.id"))
    name = Column(String)
    email = Column(String)
    phone = Column(String, nullable=True)
    status = Column(String, default="invited")   # invited | started | completed | bounced
    invited_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("SurveySession", back_populates="contacts")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("survey_sessions.id"), nullable=True)
    transcript = Column(Text)
    sentiment = Column(String)
    themes = Column(Text)            # JSON array
    summary = Column(Text)
    key_insights = Column(Text)      # JSON array
    score = Column(Float, nullable=True)
    score_context = Column(String, nullable=True)
    word_frequencies = Column(Text)  # JSON object
    recording_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("SurveySession", back_populates="responses")
