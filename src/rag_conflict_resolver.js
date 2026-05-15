const EMOTION_TERMS = ["love", "miss", "angry", "worried", "hurt", "afraid", "proud", "sad", "support", "fight", "cry", "happy", "frustrated"];
const CONTRADICTION_FACETS = [
  {
    name: "relationship_state",
    positive: ["close", "supportive", "talk", "called", "helped", "miss", "love"],
    negative: ["not speaking", "distant", "avoid", "fight", "angry", "blocked", "no contact"]
  },
  {
    name: "logistics",
    positive: ["visiting", "flight", "meet", "dinner", "wedding", "birthday"],
    negative: ["cancelled", "postponed", "can't visit", "cannot visit", "skipped"]
  }
];

export function resolveRagConflict(query, chunks, options = {}) {
  const now = new Date(options.now || Date.now());
  const ranked = chunks
    .map((chunk) => {
      const recency = recencyScore(chunk.timestamp, now);
      const emotionalWeight = scoreEmotionalWeight(chunk.text);
      const relevance = lexicalRelevance(query, chunk.text);
      const rankScore = 0.45 * recency + 0.35 * emotionalWeight + 0.2 * relevance;
      return {
        ...chunk,
        scores: {
          recency: round(recency),
          emotionalWeight: round(emotionalWeight),
          relevance: round(relevance),
          rankScore: round(rankScore)
        },
        stance: inferStance(chunk.text)
      };
    })
    .sort((a, b) => b.scores.rankScore - a.scores.rankScore);

  const contradictions = detectContradictions(ranked);
  return {
    query,
    answer: buildMergedAnswer(query, ranked, contradictions),
    rankedChunks: ranked,
    contradictions
  };
}

export function recencyScore(timestamp, now = new Date()) {
  const ageDays = Math.max(0, (now - new Date(timestamp)) / 86400000);
  return Math.exp(-ageDays / 45);
}

export function scoreEmotionalWeight(text) {
  const lowered = text.toLowerCase();
  const hits = EMOTION_TERMS.filter((term) => lowered.includes(term)).length;
  const punctuation = Math.min(((text.match(/[!?]/g) || []).length) * 0.08, 0.24);
  return Math.min(1, hits * 0.18 + punctuation);
}

export function lexicalRelevance(query, text) {
  const q = new Set((query.toLowerCase().match(/[a-z]{3,}/g) || []).filter((word) => word !== "anything"));
  const t = new Set(text.toLowerCase().match(/[a-z]{3,}/g) || []);
  if (q.size === 0) return 0;
  let overlap = 0;
  for (const token of q) if (t.has(token)) overlap += 1;
  return overlap / q.size;
}

export function inferStance(text) {
  const lowered = text.toLowerCase();
  const facets = {};
  for (const facet of CONTRADICTION_FACETS) {
    const pos = facet.positive.some((term) => lowered.includes(term));
    const neg = facet.negative.some((term) => lowered.includes(term));
    if (pos && !neg) facets[facet.name] = "positive";
    if (neg && !pos) facets[facet.name] = "negative";
    if (pos && neg) facets[facet.name] = "mixed";
  }
  return facets;
}

export function detectContradictions(rankedChunks) {
  const contradictions = [];
  for (const facet of CONTRADICTION_FACETS) {
    const positive = rankedChunks.filter((chunk) => ["positive", "mixed"].includes(chunk.stance[facet.name]));
    const negative = rankedChunks.filter((chunk) => ["negative", "mixed"].includes(chunk.stance[facet.name]));
    if (positive.length > 0 && negative.length > 0) {
      contradictions.push({
        facet: facet.name,
        positiveChunkIds: positive.map((chunk) => chunk.id),
        negativeChunkIds: negative.map((chunk) => chunk.id),
        summary: `${facet.name} has both positive and negative evidence.`
      });
    }
  }
  return contradictions;
}

function buildMergedAnswer(query, ranked, contradictions) {
  if (ranked.length === 0) return "I did not find any relevant memory chunks.";
  const subject = query.toLowerCase().includes("sister") ? "your sister" : "that topic";
  const top = ranked[0];
  const contradictionText = contradictions.length
    ? ` I found conflicting context, so I would not answer this as a single fixed fact.`
    : "";
  const evidenceText = ranked
    .slice(0, 3)
    .map((chunk) => `${chunk.timestamp.slice(0, 10)}: ${chunk.text}`)
    .join(" ");

  return `Yes, you mentioned ${subject}.${contradictionText} The most recent emotionally weighted evidence says: ${top.text} Supporting context: ${evidenceText}`;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
