# silent-main-guard: must-meet (adversary-amended)

Feature: FEAT-028 · Maintain requirement identity and trace links
Rows also home with each command's existing rows: FEAT-029 · Navigate code and investigate impact (R-1632); FEAT-039 · See the product and its decisions in one report (R-1633); FEAT-006 · Launch builders with execution limits (R-1634, R-1636). This follows the bench-win precedent of naming more than one feature.

The feature in one sentence: five commands exit and print the same when started through a symlinked or junctioned folder as when started by their real path. They are the tree movement report, the tree checker, the candidate-rows list, the product report and the roster command, which the seat and its reviewers run on every brief and land. Importing the roster module also never runs or breaks the command.

Why it matters: on macOS the OS temp folder is itself reached through a link (/var to /private/var). pi-review's detached checkout lives there. A reviewer who runs one of these commands by its absolute checkout path gets a silent exit 0, and a silent checker reads as a pass.

Class: ordinary. No installer, hook, extension, gate-policy or land and review tool file changes. Three things import nana-roster.mjs: the roster-notice extension, the roster-notice hook (inside its try) and pi-worker. R-1636 pins that importing it stays safe. The roster-set lane took the same class for this file.

Threat model: honest variation is in scope. That covers platforms and paths: the macOS /var and /tmp links, a checkout reached through a symlink, Windows junctions and 8.3 temp names. Deliberate forgery is out.

## Design
- All five commands get one guard shape. It is the shape the templates ship and scripts/runtime-measure.mjs uses:
  `process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))`
  Use node:fs realpathSync, the JS version Node's loader uses for the main module. Never use realpathSync.native.
- The existsSync term stops an import from throwing when argv[1] names no file. The plain realpath form throws ENOENT at import (probed).
- No shared helper. The guard is a one-line expression in five files across two components. A helper would add a module, a header, a map entry and a cross-component import.
- Cut from the first plan: the roster argument refusal, the R-1123 and R-1192 rewording and the pack README edit. Argument parsing is a second behaviour, outside this feature. It would change two implemented rows and documented README behaviour. It stays a HANDOFF residual and can be its own small lane. R-1635 is not used.
- Test: one new file reaches all five commands through one link to the checkout root. The link is made with fs.symlinkSync(realRoot, link, "junction"). That gives a junction on win32 and a directory symlink elsewhere, so no privilege is needed.
- realRoot is fs.realpathSync of the checkout root. This is required. On macOS a path under the OS temp folder is itself a link, and a run from it is silent too (probed).
- The link sits in its own fs.mkdtempSync folder, never passed to tmpDir. A finally block unlinks the link and then removes the folder with rmdirSync.
- Each check runs the same arguments by real path and through the link, with the same env. It passes when the statuses are equal, the stdouts are equal, and the real-path run printed something on stdout or stderr.

## Must-meet
| Row | Home | Test (file::title) |
|---|---|---|
| R-1630 | FEAT-028 | `packages/nana-pack/tests/linked-launch.test.mjs::R-1630: requirements-moved started through a linked checkout folder exits and prints as it does by its real path` (args `--root <realRoot> --base HEAD`, GIT_* stripped) |
| R-1631 | FEAT-028 | `packages/nana-pack/tests/linked-launch.test.mjs::R-1631: the tree checker started through a linked checkout folder refuses a flat ledger with exit 1 as it does by its real path` (args `--root <temp flat ledger>`) |
| R-1632 | FEAT-029 | `packages/nana-pack/tests/linked-launch.test.mjs::R-1632: requirement-rows started through a linked checkout folder refuses a run with no file and exits 1 as it does by its real path` |
| R-1633 | FEAT-039 | `packages/nana-pack/tests/linked-launch.test.mjs::R-1633: the product report started through a linked checkout folder refuses an unknown flag with exit 2 as it does by its real path` |
| R-1634 | FEAT-006 | `packages/nana-pack/tests/linked-launch.test.mjs::R-1634: the roster command started through a linked checkout folder prints the roster as it does by its real path` (empty temp PI_CODING_AGENT_DIR) |
| R-1636 | FEAT-006 | `packages/nana-pack/tests/nana-roster.test.mjs::R-1636: importing nana-roster with argv[1] naming another file or no file completes and prints nothing` |

Row text: see the rows list.

## Red today (adversary probe on main f29827a, temp clone, macOS, Node 22.22.2)
- The draft linked-launch test gave 5 FAIL on today's code and 5 PASS with the guard changed. It ran in 0.75 s, and the link was removed afterwards.
- By real path the commands gave: `tree movement: none` (exit 0), the ledger refusal (1), usage (1), usage (2) and six roster lines (0). Every run through the link exited 0 and printed nothing.
- The same commands started from the clone's path under the OS temp folder, not realpath'd, were also silent. That is the reviewer case.
- R-1636 is green today, because today's URL-compare guard cannot throw. It is a regression pin for the new shape. Without existsSync the import throws ENOENT in lstat for a missing argv[1], and `if (true) main()` prints the roster (both probed).
- With the guard changed, these single files passed: nana-roster 17/17, nana-roster-set 8/8, roster-notice 16/16, requirements-moved 4/4, requirement-rows 5/5, product-report 63/63, requirements-tree 89/89.
- Windows is inferred, not run. Node resolves the main module with the JS fs.realpathSync. That call resolves junctions and keeps 8.3 names, and it is the same call the guard makes. handoff-store.test.mjs already creates and removes junctions on the Windows leg. CI's Windows leg is the evidence.

## Known limits
- The bench's run.mjs, aggregate.mjs and lib/fixture.mjs keep the resolve-form guard. They belong to FEAT-036. This is a residual.
- `requirements-tree --check` prints nothing on success. The `--root` refusal exercises the same guard.
- R-1636 pins import safety for nana-roster only. The four scripts share the shape, but no hook or extension imports them.
- A crash between creating the link and the finally block leaves one link to the checkout in the OS temp folder. Nothing in the suite removes it recursively.
- `nana-roster --json set …` still prints the roster and sets nothing. That change was cut, and its HANDOFF residual stays.