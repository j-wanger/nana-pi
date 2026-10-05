# Worker report — fixes from the 2026-10-05 nana-pi audit

Worktree `~/nana-pi-wt/audit-fixes`, branch `feat/audit-fixes`, off main `5bae6cc`. Commits:

- `e433e5a` — A (the lint-gate defect)
- `b4f3fe0` — B (the shared-file canonicalization)
- `6fa06b7` — C (the eleven documentation drifts)
- `1632409` — this report, first cut
- `af287dd` — the seat's own commit: the sol r1 review brief (not mine)
- `d3c9e5a` — round 2: the gpt-5.6-sol r1 BLOCK response (see that section below)

No push, no merge, no `pi-review` run, `HANDOFF.md`/`~/.pi`/`~/.claude`/`~/.agents`/the live
checkout/the running desk untouched. Tags: `[V]` directly verified in this pass (ran a command,
read the exact source line, or reproduced live), `[S]` read in source/docs and trusted, `[I]`
inferred.

## A — the fresh-scaffold lint-gate defect

**Done.** [V]

**The brief's own description of the defect was incomplete on both languages — found and fixed
the real scope, not just the named one.**

- Python: `uvx ruff check .` on a fresh render gives 15 errors as the brief said, but NOT all in
  `tests/test_requirements_trace.py` — 4 of them (1 `E501`, 3 `RUF003`) are in
  `tests/conftest.py` (the module docstring's long `@purpose` line, and ambiguous-unicode glyphs
  inside comments explaining the `re.IGNORECASE`/`re.ASCII` fold). [V] direct `uvx ruff check .`
  run, line-by-line attribution.
- TypeScript: `pnpm lint` on a fresh render gives 7 errors, but only 3 are in
  `tests/requirements-trace.ts` (2 `noExcessiveCognitiveComplexity`, 1 formatting) — the other 4
  are in `scripts/code-map.mjs` (1 complexity, 1 formatting) and in `tests/code-map.test.ts` /
  `tests/requirements-trace.test.ts` (1 formatting each). [V] direct `pnpm dlx @biomejs/biome
  check .` run at both `2.0.0` (the caret floor) and `2.5.15` (what `^2.0.0` resolves to today) —
  identical result at both, so this is not biome-version drift since the audit ran, it is a real
  gap in what the audit named.

**Fix — config-scoped, no rail-logic refactor** (the brief's own warning: nana-pi's root
`scripts/code-map.mjs` and `scripts/requirements-trace.mjs` are shims importing straight from
`templates/typescript/template/scripts/code-map.mjs` and
`templates/typescript/template/tests/requirements-trace.ts` — confirmed by reading both shim
files — so a logic change there ships into this repo's own rail):

- `templates/python/template/pyproject.toml.jinja`: two new `per-file-ignores` entries, scoped to
  exactly `tests/conftest.py` and `tests/test_requirements_trace.py` (not `tests/**`), adding
  `RUF001`, `RUF003`, `E501`. Ruff's per-file-ignores union across matching globs — confirmed
  live — so the existing blanket `tests/**` entry (`S101`, `PLR2004`, `T201`) still applies
  underneath.
- `templates/python/template/tests/test_requirements_trace.py.jinja`: one line reformatted
  (wrapped the over-120-char f-string) to match `ruff format`'s own output exactly — reproduced
  the diff with `uvx ruff format --check .` first, then hand-applied the identical wrap since the
  file is templated and can't be piped through the formatter directly.
- `templates/typescript/template/biome.json`: one `overrides` block, `includes:
  ["tests/requirements-trace.ts", "scripts/code-map.mjs"]`, disabling
  `noExcessiveCognitiveComplexity` for exactly those two files — not a global cap raise.
- Four plain-formatting fixes, each reproduced from biome's own suggested diff: two files are not
  templated (`templates/typescript/template/scripts/code-map.mjs`,
  `templates/typescript/template/tests/requirements-trace.ts`) and were run through `biome
  format --write` directly; two are `.jinja` (`tests/code-map.test.ts.jinja`,
  `tests/requirements-trace.test.ts.jinja`) and were hand-edited to the identical wrapped form
  since the violated lines carry no Jinja syntax. `git diff` on all four is whitespace-only — no
  logic changed.

**Requirement row.** Added `R-758`→ corrected to **`R-858`** mid-pass: the brief's "ID blocks"
summary line (`R-756 to R-879 ... R-756 and R-757 consumed batch 0, the rest unused until a
later batch`) is itself stale — `R-758` through `R-857` are already consumed by a later EARS-form
batch not reflected in that summary sentence. Found by grepping the actual IDs in use, not the
summary prose; picked `R-858`, inside a confirmed-free span (`R-858`–`R-878`), confirmed free by
grep before use. `[V]`

> R-858 | WHEN a project is rendered from either template with default answers, its own lint and
> format gates shall pass with no edits.

**Pinned, not landed `untested`** — chose the cheap path over the brief's `untested` fallback
because `uvx ruff`/`pnpm dlx @biomejs/biome` were already cached on this machine (confirmed:
`uvx ruff --version` and `pnpm dlx @biomejs/biome --version` both resolved in under 3s, no real
network wait) and the existing `templates-render.test.mjs` already has a graceful-skip pattern
for exactly this kind of machine-dependent tool (`copierAvailable()`). Added three new checks,
each probe-gated the same way, SKIPping rather than FAILing when the tool can't be resolved:

- `${language}: a fresh scaffold passes ruff check with no edits` (python only)
- `${language}: a fresh scaffold is ruff-format clean with no edits` (python only)
- `${language}: a fresh scaffold passes biome check with no edits` (typescript only)

Each carries its own `// req: R-858` directly above its `check(...)` call. Row clauses pinned:
"its own lint ... gates shall pass" → the ruff-check and biome-check cites; "its own ... format
gates shall pass" → the ruff-format cite (biome's `check` already runs the formatter as part of
the same command, confirmed live — no separate biome-format cite needed). "rendered ... with
default answers" is the existing `render(language, {...spec.answers, adopt: "false"})` call the
new checks sit inside — `adopt: false` is copier's own declared default (`copier.yml`).

