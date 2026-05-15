# Self-Evaluation Sheet

## What Works

- Persona drift is day-level, not just aggregate.
- Drift output includes timeline labels and trigger attribution.
- Intent classification is fully offline and has no external API path.
- Classifier model is far below 50MB and runs under the 200ms CPU target in tests.
- RAG resolver ranks relevant chunks and flags contradictory sister context.
- README, system design, Loom script, and hosted-demo instructions are included.

## Tradeoffs

- The classifier uses an interpretable probabilistic architecture instead of a neural fine-tune. This was intentional: it is tiny, transparent, fast, and easy to audit under the “no API” constraint.
- The persona detector uses interpretable lexicons. It is less nuanced than an LLM judge, but it avoids black-box drift claims and can be tuned with user feedback.
- The resolver uses lexical relevance rather than dense embeddings in the demo. The architecture leaves a slot for offline embeddings, but the shipped version remains dependency-free.

## Standout Decisions

- Contradictions are first-class answer objects, not hidden retrieval noise.
- The cloud sync design deliberately avoids a searchable cloud memory store.
- The demo exposes scores and evidence so evaluators can see why each answer happened.

## Known Improvements

- Add a local embedding model such as MiniLM quantized ONNX for stronger retrieval.
- Add user correction buttons that write back to the drift and intent training sets.
- Add a richer contradiction schema for family, work, health, and location facts.
