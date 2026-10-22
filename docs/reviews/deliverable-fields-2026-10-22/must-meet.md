# deliverable-fields · must-meet (seat and plan adversary, 2026-10-22)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary (scripts, tests, the ledger, the requirements skill's text, one template sentence, the README; no install, hook, gate or land-tool file). Ladder: one final reviewer from another model family, and the seat's wrong-code pairs first. Threat model: honest variation in scope — a tree with no fields, a kindless or partly kinded tree, a deliverable retired or homed elsewhere, a maker or reader naming a path another project lacks, Windows `\` paths, CRLF ledgers, a ledger in a subfolder, a staged-only file, a non-ASCII name, an unborn HEAD, old committed outlines; deliberate forgery out (a line naming real code that never makes or reads the artifact).

Ruling: the owner, 2026-10-22, top priority — a produced artifact is a feature to maintain; approved: each deliverable names the run that makes it and the code that reads it, a report-only check flags a manual maker or a rule-only reader with no reason, and the product report shows age and real reader instead of the derived consumers. Inputs: the planner's draft (`plan-draft.md`) and the adversary's attack (`plan-attack.md`), at main 08c33d94, and the deliverable audit of 2026-10-22.

## What changes for the user

Each deliverable on a product capability says, in its capability's span, what makes it and what reads it. A claim that something is automatic must name the code that does it; anything made by hand or read only because a rule says so must say why. The tree checker prints a note for each gap every time it runs — including `npm run req:tree`, which every ledger lane runs — and never fails a land on one. nana-pi's 38 deliverables carry their lines, so the gap list is mechanical from now on. The product report's age and reader column follows in lane B.

## Seat decisions (not the owner's call; each is reversible)

- **D1 · Field shape: `span`.** Repeatable lines in the capability's span after `Deliverables:`, read only on a live `Kind: product` capability (lines on a constraint or kindless capability get one note each; a feature or subgroup span, a fenced line and lower-case labels are prose).
- **D1a · Grammar: `path` (adversary M1).**
  - `Made by: <row> · <run>: <tracked code path>[, <path>…][ · <artifact>]`, where `<run>` is one of `session start`, `suite`, `land`, `review`, `build`, `CI`, `hook`, `extension`; or `Made by: <row> · manual: <reason>`.
  - `Read by: <row> · code: <path>[, <path>…]` or `prompt: <path>` (the code that puts it in an agent's context); or `person: <reason>` or `rule: <reason>`.
  - Every automatic run and every `code` or `prompt` reader names at least one code path that git tracks at HEAD; a bare one gets a note. `manual`, `person` and `rule` need a reason. The artifact is a ledger-relative `/` path or `runtime-map`. A row may carry several lines of each.
- **D2 · Where notes show: `cli` (adversary M2).** The tree checker prints each note on its own stdout line after its summary in every mode (`--root`, `--write`, `--check`), keeps its exit status, and leaves the outline unchanged. The report shows them in lane B; a session-start line waits for the audit's hook queue.
- **D3 · Never a failure: `notes`.** No note becomes a tree problem and the suite never fails on a note. R-2539 checks presence only.
- **D4 · Paths from the HEAD tree (adversary S3).** `git -C <ledger folder> ls-tree -r -z --name-only HEAD`, paths relative to the ledger's folder, git run only when a path is to be checked; any git error gives one "paths not checked" note and never throws.
- **D5 · Subtractions: `defer`.** The three rule lines that tell agents to run commands (impact, the movement listing, the local install check) are each their output's only maker today. Each is written as a `rule:` reader, so the check lists it, and is removed in the lane that automates its maker. The derived consumer view goes in lane B. The hand measure step goes with runtime-map-live.
- **D6 · Split: `two`.** Lane A (this lane, FEAT-028): format, check and nana-pi's own lines. Lane B (FEAT-039): the report's makers, readers, ages and a count line, after lane A and runtime-map-live land, with the adversary's M3 age rule (the maker's own date first; otherwise "last changed … by <sha8>" with its subject).
- **D7 · The desk and app rows (adversary S7).** The eight frozen desk and app deliverables are written `manual` and `person` with "desk frozen since 2026-10-10"; frozen code is not researched.
- **D8 · R-1272's lines (adversary S5).** Written as they stand on main when build 2 runs; if runtime-map-live has landed, its maker is `land` with the land tool's path.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2535 | WHEN a deliverable of a live `Kind: product` capability has a `Made by:` line whose run is `manual`, or a `Read by:` line whose reader is `rule` or `person`, with no reason after the colon, the deliverable check shall report one note naming the row and the line. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::a manual maker or a rule or person reader with no reason gets one note naming the row` |
| R-2536 | WHEN a code path, a reader path or an artifact on a `Made by:` or `Read by:` line is not tracked in the ledger folder's HEAD tree, the deliverable check shall report one note naming the row and the path. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::a maker or reader path not tracked at HEAD gets one note naming the row and the path` |
| R-2537 | IF a listed deliverable has no readable `Made by:` or `Read by:` line, or a line names an unlisted row, an unknown run or reader, lacks the separator, claims an automatic run or a code or prompt reader with no code path, or sits on a constraint or kindless capability, THEN the deliverable check shall report one note naming the row or the line. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::a missing or unreadable line, or an automatic claim with no code path, gets one note naming it` |
| R-2538 | WHEN the tree has no problem, the tree checker shall print each deliverable note on its own stdout line after its summary in every mode, with the exit status and outline it gives without the lines. | `packages/nana-pack/tests/requirements-tree.test.mjs::the tree checker prints deliverable notes in every mode and keeps its exit status and outline` |
| R-2539 | Every deliverable of a live `Kind: product` capability in this repository's REQUIREMENTS.md shall carry at least one `Made by:` line and one `Read by:` line. | `packages/nana-pack/tests/requirements-deliverables.test.mjs::every deliverable in this repository's ledger has a Made by and a Read by line` |
| R-2540 | WHEN a row's `Made by:` or `Read by:` lines differ between the base and the tip, the tree movement report shall list one changed-lines entry for that row. | `packages/nana-pack/tests/requirements-moved.test.mjs::the movement report lists a row whose Made by or Read by lines changed` |

