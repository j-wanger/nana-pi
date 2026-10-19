# win-stale-copies — must-meet

Feature: FEAT-015 · Diagnose the active environment. Not FEAT-018: this lane reports unhealthy copies and names the fix; it migrates nothing.
Class: install, hook or gate. It changes a Claude Code hook, a pi extension and doctor. It gets the full ladder, wrong-code pairs through the mutation runner, one independent check and the macOS install check before nana-land.
Threat model: honest variation is in scope: POSIX links versus Windows copies, a rule or skill added after the last install, a link to another checkout, a byte-equal regular file on POSIX, NANA_SETUP_PLATFORM. Deliberate forgery is out: crafted special files, hostile checkout paths, files swapped mid-read.

Sentence: At session start, when any nana-installed rule or skill is not this checkout's current file, the Claude Code agent's session context carries one line. The line names each such item by its doctor label and gives this checkout's install command, and it asks the agent to tell the user. A pi session gets the same line in its system prompt when its installed rulings copy is stale. Nothing is added when everything is current.

## Design
- Ride the adoption hook, which every installed machine already runs from the checkout. On POSIX the installed hook is a link into the checkout. On Windows the settings entry runs node on the checkout's file. A new hook script would itself need an install first.
- The adoption wrapper calls `runHookProducer` a second time, with a `stale-copies` launcher. A new CLI, `packages/nana-setup/bin/stale-copies.mjs`, prints the line or nothing. A crash in the CLI cannot touch the adoption output or the hook's exit code (R-687 launcher).
- Shared check: `linkOk` moves verbatim from doctor.mjs into the new leaf `packages/nana-setup/lib/stale-copies.mjs`, and doctor imports it. Doctor's behaviour does not change. The CLI walks the checkout's CLAUDE_RULES with linkOk and ruleSource. It walks CLAUDE_SKILLS with doctor's `skillLinkState`, skipping NEW_CLAUDE_SKILLS on Windows as doctor does. So a newly shipped rule or skill is caught.
- pi reads one installed copy: the rulings file. When buildBlock returns rulings text and `linkOk(<agentDir>/nana-rulings.md, <ext dir>/../rules/nana-rulings.md)` is false, the extension sets its own stale section key. RULINGS_SECTION is never altered.
- One wording for both seats: `staleNotice(labels)` with doctor's labels and the command `node "<pkgRoot>/bin/nana-setup.mjs" install`. That command works with or without nana-setup on PATH. The prefixes and the section key live in `lib/stale-copies-config.mjs`.
- Rejected: an `@`-import stub in the rules folder (unprobed, misses skills and pi). Also rejected: a bounded target read (linkOk already refuses non-regular files before reading; nothing pins a bound).

## Must-meet
| Row | Text | Test (file::title) | Red today |
|---|---|---|---|
| R-1600 | WHEN the adoption hook runs and doctor would mark ✗ any rule or skill row that nana-setup installs for Claude Code, other than the private rule, THEN the adoption hook shall print exactly one line that starts with the stale prefix and names this checkout's nana-setup install command. | packages/nana-setup/tests/stale-copies.test.mjs::R-1600: a missing, misdirected or changed rule or skill puts one stale line in the adoption hook output | RED. Probe on main 6b3e432, temp HOME: a POSIX install with one rule link removed, one pointed elsewhere and one replaced by a byte-equal file. The installed hook printed nothing, exit 0. A win32-simulated install with changed standards, rulings and SKILL.md copies: the hook printed nothing. |
| R-1601 | WHEN the adoption hook runs and doctor would mark every such rule and skill row ✓ or as a note, THEN the adoption hook shall print no line that starts with the stale prefix or the stale-check unavailable prefix. | stale-copies.test.mjs::R-1601: a current install adds no stale or unavailable line to the adoption hook output | GREEN today. Guards an always-print mutation and a checker that crashes on a healthy install. |
| R-1602 | The adoption hook's stale line shall name exactly the rule and skill rows, other than the private rule, that doctor marks ✗ for the same home on the same platform, each by its doctor label. | stale-copies.test.mjs::R-1602: the stale line names exactly the rule and skill rows doctor marks failed | RED. In the same probes, in-process diagnose() failed 3 POSIX rule rows and 3 win32 rule and skill rows; the hook named none. |
| R-1603 | IF the stale-copies checker fails to start, is ended by a signal or exits nonzero, THEN the stale-copies launcher shall write only one line, which starts with the stale-check unavailable prefix. | stale-copies.test.mjs::R-1603: a failed stale-copies checker writes only the unavailable line | RED. `hookProducerConfig("stale-copies", …)` throws "Unknown hook producer". |
| R-1604 | WHEN a pi session starts and the nana-rulings extension injects nana-rulings.md as rulings text while doctor would mark the pi nana-rulings.md row ✗, THEN the extension shall set the stale section to one line that starts with the stale prefix and names pi nana-rulings.md and this checkout's nana-setup install command. | stale-copies.test.mjs::R-1604: a rulings copy doctor marks failed sets one stale line in its own section | RED. Probe: the extension's handlers over a win32-simulated changed copy set only the `nana-rulings` key. Diagnose failed the pi nana-rulings.md row. |
| R-1605 | WHEN a pi session starts and doctor would mark the pi nana-rulings.md row ✓, THEN the nana-rulings extension shall leave the stale section unset. | stale-copies.test.mjs::R-1605: a rulings copy doctor marks current sets no stale section | GREEN today. Guards an always-stale mutation. |

"Stale section" means the system-prompt section key in stale-copies-config.mjs.

Fixtures (per platform, one fresh install and one broken install with several faults at once; doctor = in-process `diagnose(resolveLayout({ home }))` under `withPiStub`):
- POSIX (skips on Windows: install makes copies there, so a link state cannot exist): the broken install has nana-seat.md removed, nana-soul.md pointed elsewhere, and nana-writing.md and the pi rulings file replaced by byte-equal regular files. The requirements skill link points elsewhere. The hook run is the installed link.
- win32 (native on Windows; NANA_SETUP_PLATFORM=win32 elsewhere): the broken install has a changed standards copy, a deleted seat copy, a changed requirements SKILL.md and a changed pi rulings copy. The hook run is the checkout's file.
- Hook children get HOME and USERPROFILE set to the temp home, CLAUDE_PROJECT_DIR set to a temp project, and PI_CODING_AGENT_DIR removed.

## Known limits
- The line reaches the agent as SessionStart context or a system-prompt section. The user sees it only if the agent relays it. Nothing pins that it does.
- No hook-file or settings check: a hook added after the last install stays unwired with no line.
- The check reads the default `~/.claude`. A machine installed with `--claude-home` elsewhere gets a false line every session.
- If pi loads the pack from a clone other than the setup checkout, the pi line appears every session, and install alone does not clear it. Doctor's package-source row names that fix.
- A POSIX byte-equal regular file counts as stale, matching doctor, though its text is current today.
- pi worker and reviewer children carry the stale section too.
- The install check does not read the new lines. R-1601 on the native Windows leg is the only native proof, and that leg is non-blocking until win-leg-flip lands.
- No test pins the hook's wall time or a live session; the builder reports the measured time.