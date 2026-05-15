import { detectPersonaDrift } from "../src/persona_drift_detector.js";
import { classifyIntent, DEFAULT_INTENT_MODEL } from "../src/intent_classifier.js";
import { resolveRagConflict } from "../src/rag_conflict_resolver.js";
import { ROUND_1_PERSONA_JSON, SISTER_QUERY_CHUNKS } from "../src/sample_data.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const SCREENS = {
  drift: {
    title: "Persona Drift Project",
    subtitle: "Track how the user's mood and tone move across days, with trigger receipts."
  },
  intent: {
    title: "Offline Intent Classifier Project",
    subtitle: "Classify messages locally into reminder, emotional-support, action-item, small-talk, or unknown."
  },
  resolver: {
    title: "Conflict Resolution RAG Project",
    subtitle: "Answer the sister question by ranking evidence and exposing contradictions."
  },
  design: {
    title: "System Design Project",
    subtitle: "Show what syncs, what stays local, and how memory conflicts resolve."
  }
};

function currentRoute() {
  const route = window.location.hash.replace("#", "");
  return SCREENS[route] ? route : "drift";
}

function renderRoute() {
  const route = currentRoute();
  const meta = SCREENS[route];
  $("#screen-title").textContent = meta.title;
  $("#screen-subtitle").textContent = meta.subtitle;

  $$("[data-screen]").forEach((screen) => {
    screen.hidden = screen.dataset.screen !== route;
  });

  $$("[data-route]").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route);
  });
}

function renderDrift() {
  const { timeline, drifts } = detectPersonaDrift(ROUND_1_PERSONA_JSON);
  $("#timeline").innerHTML = timeline
    .map(
      (item) => `<div class="day">
        <strong>${item.day}</strong>
        <span>${item.moods.join(" & ")}</span>
        <small>${item.trigger.type}: ${item.trigger.value}</small>
      </div>`
    )
    .join("");

  $("#drifts").innerHTML = drifts
    .map(
      (drift) => `<article>
        <strong>${drift.from} -> ${drift.to}</strong>
        <p>${drift.previous.join(" & ")} became ${drift.current.join(" & ")}.</p>
        <small>Trigger: ${drift.trigger.type} / ${drift.trigger.value}</small>
      </article>`
    )
    .join("");
}

function renderIntent() {
  const result = classifyIntent($("#message").value, DEFAULT_INTENT_MODEL);
  $("#model-size").textContent = `${Math.round(result.modelBytes / 1024)} KB model`;
  $("#intent-result").innerHTML = `<strong>${result.label}</strong>
    <span>${result.confidence} confidence</span>
    <small>${result.latencyMs} ms CPU latency</small>
    ${Object.entries(result.scores)
      .map(([label, score]) => `<div class="bar"><span>${label}</span><i style="width:${score * 100}%"></i><b>${score}</b></div>`)
      .join("")}`;
}

function renderResolver() {
  const resolved = resolveRagConflict($("#query").value, SISTER_QUERY_CHUNKS, { now: "2026-05-15T00:00:00Z" });
  $("#answer").textContent = resolved.answer;
  $("#chunks").innerHTML = resolved.rankedChunks
    .map((chunk, index) => {
      const conflict = resolved.contradictions.some(
        (item) => item.positiveChunkIds.includes(chunk.id) || item.negativeChunkIds.includes(chunk.id)
      );
      return `<article class="${conflict ? "conflict" : ""}">
        <b>#${index + 1} ${chunk.checkpoint}</b>
        <p>${chunk.text}</p>
        <small>${chunk.timestamp.slice(0, 10)} | score ${chunk.scores.rankScore} | emotion ${chunk.scores.emotionalWeight}</small>
      </article>`;
    })
    .join("");
}

function renderAll() {
  renderDrift();
  renderIntent();
  renderResolver();
}

$("#classify").addEventListener("click", renderIntent);
$("#resolve").addEventListener("click", renderResolver);
$("#rerun").addEventListener("click", renderAll);
window.addEventListener("hashchange", renderRoute);
renderAll();
renderRoute();
