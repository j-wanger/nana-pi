# rulings-file — must-meet (R-1410 to R-1418), adversary-amended

**Feature.** After `nana-setup install`, every new Claude Code or pi session on the machine (seat, builder or reviewer) starts with nana's standing rulings in its context. They come from one dated file in nana-pi that names no owner and no model. A pi session whose installed copy is unusable gets a one-line marker instead.

**Class.** install + hook: nana-setup install and doctor change, and a pi extension is added.

**Threat model.** In scope is honest variation:
- POSIX links versus Windows copies;
- `PI_CODING_AGENT_DIR` pointing to another folder;
- a pull with no install re-run;
- a stale or empty Windows copy;
- a hand-edited copy that is oversized, not UTF-8, a directory or a FIFO;
- every `session_start` reason;
- ordinary growth of the file.

Out of scope is a deliberately hostile rulings file. It is the owner's text, injected as-is, like the writing rule.

**Design.**
- One copy: `packages/nana-pack/rules/nana-rulings.md`. It holds a heading, one scope sentence, then one dated bullet per ruling (Seed below).
- Claude Code: a fifth `CLAUDE_RULES` entry, with `ruleSource` pointing to the pack rules dir. Install, doctor and uninstall follow through `CLAUDE_RULES` and the state manifest (precedent b1a7648). No hook and no settings.json entry.
- pi: install also links the file (copies it on win32) into pi's active agent dir, per the owner's ruling "install to user level .pi folder".
  - The new `extensions/nana-rulings.ts` reads `<piAgentDir()>/nana-rulings.md` on every `session_start` reason. It uses `readBounded(file, RULINGS_READ_CAP)` from `lib/bounded-read.mjs`, then fatal UTF-8.
  - At `before_agent_start` it sets the section `nana-rulings`.
  - It has no config, no journal and no NANA_ROLE gate.
- Subtraction: `prompt-sections.mjs` is unchanged. `orderNanaSections` leaves a non-nana key in place, and R-641 stays true.
- Scope sentence: builders and reviewers in both runtimes receive the file. So it opens with one sentence telling them to act only within their brief (precedent R-1141).
- Repo scope: Claude rules load in every project, so a ruling that binds one repo starts with "In nana-pi,".
- `lib/rulings-config.mjs` holds:
  - RULINGS_FILE (contract R-1412);
  - RULINGS_READ_CAP 8192 (chosen: 3.4 times the 2,392-byte seed, about 2k tokens);
  - RULINGS_HEADING, RULINGS_SECTION and RULINGS_UNAVAILABLE.
  - nana-setup imports RULINGS_FILE by name.
- Rejected: pi reading the pack file directly, as nana-writing does. It would drop R-1412 and R-1414, but it contradicts the owner's install ruling.
- All rows go in FEAT-001.

**Must-meet tests.** RT is `packages/nana-pack/tests/rulings.test.mjs`. IT is `packages/nana-setup/tests/rulings-install.test.mjs`.

| Row | Test (file::title) | Red today |
|---|---|---|
| R-1410 | RT::an installed rulings file reaches the nana-rulings section on every session_start reason | No extension exists, so the import fails. |
| R-1411 | RT::a missing, empty, directory, FIFO, over-cap or invalid-UTF-8 rulings file yields the one-line unavailable marker, never a throw or a hang | Same. |
| R-1412 | IT::install places nana-rulings.md in the pi agent dir (link on POSIX, byte-equal copy on win32) | Probe A. |
| R-1413 | IT::install places nana-rulings.md in the Claude rules folder (link on POSIX, byte-equal copy on win32) | Probe A. |
| R-1414 | IT::doctor marks pi nana-rulings.md ✗ when missing, a POSIX copy or a stale win32 copy, and ✓ after install | Probe B. |
| R-1415 | RT::the rulings file names no owner and no work project | The file is absent. The test requires it with at least one bullet. |
| R-1416 | RT::every ruling is one bullet that opens with its date | The file is absent. |
| R-1417 | RT::the rulings file names no model, leaving the lineup to the roster | The file is absent. The test requires it. |
| R-1418 | RT::the rulings file opens with the scope sentence for builders and reviewers | The file is absent. |

Seal: RT::seal: RULINGS_READ_CAP is 8192 (req R-1411).

**Test notes.**
- R-1410 sets PI_CODING_AGENT_DIR to a temp dir outside HOME. It edits the file between reasons. It also injects the shipped file whole, so growth past the cap fails at the land that causes it.
- R-1411: a file of exactly the cap injects, and cap+1 gets the marker. No fixture text leaks. The FIFO case runs in a subprocess under a time limit.
- R-1412 runs `install --home H --pi-home P`, with P outside H/.pi/agent.
- R-1415 and R-1417 match whole words in any case.
- R-1415's list holds only words the tracked tree already has (Owner, the owner, the work project, work-project).
- R-1417's words are each ROSTER_DEFAULTS model id, its last hyphen part (luna, sol, astra), and CLAUDE_CODE_SUBAGENT_MODELS.

**Red-today probes (adversary, 2026-10-19, temp HOME, repo untouched).**
- A: `install --home H --pi-home P` exits 0. There is no nana-rulings.md in P or in H/.claude/rules, which holds four links plus nana-personal.md.
- B: `doctor` there under NANA_SETUP_PLATFORM=win32 prints no rulings row.
- C: readBounded at 8192 on each case gave: missing ENOENT; directory EISDIR; FIFO ERR_NOT_REGULAR (0 ms); exact cap OK; cap+1 ERR_TOO_LARGE; invalid UTF-8 a decode error; BOM OK; dangling link ENOENT.
- D: the Seed is 2,392 bytes, with 19 dated bullets, no identity word and no model word.

