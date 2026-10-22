# writing-adoption · must-meet (seat and plan adversary, 2026-10-21)

Feature: FEAT-005 · Communicate decisions clearly (PATH rows in FEAT-013 · Install and connect harness runtimes)

Class: install, hook or gate (a pi extension, nana-setup install and doctor). Threat model: honest variation in scope — astral characters in the rule; the key absent, true, false, malformed or in a UTF-16LE file Windows PowerShell 5.1 wrote; pi's agent dir moved by `PI_CODING_AGENT_DIR`; the bin folder missing from PATH; cmd, Windows PowerShell and Git Bash on Windows; an existing install upgraded; uninstall. Deliberate forgery out (a crafted PATH entry, a forged shim, editing the sealed rule text to hide a finding).

The owner adopted the writing rule on 2026-10-21 after its trial (`docs/reviews/writing-trial-2026-10-04/after.md:57`): a PATH link for the checker, the pre-send check made mandatory in the rule, blocking decided per surface, a `writing.enabled` key, and one fix at the character cap. The planner's draft and the plan adversary's attack are the inputs; this file is the plan of record.

## What changes for the user

Every seat runs the checker by one name, `nana-writing`, on macOS and Windows, and the rule makes that run required before a report goes out. The owner can turn pi's writing section off with one user-scope key. nana-pi's own HANDOFF live sections fail the suite on a long sentence or a banned word; reports stay report-only.

## Seat decisions (not the owner's call; each is reversible)

- **D1 · Blocking per surface: `live`.** Reports to the owner: the rule makes the run required; nothing blocks (a Stop hook was rejected on 2026-10-04: it fires every turn and parses a transcript nana does not own). HANDOFF.md: a suite check fails on an over-cap or banned sentence in the live sections (R-2503), as R-2473 already checks this repo's HANDOFF; R-750 (the checker exits 0) stays. Reviews, briefs, worker reports and commits: out of scope, technical records.
- **D2 · Key home: `user`.** `writing: { enabled }` in the active agent dir's `nana-pack.json`, user scope only, default `true`. A project cannot silence it, as with the objective (R-006).
- **D3 · The key reaches pi only: `pi`.** The draft recommended that the key also stop nana-setup linking the Claude Code rule. The adversary showed what that costs (MUST-1, 2, 4, 5, 6 in `plan-attack.md`): the stale-copies producer would print a line at every session that install never clears; a Windows copy needs R-2310's copy-record ownership test, not byte equality; doctor needs a ✗ state while install's own link remains; R-301 and R-350 become false; nana-setup would need its own reader that agrees with the pack's on every value and on UTF-16LE. That is a second feature. This lane keeps the key to pi; Claude Code keeps its linked rule, recorded as a known limit. A later lane can extend it.
- **D4 · The cut fix: `head`.** The pack's pair-safe `head` (`lib/display.mjs:57-60`) ends the block before a split pair. The handoff-cap-surrogate lane (2026-10-20) used it for R-2160 and listed `.toWellFormed()` as a wrong version. This departs from the ruling's wording, which named `toWellFormed()`; the effect the ruling wanted, no lone surrogate in the prompt, is the same.
- **D5 · One PATH list.** One exported `PATH_COMMANDS` list feeds install's PATH step, doctor and the state manifest (today four copies). The manifest is computed per run, so older installs are unaffected (attack N1). No pack `bin` entry: nothing reads it (attack N2).
- **D6 · The rule names the bare command.** Doctor catches a missing link; the rule says what to do when the shell cannot find the command.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2498 | WHERE the platform is not win32, nana-setup shall link nana-writing on PATH to this checkout's executable checker, accept an identical link, and mark a missing or misdirected link ✗ in doctor. | `packages/nana-setup/tests/install.test.mjs::nana-writing is linked on PATH, runs by bare name, and doctor reads a missing or misdirected link ✗` |
| R-2499 | WHERE the platform is win32, WHEN ASCII text is piped by bare name to `nana-writing --report` from cmd.exe or Windows PowerShell, the installed `.cmd` shim shall hand that text to the checker unchanged. | `packages/nana-setup/tests/win-shims.test.mjs::Windows: text piped by bare name to nana-writing --report reaches the checker from cmd.exe and PowerShell` |
| R-2500 | WHERE the nana-pack.json in pi's active agent dir sets writing.enabled to the boolean false, the writing extension shall leave the nana-writing prompt section unset. | `packages/nana-pack/tests/writing-injection.test.mjs::enabled: writing.enabled false in the active agent dir leaves the writing section unset` |
| R-2501 | IF the writing block's cap falls between the two halves of a surrogate pair, THEN the injected block shall end immediately before that pair. | `packages/nana-pack/tests/writing-injection.test.mjs::cap: a rule cut between the two halves of a surrogate pair is injected ending before that pair` |
| R-2502 | The writing rule's Check section shall require a `nana-writing --report` run, by the bare command name, on every report before it is sent. | `packages/nana-setup/tests/writing-rule.test.mjs::the rule's Check section is the sealed check text` |
| R-2503 | WHEN the suite runs, it shall fail on any sentence over SENTENCE_CAP words or any banned word in this repository's HANDOFF.md sections that the frontier report's live-section names match. | `packages/nana-pack/tests/writing-check.test.mjs::this repository's HANDOFF.md live sections hold no over-cap sentence and no banned word` |

