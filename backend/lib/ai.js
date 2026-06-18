// AI quiz authoring. Drafts multiple-choice questions from a course's lesson
// content using a pluggable provider — so you can use a FREE option (Google
// Gemini free tier, Groq free tier, or a fully-local Ollama with no key) or a
// paid one (Anthropic Claude). Provider + key + model are read from the
// environment first, then per-org settings, so they can be set in .env OR
// configured in-app under Settings → AI. Generated questions are always
// returned for review and never saved automatically.
const pool = require("../config/db");

// Public provider catalogue (sent to the Settings UI — no secrets).
const PROVIDERS_PUBLIC = [
  { value: "gemini", label: "Google Gemini — free tier", needsKey: true, free: true,
    keyHint: "Get a free key at aistudio.google.com/apikey",
    models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"], defaultModel: "gemini-2.0-flash" },
  { value: "groq", label: "Groq — free tier, very fast", needsKey: true, free: true,
    keyHint: "Get a free key at console.groq.com/keys",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"], defaultModel: "llama-3.3-70b-versatile" },
  { value: "ollama", label: "Ollama — free, runs locally (no key)", needsKey: false, free: true,
    keyHint: "Install from ollama.com, then run: ollama pull llama3.1",
    models: ["llama3.1", "qwen2.5", "mistral", "phi3"], defaultModel: "llama3.1" },
  { value: "anthropic", label: "Anthropic Claude — paid", needsKey: true, free: false,
    keyHint: "Get a key at console.anthropic.com",
    models: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"], defaultModel: "claude-sonnet-4-6" },
];
const META = Object.fromEntries(PROVIDERS_PUBLIC.map((p) => [p.value, p]));
const DEFAULT_PROVIDER = "gemini";

// Resolve provider/key/model/baseUrl for an org (env wins over per-org settings).
async function config(orgId) {
  const { rows } = await pool.query(
    "SELECT key, value FROM org_settings WHERE org_id=$1 AND key IN ('ai_provider','ai_api_key','ai_model','ai_base_url')", [orgId]
  );
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const provider = (process.env.AI_PROVIDER || s.ai_provider || DEFAULT_PROVIDER).trim();

  const envKeyByProvider = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    groq: process.env.GROQ_API_KEY,
    ollama: undefined,
  }[provider];
  const envKey = envKeyByProvider || process.env.AI_API_KEY;
  const apiKey = (envKey || s.ai_api_key || "").trim();

  const model = (process.env.AI_MODEL || s.ai_model || META[provider]?.defaultModel || "").trim();
  const baseUrl = (process.env.OLLAMA_URL || s.ai_base_url || "http://localhost:11434").trim();

  return { provider, apiKey, model, baseUrl, keyEnv: !!envKey };
}

// Ollama needs a reachable host rather than a key; others need a key.
const isConfigured = (cfg) => (cfg.provider === "ollama" ? true : !!cfg.apiKey);

async function apiError(res, name) {
  let detail = `${name} error (${res.status})`;
  try { const e = await res.json(); detail = e?.error?.message || e?.message || detail; } catch { /* keep default */ }
  if (res.status === 401 || res.status === 403) detail = `The ${name} API key was rejected. Check it under Settings → AI.`;
  const err = new Error(detail); err.status = (res.status === 401 || res.status === 403) ? 400 : 502;
  return err;
}

// ── Provider calls — each returns the model's raw text ───────────────────────
async function callAnthropic(cfg, system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: cfg.model, max_tokens: 4000, temperature: 0.4, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw await apiError(res, "Anthropic");
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

async function callGemini(cfg, system, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 4096, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw await apiError(res, "Gemini");
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
}

async function callGroq(cfg, system, user) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, temperature: 0.4, max_tokens: 4000,
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!res.ok) throw await apiError(res, "Groq");
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callOllama(cfg, system, user) {
  const base = (cfg.baseUrl || "http://localhost:11434").replace(/\/$/, "");
  let res;
  try {
    res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: cfg.model, stream: false, format: "json", options: { temperature: 0.4 },
        messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
  } catch {
    const err = new Error(`Could not reach Ollama at ${base}. Make sure it's running (try: ollama serve).`); err.status = 502; throw err;
  }
  if (!res.ok) throw await apiError(res, "Ollama");
  const data = await res.json();
  return data.message?.content || "";
}

function callModel(cfg, system, user) {
  switch (cfg.provider) {
    case "gemini": return callGemini(cfg, system, user);
    case "groq": return callGroq(cfg, system, user);
    case "ollama": return callOllama(cfg, system, user);
    default: return callAnthropic(cfg, system, user);
  }
}

// ── Parsing helpers ──────────────────────────────────────────────────────────
function extractJsonArray(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
}

function clean(q) {
  if (!q || typeof q.prompt !== "string") return null;
  const prompt = q.prompt.trim();
  const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [];
  if (!prompt || options.length < 2 || options.length > 6) return null;
  let ci = Number.isInteger(q.correct_index) ? q.correct_index : parseInt(q.correct_index, 10);
  if (!Number.isInteger(ci) || ci < 0 || ci >= options.length) ci = 0;
  return { prompt, options, correct_index: ci };
}

function materialFrom(course, lessons) {
  const parts = [`Course title: ${course.title}`];
  if (course.category) parts.push(`Category: ${course.category}`);
  if (course.description) parts.push(`Course description: ${course.description}`);
  parts.push("\nLessons:");
  for (const l of lessons) {
    const body = (l.body || "").replace(/\s+/g, " ").trim();
    parts.push(`\n## ${l.title}${l.type !== "text" ? ` (${l.type})` : ""}\n${body || "(no text content)"}`);
  }
  let text = parts.join("\n");
  if (text.length > 14000) text = text.slice(0, 14000) + "\n…(truncated)";
  return text;
}

// Generate `count` MCQs from the course. Returns { questions } or throws.
async function generateQuestions(cfg, { course, lessons, count }) {
  const n = Math.min(Math.max(parseInt(count, 10) || 5, 1), 15);
  const material = materialFrom(course, lessons);

  const system =
    "You are an expert instructional designer writing assessment questions for a corporate " +
    "training platform. You write clear, unambiguous multiple-choice questions that test genuine " +
    "understanding of the supplied material — not trivia or trick questions. Every question must be " +
    "answerable purely from the material provided. Always respond with only a JSON array.";

  const user =
    `From the course material below, write exactly ${n} multiple-choice quiz questions.\n\n` +
    `Rules:\n` +
    `- Each question has exactly 4 options with exactly one correct answer.\n` +
    `- Ground every question and answer in the supplied material.\n` +
    `- Vary the difficulty and cover different lessons/topics.\n` +
    `- Avoid "All of the above", "None of the above", and true/false phrasing.\n` +
    `- Keep prompts and options concise.\n\n` +
    `Respond with ONLY a JSON array, no prose, in this exact shape:\n` +
    `[{"prompt":"...","options":["...","...","...","..."],"correct_index":0}]\n\n` +
    `--- COURSE MATERIAL ---\n${material}`;

  const text = await callModel(cfg, system, user);
  const arr = extractJsonArray(text);
  if (!arr) { const e = new Error("The AI response could not be parsed. Please try again."); e.status = 502; throw e; }

  const questions = arr.map(clean).filter(Boolean);
  if (!questions.length) { const e = new Error("The AI did not return any usable questions."); e.status = 502; throw e; }
  return { questions };
}

module.exports = { config, isConfigured, generateQuestions, PROVIDERS_PUBLIC };
