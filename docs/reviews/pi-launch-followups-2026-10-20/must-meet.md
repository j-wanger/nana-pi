# pi-launch-followups — must-meet

Feature: FEAT-013 · Install and connect harness runtimes
Class: install, hook or gate (the relay behind the pi launches of install, its dry run and doctor). Ladder: final reviewer, land reviewer or seat-land.md, seat wrong-code pairs, one independent check; the install check runs locally on macOS before nana-land.
Threat model: honest variation is in scope: a pi hung on a lock or the network, a pi that cannot run its signal handlers, a pi slow to clean up, large pi output, a supervisor or `timeout -s KILL` that kills install by process group, a kill of install alone, a supervisor that signals install and the relay at once, on macOS, Linux and native win32. Deliberate forgery is out. A pi that leaves its own group or session stays a residual.

## Feature
On macOS and Linux, when install dies while it waits on a pi launch, even by a SIGKILL of its whole process group, the relay still ends every process that launch started within one parent check plus its signal grace, and still gives pi that grace to clean up. On every platform, pi install output up to main's 1 MiB per stream reads as pi's own result again.

## The five known bugs pi-probe-timeout recorded
1. The deadline kill gives pi no grace: not built. pi 1.0.2 takes its settings lock only inside one synchronous read and write, with a synchronous retry, and `pi install <local folder>` runs no npm (both read in pi's source). A pi hung at its limit is outside that section; a pi stuck inside it cannot run a handler. The seat rewords that HANDOFF line.
2. One 1 MiB cap for both streams: built (R-2132).
3. A group SIGKILL orphans a hung pi: built (R-2130, R-2131), with R-2133 guarding pi's grace on the new path. This also ends the POSIX half of "a kill of install alone leaves pi until its limit".
4. Windows skip lines print PASS: built, tests only, no row.
5. A stuck relay on Windows leaves cmd and pi: not built; nothing here can run it. It stays a residual.

## Design
- `lib/bounded-spawn.mjs`: on POSIX the outer spawnSync passes `detached: true`, so the relay leads its own session and a kill of install's group misses it. The win32 options stay as they are. The spec adds `parentPid: process.pid`; the outer call passes `maxBuffer: RELAY_RESULT_MAX_BYTES`. Two constants join the RELAY_* ones, neither sealed:
  - `RELAY_PARENT_POLL_MS = 200`, chosen: pi gets its signal within 0.2 s of install's death.
  - `RELAY_RESULT_MAX_BYTES = 16 MiB`, chosen: two streams at main's 1 MiB need 12 MiB after JSON's worst six-byte escape.
- `lib/bounded-spawn-child.mjs`, POSIX only: an unref'd interval compares `process.ppid` with `spec.parentPid`. On a change it clears itself and, only when no termination is in progress, calls `terminate("SIGINT")`: SIGINT to pi's group, the grace, then the group kill. A watch that calls terminate again on its next tick, or while a signal's termination runs, reads as a second Ctrl-C and kills at once, so pi's grace shrinks to one poll (probed, W7 and W8). A missing parentPid turns the watch off. The deadline, Windows and signal-handler paths stay as they are.
- Ctrl-C now reaches pi through the watch: the relay is outside install's group, install dies on the signal (nana-setup registers no signal listener), and the relay sees the death. R-2026 and R-2027 pass unchanged (probed).
- Tests: the hang fixture's pi and child ignore SIGINT when `IGNORE_SIGINT` is set. The cleanup fixture's pi waits `CLEANUP_DELAY_MS` (default 0) after SIGINT before it removes its lock. Every win32 skip returns a skip result.
- README Idempotence section: one sentence after the launch-limit sentence, naming install only, and the pi-launch-limits test-table row.

Probes: macOS, Node 22, a temp clone of the pi-probe-timeout tip, temp HOME and TMPDIR. The four checks below ran on today's code and on a prototype of this design. On the prototype the file's nine existing checks pass (37 s), as do pi-registration 70/0 and doctor-runtime 21/0.

## Must-meet — all in packages/nana-setup/tests/pi-launch-limits.test.mjs
| Row | Requirement | Test title | Red today? |
|---|---|---|---|
| R-2130 | WHERE the platform is not win32, IF install's process group is killed with SIGKILL while install waits on a pi launch, THEN the pi launch relay shall end every process that launch started within the relay's parent-check interval plus its signal grace. | R-2130: a SIGKILL of install's whole process group ends the pi launch it waits on within the parent check and the signal grace | RED: sh, the fake pi and its child were all alive at the 2.2 s bound; the relay died with the group. Prototype: all dead in 1.04 to 1.17 s with the SIGINT-ignoring pi. W1, W2 and W6 turn it red. Win32 skip: Windows has no process-group SIGKILL. |
| R-2131 | WHERE the platform is not win32, IF install alone is killed with SIGKILL while it waits on a pi launch, THEN the pi launch relay shall end every process that launch started within the relay's parent-check interval plus its signal grace. | R-2131: a SIGKILL of install alone ends the pi launch it waits on within the parent check and the signal grace | RED: all three alive at the bound; the orphaned relay waits for its 12 s limit. W2 and W6 turn it red. Win32 skip: a Windows parent's death leaves process.ppid unchanged (inferred: Windows does not reparent a child). |
| R-2132 | WHEN a `pi install` that install starts exits after writing up to 1 MiB to each of stdout and stderr, install shall report that step from pi's exit status and the last line of pi's error output. | R-2132: a pi install that writes just under 1 MiB of control characters to each of stdout and stderr reads created on exit 0 and failed with its last error line on exit 1 | RED: both runs read `failed: spawnSync <node> ENOBUFS`. W4 (8 MiB) turns it red. Every platform, no skip. |
| R-2133 | WHERE the platform is not win32, IF install's process group receives SIGINT while install waits on a pi launch, THEN the pi launch relay shall wait its signal grace for that launch's processes to end before it kills them. | R-2133: SIGINT to install's process group, alone or with the relay signalled too, still lets a pi install that cleans up over two parent checks remove its lock before its processes end | GREEN today: today's relay gets SIGINT directly and waits its 1 s. This pins that promise on the new path. W3 and W7 turn phase one red, and W8 turns phase two red (probed). The plan's watch, built as worded, is W7 and passed every check of the original plan. Win32 skip: no process-group SIGINT there. |

## Known limits
- Windows is unchanged. A kill of install alone leaves pi until its limit, and a stuck relay's backstop ends only the relay.
- Doctor and install's dry run share the relay, but no check kills them mid-launch (inferred covered).
- W5 (the watch compares process.ppid with 1) survives on macOS, where an orphan's parent is pid 1. Linux runners are likely the same (inferred).
- A second Ctrl-C no longer cuts pi's grace short on macOS and Linux: install is gone, so the shell gets it.
- Ctrl-C reaches pi up to one poll later. Ctrl-Z stops only install; the relay and pi run on, and the limit counts.
- On install's death the relay passes SIGINT whatever install received.
- The relay holds pi's output in memory until pi ends. Past 16 MiB of escaped output the row reads could not start (ENOBUFS).
- Node honours spawnSync's `detached` though its docs omit it. It was probed on macOS only. The Ubuntu CI leg proves Linux but does not block, so the seat reads its R-2130, R-2131 and R-2133 lines.
- The deadline kill still gives pi no grace (bug 1). A pi that leaves its group or session, or a SIGKILL of the relay itself, still escapes the kill.
