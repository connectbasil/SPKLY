import os
import json
import random
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

MOCK_THEMES_POOL = [
    "Response Time", "Product Quality", "Support Staff", "Pricing",
    "Onboarding", "Features", "Documentation", "Reliability", "UI/UX", "Integration"
]

MOCK_SUMMARIES = [
    "The customer expressed overall satisfaction with the product quality and support received. They highlighted the ease of onboarding as a key positive. Minor concerns were raised about pricing transparency.",
    "The respondent indicated a positive experience, particularly praising the support staff's responsiveness. Product features were appreciated, though documentation could be more comprehensive.",
    "The customer was very pleased with the product's reliability and overall quality. They suggested minor improvements to the UI for a smoother experience.",
    "Strong satisfaction was noted around the integration capabilities and feature set. The onboarding process was smooth and the support team was responsive throughout.",
    "The customer highlighted excellent response times and knowledgeable staff. Pricing was considered fair given the value delivered. Would recommend to others.",
]


def analyze_transcript(transcript: str) -> dict:
    if not OPENAI_API_KEY:
        return _mock_analysis(transcript)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a CSAT survey analyst. Analyze the given customer transcript and return a JSON object with:\n"
                        "- csat_score: number from 1-10 representing customer satisfaction\n"
                        "- sentiment: one of \"positive\", \"neutral\", or \"negative\"\n"
                        "- themes: array of up to 5 short theme strings extracted from the conversation\n"
                        "- summary: 2-3 sentence summary of the feedback\n"
                        "Return ONLY valid JSON, no other text."
                    )
                },
                {
                    "role": "user",
                    "content": f"Analyze this customer survey transcript:\n\n{transcript}"
                }
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return {
            "csat_score": float(result.get("csat_score", 7)),
            "sentiment": result.get("sentiment", "neutral"),
            "themes": result.get("themes", []),
            "summary": result.get("summary", "")
        }

    except Exception as e:
        print(f"OpenAI analysis failed: {e}, falling back to mock")
        return _mock_analysis(transcript)


def _mock_analysis(transcript: str) -> dict:
    score = round(random.uniform(5.5, 10.0), 1)
    sentiment = "positive" if score >= 7.5 else ("neutral" if score >= 5.5 else "negative")
    themes = random.sample(MOCK_THEMES_POOL, random.randint(2, 4))
    summary = random.choice(MOCK_SUMMARIES)

    return {
        "csat_score": score,
        "sentiment": sentiment,
        "themes": themes,
        "summary": summary
    }
