# Requirements extraction notes, 2026-10-02 (nana-pi)

What the three read-only extraction passes (Opus workers, one per area) found that is not a requirement: judgement calls on status, stale doc claims, what no test pins. Companion to `REQUIREMENTS.md`.

## pack + runner

### Extraction notes

**ID allocation.** The requested nana-pack range R-001..R-199 was exhausted at the end of
section 9; sections 10 to 12 continue at R-700..R-741 rather than renumber or drop clauses.
The runner block starts at R-600 as requested but runs to R-617 (17 rows) and skips R-601 —
an artefact of drafting, not a missing requirement.

**Row count — a deliberate deviation.** 258 rows against the 60–100 aim: 241 for nana-pack
(sections 1–12) and 17 for the runner. The scope covers 13 contract areas, and the pack README
alone is 721 lines of declared behaviour — the gate section carries roughly 30 independently
documented behaviours and the handoff section about 35, so 100 rows would mean ~7 rows per area.
Hitting the count would have required merging clauses whose statuses differ, which the brief
forbids ("a row is the weakest of its clauses — split rather than overclaim"). No clause was
dropped to reach a number. If a shorter pack is wanted, the safe trim is to merge same-status
rows inside one mechanism — sections 3, 5 and 10 would each come down by about a third — rather
than to cut areas.

**The test runner has no test file.** `scripts/test.mjs` carries a `--self-test` mode that
plants three fixtures (red, exit-0-with-FAIL, detached pipe-holding hang) and asserts each gets
its expected verdict, which genuinely pins R-605, R-606, R-610, R-611 and R-615. Because the
brief requires a `packages/nana-pack/tests/<file>::<title>` citation and the fixtures live
inside the runner itself, every runner row is marked `untested`. Read as "no external test",
not "unverified".

**Stale doc claims found.**
- `CLAUDE.md` "Working under nana-pi" says "five pi extensions"; `packages/nana-pack/extensions/`
  holds six (`nana-gate`, `nana-handoff`, `nana-lifecycle`, `nana-notify`, `nana-objective`,
  `nana-post-edit`), and the pack README's own table says six. The same section's `Layout` bullet
  lists five by name too.
- The pack README's skills table is headed `Skills (v0.4.0)` and omits the `requirements` skill,
  which `HANDOFF.md` records as landed 2026-10-02 and which exists at
  `packages/nana-pack/skills/requirements/`.
- The pack README's handoff section still contains the pre-L5 sentence "Until L5 lands the
  session sees nothing either way", immediately after the L5 adoption bullet that describes L5
  as landed.
- `HANDOFF.md` carries the `v0.6.0` tag as still needed, so R-740 is `planned` rather than
  implemented — the templates in the tree are ahead of what consumers render.

**The one `violated` row.** R-058. The README's "Built-in forms" bullet lists `auth.json` and
`settings.json` among protected paths, and `HANDOFF.md` U2 explicitly carries "relocated
`settings.json`/`auth.json` are still outside the floor" as a separate urgent item. Code
confirms: `extensions/nana-gate.ts` `PROTECTED_PATHS` matches them only behind a literal
`.pi/agent/` path segment, and `lib/gate-paths.ts` `activeDirPolicyFiles()` enumerates only
`trust.json` and `nana-pack.json` for the active and default dirs. R-057 (the default-location
case) is `untested` — no test in the suite asserts either file is protected; the suite's policy
tables cover `nana-pack.json`, `trust.json` and `.claude/*`.

**Judgement calls.**
- The adoption signal (lane L5) has no section of its own in the requested list. Its producer
  lives in `extensions/nana-handoff.ts`, so R-143..R-158 sit in the handoff/compaction section.
  Its reader (`bin/nana-adoption.mjs`) is in the same block for cohesion.
- S2 landed mainly in `packages/nana-knowledge` (out of scope). Only its nana-pack-side contract
  is extracted: the additive `extra` escape class on `displayPath` and `locator` (R-181).
- Negative or non-testable claims — "advisory, not a security boundary" (R-073), "the label is
  defence in depth" (R-034), "a shell-computed path is not caught" (R-056), "storage is not
  bounded overall" (R-731) — are recorded as `untested` rows rather than omitted, because the
  docs state them as contract. They are declared limits, not gaps to close.
