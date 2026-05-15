import { detectPersonaDrift } from "../src/persona_drift_detector.js";
import { classifyIntent, DEFAULT_INTENT_MODEL } from "../src/intent_classifier.js";
import { resolveRagConflict } from "../src/rag_conflict_resolver.js";
import { ROUND_1_PERSONA_JSON, SISTER_QUERY_CHUNKS } from "../src/sample_data.js";

function averageRuntime(fn, iterations) {
  const started = performance.now();
  for (let i = 0; i < iterations; i += 1) fn();
  return (performance.now() - started) / iterations;
}

const benchmarks = {
  intentClassificationMs: averageRuntime(
    () => classifyIntent("remind me to call my sister tomorrow morning", DEFAULT_INTENT_MODEL),
    10000
  ),
  personaDriftAnalysisMs: averageRuntime(() => detectPersonaDrift(ROUND_1_PERSONA_JSON), 5000),
  ragConflictResolutionMs: averageRuntime(
    () =>
      resolveRagConflict("Did I mention anything about my sister?", SISTER_QUERY_CHUNKS, {
        now: "2026-05-15T00:00:00Z"
      }),
    5000
  ),
  intentModelBytes: new TextEncoder().encode(JSON.stringify(DEFAULT_INTENT_MODEL)).length,
  heapUsedMb: process.memoryUsage().heapUsed / 1024 / 1024
};

console.table(
  Object.fromEntries(
    Object.entries(benchmarks).map(([key, value]) => [
      key,
      key.endsWith("Bytes") ? `${value} bytes` : `${Math.round(value * 1000) / 1000}`
    ])
  )
);