### What each test does, and why it is red on main

- **R-2535.** Cases: bare `manual`, `manual:` with spaces, `rule`, `person:`, `manual · docs/x.md` (an artifact, no reason); each also with a reason (no note). Asserts this note kind only, so a bare `land` carries R-2537's note. Red: `scripts/deliverables.mjs` is absent.
- **R-2536.** A fixture repository: a tracked file and folder pass; a missing path, an ignored file on disk, a staged-only file, a `\` path, one bad path in a two-path list, a non-ASCII name, a subfolder ledger and an unborn HEAD; `runtime-map` passes; a root that is not a git checkout gives one "paths not checked" note. Red: absent.
- **R-2537.** Cases: no line at all, a line on a constraint and on a kindless capability, `R-999`, `nightly`, a ` - ` separator, a bare `land`, a bare `prompt`, a bare `code`. None for a feature or subgroup span, lower-case labels, a fenced line, or two maker lines for one row; a CRLF copy gives the same notes. The test pins the run and reader lists. Red: absent.
- **R-2538.** `--root`, `--write` (on a scratch copy) and `--check` on a fixture: exit 0, the summary, then the notes; the written outline equals the one rendered with the lines removed; a tree problem gives exit 1 and no notes; a tree with no deliverables gives today's output byte for byte. Red: no notes, and `--write` and `--check` print nothing.
- **R-2539.** Presence only, as R-2460 does, so a later path or reason note never blocks a land; the seat records the note count at the land. Red: no such line.
- **R-2540.** A base and tip pair where one row's `Read by:` turns from `rule:` to `code:`; one entry; the no-change output stays byte for byte. Red: no entry.

## Tunables

- `DELIVERABLE_FIELD_LABELS` ["Made by", "Read by"] — contract (the owner's 2026-10-22 approval; R-2537).
- `MAKER_RUNS`, `READER_KINDS` — contract (R-2537); the runs come from the audit's six plus `hook` and `extension`; `prompt` and `person` are chosen (injected context and pages a person reads are real readers, not code).
- `REASON_REQUIRED` [manual, rule, person] — contract (R-2535). `PATH_REQUIRED` (every run but manual; code, prompt) — contract (R-2537).
- `PART_SEPARATOR` " · " — chosen, the ledger's heading separator. `RUNTIME_MAP_ARTIFACT` "runtime-map" — contract (lane B).

## Known limits (carried to the feature files)

- The check proves a path exists, not that the code makes or reads the artifact.
- Commands named in a reason are not checked.
- A renamed code path with no ledger edit shows its note only at the next ledger lane's `req:tree`, or a `--check` run.
- `Deliverables:` sits only on product capabilities, so 38 of the audit's 78 deliverables carry lines; trust and tool actions, a constraint, carries none, and nothing flags an artifact on no `Deliverables:` line.
- A regroup that moves a deliverable's feature leaves lines naming an unlisted row (one note each).
- The three rule lines stay until their makers are automated (D5).
- Other projects' trees gain nothing until they add `Kind: product`.

## Seat steps

- Two build sessions with the larger builder. (1) R-2535 to R-2538 and R-2540, the module, the CLI, the tests, one sentence each in the ledger's organization section, the requirements skill and `templates/_shared/requirements-organization.md`, and the README's tree paragraph. (2) R-2539 and nana-pi's 38 deliverables' lines from the seat's table in this folder (`deliverable-lines.tsv`, written from the audit, home paths as `~`).
- Wrong-code pairs: accept a bare run or `prompt`; list paths from the index instead of HEAD; print notes only under `--root`; drop the reason test; read lines in feature spans; render the lines in the outline.
- A draft PR runs the Windows leg. Reserve R-2535 to R-2540 for lane A and R-2541 to R-2544 for lane B.
