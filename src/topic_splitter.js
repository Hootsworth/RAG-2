const SPLIT_GAP_HOURS = 18;

export function splitTopicCheckpoints(messages) {
  const ordered = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const checkpoints = [];

  for (const message of ordered) {
    const previous = checkpoints.at(-1);
    if (!previous || shouldStartCheckpoint(previous, message)) {
      checkpoints.push({
        id: `topic-${checkpoints.length + 1}`,
        topic: message.topic || inferTopic(message.text),
        startedAt: message.timestamp,
        endedAt: message.timestamp,
        messages: [message]
      });
    } else {
      previous.messages.push(message);
      previous.endedAt = message.timestamp;
      previous.topic = previous.topic || message.topic || inferTopic(message.text);
    }
  }

  return checkpoints;
}

function shouldStartCheckpoint(checkpoint, message) {
  const last = checkpoint.messages.at(-1);
  const gapHours = (new Date(message.timestamp) - new Date(last.timestamp)) / 3600000;
  const explicitTopicChanged = message.topic && checkpoint.topic && message.topic !== checkpoint.topic;
  const similarity = jaccard(tokenize(checkpoint.messages.map((m) => m.text).join(" ")), tokenize(message.text));
  return gapHours > SPLIT_GAP_HOURS || explicitTopicChanged || similarity < 0.08;
}

function inferTopic(text) {
  const tokens = tokenize(text).filter((token) => token.length > 4);
  return tokens[0] || "general";
}

function tokenize(text) {
  return new Set((text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((token) => token.length > 2));
}

function jaccard(a, b) {
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / union.size;
}
