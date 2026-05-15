export const ROUND_1_PERSONA_JSON = {
  userId: "demo-user",
  messages: [
    {
      id: "p1",
      timestamp: "2026-05-01T09:10:00Z",
      topic: "research project",
      text: "Could you please explain how retrieval checkpoints work? I am curious about the tradeoffs.",
      people: []
    },
    {
      id: "p2",
      timestamp: "2026-05-02T10:05:00Z",
      topic: "research project",
      text: "What if the persona JSON becomes stale across days? I wonder how we detect that.",
      people: []
    },
    {
      id: "p3",
      timestamp: "2026-05-04T16:20:00Z",
      topic: "deadline",
      text: "Hey this thing is stuck again and the deadline is making me frustrated.",
      people: []
    },
    {
      id: "p4",
      timestamp: "2026-05-05T18:45:00Z",
      topic: "family",
      text: "I am worried about my sister. We had a fight but I still miss her.",
      people: ["sister"]
    },
    {
      id: "p5",
      timestamp: "2026-05-07T20:00:00Z",
      topic: "demo polish",
      text: "lol okay let's make the demo feel fun and a little weird, in a good way!",
      people: []
    }
  ]
};

export const SISTER_QUERY_CHUNKS = [
  {
    id: "c1",
    checkpoint: "family-checkpoint",
    timestamp: "2026-05-05T18:45:00Z",
    text: "I am worried about my sister. We had a fight but I still miss her and want to talk soon.",
    source: "journal_2026_05_05.md"
  },
  {
    id: "c2",
    checkpoint: "travel-checkpoint",
    timestamp: "2026-04-22T12:30:00Z",
    text: "My sister is visiting in June for dinner and her birthday. I am happy about it.",
    source: "travel_2026_04_22.md"
  },
  {
    id: "c3",
    checkpoint: "boundary-checkpoint",
    timestamp: "2026-03-10T08:00:00Z",
    text: "I said I was not speaking to my sister after the fight and wanted no contact for a bit.",
    source: "voice_2026_03_10.txt"
  }
];
