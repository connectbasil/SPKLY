import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class SurveySession(Base):
    __tablename__ = "survey_sessions"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True)
    title = Column(String)
    description = Column(Text)
    client_name = Column(String)
    company = Column(String)
    email = Column(String)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    responses = relationship("SurveyResponse", back_populates="session")


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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("SurveySession", back_populates="responses")
