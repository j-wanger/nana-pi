# writing-adoption · plan attack (adversary, main 6684365d)

Verdict: six MUST findings. Four come from D3, and two come from must-meet tests that pass vacuously. Probes ran in a `git archive` copy at `wa-adv/repo` with temporary homes.

Confirmed red on main: M1 (exit 126, no `PATH nana-writing` row), M3 (false still injects), M6 (unit 3977 = 0xD83D), M8 (4 over-cap sentences). M2 is provable on macOS: a forced-win32 install (`NANA_SETUP_PLATFORM=win32`) writes four shim pairs and no `nana-writing` pair. The facts section cites 28dae7c4. Main now has 32 of 2,731 over cap in the whole file, and still 4 in live sections.

## MUST

**MUST-1 · D3 makes the stale-copy line fire at every session start.** `bin/stale-copies.mjs:43-44` loops over `CLAUDE_RULES`. Probe: with the key false and the link removed, `nana-adoption.mjs` prints `INSTALL STALE: rule nana-writing.md — … fix it with … install`. Install with the key false never re-links, so the line never clears. That breaks R-1763 and R-1764. The plan omits `stale-copies.mjs`. Fix: the producer uses the shared reader (MUST-6). Add two fixtures on both platforms to `stale-copies.test.mjs`. `writing-off-linked` goes under R-1761, and the line names the rule. `writing-off` goes under R-1764, and the hook prints no line.

**MUST-2 · "Byte-equal win32 copy" is the wrong ownership test.** Probe: forced-win32 install, then a line added to the pack rule. Result: `byte-equal: false | copy record unedited: true`. This lane edits the rule (D6), so every existing Windows copy is in that state at land. With the key false, the old copy stays and Claude Code keeps loading it. The established ownership test is R-2310's "bytes install last wrote there". Fix: remove a copy that equals the source or that `copyRecord.unedited` accepts.

**MUST-3 · M8 passes on main with an exact-heading slicer.** The heading is `## Open for Owner (each ask: …)`. Probe: prefix matching finds 3 sections and 4 over-cap sentences. Exact matching finds 2 sections and 0. After the rewrite, both go green, so the wrong slicer survives. The owner-name scrub can cause the same silent pass, because `isNamed` is internal to `nana-frontier.mjs:82-86`. Fix: R-2505 below.

**MUST-4 · M5's doctor half passes with a doctor that reads only the key.** That doctor shows "off" while the own link remains and Claude Code still loads the rule. Fix: R-2502 marks ✗ while the own link or copy remains. Install's dry-run row keeps the label `rule nana-writing.md`, so the fix line counts it (`nana-setup.mjs:383-385`). This also clears MUST-1 after one install. With the key absent or true, doctor adds no note row. `install-check.mjs:494` fails on any note outside `DOCTOR_NOTES`.

**MUST-5 · D3 falsifies two rows the plan leaves alone.** R-301 and R-350 install nana-writing.md with no condition. Fix: amended texts below.

**MUST-6 · Nothing pins that both runtimes give one on/off answer.** nana-setup reads `nana-pack.json` with no schema (`doctor.mjs:311-322`). A falsy check reads 0, null and "" as off, but the pack's `bool` leaf reads them as on. `JSON.parse` on UTF-8 text throws on the UTF-16LE file that PowerShell 5.1 writes (R-2231 precedent). Probe: `parseJsonBytes` decodes that file correctly. Fix: one pure `.mjs` reader over `json-text.mjs` for install, doctor and the stale producer. Keep it out of `config.ts`, because the producer has a 1,500 ms limit (R-2013). Add `writing.enabled` to the SCHEMA too. One variant table drives R-2500 and amended R-301.

## SHOULD

- **S1 · M1 wrong versions.** Install could chmod the checkout, which `nana-land` then refuses as dirty. The test could inherit a real PATH link. Doctor could check only that a link exists. Fix: R-2498 steps. Builder: `chmod +x` plus `git add`.
- **S2 · M2 passes when stdin is dropped.** `readStdin` returns "" on any error (`nana-writing.mjs:23-28`), and the CLI still prints a summary. Fix: assert exact counts and a finding line. Add stdin to R-1611's sh-shim test for Git Bash. Inferred: all three shells pass stdin through. Get scratch-CI Windows evidence before the land, since `nana-land` reads no CI.
- **S3 · M3 wrong versions.** A hardcoded `~/.pi/agent` path, a key read once, or an empty section. Fix: R-2500 steps, one subprocess per case.
- **S4 · Upgrade gap.** The rule names bare `nana-writing` right after a pull or land. The command exists only after install, and the stale line skips PATH rows. Fix: the rule says what to do when the command is missing. The land steps run install on the live machine.
- **S5 · M7 passes a regex.** "It is not required to run…" matches a phrase test. Fix: pin the whole Check section.
- **S6 · Missing files.** `stale-copies.mjs`; the R-080 matrix in `config-normalize.test.mjs`; label lists in `uninstall.test.mjs:298`, `restore.test.mjs:53`, `state-manifest.test.mjs:61-77`; the R-589 header regex at `install.test.mjs:58`; setup README lines 7, 43 and 58-61; an AGENTS.md line on the HANDOFF check.
- **S7 · M5 is compound and misses a decoy.** Split it into two rows. Keep an outside-repo symlink (R-353). An already-off rule reads unchanged, never skipped (R-1592).

## NOTE

