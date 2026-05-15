const MOOD_LEXICON = {
  curious: ["why", "how", "what if", "wonder", "curious", "explore", "learn", "maybe", "?", "idea"],
  formal: ["please", "could you", "would you", "regards", "kindly", "request", "thank you"],
  casual: ["hey", "lol", "yeah", "btw", "gonna", "wanna", "cool", "okay", "ok"],
  frustrated: ["stuck", "annoyed", "frustrated", "broken", "ugh", "again", "not working", "hate", "angry"],
  playful: ["haha", "fun", "play", "silly", "wild", "weird", "joke", "game"],
  anxious: ["worried", "scared", "anxious", "panic", "afraid", "uncertain", "overwhelmed"],
  reflective: ["realized", "feel", "felt", "thinking", "remember", "journal", "meaning", "because"],
  decisive: ["ship", "do it", "decide", "now", "must", "deadline", "plan", "finish"]
};

const LABELS = ["reminder", "emotional-support", "action-item", "small-talk", "unknown"];
const STOP_WORDS = new Set(["the", "and", "for", "with", "that", "this", "you", "are", "was", "what", "how", "can", "me", "my", "to", "it", "is", "a", "an"]);
const EMOTION_TERMS = ["love", "miss", "angry", "worried", "hurt", "afraid", "proud", "sad", "support", "fight", "cry", "happy", "frustrated"];

export const ROUND_1_PERSONA_JSON = {
  userId: "demo-user",
  messages: [
    { id: "p1", timestamp: "2026-05-01T09:10:00Z", topic: "research project", text: "Could you please explain how retrieval checkpoints work? I am curious about the tradeoffs.", people: [] },
    { id: "p2", timestamp: "2026-05-02T10:05:00Z", topic: "research project", text: "What if the persona JSON becomes stale across days? I wonder how we detect that.", people: [] },
    { id: "p3", timestamp: "2026-05-04T16:20:00Z", topic: "deadline", text: "Hey this thing is stuck again and the deadline is making me frustrated.", people: [] },
    { id: "p4", timestamp: "2026-05-05T18:45:00Z", topic: "family", text: "I am worried about my sister. We had a fight but I still miss her.", people: ["sister"] },
    { id: "p5", timestamp: "2026-05-07T20:00:00Z", topic: "demo polish", text: "lol okay let's make the demo feel fun and a little weird, in a good way!", people: [] }
  ]
};

export const SISTER_QUERY_CHUNKS = [
  { id: "c1", checkpoint: "family-checkpoint", timestamp: "2026-05-05T18:45:00Z", text: "I am worried about my sister. We had a fight but I still miss her and want to talk soon.", source: "journal_2026_05_05.md" },
  { id: "c2", checkpoint: "travel-checkpoint", timestamp: "2026-04-22T12:30:00Z", text: "My sister is visiting in June for dinner and her birthday. I am happy about it.", source: "travel_2026_04_22.md" },
  { id: "c3", checkpoint: "boundary-checkpoint", timestamp: "2026-03-10T08:00:00Z", text: "I said I was not speaking to my sister after the fight and wanted no contact for a bit.", source: "voice_2026_03_10.txt" }
];

const TRAINING_EXAMPLES = [
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

export function detectPersonaDrift(personaJson) {
  const messages = personaJson.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const firstDate = messages[0].timestamp;
  const grouped = new Map();
  for (const message of messages) {
    const key = dayKey(message.timestamp, firstDate);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(message);
  }

  const timeline = [...grouped.entries()].map(([day, dayMessages]) => {
    const scores = Object.fromEntries(Object.keys(MOOD_LEXICON).map((mood) => [mood, 0]));
    for (const message of dayMessages) {
      const messageScores = scoreTone(message.text);
      for (const [mood, score] of Object.entries(messageScores)) scores[mood] += score;
    }
    const moods = Object.entries(scores).sort((a, b) => b[1] - a[1]).filter(([, score]) => score > 0).slice(0, 2).map(([mood]) => mood);
    return {
      day,
      date: dayMessages[0].timestamp.slice(0, 10),
      moods: moods.length ? moods : ["unknown"],
      trigger: extractTrigger(dayMessages),
      messageIds: dayMessages.map((m) => m.id)
    };
  });

  const drifts = [];
  for (let i = 1; i < timeline.length; i += 1) {
    if (timeline[i - 1].moods.join("|") !== timeline[i].moods.join("|")) {
      drifts.push({
        from: timeline[i - 1].day,
        to: timeline[i].day,
        previous: timeline[i - 1].moods,
        current: timeline[i].moods,
        trigger: timeline[i].trigger
      });
    }
  }
  return { timeline, drifts };
}

export const DEFAULT_INTENT_MODEL = trainIntentModel();

export function classifyIntent(message, model = DEFAULT_INTENT_MODEL) {
  const started = performance.now();
  const tokens = tokenize(message);
  const vocabSize = model.vocabulary.length || 1;
  const totalDocs = Object.values(model.classCounts).reduce((sum, count) => sum + count, 0) || 1;
  const scores = {};

  for (const label of model.labels) {
    scores[label] = Math.log((model.classCounts[label] + 1) / (totalDocs + model.labels.length));
    for (const token of tokens) {
      scores[label] += Math.log(((model.tokenCounts[label][token] || 0) + 1) / ((model.totalTokens[label] || 0) + vocabSize));
    }
  }

  const probabilities = softmax(scores);
  const [label, confidence] = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0];
  return {
    label: confidence < 0.38 ? "unknown" : label,
    confidence: round(confidence),
    scores: Object.fromEntries(Object.entries(probabilities).map(([k, v]) => [k, round(v)])),
    latencyMs: round(performance.now() - started, 3),
    modelBytes: new TextEncoder().encode(JSON.stringify(model)).length
  };
}

