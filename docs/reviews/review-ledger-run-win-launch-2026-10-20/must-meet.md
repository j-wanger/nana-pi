# review-ledger-run-win-launch: review-ledger run starts any reviewer on Windows and never crashes

Feature: FEAT-007 · Review a specific revision independently (SUB-008, rows after R-1723)

**Feature.** On Windows, review-ledger run starts any reviewer command a seat names. pi in any spelling takes pi's npm launch (R-1722). A .cmd or .bat starts through cmd.exe, and a refused character is named. On every platform, a command it cannot start ends with exit 1 and a `cannot start <cmd>: <reason>` line on stderr and in --out. No stack trace prints, and no reservation or round is left.

**Class: install, hook or gate** (land and review tools: review-ledger run). Ladder: roster reviewer, land reviewer (seat-land.md when the roster prints `land: seat`), seat wrong-code pairs plus mutation run, one independent check. Windows pairs W10 and W11 run through a scratch CI job, as in review-ledger-run-reviewer.
**Threat model.** In scope: honest command spellings (PI, pi.cmd, a path, an npm `.cmd` shim, a native .exe, an empty or unset variable, a typo), all three platforms, npm shim layouts. Out: a forged shim, a relative PATH entry (HANDOFF residual "Review launcher's folder"), deliberate forgery.

