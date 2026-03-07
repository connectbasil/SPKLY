import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class SurveySession(Base):
    __tablename__ = "survey_sessions"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True)
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
    csat_score = Column(Float)
    sentiment = Column(String)
    themes = Column(Text)  # JSON array stored as string
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("SurveySession", back_populates="responses")
