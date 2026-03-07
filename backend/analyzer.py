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
    "The customer was very pleased with the product reliability and overall quality. They suggested minor improvements to the UI for a smoother experience.",
    "Strong satisfaction was noted around the integration capabilities and feature set. The onboarding process was smooth and the support team was responsive throughout.",
    "The customer highlighted excellent response times and knowledgeable staff. Pricing was considered fair given the value delivered. Would recommend to others.",
]

MOCK_KEY_INSIGHTS = [
    ["Quick setup was a key strength", "Support team exceeded expectations", "Pricing model needs clarification"],
    ["Onboarding flow is intuitive", "Documentation needs more real-world examples", "Feature parity with competitors is improving"],
    ["Response time is a key differentiator", "Mobile experience needs improvement", "Customer would recommend to peers"],
    ["Integration setup was unexpectedly complex", "UI polish is valued by this segment", "Reliability over six months was noted as excellent"],
]

MOCK_WORD_FREQUENCIES = [
    {
        "setup": 4, "onboarding": 5, "support": 4, "quality": 3, "pricing": 2,
        "features": 3, "documentation": 2, "reliable": 4, "helpful": 3,
        "intuitive": 2, "complex": 2, "fast": 3, "recommend": 4,
        "experience": 3, "easy": 3, "smooth": 4, "responsive": 3
    },
    {
        "integration": 4, "documentation": 3, "response": 5, "team": 4, "smooth": 3,
        "confusing": 2, "excellent": 4, "improve": 3, "platform": 3, "clarity": 2,
        "workflow": 3, "efficient": 4, "flexible": 2, "upgrade": 2, "value": 3,
        "knowledgeable": 3, "transparent": 2
    },
]


def analyze_transcript(transcript: str) -> dict:
    if not OPENAI_API_KEY:
        return _mock_analysis(transcript)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        response = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a feedback analyst. Analyze the given survey transcript and return a JSON object with exactly these fields:\n"
                        "- sentiment: one of \"positive\", \"neutral\", or \"negative\"\n"
                        "- themes: array of 3-8 short topic strings extracted from the conversation (e.g. \"Setup Experience\", \"Support Quality\")\n"
                        "- summary: 2-3 sentence summary of the feedback\n"
                        "- key_insights: array of 3-5 specific actionable insights from the conversation\n"
                        "- score: a number from 1-10 ONLY if the user explicitly stated a numeric rating, otherwise null\n"
                        "- score_context: a short string describing what the score refers to if given, otherwise null\n"
                        "- word_frequencies: an object with 15-25 meaningful words or short phrases as keys and their importance weight (integer 1-5) as values. "
                        "Exclude filler words like 'the', 'and', 'I', 'it', 'a', 'to', 'was', 'is'. Focus on nouns, adjectives, and verbs that carry meaning.\n"
                        "Return ONLY valid JSON, no other text."
                    )
                },
                {
                    "role": "user",
                    "content": f"Analyze this survey transcript:\n\n{transcript}"
                }
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        score_raw = result.get("score")
        score = float(score_raw) if score_raw is not None else None

        return {
            "sentiment": result.get("sentiment", "neutral"),
            "themes": result.get("themes", []),
            "summary": result.get("summary", ""),
            "key_insights": result.get("key_insights", []),
            "score": score,
            "score_context": result.get("score_context"),
            "word_frequencies": result.get("word_frequencies", {}),
        }

    except Exception as e:
        print(f"OpenAI analysis failed: {e}, falling back to mock")
        return _mock_analysis(transcript)


def _mock_analysis(transcript: str) -> dict:
    score = round(random.uniform(5.5, 10.0), 1)
    sentiment = "positive" if score >= 7.5 else ("neutral" if score >= 5.5 else "negative")
    themes = random.sample(MOCK_THEMES_POOL, random.randint(3, 5))
    summary = random.choice(MOCK_SUMMARIES)
    key_insights = random.choice(MOCK_KEY_INSIGHTS)
    word_frequencies = random.choice(MOCK_WORD_FREQUENCIES)

    return {
        "sentiment": sentiment,
        "themes": themes,
        "summary": summary,
        "key_insights": key_insights,
        "score": score,
        "score_context": "overall satisfaction",
        "word_frequencies": word_frequencies,
    }
