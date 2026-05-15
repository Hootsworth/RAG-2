import { detectPersonaDrift } from "./persona_drift_detector.js";
import { classifyIntent, DEFAULT_INTENT_MODEL } from "./intent_classifier.js";
import { resolveRagConflict } from "./rag_conflict_resolver.js";
import { ROUND_1_PERSONA_JSON, SISTER_QUERY_CHUNKS } from "./sample_data.js";

const drift = detectPersonaDrift(ROUND_1_PERSONA_JSON);
const intent = classifyIntent("remind me to call my sister tomorrow morning", DEFAULT_INTENT_MODEL);
const rag = resolveRagConflict("Did I mention anything about my sister?", SISTER_QUERY_CHUNKS, {
  now: "2026-05-15T00:00:00Z"
});

console.log(JSON.stringify({ drift, intent, rag }, null, 2));
