const PROVIDERS = {
  openai: ["https://api.openai.com/v1/chat/completions", "OPENAI_API_KEY"],
  grok: ["https://api.x.ai/v1/chat/completions", "XAI_API_KEY"],
  openrouter: ["https://openrouter.ai/api/v1/chat/completions", "OPENROUTER_API_KEY"],
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.APP_PASSWORD || req.headers["x-app-password"] !== process.env.APP_PASSWORD)
    return res.status(401).json({ error: "wrong password" });
  const { provider, model, prompt } = req.body || {};
  const p = PROVIDERS[provider];
  if (!p || !model || !prompt) return res.status(400).json({ error: "need provider, model, prompt" });
  const key = process.env[p[1]];
  if (!key) return res.status(500).json({ error: p[1] + " is not set" });
  try {
    const r = await fetch(p[0], {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ model, messages: [{ role: "user", content: String(prompt).slice(0, 8000) }] }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (j.error && j.error.message) || "provider error" });
    res.json({ text: (j.choices && j.choices[0] && j.choices[0].message.content) || "" });
  } catch (e) {
    res.status(502).json({ error: "request failed" });
  }
}
