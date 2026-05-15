# Loom Walkthrough Script

1. Open the hosted demo and say: “This is Memory OS, an offline-first personal RAG prototype. The point is not a pretty chatbot; it is evidence handling.”
2. Show Persona Drift. Explain that Round 1 persona JSON is grouped by calendar day, scored with interpretable tone lexicons, and converted into `Day N -> mood & mood`. Point out trigger extraction from topic, event, or person mentions.
3. Show Intent Classifier. Type three messages: a reminder, emotional support, and random unknown text. Mention the classifier is a tiny multinomial Naive Bayes model, trained locally, no OpenAI/Gemini calls, CPU-only, and usually sub-millisecond.
4. Show Sister Resolver. Ask: “Did I mention anything about my sister?” Explain the hard part: three checkpoints disagree. The resolver ranks evidence by recency, emotional weight, and relevance, flags contradiction facets, then returns a coherent answer with receipts.
5. Open `docs/system-design.md`. Explain what syncs and what stays local. Emphasize the unconventional choice: cloud as opaque encrypted courier, not searchable memory backend.
6. Close with tradeoffs: interpretable lightweight models are less magical than LLMs, but they are fast, private, debuggable, and reliable for this module.
