// Express server for Docker / Cloud Run / Render / Azure / AWS.
const express = require("express");
const path = require("path");
const { handle, test } = require("./lib/tutor");
const { handleTts, status } = require("./lib/tts");
const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.post("/api/chat", async (req, res) => {
  const r = await handle(req.body, req.ip);
  res.status(r.status).json(r.body);
});
app.get("/api/tts", (_, res) => res.json(status()));
app.post("/api/tts", async (req, res) => {
  const r = await handleTts(req.body, req.ip);
  res.status(r.status).json(r.body);
});
app.get("/api/test", async (_, res) => res.json(await test()));
app.get("/health", (_, res) => res.send("ok"));
app.listen(process.env.PORT || 8080, () => console.log("Ganit Mitra running"));
