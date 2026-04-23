const express = require("express");
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-service, x-ant-key, x-yt-key");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.get("/", (req, res) => res.json({ ok: true }));

app.post("/api/proxy", async (req, res) => {
  const svc = req.headers["x-service"];
  try {
    if (svc === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": req.headers["x-ant-key"], "anthropic-version": "2023-06-01" },
        body: JSON.stringify(req.body)
      });
      return res.status(r.status).json(await r.json());
    }
    if (svc === "youtube") {
      const path = req.originalUrl.replace("/api/proxy", "");
      const url = new URL("https://www.googleapis.com" + path);
      url.searchParams.set("key", req.headers["x-yt-key"]);
      const r = await fetch(url.toString());
      return res.status(r.status).json(await r.json());
    }
    res.status(400).json({ error: "unknown service" });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/proxy", async (req, res) => {
  const svc = req.headers["x-service"];
  if (!svc) return res.json({ ok: true });
  try {
    const path = req.originalUrl.replace("/api/proxy", "");
    const url = new URL("https://www.googleapis.com" + path);
    url.searchParams.set("key", req.headers["x-yt-key"]);
    const r = await fetch(url.toString());
    return res.status(r.status).json(await r.json());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Proxy running on port " + PORT));
