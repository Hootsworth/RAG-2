export const LABELS = ["reminder", "emotional-support", "action-item", "small-talk", "unknown"];

export const TRAINING_EXAMPLES = [
  ["remind me to call my sister tomorrow morning", "reminder"],
  ["set a reminder for the dentist appointment", "reminder"],
  ["don't let me forget rent on friday", "reminder"],
  ["ping me at 6 to drink water", "reminder"],
  ["i feel overwhelmed and need someone to listen", "emotional-support"],
  ["i am scared i messed everything up", "emotional-support"],
  ["can you help me calm down", "emotional-support"],
  ["i feel lonely tonight", "emotional-support"],
  ["make a todo to send the invoice", "action-item"],
  ["add follow up with raj to my task list", "action-item"],
  ["draft the reply and mark it as next action", "action-item"],
  ["we need to book flights and review the budget", "action-item"],
  ["hey how are you", "small-talk"],
  ["what's up", "small-talk"],
  ["lol that was funny", "small-talk"],
  ["good morning", "small-talk"],
  ["the mitochondria is the powerhouse of the cell", "unknown"],
  ["blue folder window seven", "unknown"],
  ["qzx weather pineapple", "unknown"],
  ["tell me the classification boundary", "unknown"]
];

const STOP_WORDS = new Set(["the", "and", "for", "with", "that", "this", "you", "are", "was", "what", "how", "can", "me", "my", "to", "it", "is", "a", "an"]);

export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || [])
    .map((token) => token.replace(/^'+|'+$/g, ""))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function trainIntentModel(examples = TRAINING_EXAMPLES) {
  const vocabulary = new Set();
  const classCounts = Object.fromEntries(LABELS.map((label) => [label, 0]));
  const tokenCounts = Object.fromEntries(LABELS.map((label) => [label, {}]));
  const totalTokens = Object.fromEntries(LABELS.map((label) => [label, 0]));

  for (const [text, label] of examples) {
    if (!LABELS.includes(label)) throw new Error(`Unknown label: ${label}`);
    classCounts[label] += 1;
    for (const token of tokenize(text)) {
      vocabulary.add(token);
      tokenCounts[label][token] = (tokenCounts[label][token] || 0) + 1;
      totalTokens[label] += 1;
    }
  }

  return {
    type: "multinomial-naive-bayes",
    version: "offline-intent-v1",
    labels: LABELS,
    vocabulary: [...vocabulary].sort(),
    classCounts,
    tokenCounts,
    totalTokens,
    trainedAt: new Date(0).toISOString()
  };
}

export const DEFAULT_INTENT_MODEL = trainIntentModel();

export function classifyIntent(message, model = DEFAULT_INTENT_MODEL) {
  const started = performanceNow();
  const tokens = tokenize(message);
  const vocabSize = model.vocabulary.length || 1;
  const totalDocs = Object.values(model.classCounts).reduce((sum, count) => sum + count, 0) || 1;
  const scores = {};

  for (const label of model.labels) {
    const prior = Math.log((model.classCounts[label] + 1) / (totalDocs + model.labels.length));
    scores[label] = prior;
    for (const token of tokens) {
      const count = model.tokenCounts[label][token] || 0;
      scores[label] += Math.log((count + 1) / ((model.totalTokens[label] || 0) + vocabSize));
    }
  }

  const probabilities = softmax(scores);
  const [label, confidence] = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0];
  const finalLabel = confidence < 0.38 ? "unknown" : label;

  return {
    label: finalLabel,
    confidence: round(confidence),
    scores: Object.fromEntries(Object.entries(probabilities).map(([k, v]) => [k, round(v)])),
    latencyMs: round(performanceNow() - started, 3),
    modelBytes: byteSize(model)
  };
}

function softmax(logScores) {
  const max = Math.max(...Object.values(logScores));
  const exps = Object.fromEntries(Object.entries(logScores).map(([label, score]) => [label, Math.exp(score - max)]));
  const total = Object.values(exps).reduce((sum, score) => sum + score, 0);
  return Object.fromEntries(Object.entries(exps).map(([label, score]) => [label, score / total]));
}

function byteSize(model) {
  return new TextEncoder().encode(JSON.stringify(model)).length;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function performanceNow() {
  return globalThis.performance?.now ? globalThis.performance.now() : Date.now();
}
