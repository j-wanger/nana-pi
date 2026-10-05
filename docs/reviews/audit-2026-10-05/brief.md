# Brief — fixes from the 2026-10-05 nana-pi audit

Seat: Opus 5.5. Worker: you (Claude Sonnet). A gpt-5.6-sol review follows you. Then the seat lands.
Worktree: `~/nana-pi-wt/audit-fixes`, branch `feat/audit-fixes`, off main `5bae6cc`. Commit there.
Do not push or merge. Stage explicit paths only.

The audit findings are evidence. Each was re-checked by the seat where marked.
- `/private/tmp/claude-501/-Users-jwang-nana-pi/eddb9d32-a04d-4940-bf4f-7aa79f40ad8f/scratchpad/audit/a-pack/findings.md` (pack runtime)
- `…/audit/b-setup/findings.md` (setup, hooks, templates)
- `…/audit/c-desk/findings.md` (desk, stage, bench)
- The docs auditor's findings are summarised in section C below; it could not write a file.

## Do NOT touch

`HANDOFF.md` (the seat edits it after you). `~/.pi/**`, `~/.claude/**`, `~/.agents/**`, the live
checkout `~/nana-pi`, the running desk. Never run `pi-review`.

## A. DEFECT — a fresh scaffold fails its own lint gate (both languages) [seat-verified]

Rendered with `uvx copier copy --vcs-ref v0.6.1 --defaults --data language=python …`. Then
`uv run ruff check .` fails with 15 errors (9 RUF001, 4 RUF003, 2 E501), all in the template-shipped
`tests/test_requirements_trace.py`. `ruff format` also wants to rewrite that file.

The TypeScript render fails `pnpm lint` (so `pnpm check` and CI fail) with 7 errors in
`tests/requirements-trace.ts`. Two are `noExcessiveCognitiveComplexity` (`maskCodeSpans` at 21,
`check` at 16, cap 15). Three are formatting.

Both CI workflows are red on the first push of an untouched project.

- **Requirement diff first.** Add a row: WHEN a project is rendered from either template with
  default answers, its own lint and format gates shall pass with no edits. Find how
  `packages/nana-pack/tests/templates-render.test.mjs` renders, and pin the row there if you can
  cheaply. If running ruff/biome inside it is impractical (network installs), land the row
  `untested` and record the manual fresh-render evidence in its cell. Say which you chose and why.
- **Fix narrowly; keep user code strict.**
  - Python: scope the ignores to the rail test file, not all of `tests/**`. The ambiguous-unicode
    fixtures are deliberate. Make the file `ruff format`-clean.
  - TypeScript: a biome override scoped to the rail file for the complexity rule. Run the
    formatter once on the file.
  - Do NOT refactor the rail logic. nana-pi's own `scripts/` shim over the template modules, so a
    behaviour change would ship into this repo's rail too.
- **Prove it on a FRESH render from your committed branch** (`uvx copier copy --vcs-ref HEAD
  <worktree path> …`), both languages, with real exit codes:
  - Python: `uv sync`, `uv run ruff check .`, `uv run ruff format --check .`, `uv run pytest`,
    `uv run pre-commit run --all-files`.
  - TypeScript: `pnpm install`, `pnpm check`.
  - Repeat once in adopt mode on a small scratch project.
  - Mutation: undo each fix, re-render, show red.

## B. DRIFT — AGENTS.md's "Working under nana-pi" has drifted from its canonical source [seat-verified]

`CLAUDE.md` is a symlink to `AGENTS.md`. AGENTS.md's Layout bullet calls
`templates/_shared/working-under-nana-pi.md` "the canonical section below", but the two texts
diverge both ways:
- the shared file lacks the U2-era agent-dir wording for receipts and journal, the full Gate
  paragraph (policy files, allow-pattern semantics, the four variable spellings, the
  shell-computed-path limit) and the handoff pointer-line sentence;
- AGENTS.md lacks the shared file's Objective bullet and its Requirements-first subsection.

Make the shared file the single truth: the union of the accurate content. Verify every sentence
against code before keeping it. Seat note: the 7-day staleness default is real, as
`handoff.staleAfterDays`. Then make AGENTS.md's section a byte-for-byte copy of the shared file,
so "canonical" is true. Add a requirement row and a cheap test in the repo suite that fails when
AGENTS.md no longer contains the shared file verbatim, plus a mutation. Note: a template change
ships to new projects at the next tag; the seat tags.

## C. DRIFT — the documentation edits (verify each before editing; skip any that turns out wrong and say so)

