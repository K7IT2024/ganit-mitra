// Shared AI tutor logic (used by Vercel function and Express server).
const OPEN = process.env.PROVIDER === "openai"; // any OpenAI-compatible server: Ollama, vLLM, Groq, Together, OpenRouter...
const MODEL = process.env.MODEL || (OPEN ? "" : "claude-haiku-4-5-20251001");
const LIMIT = +process.env.RATE_PER_MIN || 30;
const SYSTEM =
  "You are Ganit Mitra, a kind maths teacher for Indian school students (CBSE/NCERT, Classes 1 to 10). " +
  "Only help with maths and maths learning. If asked about anything else, gently bring the child back to maths. " +
  "Keep content child-safe. Never ask for or store personal details such as name, phone, address or school.";

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const a = (hits.get(ip) || []).filter((t) => now - t < 60000);
  a.push(now);
  hits.set(ip, a);
  if (hits.size > 5000) hits.clear();
  return a.length > LIMIT;
}

async function handle(body, ip) {
  if (OPEN ? !(process.env.BASE_URL && MODEL) : !process.env.ANTHROPIC_API_KEY) return { status: 500, body: { error: "Server not configured" } };
  if (limited(ip || "unknown")) return { status: 429, body: { error: "Too many requests" } };
  const m = body && body.messages;
  const valid =
    Array.isArray(m) && m.length > 0 && m.length <= 20 &&
    m.every((x) => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string" && x.content.length > 0 && x.content.length <= 4000) &&
    m[m.length - 1].role === "user";
  if (!valid) return { status: 400, body: { error: "Bad request" } };
  try {
    if (OPEN) {
      const r = await fetch(process.env.BASE_URL.replace(/\/$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + (process.env.API_KEY || "none") },
        body: JSON.stringify({ model: MODEL, max_tokens: 800, messages: [{ role: "system", content: SYSTEM }, ...m] }),
      });
      if (!r.ok) return { status: 502, body: { error: "AI service error" } };
      const j = await r.json();
      const t = ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "").trim();
      return { status: 200, body: { text: t || "Sorry, please ask again." } };
    }
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 800, system: SYSTEM, messages: m }),
    });
    if (!r.ok) return { status: 502, body: { error: "AI service error" } };
    const j = await r.json();
    const text = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return { status: 200, body: { text: text || "Sorry, please ask again." } };
  } catch (e) {
    return { status: 502, body: { error: "AI service error" } };
  }
}
module.exports = { handle };
