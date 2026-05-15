import test from "node:test";
import assert from "node:assert/strict";
import { classifyIntent, DEFAULT_INTENT_MODEL } from "../src/intent_classifier.js";

test("classifies offline intents under size and latency budgets", () => {
  const result = classifyIntent("please remind me to call my sister tomorrow", DEFAULT_INTENT_MODEL);
  assert.equal(result.label, "reminder");
  assert.ok(result.modelBytes < 50 * 1024 * 1024);
  assert.ok(result.latencyMs < 200);
});

test("classifies emotional support", () => {
  const result = classifyIntent("i feel lonely and overwhelmed tonight", DEFAULT_INTENT_MODEL);
  assert.equal(result.label, "emotional-support");
});