**Platforms.** All tests run on all three platforms. The FIFO case skips on win32, which has no mkfifo. Link shapes run on POSIX. Win32 copy shapes run everywhere through NANA_SETUP_PLATFORM=win32, and natively on the Windows leg.

**Known limits.**
1. No test proves a live session loads the rule or the section. Claude subagents do load user rules (verified: this planner is one).
2. Each machine needs one install after the pull.
3. A Windows copy stays stale until the next install, and doctor shows it.
4. Every child and subagent carries about 600 more tokens.
5. No test pins how a model reads the scope sentence.
6. The word lists are short lists, not proofs. The wording and scope of each ruling are the seat's reading of memory.
7. Done in build 2: the AGENTS runtime table (`templates/_shared/working-under-nana-pi.md`, mirrored in `AGENTS.md`) names `nana-rulings.md` / the `nana-rulings` extension in the Writing rule / rulings column, closing R-680/R-985's existing-check demand rather than deferring it.
8. After the land, the seat points memory at the file.
9. Uninstall still refuses on Windows.
10. On POSIX the agent-dir link points into the checkout, so an edit through it changes the checkout.

**Seed.** The seat re-checks it against memory and the owner's power-mode answer before the build. The builder then copies it byte for byte.
```markdown
# Nana — Standing rulings

These rulings guide the seat, the session that plans lanes and launches builders and reviewers; a builder or reviewer acts only within its brief and reads them as background.

- 2026-09-16: Each session says which objective or current-priority line its spend serves, or proposes updating them.
- 2026-09-18: Memory has two tiers: shared rules for every project, and project facts in the project. Start a session in the product's own folder.
- 2026-10-09: Builder sessions get no automatic knowledge pull.
- 2026-10-10: An independent reviewer accepts every revision that reaches main. Nobody commits to main directly. Notes go in before the final round, and nothing is written after a land.
- 2026-10-10: rm runs freely only inside the working directory.
- 2026-10-10: In nana-pi, Windows testing is required.
- 2026-10-10: In nana-pi, the desk stays frozen until the owner reopens it.
- 2026-10-11: Every plan names its threat model: honest variation in scope, deliberate forgery out.
- 2026-10-11: After every reviewer says LAND, nothing more is edited. Urgent fixes ship alone and are hardened later.
- 2026-10-11: In nana-pi, push main right after each reviewed land. Pushing another branch or opening a draft PR needs no approval.
- 2026-10-12: In nana-pi, a setup or hook lane runs the install check locally on macOS before the land.
- 2026-10-13: A review blocks only on a material problem. A confirmation round reviews only the change since the last round.
- 2026-10-13: A change to code with tests goes through the builder and reviewer pattern. The roster names the models, and the session-start line shows it.
- 2026-10-14: Turning a repo into a feature tree is core: lift, an approved regroup, then feature-oriented work.
- 2026-10-15: Every builder and long background run gets a failure watcher and a heartbeat at launch.
- 2026-10-16: The public repo carries no owner name and nothing about the owner's work.
- 2026-10-16: At most two lanes build and one more is planned. Each install, hook or gate lane gets one independent check. A blocking question carries a one-word default.
- 2026-10-16: Rulings live in this file. A new ruling lands in the reviewed change of the lane that records it, and removes any ruling it replaces.
- 2026-10-17: Development is feature-first. Plans get no review round; the seat and one adversary write each lane's must-meet tests.
```

## Rows the builder adds as `planned` first (seat, 2026-10-19)

- **R-1410** — WHEN a pi session starts for any reason and `nana-rulings.md` in pi's active agent dir is a non-empty regular UTF-8 file of at most RULINGS_READ_CAP bytes, THEN the nana-rulings extension shall put that file's whole text under `## Standing rulings (nana)` in the `nana-rulings` system-prompt section.
- **R-1411** — IF `nana-rulings.md` in pi's active agent dir is missing, empty, not a regular file, larger than RULINGS_READ_CAP bytes or not valid UTF-8, THEN the nana-rulings extension shall put in the `nana-rulings` section, instead of any file text, one line that starts with `RULINGS UNAVAILABLE:` and names the file and `nana-setup install`.
- **R-1412** — WHEN `nana-setup install` runs, THEN it shall place `nana-rulings.md` in pi's active agent dir as a symlink to `packages/nana-pack/rules/nana-rulings.md`, or as a byte-equal copy of it on win32.
- **R-1413** — WHEN `nana-setup install` runs, THEN it shall place `nana-rulings.md` in Claude Code's user rules folder as a symlink to `packages/nana-pack/rules/nana-rulings.md`, or as a byte-equal copy of it on win32.
- **R-1414** — WHEN `nana-setup doctor` runs, THEN it shall mark the row `pi nana-rulings.md` ✓ only when that file is a symlink to the pack's rulings file or, on win32, a byte-equal copy of it.
- **R-1415** — The rulings file `packages/nana-pack/rules/nana-rulings.md` shall contain none of the identity words its test lists, matched as whole words in any letter case.
- **R-1416** — The rulings file shall hold at least one bullet line and open every bullet line with a YYYY-MM-DD date followed by a colon.
- **R-1417** — The rulings file shall contain, as a whole word in any letter case, no model id from ROSTER_DEFAULTS, no last hyphen-separated part of such an id and no name from CLAUDE_CODE_SUBAGENT_MODELS.
- **R-1418** — The rulings file shall carry, between its heading and its first bullet, exactly one prose line: the scope sentence its test names, which tells a builder or reviewer to act only within its brief.
