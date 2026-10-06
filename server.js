// Express server for Docker / Cloud Run / Render / Azure / AWS.
const express = require("express");
const path = require("path");
const { handle } = require("./lib/tutor");
const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.post("/api/chat", async (req, res) => {
  const r = await handle(req.body, req.ip);
  res.status(r.status).json(r.body);
});
app.get("/health", (_, res) => res.send("ok"));
app.listen(process.env.PORT || 8080, () => console.log("Ganit Mitra running"));