**Mutation.** `git stash push` on the 7 defect-fix files only (test-pinning file left in place),
reran `templates-render.test.mjs`: all 3 new checks → **FAIL** (`ruff check`, `ruff format`,
`biome check`, each with the real tool output in the failure detail). `git stash pop` restored
the fix; reran — all green again. `[V]`

**Fresh-render proof, both languages, from committed `HEAD`, real exit codes:**

| Check | Python | TypeScript |
|---|---|---|
| render (`uvx copier copy --vcs-ref HEAD ...`) | exit 0 | exit 0 |
| install (`uv sync` / `pnpm install`) | exit 0 | exit 0 |
| lint (`uv run ruff check .` / `pnpm lint` inside `pnpm check`) | exit 0 | exit 0 |
| format (`uv run ruff format --check .` / biome's own check) | exit 0 | — (one command) |
| test (`uv run pytest`, 58/58 / `pnpm check`'s vitest, 52/52) | exit 0 | exit 0 |
| `uv run pre-commit run --all-files` (ruff check, ruff format, secrets, mypy strict) | exit 0 | n/a |
| `node scripts/readme-check.mjs` (inside `pnpm check`) | n/a | exit 0, 0 problems |

Every exit code above was captured by running the command standalone (never through a `| tail`
pipe) — the one place a `| tail` pipe was used mid-investigation to read long output, the exit
code was re-captured separately afterward before being relied on. `[V]`

**Adopt mode**, both languages, scratch projects with a pre-existing `src/`/`README.md`: rendered
with `adopt=true`, then ran the lint tool against the template-shipped rail files only (`tests/`,
`scripts/`) — both clean (`uvx ruff check tests/ scripts/` exit 0; `pnpm dlx @biomejs/biome check
tests/ scripts/` exit 0). The adopter's own pre-existing `src/existing_pkg/__init__.py`
(`print('hi')`, single quotes) still fails ruff — expected and documented behavior (the
`adopt-py`/`adopt-ts` skill message says to reconcile from `git diff` first), not a defect in
this fix. `[V]`

## B — `templates/_shared/working-under-nana-pi.md` as the single verified truth

**Done.** [V]

Diffed the two files bullet-by-bullet before touching either. Confirmed the brief's claim and
found it precise: the shared file was missing the U2-era agent-dir wording for receipts/journal,
the Gate paragraph's policy-files/variable-spellings/allow-pattern-segment/shell-computed-path
detail, and the Handoff bullet's staleness/authority-label facts; AGENTS.md was missing the
Objective bullet and the whole Requirements-first subsection. Navigation, Config's shape, Notify
and The desk sections were already near-identical or AGENTS.md's was already the fuller, more
accurate version.

**Verified against code before keeping each clause** (not just diffed the two docs against each
other):

- `handoff.staleAfterDays` default 7, and the pointer-not-text behavior past it — `[V]`
  `packages/nana-pack/lib/config.ts:88-108`, `packages/nana-pack/extensions/nana-handoff.ts:37-39`.
- The exact authority-label text ("Provenance: agent-written compaction summary — lower
  authority than OBJECTIVE.md / AGENTS.md / DOCTRINE...") — `[V]`
  `packages/nana-pack/extensions/nana-handoff.ts:83-84` (the `AUTHORITY` constant) and `:17-26`
  (the module's own doc comment, independently worded, says the same thing).
- The legacy-`.pi/handoff.md` pointer line really says "untrusted repo text" — `[V]`
  `nana-handoff.ts:333`, the literal injected string.
- Receipts default dir `<agent dir>/receipts`, journal default
  `<agent dir>/nana-journal.jsonl` — `[V]` `lib/config.ts:99-100`, `:612`.
- The gate's four `PI_CODING_AGENT_DIR` spellings, case-insensitive, balanced-form-only — `[V]`
  `lib/gate-paths.ts:143`, the literal regex.
- Allow patterns exempt one exec segment, never a compound — `[V]` `lib/gate-shell.ts:15-16`.
- The stranded-`nana-pack.json` one-time note, and the malformed/over-cap gate-block fallback
  behavior in the Config paragraph — `[V]` `lib/config.ts:486-493` for the stranded case; the
  fallback-to-last-valid-policy behavior is AGENTS.md's own pre-existing, live text, spot-checked
  rather than re-derived from scratch given the time budget — `[S]`.

Rewrote `templates/_shared/working-under-nana-pi.md` to the union (AGENTS.md's wording wherever
it was more precise, the shared file's wherever AGENTS.md was missing a fact entirely), then
replaced AGENTS.md's "Working under nana-pi" section (line 110 to EOF) with that exact file's
bytes. `diff <(sed -n '110,$p' AGENTS.md) templates/_shared/working-under-nana-pi.md` → empty.
`CLAUDE.md` is a symlink to `AGENTS.md`, so this covers both without a separate edit.

**Requirement row:**

> R-859 | AGENTS.md's "Working under nana-pi" section shall carry
> templates/_shared/working-under-nana-pi.md verbatim.

Pinned by a new `checkAgentsMdMirrorsWorkingUnderNanaPi()` in `templates-render.test.mjs`
(mirrors the existing `R-756` Part-G pattern): one `check()` asserting `agents.endsWith(shared)`,
clause "shall carry ... verbatim" → that cite directly.

**Mutation, two layers:**

1. In-suite, permanent: a scratch copy of the real `AGENTS.md` with its final byte dropped —
   `agents.slice(0, -1)` written to a temp file, same `.endsWith()` predicate re-run against it →
   **FAIL**. This runs every time the suite runs, so the check's liveness is re-proven on every
   CI run, not just this pass. `[V]`
2. One-off, manual, on the real file: appended one byte to the live `AGENTS.md`, reran the
   suite → the real check **FAILED**; restored from a scratchpad backup, reran → **PASS**. `[V]`

## C — the eleven documentation drifts

Order followed the brief exactly; each claim checked against the installed pi (`pi --version` →
`1.0.2`), the cited review corpora, or the named source file before editing.

**C1 — pi version, `0.87.1` → `1.0.2`.** Done. `[V]` Updated: `README.md` L73/79 (Dependencies
table), `apps/desk/README.md` L25 (+ its `npm i -g ...@1.0.2` command) and the sample log line,
`apps/bench/README.md` L11-13, `packages/nana-pack/README.md`'s "Tested host since" line (now
dated 2026-10-05, matching the a-pack audit's own live-session date on this exact repo state).
Left every dated historical citation alone (`apps/bench/README.md` L81/141's "re-checked on
0.87.1, 2026-10-02", the 0.84.4 floor everywhere, `pinnedPiVersion` in the bench study JSON) —
none of those were re-verified on 1.0.2 by anyone this pass, so touching them would have been a
false claim. One addition beyond the brief's literal ask: `packages/nana-pack/README.md`'s
adjacent sentence about the `/reload-runtime` skill-pickup claim said "verified on 0.84.4 and not
re-run on 0.87.1" — now reads "...or 1.0.2" too, since leaving it silent on 1.0.2 after bumping
the line above it to "Tested host since 2026-10-05: pi 1.0.2" would have implied that specific
claim got re-tested when it didn't (confirmed un-re-tested: the a-pack audit's own UNVERIFIED
section says so explicitly).

**C2 — `research/pi-landscape-2026-09-01.md` addendum.** Done. `[V]` Added "Addendum 2026-10-05 —
pi 0.87.1 → 1.0.2" in the existing addenda's style (only what changed, each bullet cited). Five
facts, each checked against pi's own installed `docs/` before writing:
- built-in MCP scopes (`~/.pi/agent/mcp.json` user, `.pi/mcp.json` project-trust-gated),
  `mcp__<server>__<tool>` naming, exposure modes (`codemode` default / `deferred` / `direct` /
  `hidden`), `pi.registerMcpServer()` — `docs/mcp.md`, cross-checked against
  `architecture-ruling.md` §3's "nana-gate sees the real tool name, not an adapter proxy" claim.
- `-ne`/`--no-extensions` disables built-ins too; `-e builtin:<name>` loads one back — `docs/cli.md`,
  quoted near-verbatim ("`pi -ne -e builtin:mcp` keeps only the built-in MCP support").
- `structuredContent` on a tool result (present when `outputSchema` is declared; a `tool_result`
  handler that redacts `content` must also replace it) — `docs/extensions.md`, cross-checked
  against the edge-builtin-mcp land-notes' live observation of its absence on an undeclared tool.
- pi-subagents floor raised to 0.75.0 — `architecture-ruling.md` §2, `acceptance.md` A1.
- `pi-mcp-adapter` removed from this machine 2026-10-05 — `architecture-ruling.md` §3 (`pi remove
  npm:pi-mcp-adapter`), `HANDOFF.md`'s own "pi-mcp-adapter is gone everywhere" line.

**C3 — `packages/nana-setup/README.md` pi-mcp-adapter bullet.** Done. `[V]` Rewritten past tense:
"pi-mcp-adapter was removed from this machine on 2026-10-05. While it was installed, pi did not
read mcp.json directly..., and doctor never detected the adapter, so its `!` stayed moot the
whole time it was present."

**C4 — `context-size-check.sh` description.** Done. `[V]` Read the script directly: `UserPromptSubmit`
hook, `THRESHOLD=5242880` (5 MiB), warns once per repo root via a `.claude/.context-warned` flag
file, message format confirmed verbatim. Split it out of the four-hooks grouped table row into
its own row with that one-line behavior description.

**C5 — desk README Known limits bullet.** Done. `[V]` Added: "A narrowed spawn loses your MCP
servers. `--no-extensions` ... disables pi's built-in MCP along with every configured MCP
server; the spawn picker neither lists a built-in MCP toggle nor re-adds `builtin:mcp`..." —
cross-referencing the existing 2026-10-04 Contract note rather than duplicating its detail.

**C6 — stale `docs/mcp.md` citation.** Done, with one correction to the brief's cross-reference.
`[V]` Confirmed the sentence ("The core only validates and stores registrations. The MCP
extension ... connects them") is byte-for-byte in pi's installed
`dist/core/mcp-servers.d.ts:1-5`, not in `docs/mcp.md` anywhere (grepped both). Fixed
`apps/desk/README.md`'s citation to name the real source. **Checked
`packages/nana-stage/README.md` per the brief's instruction — the claimed citation is not there**
(grepped for every substring of the sentence; line 46 of that README is about something
unrelated, `emitToolResult` deleting `structuredContent`). The brief's own source — the c-desk
audit finding — was wrong about this second location; skipped, no edit made there.

**C7 — design doc heading.** Done. `[V]` Confirmed `packages/nana-stage/lib/` holds exactly one
file, `blocks.mjs` (plus `sign.mjs`, unrelated); no `.py` validator exists anywhere in the repo.
Heading now reads "(kit; one JS validator, by design — no Python validator was built)".

**C8 — REQUIREMENTS.md Part G intro.** Done, found the real sentence (not byte-identical to the
brief's quoted wording, but the same claim). `[V]` `code-map.config.json`'s own `$comment`
states the six test roots are declared as `roots` with `layerExempt: true`, not `ignore` — and
`npm run map:check`'s own output lists `packages/nana-pack/tests` etc. among its 172 mapped
modules. The intro's old sentence lumped "the test dirs" in with "declared outside the map by
`ignore`", which is wrong for the test dirs specifically (right for the study trees and
`templates/`, which genuinely are in the `ignore` array). Rewrote to separate the two claims.

**C9 — nana-pack README Handoff bullet.** Done. `[V]` `lib/adoption.mjs:48-54`'s own comment:
"FIXED at ~/.pi/agent/handoffs on purpose (U2's ruling, twice)"; `HANDOFF.md`'s U2 entry lists
the same four exceptions the brief named. Rewrote the bullet's opening to say "fixed at ...
regardless of `PI_CODING_AGENT_DIR`" and name the other three exceptions beside it.

**C10 — AGENTS.md "nine CLIs" / Read in order.** Done. `[V]` `ls packages/nana-pack/bin/` → 9
files; the prose named 8 (missing `nana-writing.mjs`, confirmed "report-only" from its own
`@purpose` header). Added it. Added `REQUIREMENTS.md` (the standing contract) to the "Read in
order" line, after `HANDOFF.md`.

**C11 — README.md section order.** Done. `[V]` Confirmed no "order" key or order-checking logic
anywhere in `readme-check.config.json` or `scripts/readme-check.mjs` (grepped both for
`order` — zero hits beyond an unrelated "in line order" doc comment). Moved the `## Install`
section (then L92-240) to before `## Tests` (then L81-91); `diff` of the two versions shows only
the block relocation, zero byte changes inside either section.

## Gate results (real exit codes, captured without piping into `tail`)

Symlinked `apps/bench/.ext` and the root `node_modules` from `/Users/jwang/nana-pi` before the
run, removed both afterward (confirmed gone: `ls` on each now errors "No such file or
directory").

| Gate | Result |
|---|---|
| `npm test` | **95 files: 95 PASS, 0 FAIL, 0 SKIP, 0 WARN · 5780 checks pass, 0 fail, 4 skip** · exit 0 |
| `npm run map:check` | 172 modules, 0 without a contract header, 3 exempt, **0 problem(s)** · exit 0 |
| `npm run readme:check` | **553 claims checked, 0 problem(s)** · exit 0 (the 5 problems seen mid-pass were exactly the missing `.ext`/`node_modules` symlinks — gone once linked) |
| `node scripts/requirements-trace.mjs` | 797 total (510 implemented · 1 planned · 2 retired · 277 untested · 7 violated); **0 rows off form** · exit 0 |
| Fresh renders (A) | both languages, scaffold + adopt, all green — see A above |

No new module or test FILE was created this pass (only existing files edited — `git diff --stat
5bae6cc..6fa06b7`: 18 files changed, all modifications, zero additions), so the "new modules
carry six-tag headers" gate note doesn't add new obligations; `templates-render.test.mjs`'s
existing header was untouched. Both new rows (`R-858`, `R-859`) are single-`shall` EARS rows,
confirmed by `ears: 0 rows off form` after each edit.

## Residuals / things noticed but out of scope

- Two counting discrepancies the brief's own source text got wrong, both corrected narrowly
  above without expanding scope to fix the sources that produced them: the "ID blocks" summary
  sentence in `REQUIREMENTS.md`'s header (claims only `R-756`/`R-757` are consumed in the pack's
  continuation block; actually `R-756`–`R-857` are) and the c-desk audit's TypeScript error
  attribution (claimed all 7 in one file; 3 of 7 are, the rest spread across 3 other files).
  Neither summary line itself was touched — only the actual rows/fixes needed for this task.
- `REQUIREMENTS.md` Part G intro's "73 modules in all" figure was not re-verified (out of C8's
  scope, which only concerned the ignore/layerExempt sentence); a quick count found 77 non-test
  modules under the declared roots today, so that number may itself be stale — flagged here, not
  fixed, since the brief did not ask for it and changing it would need its own verification pass.
  (Fixed in round 2 below, once named by the review this residual predicted.)

## Round 2 — gpt-5.6-sol r1, BLOCK 6/10

Review at `docs/reviews/audit-2026-10-05/sol-brief.md` (the seat's brief to sol) and the full
findings the coordinator relayed (not copied into this tree — the seat's own commit carries only
the brief, per instruction). Commit `d3c9e5a`.

**1 — MUST — R-858 returned to `untested`.** Done. `[V]` sol's own reproduction (a `PATH` with
only Node present, confirmed by the SKIP/SKIP/"all passed"/exit 0 transcript in the review) is
real: the three lint checks added in round 1 are each gated behind a `uvx ruff --version` /
`pnpm dlx @biomejs/biome --version` probe that SKIPs silently, so a machine without those tools
asserts R-858's clause not at all while the suite still exits green. On top of that, even where
they DO run, they invoke `uvx ruff` / `pnpm dlx @biomejs/biome` directly, not the rendered
project's own installed `uv run ruff` / `pnpm lint` — a different command than the row's "its
own ... gates" wording promises. Removed all three `// req: R-858` markers (checks themselves
kept — they still catch a real regression on a machine that has the tools, which is worth
keeping even unmarked). Row flipped to `untested`; its Evidence cell now states, in prose, (a)
the manual fresh-render proof from 2026-10-05 (both languages, scaffold + adopt, with the
project's own installed commands), (b) that the suite's checks run here but skip silently
elsewhere, and (c) that they call `uvx`/`pnpm dlx`, not the rendered project's own commands —
exactly the three things the coordinator's instruction named. `requirements-trace.mjs` confirms:
509 implemented (down 1), 278 untested (up 1), 0 rows off form.

**2 — MUST — six categorical claims qualified, each verified in code first.** Done. `[V]` for
all six:
- Objective: `nana-objective.ts:71`, `if (!cfg.objective.enabled) return;` inside
  `session_start` — confirmed user-scope-only by `lib/config.ts:567`'s
  `merge("objective", u.objective)` (one argument, no project-scope source, unlike keys that
  take `merge(key, u.key, project.key)`).
- Handoff: `nana-handoff.ts:309,442` gate both read and write on `cfg.handoff.enabled`;
  `:327,454` read `cfg.handoff.path` and use it in place of the default store path when set.
  Case-folding on Windows re-confirmed at `lib/adoption.mjs`'s `storePathFor()`. Applied the same
  qualification to `packages/nana-pack/README.md`'s Handoff bullet (L593) — its opening clause
  said "fixed at ... regardless of PI_CODING_AGENT_DIR" with no "by default" of its own, even
  though the bullet's own later sub-bullets (`Custom handoff.path`, `Disable with
  handoff.enabled: false`) already covered both facts — the opening sentence alone was the
  unqualified part the review meant.
- Notify: `nana-notify.ts:121-122`, `if (!cfg.notify.enabled) return; if (!ctx.hasUI &&
  !cfg.notify.headless) return;` — confirms both the enabled gate and the headless-silent-by-
  default rule in one pair of lines. The in-app fallback (`ctx.ui.notify(...)` at line 136) sits
  strictly inside the `onFail` callback passed to the OS notifier (`:126-139`), confirming it
  fires only on an OS-notifier failure.
- Gate / auth: `PROTECTED_PATHS` in `nana-gate.ts:54-64` is a literal-string regex,
  `/\.pi[/\\]agent[/\\]auth\.json/i` — it matches the DEFAULT path's own text, not a resolved
  `PI_CODING_AGENT_DIR`, so a relocated agent dir's `auth.json`/`settings.json` is genuinely
  unprotected; `REQUIREMENTS.md:104`'s `R-058` is already `violated` with exactly this
  attribution.
- Gate / symlink: `activeDirPolicyFiles()` in `lib/gate-paths.ts:109-123` walks only
  `[piAgentDir(), ~/.pi/agent]` and resolves each file's symlink target within those two dirs —
  there is no equivalent walk for a project-scope `.pi/nana-pack.json`'s own symlink target.
  `HANDOFF.md`'s U2 line already carries this as "a project-scope policy symlink target is not
  covered."
- Gate / loosening vs. malformed-stop: `config-gate-fallback.test.mjs` case (c) writes a
  malformed `gate` leaf, confirms every tool call blocked, then repairs the file and calls the
  SAME gate instance again in the SAME test (no restart, no reload) — "repaired file — benign
  command allowed again" passes. `REQUIREMENTS.md:112`'s `R-065` states the rule directly: "Repairing
  the named file shall lift the stop live, while its allow patterns wait for the next session
  start."

All six qualifications were written into `templates/_shared/working-under-nana-pi.md` first,
then the file was re-copied into `AGENTS.md` (`head -n 109 AGENTS.md` + `cat` the shared file)
and `diff`-confirmed byte-identical, same mechanism as round 1's B. The
`templates-render.test.mjs` mirror check (`R-859`) still passes.

**3 — SHOULD — two addendum fixes.** Done. `[V]` `doctor.mjs:317-321`: the pi-subagents
below-floor branch calls `add(FAIL, "pi pi-subagents", ...)`, and `nana-setup.mjs:140`'s own
symbol table maps `FAIL` → `✗`, `WARN` → `!` — confirmed I had mis-attributed the `!` from
`architecture-ruling.md`'s adjacent, unrelated sentence about the `mcp.json` codemode-default
check. Fixed. Added the hash-suffix fact for colliding/overlong MCP tool names, confirmed in
`docs/mcp.md` ("tools of a server whose names then collide all get a hash suffix") and
`dist/extensions/mcp/tools.js:29-54` (`MAX_TOOL_NAME_LENGTH = 64`, a sha256-derived 8-char
suffix).

**4 — SHOULD — Part G intro module count.** Done. `[V]` Recounted directly from
`docs/code-map.md`'s own headings (172 total; 95 paths matching `/test(s)?/`; 77 not) —
matches sol's count exactly. Replaced "73 modules in all" with "172 modules in all ... 77
non-test ... plus 95 under the six test roots," naming what each counts.

**5 — NOTE — the bogus `--` in `pnpm map:impact -- <file...>`.** Done, scope widened slightly
on my own initiative. `[V]` Reproduced live against a freshly rendered TypeScript project:
`pnpm map:impact -- src/index.ts` → `node scripts/code-map.mjs --impact -- src/index.ts` →
pnpm forwards the `--` token literally (confirmed by a side-by-side `npm run` test, which DOES
strip it — `node scripts/code-map.mjs --impact scripts/code-map.mjs`, no bogus line), so the
CLI reads `--` as a second file argument and prints `-- [NOT A MAPPED MODULE]` before the real
result. Fixed the one line named
(`templates/_shared/working-under-nana-pi.md`). Checked the Python twin
(`uv run python scripts/code_map.py --impact <file>` — never uses a package-manager
script-forwarding layer, so `--` never appears; nothing to fix) and found two more TypeScript
template files carrying the byte-identical bug, not named by the review but caught while
searching for "any template README with the same form":
`templates/typescript/template/AGENTS.md.jinja` and
`templates/typescript/template/{% if not adopt %}src{% endif %}/AGENTS.md`. Fixed those too
(pure text, zero logic risk) rather than leave a known, verified, trivial-to-fix instance of the
exact same defect sitting uncorrected a few files away.

**Gate results, round 2** (symlinks re-added, then removed after):

| Gate | Result |
|---|---|
| `npm test` | 95/95 files, 5780/5780 checks, 0 fail, 4 skip · exit 0 |
| `npm run map:check` | 172 modules, 0 problems · exit 0 |
| `npm run readme:check` | 553 claims, 0 problems · exit 0 |
| `node scripts/requirements-trace.mjs` | 797 total, 0 rows off form · exit 0 |
| Fresh render, python, from new `HEAD` | render, `uv sync`, `ruff check`, `ruff format --check`, `pytest` (58/58) — all exit 0 |
| Fresh render, typescript, from new `HEAD` | render, `pnpm install`, `pnpm check` (52/52) — all exit 0; `pnpm map:impact src/index.ts` runs clean, no bogus `--` line |

Every exit code captured directly (redirected to a file, `echo $?` immediately after), never
through a `| tail` pipe.
