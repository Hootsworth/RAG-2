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

const PERSON_HINTS = ["sister", "mom", "mother", "dad", "father", "friend", "boss", "manager", "partner", "teacher"];
const TOPIC_HINTS = ["deadline", "exam", "job", "career", "health", "family", "project", "money", "travel", "relationship"];

export function normalizePersonaInput(personaJson) {
  const source = Array.isArray(personaJson)
    ? personaJson
    : personaJson.messages || personaJson.conversations || personaJson.entries || [];

  return source
    .map((item, index) => ({
      id: item.id || `m-${index + 1}`,
      timestamp: item.timestamp || item.created_at || item.date,
      text: item.text || item.message || item.content || "",
      topic: item.topic || item.checkpoint || item.title || "",
      people: item.people || item.persons || []
    }))
    .filter((item) => item.timestamp && item.text);
}

export function scoreTone(text) {
  const lowered = text.toLowerCase();
  const scores = Object.fromEntries(Object.keys(MOOD_LEXICON).map((mood) => [mood, 0]));

  for (const [mood, terms] of Object.entries(MOOD_LEXICON)) {
    for (const term of terms) {
      if (lowered.includes(term)) scores[mood] += term === "?" ? 0.7 : 1;
    }
  }

  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 0) scores.playful += Math.min(exclamations * 0.25, 0.75);
  if (text.length > 180 && !lowered.includes("lol")) scores.formal += 0.45;

  return scores;
}

export function dayKey(timestamp, startDate) {
  const start = utcDateOnly(startDate);
  const current = utcDateOnly(timestamp);
  const diff = Math.floor((current - start) / 86400000);
  return `Day ${diff + 1}`;
}

function utcDateOnly(value) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function summarizeMoods(scores, limit = 2) {
  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0);

  if (ranked.length === 0) return ["unknown"];
  return ranked.slice(0, limit).map(([mood]) => mood);
}

export function extractTrigger(messages) {
  const joined = messages.map((m) => `${m.topic} ${m.text} ${(m.people || []).join(" ")}`).join(" ").toLowerCase();
  const people = PERSON_HINTS.filter((person) => joined.includes(person));
  const topics = TOPIC_HINTS.filter((topic) => joined.includes(topic));
  const explicitTopic = messages.find((m) => m.topic)?.topic;

  if (people.length > 0) return { type: "person", value: people[0] };
  if (explicitTopic) return { type: "topic", value: explicitTopic };
  if (topics.length > 0) return { type: "topic", value: topics[0] };
  return { type: "event", value: topKeyword(joined) || "conversation shift" };
}

function topKeyword(text) {
  const stop = new Set(["about", "again", "because", "could", "would", "there", "their", "this", "that", "with", "from", "have", "need", "want", "feel", "what", "when"]);
  const counts = new Map();
  for (const token of text.match(/[a-z]{4,}/g) || []) {
    if (!stop.has(token)) counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

export function detectPersonaDrift(personaJson, options = {}) {
  const messages = normalizePersonaInput(personaJson).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (messages.length === 0) return { timeline: [], drifts: [] };

  const firstDate = options.startDate || messages[0].timestamp;
  const grouped = new Map();

  for (const message of messages) {
    const key = dayKey(message.timestamp, firstDate);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(message);
  }

  const timeline = [...grouped.entries()].map(([day, dayMessages]) => {
    const aggregate = Object.fromEntries(Object.keys(MOOD_LEXICON).map((mood) => [mood, 0]));
    for (const message of dayMessages) {
      const scores = scoreTone(message.text);
      for (const [mood, score] of Object.entries(scores)) aggregate[mood] += score;
    }
    const moods = summarizeMoods(aggregate, 2);
    return {
      day,
      date: dayMessages[0].timestamp.slice(0, 10),
      moods,
      label: `${day} -> ${moods.join(" & ")}`,
      trigger: extractTrigger(dayMessages),
      messageIds: dayMessages.map((m) => m.id),
      scores: aggregate
    };
  });

  const drifts = [];
  for (let i = 1; i < timeline.length; i += 1) {
    const previous = timeline[i - 1];
    const current = timeline[i];
    const prevLabel = previous.moods.join("|");
    const currLabel = current.moods.join("|");
    if (prevLabel !== currLabel) {
      drifts.push({
        from: previous.day,
        to: current.day,
        previous: previous.moods,
        current: current.moods,
        trigger: current.trigger,
        evidenceMessageIds: current.messageIds
      });
    }
  }

  return { timeline, drifts };
}
