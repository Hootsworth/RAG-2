import test from "node:test";
import assert from "node:assert/strict";
import { splitTopicCheckpoints } from "../src/topic_splitter.js";
import { ROUND_1_PERSONA_JSON } from "../src/sample_data.js";

test("splits topic checkpoints by explicit topic and time gaps", () => {
  const checkpoints = splitTopicCheckpoints(ROUND_1_PERSONA_JSON.messages);
  assert.ok(checkpoints.length >= 4);
  assert.equal(checkpoints[0].topic, "research project");
  assert.ok(checkpoints.some((checkpoint) => checkpoint.topic === "family"));
});
