// Optional cloud voice (Google Cloud Text-to-Speech). Enabled when GOOGLE_TTS_KEY is set.
const LANGS = new Set(["en-IN","hi-IN","kn-IN","te-IN","ta-IN","mr-IN","bn-IN","gu-IN","ml-IN","pa-IN","or-IN","ur-IN"]);
const LIMIT = +process.env.TTS_RATE_PER_MIN || 90;
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const a = (hits.get(ip) || []).filter((t) => now - t < 60000);
  a.push(now);
  hits.set(ip, a);
  if (hits.size > 5000) hits.clear();
  return a.length > LIMIT;
}
const status = () => ({ on: !!process.env.GOOGLE_TTS_KEY });

async function handleTts(body, ip) {
  if (!process.env.GOOGLE_TTS_KEY) return { status: 404, body: { error: "Cloud voice not enabled" } };
  if (limited(ip || "unknown")) return { status: 429, body: { error: "Too many requests" } };
  const text = body && typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 400 || !LANGS.has(body.lang)) return { status: 400, body: { error: "Bad request" } };
  try {
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + process.env.GOOGLE_TTS_KEY, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: body.lang },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.9 },
      }),
    });
    if (!r.ok) return { status: 502, body: { error: "Voice service error" } };
    const j = await r.json();
    return { status: 200, body: { audio: j.audioContent } };
  } catch (e) {
    return { status: 502, body: { error: "Voice service error" } };
  }
}
module.exports = { handleTts, status };
