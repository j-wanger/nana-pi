# precedent-first: plan draft (planner, 2026-10-22)

Feature: FEAT-006 · Launch builders with execution limits (checked: pi-worker, its preamble rows R-961 and R-1110 live there, REQUIREMENTS.md:435). One row (R-2583) sits in FEAT-014 beside R-1100, its precedent, and is shared into FEAT-006 through Also applies.
Class: ordinary. The lane changes pi-worker (the builder launcher), a new pack lib, the preamble text, the shared template text and the rulings text. None is in the install, hook or gate list: no nana-setup install, uninstall or doctor; no Claude Code hook or pi extension code (nana-rulings.ts is unchanged, only the file it reads); no gate policy; no nana-land, pi-review or review-round. Dropping item 6 (below) is part of what keeps it ordinary: the review standard is the text pi-review appends to every review (inferred to count as a review-tool change).
Stakes: medium blast, reversible. A wrong refusal stops every lane launch on every machine until fixed; nothing is lost or written. The refusal fails closed and names its reason.
Threat model: honest variation in the seat's own brief text is in scope: a seat forgets the section, leaves it empty, names a moved, deleted or never-committed file, writes `../` or an absolute path, a glob, backslash separators, backticks, a `:12` or `:12-40` suffix, keeps the brief in a subfolder, saves it with CRLF, trailing blanks, a BOM or no final newline, names a feature with no known-bug file, or mentions another FEAT id in prose. Deliberate forgery is out: a real but irrelevant tracked file passes; the check proves the file exists at HEAD, not that it is the right precedent. Public repo: this plan and every repo text name no owner and nothing about the owner's work; examples use nana-pi's own cases.

## Precedent (this lane's own section, in the form the lane will require)