- **N1 · D5 is safe for old installs.** `stateRows` is computed per run, not saved.
- **N2 · The pack `bin` entry does nothing.** No root bin or workspaces. Keep it only for R-311 parity.
- **N3 · The desk refuses `writing` on save.** It already refuses the seeded `objective` (`server.mjs:1385`). The desk is frozen, so record a residual.
- **N4 · In-flight lanes may go red.** A live-section line over 25 words fails after merging main. Say so in Next.
- **N5 · Code-point slicing gives 4,001 units.** R-2503's exact assertion kills it.
- **N6 · PowerShell 5.1 turns non-ASCII into `?`.** That stays a limit. A file argument avoids it.

## AMENDED must-meet rows

| ID | Requirement (EARS) | Test file::title | What it does |
|---|---|---|---|
| R-2498 | WHERE the platform is not win32, nana-setup shall link nana-writing on PATH to this checkout's executable checker, accept an identical link, and mark a missing or misdirected link ✗ in doctor. | `packages/nana-setup/tests/install.test.mjs::nana-writing is linked on PATH, runs by bare name, and doctor reads a missing or misdirected link ✗` | Source exec bit before and after install. PATH holds only the bin folder and node. A piped fixed text gives exact counts, `verdict=1/1` and one length line. Unlink: ✗. Retarget to `pi-review.mjs`: ✗. |
| R-2499 | WHERE the platform is win32, WHEN ASCII text is piped by bare name to `nana-writing --report` from cmd.exe or Windows PowerShell, the installed `.cmd` shim shall hand that text to the checker unchanged. | `packages/nana-setup/tests/win-shims.test.mjs::Windows: text piped by bare name to nana-writing --report reaches the checker from cmd.exe and PowerShell` | Windows leg. Temp-home install, PATH limited to the bin folder and node. Same exact counts through `cmd.exe /d /s /c` and `powershell -NoProfile`. |
| R-2500 | WHERE the nana-pack.json in pi's active agent dir sets writing.enabled to the boolean false, the writing extension shall leave the nana-writing prompt section unset. | `packages/nana-pack/tests/writing-injection.test.mjs::enabled: writing.enabled false in the active agent dir leaves the writing section unset` | `PI_CODING_AGENT_DIR` points elsewhere. False and UTF-16LE false read off. Absent, true, "false", 0, null, `writing:false`, invalid JSON and a stranded `~/.pi/agent` false read on. The key changes between two `session_start` events. |
| R-2501 | WHERE writing.enabled is the boolean false in pi's active agent dir nana-pack.json, nana-setup install shall remove the Claude Code writing rule only where it is install's own symlink into this checkout or, on win32, a copy whose bytes equal the source or the bytes install last wrote there. | `packages/nana-setup/tests/writing-rule.test.mjs::writing.enabled false: install removes only its own rule link or unedited copy` | Dry-run says "would remove", install removes it, a second run reads unchanged. A foreign file and an outside-repo link stay. Forced win32: a recorded older copy goes, an unrecorded edited copy stays. Key true again: restored, doctor ✓. |
| R-2502 | WHERE writing.enabled is the boolean false in pi's active agent dir nana-pack.json, doctor shall mark rule nana-writing.md ✗ while install's own link or unedited copy remains, and otherwise show it as a note that reads off. | `packages/nana-setup/tests/writing-rule.test.mjs::writing.enabled false: doctor reads a remaining own rule ✗ and an absent rule as an off note` | Linked: ✗, and the fix line counts it. After install: an off note, exit 0. Key absent: no new note. Plus MUST-1's two fixtures. |
| R-2503 | IF the writing block's cap falls between the two halves of a surrogate pair, THEN the injected block shall end immediately before that pair. | `packages/nana-pack/tests/writing-injection.test.mjs::cap: a rule cut between the two halves of a surrogate pair is injected ending before that pair` | 3,949 ASCII characters, U+1F600, then filler. Block equals heading + 3,949 `a` + notice, length ≤ cap. An ASCII rule keeps `keep` units. |
| R-2504 | The writing rule's Check section shall require a `nana-writing --report` run, by the bare command name, on every report before it is sent. | `packages/nana-setup/tests/writing-rule.test.mjs::the rule's Check section is the sealed check text` | Equals the contract text the test holds: a required pre-send run, fix or explain each finding, what to do if the command is missing. No `node ` and no `~/`. R-376 stays green. |
| R-2505 | WHEN the suite runs, it shall fail on any sentence over SENTENCE_CAP words or any banned word in this repository's HANDOFF.md sections that the frontier report's live-section names match. | `packages/nana-pack/tests/writing-check.test.mjs::this repository's HANDOFF.md live sections hold no over-cap sentence and no banned word` | Every live name is found, with its `(…)` suffix, and holds a sentence. Control: `## Open for Owner (x)` and a `###` under Next, with a 26-word sentence and the banned word, give 2 findings; under `## Landed` they give 0. Repo HANDOFF gives 0. |

Amend these existing rows:
- **R-006:** add writing.enabled. Evidence: `writing-injection.test.mjs::enabled: a trusted project's writing.enabled false leaves the rule injected`, plus `writing` as user-only in the R-080 matrix.
- **R-301:** "nana-writing.md, unless writing.enabled is the boolean false in pi's active agent dir nana-pack.json". Evidence: `install.test.mjs::rule nana-writing.md is linked for every writing.enabled value except the boolean false`.
- **R-350:** the same condition, on win32.
- **R-1610 and R-1615:** add nana-writing by its literal name.
- **R-589:** update the header regex to match the new outputs list.
