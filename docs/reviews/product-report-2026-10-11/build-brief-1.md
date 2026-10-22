# Lane product-report — build round 1: the foundations (2026-10-11 · feat/product-report)

The contract is `CHANGE.md` in this folder (sol reviewed the plan three times; r3 LAND-WITH-FIXES 9/10,
fixes applied; the owner approved the share line). The build runs in short rounds; this round is the
foundations only. Three items; do all three before you report.

- [ ] **A. The ledger.** Under `# CAP-07` add `## FEAT-039 · See the product and its decisions in one
  report` with the `Purpose:`, `Status: active` and `Also applies:` lines exactly as CHANGE §2, and a
  table holding R-1012–R-1030 with the CHANGE §2 texts, each `planned` with Evidence `—` (later rounds
  flip each to `implemented` with its tests). No `// req:` marker for them yet. Update
  `packages/nana-pack/tests/requirements-tree.test.mjs`'s real-ledger literals (67 → 68 headings,
  1,024 → 1,043 rows, and the titles that say 1,024). `npm run req:tree`.
- [ ] **B. The tree module** (`scripts/requirements-tree.mjs`, FEAT-028 — code only, no row change):
  export ONE row reader returning, for every requirement row in document order, its ID, requirement
  text, status, evidence, line and owning heading, built on the rail's `requirementRowId` and
  `WHITESPACE`; make `checkLifecycleAndShares` use it instead of its private cell read; record each
  capability's `Outcome:` as `outcome` on its heading; export the descendant walk. The committed
  outline (R-291) must not change by one byte. Add tests in `requirements-tree.test.mjs` for the
  reader (text with a `|`-free cell, a G row, a four-digit row, a shared row's owning heading) and
  for `outcome`.
- [ ] **C. The shared HANDOFF entry splitter** (`packages/nana-pack/lib/handoff-asks.mjs`, FEAT-002
  SUB-005; six-tag header) exactly as CHANGE §3: every raw entry of "Open for the owner" with its lines and
  start line, plus an independent tag result (frontier's existing rule) and title result (the report's
  grammar). FIRST capture golden outputs of the CURRENT `nana-frontier.mjs` on fixture HANDOFFs
  (today's real HANDOFF, an entry with a valid tag and no parseable title, a tag on a continuation
  line, a missing tag, a future date, a fenced block) and commit them; THEN make `nana-frontier.mjs`
  consume the splitter and apply only its existing tag and date rules; its output on every fixture
  must equal the golden bytes. Tests for the splitter's title results in a pack test file.

Then: `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked` (must pass; report the summary line), commit with explicit paths (message file
under `$TMPDIR`). Rules: mutation pairs break code, never assertions; no test writes the repository;
fix the class. Frozen: `CHANGE.md`, `HANDOFF.md`, `docs/sessions/`, `prototype/`. Report ≤ 25 lines,
first line `VERDICT: DONE | PARTIAL | BLOCKED`, the checklist ticked, the suite summary line, and the
one claim most likely wrong.
