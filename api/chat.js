// Vercel serverless function: POST /api/chat
const { handle } = require("../lib/tutor");
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const r = await handle(req.body, ip);
  res.status(r.status).json(r.body);
};