### What each test does, and why it is red on main

- **R-2498.** Asserts the source checker's exec bit (git mode 100755) before and after install, so an install that chmods the checkout (which nana-land then refuses as dirty) fails. Temp-home install; the child PATH holds only the install's bin folder and node's folder, never the real PATH. Pipes a fixed text to bare `nana-writing --report`: exit 0, the exact summary counts, `verdict=1/1` and exactly one length line. Removes the link: doctor ✗. Retargets it to `pi-review.mjs`: doctor ✗. Red on main: install writes no `PATH nana-writing` row, and a link to the 100644 file exits 126 (planner and adversary, both probed).
- **R-2499.** Windows leg only (SKIP elsewhere, with a reason). Temp-home install, PATH limited as above. Pipes the same fixed text through `cmd.exe /d /s /c` and through `powershell -NoProfile -Command`; each gives the same exact counts and the one length line, so a shim that drops stdin (the CLI reads "" on any stdin error and still prints a summary) fails. Red on main: a forced-win32 install writes no nana-writing shims (adversary, `NANA_SETUP_PLATFORM=win32`). R-1611's sh-shim test also gains a stdin case for Git Bash.
- **R-2500.** One subprocess per case. `PI_CODING_AGENT_DIR` points away from `~/.pi/agent`. Off: the boolean false, and the boolean false in a UTF-16LE file with a BOM. On: absent, true, the string "false", 0, null, `writing: false`, invalid JSON, and a stranded `~/.pi/agent/nana-pack.json` that says false. The key changes between two `session_start` events and the second reading follows it. Red on main: the config has no `writing` block, so false still injects, with no journal line (probed). R-006 is amended to add `writing.enabled`, with evidence `writing-injection.test.mjs::enabled: a trusted project's writing.enabled false leaves the rule injected`, and the R-080 matrix in `config-normalize.test.mjs` lists `writing` as user-only.
- **R-2501.** A rule of 3,949 ASCII characters, then U+1F600, then filler. The block equals the heading plus 3,949 `a` plus the cap notice, its length is at most the cap, and `isWellFormed()` holds. An ASCII rule keeps all `keep` units, which kills "always cut one unit early"; the exact equality kills a code-point cut, which gives 4,001 units (attack N5). Red on main: unit 3977 is 0xD83D (probed).
- **R-2502.** The test holds the sealed Check text below and asserts the rule's `## Check` section equals it, and that the rule names no `node ` and no `~/`. R-376 (the rule passes its own checker) stays green. Red on main: the section names `node ~/nana-pi/...` and says "It does not block."
- **R-2503.** Slices the repo's HANDOFF.md by LIVE_SECTION_NAMES, matching a heading that starts with the name and may carry a `(…)` suffix, and runs checkText on each. Asserts every live name is found and holds a sentence, so a renamed heading fails loudly. Control fixture: `## Open for Owner (x)` and a `###` under `## Next`, each holding a 26-word sentence and the banned word, give the expected findings; the same lines under `## Landed` give none. This kills an exact-heading slicer, which finds two sections and passes on main (adversary MUST-3, probed). Red on main: four over-cap sentences in Open for the owner; the seat rewrote them in this lane before build 1.

