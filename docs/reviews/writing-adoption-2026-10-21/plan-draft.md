# writing-adoption · lane plan (draft)

Feature: FEAT-005 · Communicate decisions clearly (PATH rows in FEAT-013 · Install and connect harness runtimes)
Class: install, hook or gate (pi extension, nana-setup install and doctor). Threat model: honest variation in scope (astral characters in the rule, a key absent, true, false or malformed, a bin folder missing from PATH, cmd, PowerShell and Git Bash). Deliberate forgery is out.

## 1. What changes for the user

Every seat runs the checker by one name, `nana-writing`, on macOS and Windows, and the rule makes that run required before sending. The owner can turn the rule off for both runtimes with one user-scope key, and doctor stays green. nana-pi's HANDOFF live sections fail the suite on a long sentence or a banned word, and reports stay report-only.

## 2. Facts verified on main (28dae7c4)

- HANDOFF.md:18 queues the lane. after.md:57 lists the adoption, including "one `toWellFormed()` at the character cap". land-ruling.md:87-88 deferred the key to this verdict.
- design-ruling.md:113: "Switching to blocking is a requirement diff, not a flag." R-750 (REQUIREMENTS.md:380) seals exit 0, and nana-writing.mjs:51-52 does it.
- **Surrogate bug** (land-ruling.md:135): nana-writing.ts:134-139 cuts `full.slice(0, keep)` in UTF-16 units, with keep 3978. Probed: 3949 ASCII + U+1F600 leaves unit 3977 = 0xD83D, and `isWellFormed()` is false.
- display.mjs:57-60 `head` is the pack's pair-safe cut. The handoff-cap-surrogate lane (10-20) used it for R-2160 and listed `.toWellFormed()` as wrong version W2.
- **Key ignored:** config.ts:239-247 has no `writing` block, and normalizeRaw (:269) reads only those blocks. Probed: `writing.enabled: false` still injects, with no journal line.
- nana-objective.ts:71-72 and :85 show the enabled check. config.ts:571-583 merges `objective` from user scope only.
- **PATH:** steps.mjs:800-806 links four commands. doctor.mjs:634 and :655-660 and state-manifest.mjs:64-65 repeat the list, and uninstall reads the manifest (uninstall.mjs:22). Probed dry-run: no `PATH nana-writing` row.
- **Not executable:** bin/nana-writing.mjs is git mode 100644. Probed: a link run by bare name exits 126. package.json:7-13 declares no `nana-writing` bin.
- No shim test pipes stdin through a `.cmd` (win-shims.test.mjs:89-161).
- rule:41-43 names `node ~/nana-pi/...` and says "It does not block." Inferred: cmd.exe does not expand `~`.
- steps.mjs:65,72 link the Claude rule. Probed: dry-run with the key false still reads "would link".
- HANDOFF.md: 31 of 2,701 sentences over cap, 0 banned. Four sit in Open for the owner (lines 40, 43, 45, 49). frontier-config.mjs:17 holds LIVE_SECTION_NAMES.
- nana-land.mjs:103-105 refuses on a failed suite. frontier.test.mjs:281 (R-2473) is a suite check over this repo's HANDOFF.
- install-check-config.mjs:65 needs `<nana-writing>` in the prompt, so the default must stay on.

## 3. Design choices

**D1 · Blocking per surface.** Default: `live`.
| Surface | Options | Recommendation |
|---|---|---|
| Report to the owner (both runtimes) | (a) mandatory run, no block; (b) Claude Code Stop hook block; (c) pi `agent_end` notice | (a). A Stop hook was rejected on 10-04: it fires every turn and parses a transcript we do not own. The rule alone reached 14/16 verdict-first. |
| HANDOFF.md | (a) report; (b) block banned words; (c) suite check: block over-cap or banned sentences in the three live sections; (d) nana-land checks added lines | (c). R-750 stays, and the block lives in a test, as R-2473 does. (b) guards a count that is 0 in 835 messages. (d) changes a land tool. |
| Reviews, briefs, worker reports, commits | none | Out of scope: technical records (rule:3-5). |

**D2 · Key home.** Options: user plus project; user only; an environment variable. Recommendation: `writing: { enabled }` in `<agent dir>/nana-pack.json`, user scope only, default `true`. A repo cannot silence it, the same rule as the objective. A malformed value reads as on. Default: `user`.

**D3 · Does the key reach Claude Code?** Options: (a) pi only, with a recorded limit; (b) install and doctor honor it. Recommendation: (b). Otherwise a deleted Claude link makes doctor ✗ and install re-links it, the breakage the key fixes for pi. Install removes only its own link or byte-equal win32 copy. This is the largest scope item; (a) is the smaller fallback. Default: `both`.

**D4 · The cut fix.** Options: `.toWellFormed()` (U+FFFD for the half); `head` (ends before the pair). Recommendation: `head`, matching R-2160. This departs from HANDOFF's wording, and the plan says so. Default: `head`.

**D5 · PATH list.** Recommendation: one exported `PATH_COMMANDS` for stepPath, doctor and the manifest. Tests still name `nana-writing` literally. Set mode 100755 and add a pack `bin` entry. Default: `one-list`.

