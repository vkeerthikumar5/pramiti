from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")

def get_answer_and_topic(question: str):
    prompt = f"""
You are an AI assistant.

1. Answer the question clearly.
2. Then give a short topic (1–3 words).

Return strictly in this format:

ANSWER:
<answer here>

TOPIC:
<topic here>

Question:
{question}
"""

    response = client.chat.completions.create(
        model="gemini-2.5-flash",
        messages=[{"role": "user", "content": prompt}],
    )

    content = response.choices[0].message.content

    answer = content.split("TOPIC:")[0].replace("ANSWER:", "").strip()
    topic = content.split("TOPIC:")[1].strip()

    return answer, topic