Precedent:
- packages/nana-pack/bin/pi-worker.mjs:93-100 — brief validation: exists, regular, readable; the check slots in right after :100, before the roster (:102) and the lock (:166).
- packages/nana-pack/bin/pi-worker.mjs:59-64 — `laneFailure(reason)`: one `pi-worker: lane refused: <reason>` line, exit 1, preamble temp dir and lock released. Every new refusal goes through it.
- packages/nana-pack/bin/pi-worker.mjs:124 — the one-line stderr notice before pi starts (`pi-worker: builder: …`). The new precedent/known-bugs line copies its form.
- packages/nana-pack/bin/pi-worker.mjs:125-131 — prompt assembly: rendered preamble file, then the brief path, each as `--append-system-prompt <file>`. The known-bug file becomes a third one after the brief; no new prompt mechanism.
- packages/nana-pack/bin/pi-worker.mjs:56-58 — the `git()` helper (cwd is the verified worktree root). Do not reuse its `.trim()` for NUL-split output.
- scripts/deliverables.mjs:55-58 — `trackedAtHead(path, tracked)`: folder-aware membership in a list of tracked paths. MOVE it into the new pack lib and import it back into deliverables.mjs (no behaviour change; R-2537's tests stay green). A copy would be the exact anti-pattern this lane exists to stop.
- scripts/deliverables.mjs:181 — the wording `"<path>" … is not tracked at HEAD`; reuse it in the refusal.
- scripts/requirements-tree.mjs:585-598 — `git ls-tree -r -z --name-only HEAD`, NUL split, failure handled by name. pi-worker uses the same call with literal pathspecs (below) and fails closed instead of report-only.
- scripts/known-bugs.mjs:16-20 — `KNOWN_BUGS_DIR`, `UNPLACED_FILE`, file form `FEAT-nnn.md`. pi-worker (packages layer) may not import scripts/ (code-map.config.json layers: "a package may not import them"). MOVE both constants to a pack lib config; scripts/known-bugs.mjs imports and re-exports them, so its three importers (worker-lane, known-bugs, templates-render tests) and the R-2509 seal at templates-render.test.mjs:420 are unchanged. Precedent for scripts importing pack config: scripts/known-bugs.mjs:12.
- AGENTS.md:157 and packages/nana-pack/skills/requirements/SKILL.md:144 — the `Feature: FEAT-nnn · <label>` brief convention. No code parses it today (grep: none); 141 of 364 recorded build briefs open with it.
- packages/nana-pack/lib/json-text.mjs:23 (one leading BOM stripped) and lib/writing-check.mjs:45 (`split(/\r\n|\r|\n/)`) — the line reading the parser copies.
- packages/nana-pack/lib/rulings-config.mjs, suite-records-config.mjs — config module beside its lib, provenance per value, read by name.
- packages/nana-pack/tests/worker-lane.test.mjs:122-139 — `RULE_LINE` + `preambleOnce`, and R-2510 (:138-139) as the pattern for a NEW preamble line with its own row (R-1110's twelve-rule text stays as is).
- packages/nana-pack/tests/worker-lane.test.mjs:43-54, :75-93, :32 — the stub that copies each appended prompt to `prompt-N`, the spawn marker for "before pi starts", the lock path for "before the lock".
- packages/nana-pack/tests/templates-render.test.mjs:598-603 (R-1100 threat-model check on the shared file) and :430-435 (R-859: AGENTS.md region byte-identical to the shared file).
- packages/nana-pack/tests/rulings.test.mjs:212-243 — R-1415/R-1416/R-1417 already pin every ruling's shape; no ruling has its own content test.
- docs/reviews/suite-records-2026-10-22/seat-titles.mjs — the seat title check this lane's seat copies.

## Design

1. New `packages/nana-pack/lib/brief-precedent.mjs` (six-tag header, @effects none): `readBrief(text)` returns `{ precedent: null | entries[], feature: null | "FEAT-nnn" }`; `checkPrecedent(entries, trackedPaths)` returns the problem list. Plus the moved `trackedAtHead`. Pure; tracked paths injected (deliverables precedent).
2. New `packages/nana-pack/lib/brief-config.mjs`: the vocabulary below. New `packages/nana-pack/lib/known-bugs-config.mjs`: the two moved constants and the file-name form.
3. Grammar. Header: the first line that, after one BOM, CR and trailing blanks are stripped, is `Precedent:` or `#`…`######` + ` Precedent`. Entries: the `- ` or `* ` bullets after it (blank lines allowed before the first), up to the first line that is neither blank nor a bullet. An entry is `none: <reason>` (reason non-empty) or a path as its first token: backticks stripped, a `:N` or `:N-M` suffix stripped, `\` turned to `/`, a leading `./` dropped; the rest of the line is a free note (a commit sha or review file goes there). A path that is absolute, starts with `~` or climbs with `..` is refused by name without asking git.
4. pi-worker, lane mode, after :100: read the brief (utf8), parse, refuse via `laneFailure` when the section is missing or empty or a `none:` lacks a reason; else run `git --literal-pathspecs ls-tree -r -z --name-only HEAD -- <paths>` (bounded output, globs taken literally; checked on this Mac 2026-10-22: a folder lists its files, `scripts/*.mjs` matches nothing, and a `../` entry makes git exit 128, hence the pre-filter in 3), split on NUL, and refuse naming every path `trackedAtHead` rejects. Git failure refuses: `cannot list paths tracked at HEAD`. The refusal text teaches the form: add `Precedent:` with one `- <path>` line per existing file to follow, or `- none: <reason>`.
5. Feature: the first line matching `^Feature: (FEAT-\d{3})\b` (after BOM/CR strip). When `<root>/docs/known-bugs/<FEAT-nnn>.md` is a regular file, append `--append-system-prompt <its real path>` after the brief. One stderr line before pi starts: `pi-worker: precedent: <N> checked at HEAD; known bugs: <repo-relative path | none>`.
6. Preamble, under Scope, one line: `- Read every file your brief's Precedent section names before you design. Follow its pattern, and report each departure with its reason.`
7. Shared template Plans bullet (templates/_shared/working-under-nana-pi.md:27), after the threat-model sentence: `Every plan names its precedent: the nearest existing code for each part, by path, or none with a reason.` Same bytes in AGENTS.md:95 (R-859).
8. Ruling, no row (precedent: rulings land as text; R-1410 already pins that the whole file reaches pi; 3,132 bytes + ~170 stays under RULINGS_READ_CAP 8,192): `- 2026-10-22: Every plan and brief names its precedent, the nearest existing code for each part. Builders follow it and report each departure. pi-worker refuses a brief without it.` It reaches the pi seat (extension) and the Claude seat (rule copy, R-1413) without touching nana-setup, so no install check.
9. Item 6 of the scope, the review-standard clause: LEFT OUT. review-standard.md:1 already makes every non-MUST finding a known bug, so a rebuilt pattern is already a SHOULD; the clause adds no outcome, changes the text pi-review appends (pulling the lane toward the review-tool class), and the builder's departure report already puts the fact in front of the seat. Revisit after five lanes if departures never reach review briefs.
10. Where the check lives: pi-worker only, over the shared lib. The Claude Code subagent builder already bypasses the preamble too; a lone check CLI would give that path half the contract. The lib boundary makes a 15-line CLI cheap later. Recorded as a known limit.
11. Old briefs in docs/reviews are records: no scan, no migration; the check runs only at launch. This lane's own build briefs carry the section above; the seat check `docs/reviews/precedent-first-<date>/seat-brief.mjs` imports the worktree's lib and runs it on the lane's build briefs against the worktree HEAD.
Trade: a pass/fail existence check is cheap and deterministic but cannot judge relevance; relevance stays with the plan adversary and the builder's departure report. The cost is one refused launch when a seat forgets, against the measured cost of re-solving (82 of 156 lanes needed two or more builds; nine clear re-solves, five a named precedent would likely have prevented, per the audit).

## Must-meet rows (EARS, one shall each) and tests

- R-2578 (FEAT-006): IF a lane brief has no Precedent section, its section holds no entry, or an entry is `none:` with no reason, THEN pi-worker shall refuse the lane, naming the Precedent section and its two entry forms, before it takes the worktree lock or starts pi.
  Test (worker-lane.test.mjs): `R-2578: a lane brief with no Precedent section, an empty one or a reasonless none is refused before the lock and before pi starts`. Four fixture briefs (no section; `## Precedent` then `## Done`; `Precedent:` then prose; `- none:`); each run: exit 1, `lane refused:` naming Precedent, no spawn marker, no lock file. Red on main: main starts pi for any readable brief.
- R-2579 (FEAT-006): IF a Precedent entry names a path that no file tracked at the worktree's HEAD equals or sits under, THEN pi-worker shall refuse the lane before starting pi and name every such entry's path.
  Test: `R-2579: Precedent entries not tracked at HEAD are refused, each one named`. One brief with an untracked file present in the worktree, a path committed then moved by `git mv`, `../outside.md`, an absolute path, a glob `*.mjs`, plus one tracked entry; exit 1, all five named, the tracked one not named, no marker. Red on main: no check.
- R-2580 (FEAT-006): WHEN every Precedent entry is `none:` with a reason or a worktree-root-relative path that a file tracked at HEAD equals or sits under, THEN pi-worker shall print `pi-worker: precedent: <N> checked at HEAD` before starting pi, for slash or backslash separators, backticks, a line suffix, a folder, a brief in a subfolder, and LF, CRLF, trailing blanks, a BOM or no final newline.
  Test: `R-2580: honest Precedent forms pass and the launch line names the checked entry count`. A table of briefs, one per variation; each: exit 0, marker present, stderr count right. Red on main: no such line.
- R-2581 (FEAT-006): WHEN a lane brief's first `Feature: FEAT-nnn` line names a feature whose known-bug file is a regular file in the worktree, pi-worker shall pass that file to pi as a third appended system prompt after the brief, and pass no third prompt otherwise.
  Test: `R-2581: the named feature's known-bug file follows the brief as the third prompt, and nothing follows when the feature has none`. Fixture commits `docs/known-bugs/FEAT-006.md`. Cases: Feature FEAT-006 (3 paths, third is its real path, `prompt-3` bytes equal, line says the path); CRLF Feature line (3); FEAT-012 with no file (2, `known bugs: none`); no Feature line, FEAT-006 in prose (2); the known-bug path a directory (2). Red on main: always two prompts.
- R-2582 (FEAT-006): The builder preamble shall state once, on its own line, that a builder reads every file its brief's Precedent section names before designing, follows their pattern and reports each departure with its reason.
  Test: `R-2582: the builder preamble tells the builder to read its Precedent files first, follow their pattern and report each departure`, via `preambleOnce(RULE_LINE.precedentFirst)` from the delivered prompt-1. Red on main: line absent.
- R-2583 (FEAT-014, shared into FEAT-006): The shared working pattern's Plans bullet shall require every plan to name its precedent: the nearest existing code for each part by path, or none with a reason.
  Test (templates-render.test.mjs): `R-2583: the shared working pattern's Plans bullet requires every plan to name its precedent`; finds the one `- Plans:` bullet and asserts the exact sentence; R-859 keeps AGENTS.md in step. Red on main: sentence absent.
- Seal test (one, R-2578 and R-2581): `seal: a brief's precedent section is Precedent, its no-precedent entry starts none: and its feature line starts Feature:`.
Existing tests made false (listed edits, not new tests): the fixture briefs in worker-lane.test.mjs:33 (and R-961's literal at :114), win32-launch.test.mjs:219 and watchdog-exit.test.mjs:251 gain a Precedent section. win32-launch uses `- seed` so the HEAD check runs through the flipped-case and 8.3 short-path cwd on the blocking Windows leg; the others use `- none: fixture`.

## Tunables (packages/nana-pack/lib/brief-config.mjs unless noted)

- PRECEDENT_SECTION = "Precedent": contract, the 2026-10-22 ruling's word and R-2578-R-2580. Sealed.
- PRECEDENT_NONE = "none:": chosen, the audit's proposed form; contract for R-2578/R-2580. Sealed.
- FEATURE_LINE_PREFIX = "Feature: ": contract, AGENTS.md:157 and requirements SKILL.md:144. Sealed.
- KNOWN_BUGS_DIR, UNPLACED_FILE (known-bugs-config.mjs): moved unchanged; already sealed by R-2509 (templates-render.test.mjs:420).
- No size cap on the attached known-bug file: chosen; largest today 46,035 bytes (FEAT-013, measured 2026-10-22), under READ_WINDOW_BYTES 51,200, and scripts/known-bugs.mjs already reports any file past one read window.
- No maxBuffer tunable: literal pathspecs keep ls-tree output to the named entries (whole-tree output is 214,271 bytes for 3,745 files today).

## Wrong-code pairs (each must turn its test red)

1. Header-only check, so an empty section passes (R-2578). 2. Check placed after the lock or the spawn (R-2578: lock file or marker). 3. `existsSync` in the worktree instead of HEAD (R-2579: the untracked file passes). 4. Stop at the first bad entry (R-2579: four not named). 5. Pathspec without `--literal-pathspecs` (R-2579: the glob passes). 6. Paths resolved from the brief's folder (R-2580: subfolder case). 7. No backslash, backtick or suffix normalisation (R-2580). 8. Exact `Precedent:` match with no CR, blank or BOM strip (R-2580). 9. Any FEAT id anywhere in the brief (R-2581: prose case). 10. `existsSync` without `isFile` (R-2581: directory case). 11. Known-bug prompt placed before the brief (R-2581: order).

## Known limits (seat writes them to docs/known-bugs/FEAT-006.md at land)

- Existence, not relevance: a real but wrong tracked file passes (outside the model).
- A Claude Code subagent builder does not go through pi-worker: no precedent check, no known-bug attachment (and, as today, no preamble). Follow-up lane: Claude Code builder launch parity.
- The brief is read once at launch; an edit after launch is not re-checked. First Precedent header and first Feature line win.
- Paths only: a commit or a review finding is cited in an entry's note after a tracked path, or as `none:`. Line suffixes are not checked against the file. Path case must match git's.
- On POSIX a tracked file with a backslash in its name cannot be named (backslash is read as a separator).
- No tool reads the builder's departure report; it reaches review only when the seat puts it in the review brief.

## Docs that change

packages/nana-pack/README.md (lane-mode paragraph, :258: the refusal, the stderr line, the third prompt); templates/_shared/working-under-nana-pi.md and AGENTS.md:95 (Plans sentence); AGENTS.md:157 local section (one sentence: the brief carries a Precedent section; pi-worker refuses one without it); packages/nana-pack/rules/nana-rulings.md (one ruling); packages/nana-pack/prompts/builder-preamble.md (one line); REQUIREMENTS.md (six rows; FEAT-006 Also applies gains R-2583; optional purpose amendment "a checked precedent and its feature's known bugs"); docs/code-map.md (regenerated for three new lib modules); seat: HANDOFF and session note before the final round. Unchanged: the requirements skill (the refusal text self-documents), review-standard.md, nana-soul.md and nana-seat.md (nana-setup untouched, no install check).

## Open for the seat (one-word defaults)

- A brief-check CLI for the Claude Code builder path now: default `later`.
- The review-standard clause: default `no`.
- R-2583 in FEAT-014 shared into FEAT-006, or in FEAT-006 outright: default `FEAT-014`.