- `docs/review-punchlist-2026-09-08.md` contributed no SHOULD/MUST line of its own: its 12
  SHOULD lines are all `apps/desk` or `nana-stage` items. Its nana-pack content is the FIXED
  `2efd435` block (timeout-ignore hang, formatter race, path-resolution and `$&` corruption,
  symlink refusal), which the README already states as contract and which R-089, R-090, R-093
  and R-134 cover. Two open sub-items it names are reflected as `untested`: the win32 `taskkill`
  branch (R-107) and `post-edit-file-queue` skipping silently when pi is not installed globally.

**Test files mapped, with the exceptions.** All 36 `packages/nana-pack/tests/*.test.mjs` files
are cited at least once except:
- `agent-dir-hostile.test.mjs` case `A-default` and `B` variants are cited; its `C` group is too.
- `config-normalize.test.mjs` rows R-080 and R-081 cover its generated matrix; individual
  per-block titles are template literals and are cited in that form.
- `handoff-artifact.test.mjs` is cited only via R-108 and R-142 — it is a small smoke file whose
  remaining titles duplicate `handoff-store.test.mjs`.
No test file was left unmapped.

**Titles are quoted as authored.** Many are JavaScript template literals, so a cited title may
contain `${...}`. That is the exact source text, not a transcription artefact.

## knowledge, stage, installer

### Extraction notes

- **Shape.** 35 rows for nana-knowledge (R-200…R-234), 16 for nana-stage (R-250…R-265), 57 for
  nana-setup (R-300…R-356) — 108 total. The weighting follows the sources: nana-setup's README is
  the only full install contract, and its eleven test files assert most of it line by line.
- **What "implemented" rests on.** Every cited title was read from the test file itself (the
  `check(...)` / `ok(...)` first argument across all 19 test files in the three packages), and each
  row's wording is held to what those titles assert. Where a title is a template literal in the
  source (`remote IS us: ${e}`, `${language}: ${rel} is byte-equal …`), it is cited verbatim with the
  placeholder — that is the text in the file, not a rendered run. These suites use a
  `check(name, ok)` harness printing PASS/FAIL per line; **no suite was executed** here (read-only),
  so "implemented" means an assertion of record exists, not green on this working tree.
- **Merging.** Rows were merged where one `shall` sentence covers claims that always travel together
  and share a status (e.g. R-206 incremental build, R-232 the build lock, R-321 the atomic settings
  write). Nothing tested was merged with something untested — every untested claim is its own row,
  which is why R-203 (symlinked directories), R-224 (one renderer) and R-228 (stdin cap) sit alone
  beside their tested neighbours.
- **nana-stage has no README.** Its contract came from `package.json`, the module headers of
  `lib/sign.mjs` and `extensions/nana-stage.ts`, `docs/agent-frontend-design-2026-09-04.md`
  (§3.1/§3.2/§6 plus the review rounds), and the 110-plus assertions in `tests/blocks.test.mjs`.
  Its two `untested` rows are the mechanisms that live in the extension rather than `lib/`, which the
  zero-dep test imports directly: the environment-key scrub (R-258) and the tool-readiness watcher
  (R-265). HANDOFF records the extension side as covered by a "real chain (15, real pi + 2 model
  turns)" run — not a committed deterministic test in this package.
- **Concurrent edits in nana-setup.** The working tree has `README.md`, `lib/doctor.mjs`,
  `lib/paths.mjs`, `lib/steps.mjs` and `tests/install.test.mjs` modified, plus untracked
  `tests/skills-and-standards.test.mjs` and `claude/rules/nana-standards.md`. R-301…R-305 — the two
  pieces landed 2026-10-02, the `requirements` skill symlink and the `nana-standards.md` rule — are
  extracted from those files **as they stand**, so their evidence may move before the edits settle.
- **The nine untested rows, by kind.** Housekeeping invariants nobody asserts (R-200 store directory
  and no source writes, R-203 symlinked directories, R-209 the FTS5/BM25 configuration, R-315
  `--yes` and never prompting); a structural coupling HANDOFF already carries as a residual
  ("no CLI-level rendering test", R-224); one documented cap (R-228); two extension-side mechanisms
  (R-258, R-265); and one that is untestable by design, since no test may load a launchd service
  (R-356).
- **No `violated` rows.** Nothing asserted the opposite of a documented contract. The nearest thing
  is stale narrative rather than broken code: `HANDOFF.md` line 39 still says the knowledge pull has
  a "hard 1500 ms bound", which the README's own Budget paragraph retracts and the tests do not
  assert. R-225 follows the README and the tests — fail-open on an asynchronous stall — and the
  HANDOFF line should be corrected when that file is next touched.
