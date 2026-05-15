import test from "node:test";
import assert from "node:assert/strict";
import { resolveRagConflict } from "../src/rag_conflict_resolver.js";
import { SISTER_QUERY_CHUNKS } from "../src/sample_data.js";

test("ranks sister chunks and flags contradictions", () => {
  const result = resolveRagConflict("Did I mention anything about my sister?", SISTER_QUERY_CHUNKS, {
    now: "2026-05-15T00:00:00Z"
  });
  assert.equal(result.rankedChunks[0].id, "c1");
  assert.ok(result.contradictions.length > 0);
  assert.match(result.answer, /conflicting context/i);
});
