# System Design: Offline Memory Sync

## Goal

Keep intimate memory analysis useful across devices without turning the raw journal into a cloud database. The design treats the device as the source of truth and the cloud as a dumb encrypted courier.

```mermaid
flowchart LR
  A[Phone / Laptop Vault] --> B[Local SQLite + encrypted files]
  B --> C[On-device jobs: splitter, drift, intent, embeddings]
  C --> D[Encrypted sync queue]
  D --> E[Cloud relay: opaque blobs only]
  E --> F[Second device pulls blobs]
  F --> G[CRDT merge + conflict log]
  G --> B
```

## On-Device Storage

- `memories.sqlite`: messages, topic checkpoints, chunk metadata, model versions, sync watermarks.
- `vault/attachments`: optional local-only files, encrypted with a device key.
- `models/intent.nb.json`: tiny offline classifier artifact. It is deterministic, inspectable, and under 50MB.
- `indexes/embeddings.bin`: local vector index. Embeddings are generated on device by a small local model or imported from an approved offline job.

## What Syncs

- Syncs: encrypted message metadata, topic checkpoints, drift summaries, contradiction flags, model version hashes, and user-approved compact memory summaries.
- Stays local by default: raw journal text, attachments, exact embeddings, private keys, deleted-item tombstone contents, and any message marked `local_only`.
- Optional explicit export: user can share a redacted support bundle containing chunks, rankings, and conflict receipts for debugging.

## Conflict Resolution

Every write gets `{device_id, logical_clock, edited_at, content_hash}`. Non-overlapping edits merge automatically. Same-field edits create a conflict record instead of silently picking a winner. The UI shows “newer”, “more emotionally weighted”, and “manual favorite” candidates. For RAG answers, the resolver never hides conflict: it ranks by recency + emotional weight + lexical relevance, then returns a merged answer with contradiction receipts.

## Unconventional Decision

The cloud never receives a normal searchable memory database. It only stores opaque sync envelopes. Search quality comes from local indexes rebuilt per device. This is slower during first restore, but it makes the privacy story obvious and lets the submission stand out: memory intelligence is portable without making memory ownership cloudy.