### The sealed Check text (R-2502)

```
## Check

Before you send a report, run `nana-writing --report` on its text.
You must run it every time. Fix each finding, or say in the report why it stays.
After you edit `HANDOFF.md`, run `nana-writing HANDOFF.md`.
If your shell cannot find `nana-writing`, run `nana-setup install`, then run the check.
```

### Existing rows this lane changes

- R-006: add `writing.enabled` (see R-2500).
- R-1610 and R-1615: add nana-writing by its literal name to the list of PATH commands.
- R-589's test: its header regex follows the new outputs list.
- R-376: unchanged, stays green against the new text.

## Tunables

None new. The command name `nana-writing` is a contract (R-2498, R-2502). The default `true` is a contract: the owner's adopt ruling, 2026-10-21. SENTENCE_CAP, BANNED_WORDS, WRITING_INJECT_CAP and LIVE_SECTION_NAMES are read by name, sealed by their own rows.

## Known limits (carried to HANDOFF)

- The report run stays an instruction. Nothing checks that a seat ran it before sending.
- The key reaches pi only (D3). With `writing.enabled` false, Claude Code still loads its linked rule.
- R-2503 covers nana-pi's live sections only; the archive sections keep their over-cap sentences. A lane in flight whose HANDOFF live lines run long goes red once it merges main.
- Windows PowerShell 5.1 pipes non-ASCII text as `?`, which can end a sentence early and under-count long ones (inferred). A file argument avoids it.
- Right after a pull or a land, the rule names a command that exists only once install runs; the rule says to run install, and the seat runs install on its machine after this lane lands.
- The frozen desk refuses to save a `nana-pack.json` holding `writing`, as it already refuses `objective`.
- `--help` is still read as a path.

## Files

Pack: `bin/nana-writing.mjs` (mode 100755), `extensions/nana-writing.ts`, `lib/config.ts`, `rules/nana-writing.md` (the Check section only), `README.md`, `tests/writing-injection.test.mjs`, `tests/writing-check.test.mjs`, `tests/config-normalize.test.mjs`. Setup: `lib/steps.mjs`, `lib/doctor.mjs`, `lib/state-manifest.mjs`, `README.md`, `tests/install.test.mjs`, `tests/win-shims.test.mjs`, `tests/win32-degrade.test.mjs`, `tests/writing-rule.test.mjs`, and the label lists in `tests/uninstall.test.mjs`, `tests/restore.test.mjs`, `tests/state-manifest.test.mjs`. Also `AGENTS.md` (one line in nana-pi's own section on the HANDOFF check), `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`. Seat: `HANDOFF.md`, `docs/sessions/2026-10.md`.

## Seat steps

- Build with the larger builder: `pi-worker --lane writing-adoption --lane-size larger`, three sessions, a failure watcher and a heartbeat at launch.
- After session 2, push the branch and open a draft PR so the Windows leg runs R-2499.
- Wrong-code pairs on the shared runner, one or more per row; one independent check; the macOS install check before the land.
- Reviews: Opus as the final reviewer (the builder is the GPT lineage) and astra as the land reviewer, on the exact tip.
- After the land: push main, run `nana-setup install` on this machine, then re-stub the verifier-pipe hook (the owner's standing 2026-10-19 instruction).
