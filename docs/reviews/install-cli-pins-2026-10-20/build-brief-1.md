# install-cli-pins: build brief

Feature: FEAT-013 · Install and connect harness runtimes. Class: ordinary (tests only). Base: main 1c539a0e or newer. Worktree ~/nana-pi-wt/install-cli-pins, branch feat/install-cli-pins. Read must-meet.md here first.
Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/. Change nothing under lib/, bin/, claude/ or extensions/: if product code turns a check red, stop and report.

## Tests (each under `// req: R-nnn`, `check("<exact must-meet title>", …` on the next line; reuse each file's helpers; add no import)
- relative-agent-dir, R-932: place AFTER the existing explicit --pi-home runs (an earlier check asserts HOME/.claude absent). Pre-seed `<CWD>/explicit-rel/nana-knowledge/sources.json` (`{roots:[]}`), run `install --pi-home explicit-rel`. Assert the existing absolute run `ok` (exit 0, nana-pack.json in `explicit`) AND the relative run: exit 0; `<CWD>/explicit-rel/nana-pack.json`; nothing at `<HOME>/explicit-rel` or `resolved`; no "specific to the current working directory".
- install, R-383: give freshHome an optional path (wipe with `rmSync(..., {recursive:true, force:true, maxRetries:5})`, then seed). For `install --home H`, `install --dry-run --home H`, `project H/proj --home H`: run without --yes, re-seed the SAME H, run with --yes. Compare status, stdout, stderr and JSON of walk(H).
- install, R-315: `install --home H`, no --yes, `input: "n\n"`. Assert exit 0, "next: nana-setup doctor" printed, nana-pack.json seeded, no `[y/N]`/`(y/n)`.
- settings-merge, R-320: refused, each exits 2, stderr names the file, homeSnapshot unchanged: a truncated body; `[]`, `null`, `"x"`; `{"hooks":null}`, `{"hooks":[]}`; `{"hooks":{"Stop":{}}}`; `{"hooks":{"Stop":[1]}}`, `[null]`; `{"hooks":{"Stop":[{"hooks":"x"}]}}`. Accepted, each exits 0 and SessionStart then holds an entry that `entryInvokes(entry, spec, platform())` for the objective spec from `desiredHooks`: a whitespace-only file, `{"theme":"dark"}`, `{"hooks":{"Notification":[{"matcher":"x"}]}}`. Wrap JSON reads so a bad file is FAIL, not a throw.
- settings-merge, R-317: one table on `desiredHooks({hooksDir:"/h",repoRoot:"/r"})` objective and knowledge specs.
  - Must match: `node '/a b/S'`, `node "/a b/S"`, `node /a\ b/S`, `NODE_NO_WARNINGS=1 node /x/S`, `A=1 B=2 node /x/S`, `/usr/bin/node /x/S`, knowledge `NODE_NO_WARNINGS=1 node '/r/packages/nana-knowledge/bin/nana-knowledge.ts' hook`.
  - Must not: `node '/x/S` (unbalanced), `echo node /x/S`, `env node /x/S`, `echo /x/S`, `cat /x/S`, `node /x/old-S`, `node /x/S.disabled`, `node --inspect /x/S`, `nodemon /x/S`, knowledge with `build`, with no argument, and with `build hook`.
- win32-degrade, R-349: forced-win32 `install --desk --home H`, then `--dry-run`. Each: exit 0; exactly one line matching `/\bdesk\b/`, and it matches `/desk service\s+skipped\s+skipped \(win32/` (labels are padded: never a literal spaced string); no `/^\s*\S hook /` row; no `H/Library`; no `H/.claude/hooks`.
- pi-registration, R-384: inside the throwaway-worktree try block, BEFORE the tilde/other-repo rewrites. A: the existing worktree-CLI run `r`. B: new `piHomeWith(null)` home whose entries are relative paths to the worktree's packages/nana-pack and packages/nana-knowledge, run this checkout's `cli install --home`. Both: the pi packages line matches `/pi packages\s+unchanged\s+all extension directories registered as /`.
- pi-registration, R-927: in the "registered by relative path" block, reuse `r` and `doc`. The install `pi packages` line and doctor's `✓ pi packages` line each `trimEnd().endsWith("registered as " + rel)`. Never build a RegExp from `rel`.

## Ledger
Flip the eight rows to `implemented`, citing `packages/nana-setup/tests/<file>::<title>`. Retire R-939 (`retired 2026-10-20: duplicate of R-359`) and R-739 (`retired 2026-10-20: duplicate of R-302`), text kept. Open question 14: prepend "R-739's half closed on 2026-10-20." Run `npm run req:tree`.

## Wrong code (in a temp clone from mktemp, never on feat/install-cli-pins; revert each; spell no pi launch as spawn("pi" anywhere)
Every row's "Red on" list in must-meet.md. For R-384 direction A, commit the exactLocalEntry change in the temp clone so the throwaway worktree runs it.

## Done
The eight checks pass on unchanged code, and each goes red on every listed wrong code. The five files pass one by one. The trace rail, `npm run req:tree`, map:check and readme:check are green (regenerate the map only if map:check reports drift).

## Report (≤ 10 lines)
1. Commit SHA. 2. Each row with PASS on unchanged code. 3. Pairs red/total, row by row. 4. Per-file pass counts before and after. 5. Trace, tree, map and readme results. 6. Anything left open.