- **Contract, not design.** Mechanism is named only where it *is* the guarantee being sold: the
  two-lock reclaim (R-232), the lock-held read-validate-temp-recompare-rename sequence (R-321),
  `lstat`-not-`existsSync` presence (R-333), and realpath identity matching (R-324). Everywhere else
  the row states the observable obligation and leaves the implementation to the package.

## desk, bench

### Extraction notes

- **Counts.** 62 desk rows (R-400…R-461) and 41 bench rows (R-500…R-540), 103 rows total. Rows were
  merged where several claims shared one status and one test file, so the granularity is coarser than the
  source documents; no row mixes statuses.
- **`implemented` discipline.** Claimed only where the asserting `check(...)` call was read in the named
  unit test file. Titles are quoted as they appear in the source, template placeholders included
  (`${PI_MIN_VERSION}`, `${PENDING_CAP + 1}`, `${label}`, `${k}`) — that is the literal text.
- **What the e2e suites cover that nothing in `npm test` pins.** `scripts/test.mjs` collects
  `packages/*/tests/*.test.mjs`, `apps/desk/test/*.test.mjs` and `apps/bench/test/*.test.mjs`; every
  `*.e2e.mjs` is excluded (fixed ports, browser), as is everything under `apps/bench/studies/**`. So
  these have no mechanical coverage in the canonical acceptance path, which is exactly why R-413, R-418,
  R-421, R-426, R-427, R-428, R-434 and R-454 read `untested`:
  - `session-races.e2e.mjs` (46 browser checks, stub pi) — the single stage-generation counter, `resync()`
    as the one coalescing door, the reconnect single-resync rule, the per-id bash buffer bounds, the
    surrogate-safe 20000-character cut, history-wins after a rebuild, and explicit-rejection-returns-text.
    That is the whole of §8 and the page half of §4.
  - `changes-ui.e2e.mjs` — the bar's render, the floating window, and the Esc carve-out (R-426). The
    server half of §5 is fully pinned by `changes-endpoint.test.mjs`; the UI half is not.
  - `reload.e2e.mjs` — reload with and without the pack, and skill auto-detect on window focus (R-427).
  - `live-feel.e2e.mjs` — the activity line's states and the streaming thinking card (R-428). Only the
    `/skill:` parser from that batch has a unit test (`live-feel.test.mjs`, 5 checks).
  - `subagent-render.e2e.mjs` — the subagent card and the post-compaction context-meter estimate (R-413,
    R-428).
  - `spawn-tools.e2e.mjs` — the picker recomputing the effective tool set on cwd change and trust flip
    (R-418).
  - `rail-collapse.e2e.mjs` — rail fold, its persistence, the Ctrl/Cmd+B binding, the compact spawn
    affordance and the product name. No row was written for these: presentation only, and no source
    document states them as a contract.
  - `stage-page.e2e.mjs`, `stage-page-edge.e2e.mjs`, `stage-render-edge.e2e.mjs`, `stage-chain.e2e.mjs`,
    `stage-chain-edge.e2e.mjs` — the stage host reducer, same-id upsert in place, the gate-bar invariant
    with the drawer collapsed and after reload, the chart-tooltip escaping invariant, the
    mutating-tool refresh event reaching the app page, and both real MCP chains. The desk-side listener
    contract is pinned by `app-listener.test.mjs`; the page, the renderer and the dashboard ports (R-454)
    are not.
  - `double-msg.e2e.mjs`, `title-live.e2e.mjs` — the one-bubble regression (one real model call) and title
    derivation routed through a live session rather than a file append.
- **Known intermittent.** `apps/desk/test/stage-key-persistence.test.mjs` is recorded in `HANDOFF.md` as
  having failed once under the full runner and passed 5/5 standalone, with no root cause. Every
  `implemented` row in §9 rests on that one file.
- **Non-code constraints.** R-500, R-538 and R-540 are contract lines the sources state plainly but
  nothing in the suite asserts: the dry-run default and the zero-model-call property of the bench tests,
  the E1 land posture plus its kappa refusal gate, and the tool-profile ruling. They are `untested` with
  `—` because a test citation is the only evidence this format admits.
- **Declared violations.** R-433, R-435, R-436, R-445 and R-446 are requirements the source documents
  themselves record as unmet, each one line in `apps/desk/README.md` Known limits and most also STILL OPEN
  in `docs/review-punchlist-2026-09-08.md`. They are listed as requirements rather than omitted because
  each names a property a caller would otherwise assume.
- **Deliberately not extracted.** Study data under `apps/bench/studies/**` (results, labels, kappa pairs,
  summary tables) was read only for the land-posture and verdict headlines; no number from it appears as a
  requirement.

