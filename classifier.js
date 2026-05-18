//you should get ur own sorryyy
const GROQ_API_KEY = "your_groq_api_key_here";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function classifyYouTubeActivity(activity) {
  if (activity.type === "surfing") {
    return {
      ...activity,
      category: "browsing",
      reason: "Surfing YouTube without watching a specific video",
      confidence: "high"
    };
  }

  const prompt = `You are analyzing a YouTube video title to classify it for a productivity tracker.

Video title: "${activity.title}"
Video type: ${activity.type === "shorts" ? "YouTube Short" : "Regular YouTube Video"}

Classify this into exactly ONE of these categories:
- "educational" — tutorials, documentaries, news, science, coding, history, how-to, lectures, study content
- "entertainment" — vlogs, memes, drama, gossip, reaction videos, comedy, music videos, gaming
- "ambiguous" — could genuinely be either depending on context

Respond in this exact JSON format, nothing else, no markdown, no backticks:
{
  "category": "educational" or "entertainment" or "ambiguous",
  "confidence": "high" or "medium" or "low",
  "reason": "one short sentence explaining why"
}`;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return {
      ...activity,
      category: result.category,
      confidence: result.confidence,
      reason: result.reason
    };
  } catch (e) {
    console.error("Classification failed:", e);
    return {
      ...activity,
      category: "unknown",
      confidence: "low",
      reason: "Classification failed"
    };
  }
}