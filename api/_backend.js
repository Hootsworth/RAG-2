import { detectPersonaDrift } from "../src/persona_drift_detector.js";
import { classifyIntent, DEFAULT_INTENT_MODEL } from "../src/intent_classifier.js";
import { resolveRagConflict } from "../src/rag_conflict_resolver.js";
import { ROUND_1_PERSONA_JSON, SISTER_QUERY_CHUNKS } from "../src/sample_data.js";

const memoryStore = {
  persona: structuredClone(ROUND_1_PERSONA_JSON),
  chunks: structuredClone(SISTER_QUERY_CHUNKS),
  updatedAt: new Date().toISOString()
};

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.status(204).end();
    return true;
  }
  return false;
}

export function health() {
  return {
    ok: true,
    service: "memory-os",
    mode: "serverless-backend",
    storage: "warm-instance-memory",
    model: DEFAULT_INTENT_MODEL.version
  };
}

export function getMemory() {
  return memoryStore;
}

export function getDrift() {
  return detectPersonaDrift(memoryStore.persona);
}

export function classifyMessage(message) {
  return classifyIntent(String(message || ""), DEFAULT_INTENT_MODEL);
}

export function resolveQuery(query, now) {
  return resolveRagConflict(String(query || "Did I mention anything about my sister?"), memoryStore.chunks, {
    now: now || new Date().toISOString()
  });
}

export function addMessage(body = {}) {
  const message = {
    id: body.id || `p-${Date.now()}`,
    timestamp: body.timestamp || new Date().toISOString(),
    topic: body.topic || "user-added",
    text: String(body.text || ""),
    people: Array.isArray(body.people) ? body.people : []
  };

  if (!message.text.trim()) {
    return { error: "message_text_required" };
  }

  memoryStore.persona.messages.push(message);
  memoryStore.updatedAt = new Date().toISOString();
  return message;
}

export function send(res, status, payload) {
  setCors(res);
  res.status(status).json(payload);
}