**D6 · Rule wording.** Name only `nana-writing --report`, since doctor catches a missing link. Add "Fix each finding or say why it stays." R-376 must stay green. Default: `bare-name`.

## 4. Must-meet rows

IDs start at the next free ID (R-2487 today). R-1610 and R-1615 gain nana-writing.

| # | Requirement (EARS) | Test file::title | What it does | Red on main |
|---|---|---|---|---|
| M1 | WHERE the platform is not win32, the installer and doctor shall link nana-writing on PATH to this checkout's executable checker and report its link state. | `packages/nana-setup/tests/install.test.mjs::nana-writing is linked on PATH, runs by bare name, and doctor reports its link state` | Temp-home install. Pipes `DONE. It works.` to bare `nana-writing --report`: exit 0, `verdict=1/1`. Removes the link: doctor ✗. | No PATH row; a link alone exits 126 (both probed). |
| M2 | WHERE the platform is win32, WHEN text is piped to `nana-writing --report` through the installed `.cmd` shim, the checker shall receive that text and print its summary line. | `packages/nana-setup/tests/win-shims.test.mjs::Windows: text piped to nana-writing --report through the installed .cmd shim reaches the checker` | Temp-home install, then a pipe through cmd.exe. Windows leg only. | No shim written (steps.mjs:801-806). Inferred; not run here. |
| M3 | WHERE the user-scope nana-pack.json sets writing.enabled to false, the writing extension shall add no writing section to the system prompt. | `packages/nana-pack/tests/writing-injection.test.mjs::enabled: user-scope writing.enabled false injects no writing section` | Temp HOME config, then both events. | Injected (probed). |
| M4 | IF a nana-trusted project's .pi/nana-pack.json sets writing.enabled to false, THEN the writing extension shall still inject the rule. | same file `::enabled: a trusted project's writing.enabled false leaves the rule injected` | Trusted project sets false. | Green today. It kills a user-plus-project merge. |
| M5 | WHERE writing.enabled is false in the user-scope nana-pack.json, nana-setup shall leave the Claude Code writing rule unlinked, with install removing only its own link and doctor reporting the rule off. | `packages/nana-setup/tests/writing-rule.test.mjs::writing.enabled false: install removes its own Claude Code rule link and doctor reads the rule as off` | Install, flip the key, install again. A foreign file stays. Doctor exits 0. | "would link" (probed). D3(a) drops it. |
| M6 | IF the writing block's cap falls between the two halves of a surrogate pair, THEN the injected block shall end immediately before that pair. | `writing-injection.test.mjs::cap: a rule cut between the two halves of a surrogate pair is injected ending before that pair` | 3949 ASCII + U+1F600 + text. Also asserts an ASCII rule keeps `keep` units, which kills "keep − 1 always". | 0xD83D at unit 3977 (probed). |
| M7 | The writing rule shall require a `nana-writing --report` run on every report before it is sent. | `packages/nana-setup/tests/writing-rule.test.mjs::the rule makes the pre-send run required and names the nana-writing PATH command` | Reads the shipped rule. R-376 is the partner check. | rule:41-43. |
| M8 | WHEN the suite runs, it shall fail if a sentence in this repository's HANDOFF.md live sections exceeds SENTENCE_CAP words or holds a banned word. | `packages/nana-pack/tests/writing-check.test.mjs::this repository's HANDOFF.md live sections hold no over-cap sentence and no banned word` | Slices by LIVE_SECTION_NAMES, runs checkText. | Four over-cap sentences; the lane rewrites them. D1(a) drops it. |

## 5. Tunables, ladder, limits, files

**Tunables.** None new. The name `nana-writing` is a contract (M1, M7). The default `true` is a contract: the owner's adopt ruling, 2026-10-21. SENTENCE_CAP, BANNED_WORDS, WRITING_INJECT_CAP and LIVE_SECTION_NAMES are reused by name, sealed by their own rows.

**Ladder.** Roster reviewer, land reviewer, wrong-code pairs, one independent check. Run the macOS install check before nana-land. M2 needs the Windows leg.

**Known limits.**
- The report run stays an instruction. stop-count.mjs is only a proxy.
- M8 covers nana-pi's live sections only. The archive sections keep 26 over-cap sentences.
- Inferred: Windows PowerShell 5.1 pipes non-ASCII as `?`, which ends a sentence, so dashed sentences may be under-counted.
- Reviewer and worker sessions still carry the block; the `hasUI` question stays open.
- `--help` is still read as a path.
- The queued owner-name scrub renames "Writing for the owner" and "Open for the owner", which LIVE_SECTION_NAMES reads. Land this lane first.

**Files.** Pack: bin/nana-writing.mjs (mode), package.json, extensions/nana-writing.ts, lib/config.ts, rules/nana-writing.md, README.md (:365-377, :593-594), two tests. Setup: lib/steps.mjs, lib/doctor.mjs, lib/state-manifest.mjs, README.md, six tests. Also AGENTS.md:20, REQUIREMENTS.md, docs/requirements-tree.md, the code map, and HANDOFF.md.
