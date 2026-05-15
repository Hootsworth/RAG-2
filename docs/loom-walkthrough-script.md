# Loom Walkthrough Script

1. Open the hosted demo and say: “This is Memory OS, an offline-first personal RAG project. The core idea is evidence handling for personal memory, not a generic chatbot.”
2. Start with why temporal reasoning matters. Show Persona Drift and explain that a memory system should know that a user can be formal on Day 1, frustrated on Day 4, and playful on Day 7 instead of collapsing them into one permanent personality.
3. Show the Intent Classifier. Say: “I intentionally prioritized interpretability, deterministic latency, tiny artifact size, and offline reliability over marginal accuracy gains from transformer architectures. The classifier is swappable; the interface is model-agnostic.”
4. Mention the benchmark numbers from the README: sub-millisecond module runtimes on the sample project, 1.8 KB classifier artifact, and no OpenAI/Gemini path in this module.
5. Show Sister Resolver. Ask: “Did I mention anything about my sister?” Explain why contradictions should not be flattened. A personal memory assistant should expose conflicting evidence with receipts instead of inventing a single clean fact.
6. Open `docs/system-design.md`. Explain why deterministic offline systems matter for intimate memory: raw journals and exact embeddings stay local, and the cloud is only an encrypted courier.
7. Close with the modularity point: retrieval, ranking, drift analysis, and classification can each be upgraded independently without changing the external interfaces.
