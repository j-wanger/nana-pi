# tree-briefs: show how the requirements tree moved, per feature (2026-10-19, adversary-amended)

**The feature.** `node scripts/requirements-moved.mjs --root <dir> --base <rev>` prints, under each feature, every requirement row the branch added, removed, re-statused, reworded or moved since it left `<rev>`. It also names the features whose `Also applies:` line lists each changed row. Falsifiable: in a temp repo where a branch flips R-001 from planned to implemented, `R-001 planned -> implemented` appears under `FEAT-001 · Alpha`. Today the command does not exist.

**Why this cut.** This is HANDOFF Next 7 (Jake, 10-11, 10-16 and 10-17): briefs name their feature, reviews read per feature, and each land shows how the tree moved. One read-only report serves all three:
- The brief names its feature as `Feature: FEAT-nnn · <label>`. That is plain text and needs no tool.
- The review brief pastes the report. Its feature lines and each row's `also applies` names are the features the reviewer reads.
- The seat's land report carries the same output, run before `nana-land`.

nana-land, pi-review, review-round and the builder preamble stay unchanged:
- The code-map layers forbid a package from importing `scripts/`.
- win-review-paths is editing those tools now.
- The live user ask is for fewer land checks, not more.

**Adversary change: no `--feature` gate.** The draft's `--feature` flag exited 1 on any changed row outside the named feature.
- A replay of main's last 10 lands that changed rows found 4 that changed rows in 2 to 4 features: win-project-files, win-line-endings, runtime-map and feature-first.
- The builder preamble says DONE means every seat check passes. The gate would block DONE on those lanes, or push a builder to bend the ledger.
- The report already names every feature the change reaches.

The gate is dropped and recorded as known limit 1.

**Class: ordinary.** The lane adds a repo script, its test, four rows and docs. It touches no install, hook, gate, land or review tool, so it gets one final reviewer.

**Threat model.** In scope is honest variation:
- subgroup homes and shared rows;
- Evidence-only edits from test renames;
- main moving on after the branch, or being merged back into it;
- a ledger in a subfolder root;
- Windows git (autocrlf) and Windows paths;
- a flat ledger, or no ledger at the base.

Deliberate forgery is out, for example renumbering a row to hide a change.

**Design.**
- **Module.** New module `scripts/requirements-moved.mjs` with the six-tag header and one purpose. It imports `parseLedger` and `readRequirementRows` from `scripts/requirements-tree.mjs` and adds no second parser.
- **Git runner.** The runner is injected. The default is `spawnSync("git", args, {cwd: root, maxBuffer})` with no shell. The buffer size is a named constant with provenance: 64 MiB, `chosen`, the same as requirements-lift's blob reader.
- **Arguments.** `--root <dir>` and `--base <rev>` are both required. Anything else prints usage on stderr and exits 2.
- **Comparison base.** The base is `git merge-base <rev> HEAD`. Both ledgers are read as committed blobs with `git show <sha>:./REQUIREMENTS.md`, run with cwd `<dir>`. A subfolder root and a CRLF checkout therefore read the same.
- **Missing inputs.** If the ledger is absent at the base (`git cat-file -e`), every row is new. If it is absent at HEAD, the revision is unknown, or there is no merge base, the command exits 1 and names the cause.
- **A row's feature.** It is the heading of the row's table, with a subgroup rolled up to its feature. A flat ledger groups its rows under `(no feature)`.
- **Changed row.** A row is changed when it is added or removed, or when its Status cell, trimmed Requirement cell or feature differs. An Evidence-only edit is not movement.
- **Output.** The command exits 0.
  - The first line is `tree movement <base7>..<head7>: <n> rows in <m> features`, or `tree movement: none`.
  - Next comes one unindented `FEAT-nnn · <label>` line per feature, in HEAD order. Features whose only changes are removed rows come last, labelled from the base.
  - Under each feature, one line per row: `  <ID> <changes>`, with changes joined by `; `. The changes are `new (<s>)`, `removed (<s>)`, `<old> -> <new>`, `text changed`, `moved from FEAT-nnn`, and then `also applies: FEAT-a, FEAT-b`, read from HEAD.

## Fixture (one temp git repo under the OS temp folder via `tmpDir`)

The ledger uses `#` for CAP, `##` for FEAT and `###` for SUB headings. A probe confirmed the tree checker reports 0 problems on it.

