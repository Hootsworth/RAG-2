import test from "node:test";
import assert from "node:assert/strict";
import { detectPersonaDrift } from "../src/persona_drift_detector.js";
import { ROUND_1_PERSONA_JSON } from "../src/sample_data.js";

test("detects day-level persona drift and triggers", () => {
  const result = detectPersonaDrift(ROUND_1_PERSONA_JSON);
  assert.equal(result.timeline[0].label, "Day 1 -> curious & formal");
  assert.ok(result.timeline.some((item) => item.label.includes("frustrated")));
  assert.ok(result.drifts.some((drift) => drift.trigger.value === "deadline"));
  assert.ok(result.drifts.some((drift) => drift.trigger.value === "sister"));
});
