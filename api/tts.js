// Vercel serverless function: GET /api/tts (status) and POST /api/tts (speech)
const { handleTts, status } = require("../lib/tts");
module.exports = async (req, res) => {
  if (req.method === "GET") return res.status(200).json(status());
  if (req.method !== "POST") return res.status(405).json({ error: "Not allowed" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const r = await handleTts(req.body, ip);
  res.status(r.status).json(r.body);
};