**Commit c1 on main:**
- FEAT-001 Alpha: R-001 planned, R-002 untested, R-003 implemented.
- FEAT-002 Beta, with `Also applies: R-001`: R-004 and R-005, both untested.
- FEAT-003 Gamma, with subgroup SUB-001: R-008 untested.

**Branch feat/x from c1:**
- R-001 changes to implemented.
- R-002 is reworded.
- R-003 is deleted.
- R-006 is added as planned in FEAT-001.
- R-004 moves into FEAT-001's table.
- R-005 gets an Evidence-only edit.
- R-008 changes to implemented.

**After the branch, main** gains R-007 in FEAT-002.

## Must-meet tests (rows R-1460 to R-1463, homed in FEAT-028)

Every test lives in `packages/nana-pack/tests/requirements-moved.test.mjs` and runs on feat/x with `--base main`. A row line sits under the nearest preceding unindented stdout line.

| Test | Row | Title | Passes when |
|---|---|---|---|
| MT1 | R-1460 | `R-1460: added, removed, re-statused and reworded rows are listed under their feature, evidence-only edits are not` | Exit 0. Under `FEAT-001 · Alpha`: R-001 `planned -> implemented`, R-002 `text changed`, R-003 `removed (implemented)`, R-006 `new (planned)`. Under `FEAT-003 · Gamma`: R-008 `untested -> implemented`. No R-005 line. |
| MT2 | R-1461 | `R-1461: rows main gained after the branch point are not reported` | No `R-007` anywhere in stdout, and R-006 `new (planned)` is present. |
| MT3 | R-1462 | `R-1462: a row moved to another feature is listed there naming the feature it left` | The R-004 line sits under `FEAT-001 · Alpha` and contains `moved from FEAT-002`. |
| MT4 | R-1463 | `R-1463: a changed shared row names the feature that lists it` | The R-001 line contains `also applies: FEAT-002`, and the R-002 line has no `also applies`. |

**Red today.** A probe on 2026-10-19 in the fixture: `node scripts/requirements-moved.mjs --root . --base main` fails with MODULE_NOT_FOUND, exit 1. No tracked file names `requirements-moved`, so all four checks are red. Every negative assertion sits beside a positive one in the same check.

**Discrimination (probed).** A throwaway reference of this design ran over this exact fixture and passed MT1 to MT4. Each break below turned its check red:
- Diff against `<rev>` instead of the merge base: MT2.
- Group a subgroup's rows under the subgroup: MT1.
- Count Evidence-only edits: MT1.
- Drop removed rows: MT1.
- Omit the shares: MT4.
- Ignore a change of feature: MT3.

## Known limits
1. Nothing checks that a lane stayed inside its brief's feature. A reader compares the brief's Feature line with the report.
2. nana-land does not print the report. "Each land shows how the tree moved" rests on the seat's land report.
3. Changes to feature headings (a new feature, a Status line, an Also applies line) are not reported as rows.
4. Evidence-only edits are not reported.
5. The command reads HEAD, not the working tree. After a land, HEAD equals main, so run it before `nana-land` or pass the pre-land main SHA as `--base`.
6. Shares are read at HEAD only. G rows in REQUIREMENTS-general.md are not read.
7. A ledger absent at the base, a flat ledger and a subfolder root are designed but not pinned by a test.
8. The shared working pattern is unchanged. nana-pi's AGENTS.md local section and the requirements skill carry the practice.

## Rows the builder adds as `planned` first (seat, 2026-10-19)

- **R-1460** — WHEN `scripts/requirements-moved.mjs` runs with `--root <dir>` and `--base <rev>`, the tree movement command shall print, under a line holding the ID and label of each affected feature (a subgroup's rows counting under its feature), one line per row that HEAD's `<dir>/REQUIREMENTS.md` adds, removes, or gives a different Status or Requirement cell relative to that file at the comparison base, naming each change, and no line for a row whose only change is its Evidence cell.
- **R-1461** — The tree movement command shall take as its comparison base the merge base of `<rev>` and HEAD, so that rows `<rev>` gained after HEAD branched from it are not reported.
- **R-1462** — WHEN a row's feature at HEAD differs from its feature at the comparison base, the tree movement command shall list that row under its HEAD feature, naming the feature it moved from.
- **R-1463** — WHEN a row the tree movement command reports is listed on a feature's `Also applies:` line at HEAD, the command shall name that feature on the row's line.
