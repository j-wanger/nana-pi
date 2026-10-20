# install-pins: must-meet

Feature: FEAT-013 · Install and connect harness runtimes
R-346 homes in FEAT-015 · Diagnose the active environment.

The feature in one sentence: on every CI leg, install and doctor keep eight promises that no tagged test names today. An owner's folder at the skill path is left alone, nothing is backed up beside it, and the run fails. A settings file that install cannot read, or will not edit, stops it before any write. A held lock names its fix. A hook command carrying an operator, or a look-alike, reads as not installed, and install adds the real hook beside it. --pi-home beats --home and the ambient agent folder, with no stray write. A relative ambient agent folder makes doctor warn and fail.

Class: ordinary. The lane changes tests, rows, the tree and the map only. It changes no install, doctor, hook, gate or land-tool code. It touches nana-setup tests, so the seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before nana-land.

Threat model: honest variation is in scope. That covers macOS, Linux and Windows on Node 22; shell-form and exec-form hook entries; hand-edited settings; a lock left by an interrupted run; and an absolute or relative ambient PI_CODING_AGENT_DIR. Deliberate forgery is out: a forged lock, or settings shaped to fool the tokenizer.

## Design
- Pin, not change. Each check is new, has its title on the line under its `// req:` marker, and runs on every platform with no skip. No other new check: each control folds into its pinned check.
- R-304, R-381 and R-382 say "a regular directory". On win32, nana-setup's own mirror is a regular directory. Install refreshes it with exit 0 and backs up its stale files inside the skills directory, so all three rows are wider than any test. Retire R-304 and R-382 as superseded by R-1870, and R-381 as superseded by R-1871. R-1420 to R-1423 keep their win32 pins.
- R-922 and R-318 build their look-alikes from desiredHooks for the host platform. A win32 exec-form entry is joined into one shell-form line with shq. The checks judge only by doctor's printed ✓ or ✗ and by JSON equality with the installer's own entry, never by calling the code under test.
- R-346 needs a home where doctor reads all good. Both doctor runs pass --claude-home. That turns the real-home-only rows (pi on PATH, PATH order, package registration) into notes on every platform, while the agent folder stays the ambient value. The absolute value must read exit 0 and all good. The relative value must show the same ✓ rows, exactly one ! line naming the cwd, no all good, and a non-zero exit. The no-flag control was dropped: with NANA_SETUP_PLATFORM=win32 it read 2 ✗ rows.
- R-827 goes in agent-dir-parity's --home hermeticity block.
- R-924 and R-322 close the install-honest-report HANDOFF residual about two install rows that tests checked without a tag.

## Must-meet
| Row | Requirement | Test (file::title) | Wrong code that reds it (probed) |
|---|---|---|---|
| R-1870 | IF a directory that nana-setup did not make occupies the requirements skill path, THEN install shall leave that directory untouched, back up nothing in the skills directory and report ✗ with the move-or-remove fix. | `packages/nana-setup/tests/skills-and-standards.test.mjs::R-1870: install leaves an owner's folder at the requirements skill path untouched, backs up nothing in the skills directory and reports ✗ with the move-or-remove fix` | W7b, W7c, W7d |
| R-1871 | IF a directory that nana-setup did not make occupies the requirements skill path, THEN install and install --dry-run shall exit 1. | `packages/nana-setup/tests/skills-and-standards.test.mjs::R-1871: an owner's folder at the requirements skill path makes install and install --dry-run exit 1` | W7, W7b, W7c |
| R-924 | (existing, verbatim) | `packages/nana-setup/tests/settings-merge.test.mjs::R-924: install over a settings.json that does not parse, or parses to a shape it will not edit, exits 2 naming the file with everything under the home unchanged` | W4, W5 |
| R-322 | (existing, verbatim) | `packages/nana-setup/tests/settings-merge.test.mjs::R-322: a held settings lock stops install printing the lock path, the recorded pid, its age and the exact rm command` | W6, W6b |
| R-922 | (existing, verbatim) | `packages/nana-setup/tests/install.test.mjs::R-922: doctor and install read a nana hook command carrying an operator, a redirection, a substitution or broken quoting as not installed` | W1, W2, W3 |
| R-318 | (existing, verbatim) | `packages/nana-setup/tests/install.test.mjs::R-318: install beside two look-alike commands of nana hooks keeps both look-alikes and adds each real hook` | W1, W3 |
| R-827 | (existing, verbatim) | `packages/nana-pack/tests/agent-dir-parity.test.mjs::R-827: install with --pi-home, --home and an ambient PI_CODING_AGENT_DIR seeds the --pi-home dir only and writes nothing into the ambient dir` | W8, W9 |
| R-346 | (existing, verbatim) | `packages/nana-setup/tests/relative-agent-dir.test.mjs::R-346: on a home doctor reads as all good, an ambient relative PI_CODING_AGENT_DIR still prints every row, adds one ! line naming the cwd, never says all good and exits non-zero` | W10, W11, W11b, W12 |

## Red today
Nothing is red today: this is a pin lane, and the behaviour holds. I probed main f0d6da24 in a temp clone with a temp HOME, on macOS with Node 22.22.2. All eight checks passed. File counts: install 106, settings-merge 219, skills-and-standards 83, relative-agent-dir 30, agent-dir-parity 56. The trace found 0 rows off EARS form. Tree, map and README checks are green after regenerating. requirements-moved lists 11 rows.
I applied each wrong version alone, then restored it:
- W1: tokenize keeps operators.
- W2: doctor's POSIX settings row uses a script-name substring.
- W3: install's merge uses a substring.
- W4: the settings read moves after the skills step.
- W5: validateShape accepts any shape.
- W6: the lock message drops the rm line.
- W6b: the lock message drops the pid.
- W7: dry run says "would link" over an occupied path.
- W7b: install renames the owner folder to .bak and links.
- W7c: an occupied path reports skipped.
- W7d: install copies a .bak beside an untouched owner folder.
- W8: --home wins over --pi-home.
- W9: install --pi-home creates the ambient folder.
- W10: doctor drops the ! row.
- W11: doctor's exit ignores ! rows.
- W11b: the summary says all good despite a ! row.
- W12: doctor refuses up front.
With NANA_SETUP_PLATFORM=win32 forced on macOS, R-922, R-318 and R-346 pass. Native Windows and Linux runs are inferred; the PR's CI legs are the evidence.

## Known limits
- Found, not fixed: install --home --dry-run reports pi packages as "would add per-package entries", while install --home reports skipped. That breaks R-391 under dry run, and breaks R-313 for that step. The seat records a HANDOFF residual or opens an install-class fix: move the --home check above the dry-run branch in stepPiRegister.
- R-346 is pinned through doctor --claude-home. With no flags, the ! line is still checked only by the older untagged check.
- R-322, R-924 and R-827 are pinned through install only.
- Left for later: R-315, R-383, R-358, R-391, R-932, R-825, R-317, R-320, R-324, R-384, R-927.
- R-346's "that value" points at R-345 in another feature. Left as is.
- The older untagged checks stay.

## Conflicts
No in-flight lane touches these five test files or these rows. All lanes share REQUIREMENTS.md, the tree and the map: regenerate them after merging main. If win-hook-rows changes how doctor prints the win32 settings rows, whichever lane lands second re-runs install.test.mjs. Wait for none.