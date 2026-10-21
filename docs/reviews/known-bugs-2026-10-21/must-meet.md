# known-bugs · must-meet (seat and plan adversary, 2026-10-21)

Feature: FEAT-002 · Resume decisions and next actions

Class: ordinary (a new repo script, its tests, the shared working-pattern text and its AGENTS.md copy, the builder preamble; no install, uninstall, doctor, hook, extension, gate policy, nana-land, pi-review or review-round change). One final reviewer from another model family. Threat model: honest variation in scope — old lines with only an area tag, a lane whose brief names another feature than its rows, a lane building alongside this one, other projects' HANDOFFs, Windows line endings or a BOM in a known-bug file, a feature split, frozen or retired later, a project with no requirements tree; deliberate forgery out (a file named for a live feature holding unrelated lines, a forged Feature line in a brief).

The owner ruled on 2026-10-21 that known bugs move out of HANDOFF.md into one file per feature, and that this changes the shared review bar. The planner's draft (`plan-draft.md`) and the plan adversary's attack (`plan-attack.md`) are the inputs; this file is the plan of record.

## What changes for the user

Known bugs leave HANDOFF.md and live one line each in `docs/known-bugs/FEAT-nnn.md`, with `docs/known-bugs/unplaced.md` for a line no feature owns. HANDOFF keeps a short Known bugs pointer, so it drops from 235 KB to 16 KB and fits one default read in pi and in Claude Code. Every seat records a non-blocking review finding as one line in the file of the feature it concerns.

## Seat decisions (not the owner's call; each is reversible)

