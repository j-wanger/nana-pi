# install-cli-pins: must-meet

Feature: FEAT-013 · Install and connect harness runtimes
Shared row: R-383 is also on FEAT-014 · Create or adopt a project workspace (its Also applies line).
Class: ordinary. The lane changes tests, rows and the tree only, and no install, uninstall, doctor, hook, gate or land-tool code (precedent: install-pins 2026-10-19). It touches nana-setup tests, so the seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before nana-land, and re-runs the wrong-code pairs once at verify.
Threat model: honest variation in our tools' output, platforms (darwin, linux, native win32, forced win32) and configs is in scope; deliberate forgery is out.

## Design
- Pin, not change. Eight new checks, each with its title on the line under its `// req:` marker; each row flips to `implemented` citing it. No new imports. No new rows: R-2040 to R-2049 stay unused.
- Retire two duplicates (seat's call; IDs and text kept): R-939 `retired 2026-10-20: duplicate of R-359` (closes the win-claude-skills ledger residual); R-739 `retired 2026-10-20: duplicate of R-302`. Open question 14 gets "R-739's half closed on 2026-10-20."; its R-834 half stays open.
- R-320 differs from R-924: R-924 pins a refusal's effect on two samples; R-320 pins every shape rung refused and the accept side.
- R-932 "as given" reads: absolute as named, relative against the process cwd (as pi does, R-190), never refused.
- Reuse runs already in each block: R-932 folds in the absolute --pi-home run; R-384 direction A reuses the worktree-CLI install; R-927 reuses the relative-path block's install and doctor.

## Must-meet (all green on main 1c539a0e; "Red on" = wrong code, probed in a temp clone)
| Row | Row text (unchanged) | Test file::title | Red on |
|---|---|---|---|
| R-932 | An explicit --pi-home, relative or not, shall be used as given. | `relative-agent-dir.test.mjs::R-932: install uses an explicit --pi-home as given, an absolute one as named and a relative one against the cwd, with no refusal under an ambient relative PI_CODING_AGENT_DIR` | `path.resolve(base, opts.piHome)`; piHomeCwdRelative set for a relative explicit value. 2/2 |
| R-383 | Install and project shall accept --yes and do nothing with it. | `install.test.mjs::R-383: install, install --dry-run and project give the same exit, output and home tree with --yes as without it` | --yes also sets desk; project --yes also writes trust; an install prompt unless --yes. 3/3 |
| R-315 | The installer shall never prompt. | `install.test.mjs::R-315: install without --yes, with no terminal and a no answer waiting on stdin, finishes and seeds the home without asking anything` | `[y/N]` via readline unless --yes (exit 1 on "n"; on EOF exit 0 with nothing seeded). Red |
| R-320 | Preflight shall parse and shape-validate settings.json. | `settings-merge.test.mjs::R-320: preflight refuses a settings.json that does not parse or breaks any rung of the hooks shape, and accepts a blank file, no hooks key and a foreign group without hooks` | each of 5 validateShape rungs dropped; group.hooks required; parse failure read as {}; blank file refused. 8/8 |
| R-317 | A hook shall count as present only when the command actually executes that script — tokenized with shell-quoting rules, leading VAR=value dropped, argv[0] the interpreter, argv[1] a path ending in that script plus the expected argument. | `settings-merge.test.mjs::R-317: a hook counts as present only when its command, read with shell quoting and leading VAR=value words dropped, runs the interpreter on a path ending in the script with the expected argument` | no VAR= skip; endsWith without `/`; no args check; no interpreter check; quotes ignored; backslash ignored; target from any later word; args anywhere after target; interpreter by substring. 9/9 |
| R-349 | WHERE the platform is win32, every posix-only step shall create nothing and, except the Claude Code hook-file link step, report skipped (win32). | `win32-degrade.test.mjs::R-349: on win32, install --desk and its dry run create no hook folder and no launch agent, and report the desk service skipped (win32)` | desk skip only on linux; stepHooks unguarded; desk detail without platform; win32 hook step makes the folder. 4/4 |
| R-384 | An entry naming another checkout or a linked worktree of this repository shall count as a match by that same identity. | `pi-registration.test.mjs::R-384: install from a linked worktree counts the main checkout's entries as registered, and install from this checkout counts the worktree's entries, adding none` | no common-git-dir fallback in exactLocalEntry: B red uncommitted, A and B red once committed in the scratch clone |
| R-927 | WHEN this repo is already registered, the matching entry shall be reported. | `pi-registration.test.mjs::R-927: when this repo is already registered, install and doctor both name the matching entry on the pi packages row` | drop ` as <match>` in install: red; in doctor: red. 2/2 |

Every check runs on all three platforms with no new skip. R-349 forces win32 (a no-op on native Windows). R-384 inherits its block's environment SKIP (not a git checkout, or `git worktree add` failed), which is an environment limit, not a platform skip.

## Known limits
- R-315: a prompt shown only when stdin is a terminal stays green; there is no portable terminal in tests.
- R-383: `project --check` and `--not-a-project` are not compared (project-check-quiet edits --check). Project seeds carry today's date, so a pair straddling local midnight differs.
- R-349: names the two posix-only steps that exist today; a future one needs its own case.
- R-384: the worktree direction runs the throwaway worktree's HEAD, so its wrong code must be committed in the scratch clone. Under --home install never runs pi, so the `registered as` row, not the settings bytes, is the evidence.
- R-324 (tilde, relative, realpath identity) stays untested and out of scope; the common-dir fallback masks a dropped realpath.
- Older unmarked checks covering parts of R-317, R-320, R-349 and R-932 stay untouched.