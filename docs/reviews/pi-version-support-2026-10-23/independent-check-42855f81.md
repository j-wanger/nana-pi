MATERIAL: none
# pi-version-support independent check · tip 42855f81 against main b2e594c3

Question: does the change work for its user, and does it break anything main does today that the lane does not set out to change. Every claim below is tagged **measured** (I ran it and read the output) or **inferred** (reasoned, not run).

## How I ran things

- Trees: `git archive 42855f81` and `git archive b2e594c3` into `<scratch>/pvs-check/{lane,main}`. For the install check, which needs a git repo, I made `git clone --no-hardlinks` copies checked out at the same two commits (`lane-git`, `main-git`). I wrote nothing in the main checkout or the lane worktree.
- Runner: one wrapper sets `HOME`, `USERPROFILE` and `TMPDIR` to `<h>` (a folder under `<scratch>/pvs-check/homes/`). It unsets `PI_CODING_AGENT_DIR`, `CLAUDE_CONFIG_DIR`, `NANA_SHARED_MEMORY_DIR`, `NANA_KNOWLEDGE_HOME`, `NANA_SETUP_PLATFORM`, `npm_config_prefix` and `NODE_OPTIONS`. `PATH` is `<prefix>/bin:<tools>:/usr/bin:/bin`, and `<tools>` holds only `node` (22.22.2) and `npm` links, so no other `pi` is reachable.
- pi installs: the planner's four scratch prefixes (`fresh103`, `pinned103`, `pinned140`, `fresh140`). I added four layouts built from their real package folders (no version edits): a hoisted lockstep 1.4.0 tree, two hoisted mixed trees (pi 1.0.3 with 1.4.0 dependencies), a hoisted tree missing `pi-mcp`, a shell-wrapper `pi` that execs pinned 1.4.0's `cli.js` (the pnpm-style shim), and a `sh` stub that prints `1.4.0`. This Mac's real pi was reached read-only through a link to `~/.local/bin/pi`.
- Doctor homes: (1) `install --home <h>` then `doctor --home <h>`, as the brief asks. (2) "Real-home" style, with `HOME=<h>` and no `--home`, so `isRealHome` is true and install really registers the checkout with the scratch pi. (3) An "all good" home: `install --home <h>`, a pi-subagents 0.75.0 `package.json` placed in `<h>` so that unrelated ✗ goes away, and doctor run from `<h>` so the project-trust `!` goes away.
- No model calls and no full suite. I ran the three changed test files once each on the lane clone (all exit 0), the install check five times, and two npm `--dry-run` resolutions into an empty scratch prefix.

## (a) Doctor end to end, each scratch prefix, lane against main

Measured, `--home` homes:

| prefix | `pi executable` | lane `pi dependencies` | lane last line | main last line |
|---|---|---|---|---|
| fresh103 | ✓ 1.0.3 | ✗ `@earendil-works/chord 1.4.0, …pi-agent-core 1.4.0, …pi-ai 1.4.0, …pi-codemode 1.4.0, …pi-mcp 1.4.0, …pi-tui 1.4.0 newer than pi 1.0.3 — install: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.4.0 --before=2026-10-23T18:35:54Z` | `2 missing — fix by hand as each ✗ line says: pi dependencies, pi pi-subagents (and see the 1 ! above)` | `1 missing — fix by hand as each ✗ line says: pi pi-subagents (…)` |
| pinned103 | ✓ 1.0.3 | ✓ `pi 1.0.3; 6 scoped packages read` | same as main | `1 missing — … pi pi-subagents` |
| pinned140 | ✓ 1.4.0 | ✓ `pi 1.4.0; 5 scoped packages read` | same as main | same |
| fresh140 | ✓ 1.4.0 | ✓ `pi 1.4.0; 5 scoped packages read` | same as main | same |

