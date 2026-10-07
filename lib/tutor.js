// Shared AI tutor logic (used by Vercel function and Express server).
const OPEN = process.env.PROVIDER === "openai"; // any OpenAI-compatible server: Ollama, vLLM, Groq, Together, OpenRouter...
const MODEL = process.env.MODEL || (OPEN ? "" : "claude-haiku-4-5-20251001");
const LIMIT = +process.env.RATE_PER_MIN || 30;
const SYSTEM =
  "You are Ganit Mitra, a kind maths teacher for Indian school students (CBSE/NCERT, Classes 1 to 10). " +
  "Only help with maths and maths learning. If asked about anything else, gently bring the child back to maths. " +
  "Keep content child-safe. Never ask for or store personal details such as name, phone, address or school.";

let EXTRA = {};
try { EXTRA = JSON.parse(process.env.EXTRA_BODY || "{}"); } catch (e) { console.error("EXTRA_BODY is not valid JSON"); }
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
  const MAXT = Math.min(Math.max(+body.max_tokens || 1500, 200), 3000);
  try {
    if (OPEN) {
      const r = await fetch(process.env.BASE_URL.replace(/\/$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + (process.env.API_KEY || "none") },
        body: JSON.stringify({ model: MODEL, max_tokens: MAXT, messages: [{ role: "system", content: SYSTEM }, ...m], ...EXTRA }),
      });
      if (!r.ok) {
        const d = await r.text().catch(() => "");
        console.error("AI error", r.status, d.slice(0, 300));
        return { status: 502, body: { error: "AI service error", upstream: r.status }, detail: d.slice(0, 300) };
      }
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
      body: JSON.stringify({ model: MODEL, max_tokens: MAXT, system: SYSTEM, messages: m }),
    });
    if (!r.ok) {
        const d = await r.text().catch(() => "");
        console.error("AI error", r.status, d.slice(0, 300));
        return { status: 502, body: { error: "AI service error", upstream: r.status }, detail: d.slice(0, 300) };
      }
    const j = await r.json();
    const text = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return { status: 200, body: { text: text || "Sorry, please ask again." } };
  } catch (e) {
    console.error("AI request failed", e && e.message);
    return { status: 502, body: { error: "AI service error", upstream: 0 }, detail: String(e && e.message) };
  }
}

// Diagnostic: open /api/test in the browser to see exactly what is wrong. Set DISABLE_TEST=1 to turn off.
const HINTS = {
  500: OPEN ? "Missing settings. Add PROVIDER=openai, BASE_URL and MODEL in Environment, then redeploy." : "ANTHROPIC_API_KEY is missing. Add it in Environment (exact spelling) and redeploy.",
  401: "The API key is wrong or has extra spaces/quotes. Create a new key and paste it again.",
  403: "The key is not allowed to use this model or service.",
  402: "No credit on the AI account. Add credit, or pick a free/cheaper model.",
  404: "The MODEL name or BASE_URL is wrong. Copy the model name exactly; BASE_URL must not end with /chat/completions.",
  429: "Too many requests or a free model limit. Wait a minute, or use a paid model.",
  400: "The AI service rejected the request. Check the MODEL name and that it supports chat.",
};
async function test() {
  if (process.env.DISABLE_TEST === "1") return { disabled: true };
  const r = await handle({ messages: [{ role: "user", content: "Reply with the single word OK" }] }, "diagnostic");
  const code = r.status === 200 ? 200 : r.status === 502 ? r.body.upstream : r.status;
  return {
    ok: r.status === 200,
    provider: OPEN ? "openai-compatible" : "anthropic",
    model: MODEL || null,
    baseUrl: OPEN ? process.env.BASE_URL || null : "api.anthropic.com",
    keyPresent: OPEN ? !!process.env.API_KEY : !!process.env.ANTHROPIC_API_KEY,
    status: r.status,
    upstreamStatus: r.body.upstream === undefined ? null : r.body.upstream,
    reply: r.body.text || null,
    problem: r.status === 200 ? null : HINTS[code] || "Unknown problem. Read the Render Logs for the line starting with 'AI error'.",
    detail: r.detail || null,
  };
}
module.exports = { handle, test };
