import json
import urllib.request

payload = {
    "message": {
        "type": "end-of-call-report",
        "call": {
            "id": "call_abc123fake456",
            "metadata": {
                "survey_uuid": "test-123"
            }
        },
        "artifact": {
            "messages": [
                {"role": "assistant", "message": "Hello. Thanks for joining me today."},
                {"role": "user",      "message": "Hello. What's up?"},
                {"role": "assistant", "message": "Hi there. Thanks for taking the time to chat. I'm here to ask you a few quick questions as part of a short survey. It won't take long, and there are no right or wrong answers. Whenever you're ready, shall we get started?"},
                {"role": "user",      "message": "Yes, please."},
                {"role": "assistant", "message": "Great. Let's jump in. Could you tell me about your overall experience with our service so far?"},
                {"role": "user",      "message": "It's been a mixed bag. I wouldn't say that I'm unhappy, but then at the same time, I'm not too happy as well."},
                {"role": "assistant", "message": "Thank you for sharing that. Can you tell me a bit more about what aspects you found positive and what didn't meet your expectations?"},
                {"role": "user",      "message": "Positive was the setup did not take a lot of time. However, what I got confused with was the number of options that you had, which felt very advanced. For non developers like me, there should have been an option to do things far easier."},
                {"role": "assistant", "message": "It sounds like you appreciated the quick setup, but found the options a bit overwhelming. Was there any support or guidance you received during setup? How did you feel about it?"},
                {"role": "user",      "message": "There were tooltips available. However, I made sure all my options were vetted with Claude before I answered them. So Claude was more helpful than the tooltips itself."},
                {"role": "assistant", "message": "It sounds like the tooltips were there but you found Claude resources even more helpful. Last question - if you could change one thing about your experience, what would it be?"},
                {"role": "user",      "message": "Add more explainer videos on the platform. And at the beginning of the assistant creation journey, try to understand whether I want advanced settings or something really basic."},
                {"role": "assistant", "message": "Thank you for sharing. You'd like more explainer videos and a way for the platform to understand at the start whether you need basic or advanced settings. To sum up - you appreciated the quick setup but found the options overwhelming and relied more on Claude than tooltips. Thanks so much for your thoughtful feedback today."},
                {"role": "user",      "message": "Thank you."}
            ]
        }
    }
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    "http://localhost:8000/webhook/vapi",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        print(json.dumps(body, indent=2))
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode('utf-8')}")
except urllib.error.URLError as e:
    print(f"Connection error: {e.reason}")
    print("Is the backend running? Try: uvicorn main:app --reload --port 8000")