## Today (main a112fd30, read and probed)
- review-ledger.mjs:80 takes piLaunch only for a first word of exactly `pi`. Every other word spawns by name, and libuv's Windows lookup tries only .com and .exe. So an npm `claude.cmd` ends `no verdict (exit ENOENT…)` (inferred from libuv and the README's Windows paragraph).
- review-ledger.mjs:91-97 spawns inside a `new Promise` executor, so a synchronous spawn throw is a top-level rejection. Probe (temp clone, temp HOME, macOS): `run … -- ""` printed the admission note, then a raw `TypeError [ERR_INVALID_ARG_VALUE]` stack. It exited 1, kept the reservation file and wrote no --out. On Windows a .cmd or .bat given by path throws EINVAL the same way (Node's batch-file rule, inferred).
- Probe: `run … -- nana-absent-reviewer-xyz` printed `no verdict (exit ENOENT; 0 chars)` and left an empty --out: no `cannot start` line and no reason.
- A refused pi launch writes nothing to --out, and the R-1723 check never reads --out (HANDOFF residuals from review-ledger-run-reviewer).

## Design
- New `bin/review-launch.mjs` (six-tag header) exports `reviewLaunch(child, {platform, env, cwd, exists, isFile, readText, execPath})`. It returns `{command, args, options?}` or `{refused}` and is pure under injection.
  - Not win32: today's start, unchanged. An exact `pi` goes to piLaunch, which starts pi by name there; any other word starts by name.
  - win32, a bare pi name (lowercased `pi`, or `pi` plus one PI_EXTENSIONS entry): piLaunch(args, opts). A refusal becomes `pi launch refused: <reason>`.
  - win32, a word holding `\`, `/` or `:` is a path, taken as given. A .cmd or .bat goes to winCommand; anything else starts directly, as today.
  - win32, any other bare word: findOnPath(word, {env, cwd, exists}). No match returns `{refused: 'not on PATH'}`. Otherwise it calls winCommand(found, args, {comspec}), reading ComSpec from env in any key case, as steps.mjs does.
- review-ledger.mjs computes `reviewLaunch(child)` where it does today.
  - After admit and before the heartbeat, a `{refused}` calls cannotStart(reason).
  - cannotStart releases the reservation and writes `cannot start <word>: <reason>` to adm.res.out (best effort). Then it dies with that line. An empty word prints as `""`.
- Spawn moves out of the Promise into a try, with `{...launch.options, cwd, stdio, env}`. A throw calls stopHeartbeat, then cannotStart(e.code ?? e.message).
- **Adversary amendment:** the spawn's `error` event (ENOENT, EACCES) also calls cannotStart(code) after stopHeartbeat, instead of `no verdict`.
  - review-ledger never kills or messages its child, so this event means the command did not start.
  - Without it, R-2250 is false for a mistyped command on macOS and Linux.
- The refusal runs after admission, not before, as pi-review does. So admission's tracked --out refusal runs before anything writes --out.
- Adversary prototype (temp clone of a112fd30): about 20 lines of new module and about 10 changed lines in review-ledger.mjs.
  - `-- ""` gave `cannot start "": ERR_INVALID_ARG_VALUE`, and the absent name gave `cannot start nana-absent-reviewer-xyz: ENOENT`.
  - Both exited 1 with the reason in --out and no reservation left. A node reviewer still recorded its round.
  - Under an injected win32 volume, the outputs matched every R-2251 to R-2253 case.
- lib/win-command.mjs and pi-watchdog.mjs stay unchanged. The R-1723 Windows check gains one condition: --out starts `cannot start pi: pi launch refused:`. Its marker becomes `// req: R-1723 R-2250`.
- README (pack): the run paragraph names the cannot-start line. Under the example, add a Windows note:
  - A .cmd reviewer (npm-installed claude or codex) starts through cmd.exe.
  - cmd.exe cannot carry `"`, %, !, a line break or a trailing backslash in an argument. It also caps its line at 8191 characters.
  - So give such a reviewer its brief on stdin: `… -- claude -p --model <model> < brief.md` from Command Prompt or Git Bash.

## Must-meet
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-2250 | IF review-ledger run cannot start its review command, THEN review-ledger run shall exit 1 with a `cannot start` line naming the command and the reason on stderr and in --out, printing no stack trace and leaving no reservation or round. | `packages/nana-pack/tests/review-launch.test.mjs::review-ledger run with an empty or a missing command exits 1 naming what it cannot start, with no stack trace, no reservation or round, and the reason in --out` | Every leg. Probed on macOS: `""` printed a stack, kept the reservation and wrote no --out; the absent name printed `no verdict`, with an empty --out. On Windows both take the refusal path (`not on PATH`). |
| R-2251 | WHERE the platform is win32, WHEN the review command's first word is a bare pi name in any letter case, alone or with a .com, .exe, .bat or .cmd extension, the review launch resolver shall return pi's own npm launch with the remaining arguments unchanged. | `…review-launch.test.mjs::on win32 PI, pi.cmd, Pi.Exe, pi.bat and pi.COM take pi's own npm launch with the arguments unchanged` | Every leg: the module is absent on main (guarded import fails by title). Main routes only an exact `pi`. |
| R-2252 | WHERE the platform is win32, WHEN the review command's first word is not a bare pi name, the review launch resolver shall return a .cmd or .bat file, named by its path or found through PATH and PATHEXT, as winCommand's ComSpec launch, and a .exe that PATH finds, or any other path, as a direct launch with the arguments unchanged. | `…review-launch.test.mjs::on win32 a .cmd found on PATH and .bat or pi.cmd paths start through ComSpec, while pip.exe and an extensionless path start directly` | Every leg: the module is absent. |
| R-2253 | WHERE the platform is win32, IF the review command's first word is a bare name PATH finds no file for, a bare name PATH finds with an extension other than .exe, .com, .cmd or .bat, or a .cmd or .bat with an argument winCommand refuses, THEN the review launch resolver shall return a refusal naming the reason. | `…review-launch.test.mjs::on win32 a name not on PATH, a .py PATH finds and a .cmd argument with a line feed or % are refused, named` | Every leg: the module is absent. |
| R-2254 | WHERE the platform is win32, WHEN PATH resolves the review command's bare first word to an npm-style .cmd shim, review-ledger run shall start that shim with its arguments and standard input unchanged and record its review-shaped output as a round. | `…review-launch.test.mjs::Windows: review-ledger run starts an npm-style .cmd reviewer found on PATH with its arguments and stdin unchanged and records a round` | Windows leg, inferred: today's spawn by name gives ENOENT, then no verdict. SKIP elsewhere, because .cmd shims and cmd.exe exist only on Windows. Marker `req-candidate`; the row stays untested until the seat sees it pass on Windows CI. |

## Known limits
- A pi named by its path is taken as given. pi.cmd then goes through cmd.exe, so a multi-line argument is refused, named. Name pi bare instead.
- A pi name with an extension starts the pi that findPi finds first, whatever extension was typed.
- A bare name resolves in PATH-folder order, then PATHEXT order, as Command Prompt does. A .cmd in an earlier folder now beats a .exe in a later one.
- A bare name no longer starts a program in the reviewed tree's own folder. libuv searched the child's folder first (inferred from libuv's search_path); findOnPath searches PATH only.
- The lookup runs from the launcher's folder, not --tree (HANDOFF residual, unchanged).
- A refused or failed start now prints the admission note first. With --over-cap the override audit line stays, as for pi-review.
- A .cmd reviewer line over 8191 characters fails inside cmd.exe. The result is no verdict and the reservation is returned; nothing crashes.
- That `claude -p` reads its brief from stdin is inferred from Claude Code's pipe use; it was not probed. A native claude.exe starts directly.
- R-2250 proves the refusal path on Windows and the throw and error-event paths on macOS and Linux. Only R-2254 and R-1722 prove the Windows wiring.

## Claim most likely wrong
R-2254 passes on the Windows leg on its first run. npm's cmd-shim text starts through winCommand's cmd.exe line from a folder with a space. It must hand node the `&` and parentheses argument and the piped multi-line stdin unchanged. The test is written on macOS, and Windows CI is its first proof.