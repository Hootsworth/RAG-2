import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server/app.js";

async function withServer(fn) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("backend exposes health, drift, intent, and resolver APIs", async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`).then((res) => res.json());
    assert.equal(health.ok, true);

    const drift = await fetch(`${baseUrl}/api/persona/drift`).then((res) => res.json());
    assert.ok(drift.timeline.length > 0);

    const intent = await fetch(`${baseUrl}/api/intent/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "remind me to call my sister" })
    }).then((res) => res.json());
    assert.equal(intent.label, "reminder");

    const rag = await fetch(`${baseUrl}/api/rag/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Did I mention anything about my sister?", now: "2026-05-15T00:00:00Z" })
    }).then((res) => res.json());
    assert.ok(rag.contradictions.length > 0);
  });
});