- **Layout: `docs/known-bugs`.** One file per feature, named by its stable ID (`FEAT-nnn.md`, never the label, so a relabel moves nothing), plus `unplaced.md`. Each file opens with `# FEAT-nnn — known bugs` and one italic line; no label in the heading, so nothing drifts (attack N3).
- **Line format: verbatim.** Lines move word for word, so the move is provably lossless.
- **Placement: by lane.** `move.mjs` places a line by the first lane its tag names whose review briefs carry a `Feature:` line (the `SUB-nnn in FEAT-nnn` form included), else by that lane's added rows, else by the area read as a lane name or slug, else in `unplaced.md`. Only an active or frozen feature receives lines. Result at 086eb4b2: 837 lines in 25 feature files, 51 unplaced, two removed as fixed by this lane (the whole-file size finding and the Claude Code one-read limit), and one pointer line ("Desk residuals live in `apps/desk/README.md`") folded into the pointer text. `conserve.mjs` proves every other line lands exactly once. A line about another feature stays under its lane's feature; the shared rule asks new lines to go to the feature they concern (attack S3), and that gap is a known limit.
- **HANDOFF keeps a pointer.** A `## Known bugs` section of one paragraph naming the folder, with no list item and no counts.
- **The seat moves the lines in the plan commit,** before build 1, because the builder preamble forbids editing HANDOFF.md and the builder cannot make R-2504, R-2505 or R-2508 green (attack S9). `conserve.mjs` re-runs at the final tip and after every merge of main (attack MUST-3).
- **Size is reported, never failing in this repo.** FEAT-013's file starts at 45,643 bytes, 89% of one pi read, and grows each install lane. A suite failure there would leave no fix inside the rules (attack MUST-2). The check reports a size line; this repo's test asserts only that no file is misnamed. An Open line asks the owner whether to split or prune FEAT-013.
- **Concurrency.** At this lane's land no open lane may carry residual lines in HANDOFF; the queued owner-name scrub starts after this lane (attack MUST-4). Nothing else is building now.
- **Shared text avoids path claims.** The Review bar names `docs/known-bugs/<feature>.md` in backticks and the unplaced file without backticks, so R-598's path checker reads no missing file (attack MUST-1).
- **The rulings file records the ruling** (attack S4), and the writing adoption's ruling, which that lane left out, is folded in here.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2504 | This repository's HANDOFF.md shall get no file-size finding from the HANDOFF frontier report. | `packages/nana-pack/tests/frontier.test.mjs::R-2504: this repository's HANDOFF.md gets no file-size finding` |
| R-2505 | This repository's HANDOFF.md shall carry a Known bugs section that names the known-bugs folder, holds no list item, and stands where no Carried residuals heading remains. | `packages/nana-pack/tests/known-bugs.test.mjs::R-2505: this repository's HANDOFF.md points to the known-bugs folder from a Known bugs section with no list item and has no Carried residuals heading` |
| R-2506 | WHEN an entry in the known-bugs folder is neither the unplaced file nor named `FEAT-nnn.md` for an active or frozen feature, the known-bug check shall report its name. | `packages/nana-pack/tests/known-bugs.test.mjs::R-2506: a known-bug entry named for a missing, proposed or retired feature, or not named for a feature, is reported` |
| R-2507 | WHEN a known-bug file is over 51,200 bytes or 2,000 lines, the known-bug check shall report that file as a size line with its byte and line counts. | `packages/nana-pack/tests/known-bugs.test.mjs::R-2507: a known-bug file over the read window in bytes or in lines is reported with its counts` |
| R-2508 | This repository's known-bugs folder shall hold at least one feature file and get no name finding from the known-bug check. | `packages/nana-pack/tests/known-bugs.test.mjs::R-2508: this repository's known-bugs folder holds feature files and gets no name finding` |
| R-2509 | The shared working pattern shall state that a finding that does not block the land goes as one line in the known-bug file of the feature it concerns, or in the unplaced file. | `packages/nana-pack/tests/templates-render.test.mjs::R-2509: the shared working pattern records a non-blocking finding in its feature's known-bug file, not HANDOFF` |
| R-2510 | The builder preamble shall forbid a builder to edit the known-bugs folder. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2510: the builder preamble forbids editing HANDOFF.md, the known-bugs folder and session archives` |

### What each test does, and why it is red on main

- **R-2504.** Runs the frontier checker on the repo's HANDOFF.md: no `file-size` line. A temp control of `READ_WINDOW_BYTES + 1` bytes gets one, so a checker that never reports passes nothing. Red on main: `file-size: bytes=235462` (probed). Green after the seat's move.
- **R-2505.** Reads headings outside fenced blocks. A `## Known bugs` section exists, contains `KNOWN_BUGS_DIR`, and holds no list item; no `## Carried residuals` heading remains. Controls: a `- ` line under Known bugs fails; a Carried residuals heading fails; the folder named only in a Landed line fails (attack S1). Red on main: the heading at :65, the folder never named.
- **R-2506.** A temp tree with FEAT-001 `active`, FEAT-002 `frozen (x)`, FEAT-003 `retired (FEAT-001)` and FEAT-004 `proposed`, in the ledger's real status forms (`scripts/requirements-tree.mjs`). Passes: `FEAT-001.md`, `FEAT-002.md`, `unplaced.md`. Reported by name: `FEAT-003.md`, `FEAT-004.md`, `FEAT-099.md`, `feat-001.md`, `FEAT-001.MD`, `SUB-005.md`, `notes.md`, a subfolder. With a flat ledger or no REQUIREMENTS.md, only `unplaced.md` passes. Red on main: `scripts/known-bugs.mjs` is absent.
- **R-2507.** One byte over through a multibyte character (a character count passes it; 40 moved lines are non-ASCII), one line over with CRLF and no final newline, and exactly at both limits (no line). Limits imported from `packages/nana-pack/lib/frontier-config.mjs` by name. Red on main: the module is absent.
- **R-2508.** Runs the check on the repo root: at least one `FEAT-nnn.md`, no name finding; a size line is allowed and printed. Red on main: the folder is absent.
- **R-2509.** Reads the shared section's Review bar and Land checklist bullets in `templates/_shared/working-under-nana-pi.md`. The Review bar holds `KNOWN_BUGS_DIR` and the unplaced file's stem; no bullet holds both "HANDOFF" and "residual" (attack S2). R-859 carries the change to AGENTS.md's copy, byte for byte. Red on main: :28 says "recorded in HANDOFF's residuals". A seal test, `seal: the known-bugs folder is docs/known-bugs`, pins `KNOWN_BUGS_DIR` and cites R-2509.
- **R-2510.** Uses the existing `preambleOnce` helper on the new preamble line, built from `KNOWN_BUGS_DIR`. Red on main: `builder-preamble.md:7` names only HANDOFF.md and session archives.