export function resolveRagConflict(query, chunks, options = {}) {
  const now = new Date(options.now || Date.now());
  const rankedChunks = chunks.map((chunk) => {
    const recency = recencyScore(chunk.timestamp, now);
    const emotionalWeight = scoreEmotionalWeight(chunk.text);
    const relevance = lexicalRelevance(query, chunk.text);
    return {
      ...chunk,
      scores: {
        recency: round(recency),
        emotionalWeight: round(emotionalWeight),
        relevance: round(relevance),
        rankScore: round(0.45 * recency + 0.35 * emotionalWeight + 0.2 * relevance)
      },
      stance: inferStance(chunk.text)
    };
  }).sort((a, b) => b.scores.rankScore - a.scores.rankScore);

  const contradictions = detectContradictions(rankedChunks);
  const answer = `Yes, you mentioned your sister.${contradictions.length ? " I found conflicting context, so I would not answer this as a single fixed fact." : ""} The most recent emotionally weighted evidence says: ${rankedChunks[0].text}`;
  return { query, answer, rankedChunks, contradictions };
}

function scoreTone(text) {
  const lowered = text.toLowerCase();
  const scores = Object.fromEntries(Object.keys(MOOD_LEXICON).map((mood) => [mood, 0]));
  for (const [mood, terms] of Object.entries(MOOD_LEXICON)) {
    for (const term of terms) if (lowered.includes(term)) scores[mood] += term === "?" ? 0.7 : 1;
  }
  if (text.length > 180 && !lowered.includes("lol")) scores.formal += 0.45;
  scores.playful += Math.min(((text.match(/!/g) || []).length) * 0.25, 0.75);
  return scores;
}

function extractTrigger(messages) {
  const joined = messages.map((m) => `${m.topic} ${m.text} ${(m.people || []).join(" ")}`).join(" ").toLowerCase();
  if (joined.includes("sister")) return { type: "person", value: "sister" };
  if (messages.find((m) => m.topic)?.topic) return { type: "topic", value: messages.find((m) => m.topic).topic };
  return { type: "event", value: "conversation shift" };
}

function dayKey(timestamp, startDate) {
  const diff = Math.floor((utcDateOnly(timestamp) - utcDateOnly(startDate)) / 86400000);
  return `Day ${diff + 1}`;
}

function utcDateOnly(value) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function trainIntentModel() {
  const vocabulary = new Set();
  const classCounts = Object.fromEntries(LABELS.map((label) => [label, 0]));
  const tokenCounts = Object.fromEntries(LABELS.map((label) => [label, {}]));
  const totalTokens = Object.fromEntries(LABELS.map((label) => [label, 0]));
  for (const [text, label] of TRAINING_EXAMPLES) {
    classCounts[label] += 1;
    for (const token of tokenize(text)) {
      vocabulary.add(token);
      tokenCounts[label][token] = (tokenCounts[label][token] || 0) + 1;
      totalTokens[label] += 1;
    }
  }
  return { type: "multinomial-naive-bayes", labels: LABELS, vocabulary: [...vocabulary].sort(), classCounts, tokenCounts, totalTokens };
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || []).filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function softmax(logScores) {
  const max = Math.max(...Object.values(logScores));
  const exps = Object.fromEntries(Object.entries(logScores).map(([label, score]) => [label, Math.exp(score - max)]));
  const total = Object.values(exps).reduce((sum, score) => sum + score, 0);
  return Object.fromEntries(Object.entries(exps).map(([label, score]) => [label, score / total]));
}

function recencyScore(timestamp, now) {
  return Math.exp(-Math.max(0, (now - new Date(timestamp)) / 86400000) / 45);
}

function scoreEmotionalWeight(text) {
  const lowered = text.toLowerCase();
  return Math.min(1, EMOTION_TERMS.filter((term) => lowered.includes(term)).length * 0.18 + Math.min(((text.match(/[!?]/g) || []).length) * 0.08, 0.24));
}

function lexicalRelevance(query, text) {
  const q = new Set((query.toLowerCase().match(/[a-z]{3,}/g) || []).filter((word) => word !== "anything"));
  const t = new Set(text.toLowerCase().match(/[a-z]{3,}/g) || []);
  let overlap = 0;
  for (const token of q) if (t.has(token)) overlap += 1;
  return q.size ? overlap / q.size : 0;
}

function inferStance(text) {
  const lowered = text.toLowerCase();
  const positive = ["close", "supportive", "talk", "called", "helped", "miss", "love"].some((term) => lowered.includes(term));
  const negative = ["not speaking", "distant", "avoid", "fight", "angry", "blocked", "no contact"].some((term) => lowered.includes(term));
  return { relationship_state: positive && negative ? "mixed" : positive ? "positive" : negative ? "negative" : "unknown" };
}

function detectContradictions(chunks) {
  const positive = chunks.filter((chunk) => ["positive", "mixed"].includes(chunk.stance.relationship_state));
  const negative = chunks.filter((chunk) => ["negative", "mixed"].includes(chunk.stance.relationship_state));
  return positive.length && negative.length
    ? [{ facet: "relationship_state", positiveChunkIds: positive.map((chunk) => chunk.id), negativeChunkIds: negative.map((chunk) => chunk.id) }]
    : [];
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