1. pi version. Update "tested/installed on 0.87.1" claims to 1.0.2: verified 2026-10-04 by the
   pi-1.0 lane, and the full suite plus all 14 desk e2e suites passed on 1.0.2 on 2026-10-05. The
   places: `README.md` ~L73 and ~L79; `apps/desk/README.md` ~L25 (including its `npm i -g …@0.87.1`
   command) and the sample log line ~L89; `apps/bench/README.md` Dependencies rows ~L11–13;
   `packages/nana-pack/README.md` ~L70 ("Tested host since…"). Leave dated HISTORICAL citations
   alone ("re-checked on 0.87.1, 2026-10-02", the 0.84.4 floor, `pinnedPiVersion`) unless you
   re-verify them on 1.0.2.
2. `research/pi-landscape-2026-09-01.md`: append a dated addendum "2026-10-05 — pi 0.87.1 →
   1.0.2" in the style of the existing addenda. Write facts only, each cited:
   - built-in MCP: config scopes, exposure modes, `registerMcpServer`, the
     `mcp__<server>__<tool>` naming;
   - `--no-extensions` disables built-in extensions, and `-e builtin:<name>` loads one back;
   - the `structuredContent` field on `tool_result` events;
   - the pi-subagents 0.75.0 floor;
   - pi-mcp-adapter removed.
   Sources: `docs/reviews/pi-1.0-2026-10-04/{compat-audit,architecture-ruling,acceptance}.md`,
   `docs/reviews/edge-builtin-mcp-2026-10-04/land-notes.md`, and pi's installed docs.
3. `packages/nana-setup/README.md` ~L77 "While pi-mcp-adapter is installed…": rewrite as past
   tense. The adapter was removed from this machine on 2026-10-05; while installed it stopped pi
   reading mcp.json, and doctor never detected it.
4. `packages/nana-setup/README.md` install table: describe `context-size-check.sh` in one line.
   It is a `UserPromptSubmit` hook that warns once per repo root when the transcript passes 5 MB
   and suggests `/dev-debrief` then `/compact`. Verify the event and the threshold in the script.
5. `apps/desk/README.md` "Known limits": add one bullet. A narrowed spawn (`--no-extensions`)
   loses pi's built-in MCP and every configured MCP server; the picker does not re-add
   `builtin:mcp`.
6. `apps/desk/README.md` ~L576 cites `docs/mcp.md` for "The core only validates and stores
   registrations…". The sentence is in pi's `dist/core/mcp-servers.d.ts`, not in docs/mcp.md
   [seat-verified]. Fix the source. Check `packages/nana-stage/README.md` for the same citation.
7. `docs/agent-frontend-design-2026-09-04.md` ~L59 heading "(kit; JS + Python validators)": there
   is one JS validator by design, and no Python validator was built. Fix the heading.
8. `REQUIREMENTS.md` Part G intro. The docs auditor says it calls the test dirs "declared outside
   the map by ignore", while `code-map.config.json` maps the six test roots as `layerExempt`
   roots (172 modules). The seat could not find that exact wording, so locate the sentence and fix
   it if it is wrong.
9. `packages/nana-pack/README.md` Handoff bullet: say the store is FIXED at
   `~/.pi/agent/handoffs/…` regardless of `PI_CODING_AGENT_DIR`. It is a deliberate U2 exception,
   as `lib/adoption.mjs` ~L54 says, beside the round-cap ledger, the stage-key store and the
   knowledge index.
10. `AGENTS.md`:
    - the Layout bullet says "nine CLIs" but names eight; add `nana-writing` (the report-only
      writing checker);
    - the "Read in order" line: add `REQUIREMENTS.md` (the standing contract) after `HANDOFF.md`.
11. `README.md`: the sections run Tests (~L81) before Install (~L92). nana-standards' README
    contract orders install, run, test. Move Install before Tests if `readme-check.config.json`
    does not pin the order. Keep the content byte-identical apart from the move.

Skipped on purpose; do not do these:
- the design-doc "112 checks" count (a dated historical figure);
- the nana-objective Node `MODULE_TYPELESS_PACKAGE_JSON` warning (the hook runs `node
  --no-warnings` and discards stderr);
- the `~/.agents/skills` shadowing of four pack skills (machine state; Jake's call).

## Gates (real exit codes; never pipe a test into tail before deciding)

Run the full `npm test` in your worktree. Symlink in the gitignored `apps/bench/.ext` and the root
`node_modules` from `/Users/jwang/nana-pi` first, and remove the symlinks afterwards. Also run
`npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, plus the
fresh renders in A. The new modules and tests carry six-tag headers, and every new row is one
`shall`.

## Report

Write `docs/reviews/audit-2026-10-05/worker-report.md` and commit it. Cover:
- each item A, B, C1–C11: done / skipped-why, with the evidence;
- the rows added and the clause each cited test pins;
- the mutations, with their red lines;
- the gate results.

Tag each claim [V]/[S]/[I]. Final message: verdict, commit hashes, one line per item.