### The shared text (R-2509), as the builder writes it

- Review bar, the clause after "every other finding is a known bug,": `recorded as one line in the known-bug file of the feature it concerns, `docs/known-bugs/<feature>.md` (or the unplaced file in that folder when no feature fits or the project has no tree), and fixed when someone hits it or next works on its feature.`
- Land checklist, its opening clause: `resolve review findings or record them as known bugs in their feature's file;`
- The Plans bullet keeps "a finding outside the model is a residual" (R-1100 pins it).
- Builder preamble line 7: `- Never edit `HANDOFF.md`, `docs/known-bugs/` or session archives.`

## Tunables

- `KNOWN_BUGS_DIR = "docs/known-bugs"` — chosen: it sits beside `docs/reviews` and `docs/sessions`; a contract for R-2505, R-2509 and R-2510; sealed by the seal test.
- `UNPLACED_FILE = "unplaced.md"` — chosen: a plain name for lines no feature owns.
- The live statuses, `active` and `frozen` — contract: REQUIREMENTS.md's lifecycle, read through `parseLedger`.
- The read window — imported from `frontier-config.mjs` (R-2471, R-2472), never restated.

## Known limits (carried to the feature files)

- The word-budget finding stays: HANDOFF's live sections hold about 2,570 words against 1,200, most of them in the Open asks.
- Placement is by lane. A line about another feature stays under its lane's feature; 51 lines sit in `unplaced.md`.
- About 117 lines carry no lane tag. Nothing checks the line format or that an entry is one line.
- FEAT-013's file starts at 89% of one pi read and grows each install lane; the check reports, it does not fail.
- Nothing proves a seat files a new finding in the right file.
- A lane in flight whose notes add residual lines to HANDOFF loses them on a careless merge; `conserve.mjs` catches it only when re-run.
- A feature split or retired later turns R-2508 red in that lane; its seat moves the lines in that lane's plan commit, since the builder may not.
- Known-bug files are technical records, outside the writing rule (an Open line asks the owner; default: technical records).
- The product report does not show known bugs.
- "Residual" survives in the Plans bullet and in review-round's message, so one thing keeps two names.
- Other projects with old residual lines in their HANDOFF (yokai-world, jev-research, the-hive) keep them; the rule applies going forward.

## Files

Seat (plan commit): `HANDOFF.md` (the move and the header sentence), `docs/known-bugs/*.md` (26 files), this folder (`move.mjs`, `conserve.mjs`, `placement.tsv`, `must-meet.md`, `plan-draft.md`, `plan-attack.md`, briefs). Seat (notes): `HANDOFF.md`, `docs/sessions/2026-10.md`, `packages/nana-pack/rules/nana-rulings.md` (two ruling lines), the lane's own known limits into `docs/known-bugs/FEAT-002.md`. Builder: new `scripts/known-bugs.mjs` (exports `KNOWN_BUGS_DIR`, `UNPLACED_FILE` and a check function; a `--root` CLI), new `packages/nana-pack/tests/known-bugs.test.mjs`, `packages/nana-pack/tests/frontier.test.mjs`, `templates-render.test.mjs`, `worker-lane.test.mjs`, `templates/_shared/working-under-nana-pi.md` and its AGENTS.md copy, `packages/nana-pack/prompts/builder-preamble.md`, the root README (the readme check fails a script no README names, attack S7), `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`.

## Seat steps

- One build session with the larger builder (`pi-worker --lane known-bugs --lane-size larger`), a failure watcher and a heartbeat at launch.
- Seat checks after the build: the lane's tests, `conserve.mjs`, skill-claims and templates-render (R-598), map:check, readme:check, the trace, requirements-moved.
- One final reviewer (Opus) on the exact tip; the locked suite at the land.