- The fix line is sensible (measured). The ✗ names all six newer packages, both versions and the ceiling install command. The last line puts `pi dependencies` in the fix-by-hand list. It never tells the user that `nana-setup install` fixes it.
- Split with install (measured, real-home style, pi registration removed from `<h>`'s pi settings): `4 missing — fix by hand as each ✗ line says: pi dependencies, pi pi-subagents, PATH resolves pi-review; then run: nana-setup install for the other 1`. The registration ✗ (`pi packages`) still goes to install, and `pi dependencies` stays by hand.
- "All good" home (measured): the lane prints `1 missing — fix by hand as each ✗ line says: pi dependencies` and exits 1 on fresh103. Main prints `all good.` and exits 0. Pinned 1.0.3, pinned 1.4.0 and this Mac's real pi (1.0.2: `✓ pi 1.0.2; 6 scoped packages read`) print `all good.` on the lane.
- Row counts (measured, all 23 doctor runs): exactly one `pi packages` row and exactly one `pi dependencies` row on the lane, and one `pi packages` row with no `pi dependencies` row on main. The new row sits directly after `pi executable`.
- The fix works (inferred from measurement): the hinted command's dry run resolves every scoped package at 1.4.0 (section e), and the fresh140 and pinned140 trees read ✓.

## (b) Every other doctor row, lane against main

Measured. For each pair (same home layout, same PATH), I normalised the tree folder name (`lane`/`main`) and the home name, dropped the `pi dependencies` row, and diffed:
- `--home` homes, all four prefixes: identical, every status, label, padding and detail. The only other difference is fresh103's last line (above).
- Real-home homes (fresh103, pinned103), with registration through the scratch pi: identical apart from the relative registration path naming `lane` or `main`, which comes from my folder names.
- "All good" homes (stub, fresh103, pinned103, pinned140): identical. The lane prints 50 rows and main 49.
- `nana-setup install` output, all six install runs: identical between lane and main. Install code is unchanged by the diff.
- The new label is 15 characters, shorter than the longest label, so column padding is unchanged (measured by the identical diffs).

## (c) A stub `pi` outside any package

Measured, with a `sh` stub that prints `1.4.0` first on PATH:
- `✓ pi executable 1.4.0` and `· pi dependencies no pi package found for the pi executable on PATH`.
- In the "all good" home, both lane and main print `all good.` with exit 0, so a `·` on the new row does not change the all-good logic.
- The shell-wrapper pi (pnpm-style shim over a real 1.4.0 package) gives the same `·` and `all good.` (measured).
- A hoisted tree missing `pi-mcp` gives `· pi dependencies could not read an exact three-part installed version for @earendil-works/pi-mcp` and `all good.` (measured). It is never ✗.

## (d) The CI workflow as GitHub reads it

Measured: PyYAML (`uvx --with pyyaml`) loaded both workflows. I expanded the install-check matrix and evaluated each step's `if:` per leg.
- The env holds `PI_VERSION 1.4.0`, `PI_BEFORE 2026-10-23T18:35:54Z`, `PI_FLOOR_VERSION 1.0.3` and `PI_FLOOR_BEFORE 2026-10-05T08:40:00Z`. The matrix is `os: [macos-latest, windows-latest]` × `pi: [ceiling, floor]`, with no `include` or `exclude`.
- Each of the four legs runs checkout, then setup-node, then exactly one `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@<its version> --before=<its cutoff>`, then `test "$(pi --version)" = <its version>`, then the one ungated `node packages/nana-setup/bin/install-check.mjs`. No leg runs the other version's install or check.
- The suite and release jobs install and verify `1.4.0` at `2026-10-23T18:35:54Z`, with their flags unchanged from main. Release still `needs: [suite, install-check]`.
- Job-name consumers (measured by grep): the CI-record reader matches only `suite (<leg>)` jobs, and `nana-land`'s CI gate judges whole workflow runs. The rename to `install-check (<os>, <pi>)` breaks neither. `main` has no branch protection or rulesets (measured: `gh api` gives 404 and `[]`).
- CI on the exact tip, run 40020575985 (measured, `gh` job logs): all four install-check legs passed. The floor legs installed `@1.0.3` and the ceiling legs `@1.4.0`, each printed `PASS doctor`, and the Windows legs resolved `C:\npm\prefix\pi.cmd`. A `PASS doctor` means exit 0 and no undeclared `·` line, so `pi dependencies` was ✓ on Windows npm shims at both ends. When I last checked, the ubuntu suite leg had passed and the macOS and Windows suite legs were still running. The previous run, at 291f8a14, failed only its macOS suite leg, in `test-locked.test.mjs` "handled signals wait for suite termination before releasing the lock". That is a lock-timing test the lane does not touch (inferred unrelated).

## (e) README pi install commands

Measured, every `npm i|install … @earendil-works/pi-coding-agent…` span in the seven READMEs the readme check covers (lane):
- Root README, macOS and Windows checklists: `npm i -g --ignore-scripts …@1.4.0 --before=2026-10-23T18:35:54Z` (the ceiling).
- Setup README "Upgrade pi itself": the ceiling command, plus one `npm i -g --ignore-scripts …@1.0.3 --before=2026-10-05T08:40:00Z` (the floor pair).
- Bench (two spans) and desk (one span): `npm i -g …@1.4.0 --before=2026-10-23T18:35:54Z`. These have the ceiling pair and, like main, no `--ignore-scripts`.
- Nothing else names a pi install command. The ceiling sentence `nana supports pi 1.0.3 through 1.4.0` is present.

The floor command really gives a lockstep 1.0.3 (measured three ways):
- Registry publish times (`npm view … time`) for all eight scoped packages: at `2026-10-05T08:40:00Z` every one has 1.0.3 as its newest version. Each first post-cutoff version is a 1.0.4, published 21:44Z or later.
- `npm i -g --dry-run --ignore-scripts --prefix <empty scratch prefix> …@1.0.3 --before=2026-10-05T08:40:00Z` printed `add` lines for pi-coding-agent, chord, pi-agent-core, pi-ai, pi-codemode, pi-mcp, pi-tui and pi-telemetry, all at `1.0.3`, and wrote nothing. That matches `npm ls -g --all` of `pinned103`.
- The CI floor legs on macOS and Windows printed `PASS doctor` (above).

The ceiling command's dry run gives seven scoped packages, all at `1.4.0` (measured).

No pi version in the registry is a scoped dependency's version without a matching pi release, outside `0.0.x` placeholders (measured). So a lockstep install of any 1.x pi cannot read ✗ today.

## (f) Other install-lane checks

Install check, macOS, from the scratch clones (measured):

| tree | pi first on PATH | doctor item | other items |
|---|---|---|---|
| lane | pinned103 | PASS | all PASS but `hook adoption` |
| lane | fresh103 | FAIL `exit: exit status 1` (the ✗ row) | all PASS but `hook adoption` |
| main | fresh103 | PASS | all PASS but `hook adoption` |
| lane | shell-wrapper pi (pnpm-style) | FAIL `note-row: pi dependencies no pi package found for the pi executable on PATH` | all PASS but `hook adoption` |
| main | shell-wrapper pi (pnpm-style) | PASS | all PASS but `hook adoption` |

- `hook adoption — no-output` fails on every run, main included. Adoption skips projects under the temp roots, and my clones live under `/private/tmp`. The plan records the same failure, and the seat's run from the real worktree and CI pass it.
- So the install check now catches the mixed install that main's install check passed (measured). This is the lane's intent.
- This Mac's real pi (1.0.2, read-only): lane doctor gives ✓ and `all good.` in the all-good home (measured). The seat's local install check at c3968694 passed `doctor`. The tip differs from c3968694 only in review-folder files (measured, `git diff --stat`).

## Findings that are not material

1. **The install check's doctor item now fails wherever the new row reads `·`** (measured above with a shell-wrapper pi; Volta, pi's own installer, a pre-release and a checkout-built pi take the same branch, inferred). `pi dependencies` is not in `DOCTOR_NOTES`, and on main that install check passed `doctor`. CI, this Mac and the second machine all use npm globals and read ✓, and the README's install path is an npm global. So no current user or gate is hit. The seat's uncommitted FEAT-015 lines name the `·` for pnpm, Volta and pi's installer, but not this effect on the install check. Suggest one known-bug line.
2. Under `--home`, the new row stays ✗. `pi executable` and `PATH resolves pi-review` drop to `·` there. The row still judges the real PATH pi, so ✗ is honest. It only matters on a machine with a mixed pi (inferred, no change suggested).
3. For a missing dependency, the `·` detail says "could not read an exact three-part installed version". The text says "unreadable" where the case is "absent" (cosmetic).
4. At the time I read it, the lane worktree held uncommitted HANDOFF and known-bug edits (the seat's notes step). The tip still carries HANDOFF's "[optional, since 2026-10-21] The pi upgrade" line, which the must-meet says goes. The pending edit drops it (measured by `git diff` in the worktree, read only).
5. Inferred future risk, outside the supported range: a later pi that depends on its own packages at a higher version than itself would read ✗ on a correct install. No such release exists today (measured, registry).
