# nana-knowledge

A local full-text index over the knowledge stores on this machine, queried **at the
moment you type a prompt** and injected as a handful of pointers.

The problem it answers (audit: `~/nana-agent-loop/docs/audits/2026-09-16-knowledge-utilization.md`):
72 grounded research articles with zero reads, ten knowledge wikis unqueried since June.
Research only gets used when it is surfaced *at a live decision* — so the trigger is the
prompt text, not session start. Pointers, not content: a title, a path, and 160 characters
of context, so the agent can decide whether to open the file.

**Dependencies:** none. Node ≥ 22.18 and nothing else — `node:sqlite` (bundled SQLite,
FTS5 enabled) does the indexing, the `.ts` files run directly on Node's type stripping,
and there is no build step, no lockfile, no npm install. pi is an *optional*
peerDependency for manifest consistency with the other packages; this one does not run
inside pi. Tests are zero-dep `node packages/nana-knowledge/tests/*.test.mjs`.

## Use

```bash
node packages/nana-knowledge/bin/nana-knowledge.ts build [--rebuild]
node packages/nana-knowledge/bin/nana-knowledge.ts query "review round cap pi review" [--limit N] [--json]
node packages/nana-knowledge/bin/nana-knowledge.ts status
echo '{"prompt":"...","session_id":"s1","cwd":"/x"}' | node packages/nana-knowledge/bin/nana-knowledge.ts hook
```

Everything it owns lives under `~/.pi/agent/nana-knowledge/` — delete that directory and
the feature is gone. **It never writes to a source store.** Sources are stat'd, read, and
hashed; nothing else.

## sources.json

`~/.pi/agent/nana-knowledge/sources.json`, created from a seed on first run:

```json
{
  "roots": [
    { "path": "/Users/you/nana-agent-loop/research/knowledge", "kind": "articles" },
    { "path": "/Users/you/nana-agent-loop/loops/DOCTRINE.md",  "kind": "ledger" }
  ]
}
```

- `articles` — every `*.md` under the root, one row per file. Title is frontmatter
  `title:`, else the first H1, else the filename. `node_modules/`, `.git/`, symlinked
  directories and files over 1 MB are skipped.
- `ledger` — one row per **entry** in a line-oriented ledger. An entry starts on a line
  beginning with `- ` or a digit that contains `[uses:`, and absorbs the indented
  continuation lines under it (DOCTRINE entries run up to three physical lines). Fenced
  code blocks are skipped, so DOCTRINE's own entry-contract template does not become 3
  fake rows. Pointers to ledger rows carry a line number: `~/…/DOCTRINE.md:147`.

Roots that do not exist are skipped silently, reported by `build` and `status`. Add a
root by editing the file; nothing else needs to change.

## The index

`~/.pi/agent/nana-knowledge/index.db` — SQLite with an FTS5 table (`porter unicode61`)
over title + body, external-content against a `docs` table so `snippet()` works. Ranking
is BM25 with the title column weighted 4×. No embeddings, no vector extension, no model
call anywhere in this package.

Builds are incremental on a per-file SHA-1 of the content: a file whose size and mtime
are unchanged is not even read; one whose mtime moved but whose content hash matches is
re-stat'd and **not** re-indexed. Files that vanish from disk are dropped from the index.
Measured on the seeded corpus (13,382 files / 182 MB of markdown): **11.0 s cold, 0.1 s
for a no-op rebuild, 273 MB on disk.**

## The hook

Wire it as a Claude Code `UserPromptSubmit` hook in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "NODE_NO_WARNINGS=1 node /Users/jwang/nana-pi/packages/nana-knowledge/bin/nana-knowledge.ts hook",
            "timeout": 5,
            "statusMessage": "nana: knowledge pull"
          }
        ]
      }
    ]
  }
}
```

It reads the hook JSON on stdin (`prompt`, `session_id`, `cwd`, `transcript_path`) and
prints at most one block, capped at 2000 characters:

```
[nana:knowledge] 3 pointers for this prompt (read only if relevant):
- <title> — <path> — <snippet around the best match>
```

Behaviour, in the order it is decided:

- **Fail-open, always.** Malformed stdin, a missing index, a corrupt database, a
  permission error — it prints nothing and exits 0. A knowledge pull is never the reason
  a prompt fails to run.
- **Budget: 1500 ms wall clock**, checked at every stage; over budget it exits silently.
  Measured cost on the real index is ~8 ms of work inside a ~60 ms Node start.
- **Skips** prompts under 12 characters, prompts starting with `/` (slash commands), and
  prompts with fewer than two meaningful tokens (length > 2, not in a short stopword list).
- **Top 3 by BM25**, then per-session dedup: paths already shown in this `session_id` are
  dropped, and if that empties the list nothing is printed. State lives in
  `shown/<session_id>.json`; files older than 7 days are pruned on each build. Dedup is
  keyed on the *row*, so one doctrine file can still contribute different lines.
- **Stale index (missing, or older than 24 h)** spawns a detached background `build` —
  guarded by a 10-minute `build.lock` so a burst of prompts spawns one — and queries the
  existing index as-is meanwhile. It never builds synchronously.

## The log

Every invocation that printed something appends one JSONL line to
`~/.pi/agent/nana-knowledge/pull.log`: `ts`, `cwd`, `session_id`, the query `tokens`, the
`hits` shown, and `ms`. Skipped and deduped prompts are not logged. This is the file that
answers the real question later — *do pulled pointers get cited?* — by diffing paths that
appeared here against paths that turn up in commits, specs, and session logs.

## Limits

- BM25 only. It matches words, not meaning: "how do I stop the reviewer looping" will not
  find an article titled "round caps" unless the words overlap.
- The pointer is a *guess*. It is injected below the prompt with "read only if relevant",
  and the agent is expected to ignore most of them. The failure mode is noise, not error.
- Snippets come from FTS5 `snippet()` and can start mid-sentence.
- One index for every store. A wiki with 3,000 raw scraped articles competes with 75
  curated ones on the same BM25 scale, and sometimes wins on a generic query. If that gets
  annoying, drop the raw roots from `sources.json` rather than adding scoring machinery.
- Dedup is per `session_id`. A resumed session keeps its history; a `--continue` into a
  new session id starts over.
