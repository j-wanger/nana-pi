# nana-knowledge

A local BM25 full-text index over this machine's markdown knowledge stores.
Search explicitly with `nana-knowledge query`; neither runtime pulls pointers automatically.

**Dependencies:** Node ≥ 22.18 supplies type stripping and SQLite FTS5.
No npm dependencies, build step or model calls. The sibling nana-pack modules
`../nana-pack/lib/display.mjs` and `../nana-pack/lib/json-text.mjs` provide the shared
safe renderer and marked JSON decoder. Keep this package in the repository layout.
Pi is not required.

## Install

`nana-setup install` seeds sources, builds the first index and links `nana-knowledge`
on PATH (Windows gets sh and `.cmd` shims). Or run directly from the clone.
All owned files live under `~/.pi/agent/nana-knowledge/`; source stores remain read-only.

## Usage

```bash
node packages/nana-knowledge/bin/nana-knowledge.ts build [--rebuild]
node packages/nana-knowledge/bin/nana-knowledge.ts query "review round cap" [--limit N] [--json]
node packages/nana-knowledge/bin/nana-knowledge.ts status
```

Edit `sources.json` in the knowledge home to select `articles` roots (markdown files)
or `ledger` roots (individual entries). Optional `discover` parents add repository
`docs`, `research` and `knowledge` folders. Nested roots are deduplicated.
Missing and unreadable roots preserve their indexed rows. Removed roots and files
vanished from successfully scanned roots lose their rows. `--rebuild` starts afresh.

Malformed or unreadable sources freeze the existing index, including during rebuild.
Status and doctor name the problem. Repair sources before rebuilding. Damaged SQLite
indexes rebuild from readable sources; source problems prevent replacement.

Ranking uses FTS5 BM25 with title weight four. Query prints title, path and snippet
pointers, or structured JSON. Every field stays bounded and on one line. Unsafe paths
use reversible JSON escaping; prose cannot introduce the pointer field separator.
Query always runs an incremental build first, creating a missing index. If refresh
is locked or fails, one stderr line warns that results may be stale and query searches
the existing index. An unusable index makes query exit one; hits exit zero.
No hits prints `(no hits)`. Monthly archives (YYYY-MM.md under sessions) remain indexed but
are excluded from query results; other session notes remain eligible.
Builds hold an exclusive lock and incrementally reindex changed content hashes.

## The hook

The Claude Code prompt hook is retired (2026-11-06, #342).
Only 17 of 871 suggested files were later opened: approximately 2%.
Run `nana-setup install` to remove old managed wiring.
Search explicitly with `nana-knowledge query "your terms"`.
The legacy prompt-hook implementation and CLI command are removed.

## The pi extension

Automatic pi knowledge delivery is retired too. The package registers no extensions.
Restart existing pi sessions after updating the checkout.

## Limits

BM25 matches words, not meaning. Snippets may start mid-sentence.
One shared index lets large stores compete with small ones; select sources accordingly.

## Tests

```bash
npm test -- nana-knowledge
```

Tests use OS-temporary indexes and source trees, with no model calls.
