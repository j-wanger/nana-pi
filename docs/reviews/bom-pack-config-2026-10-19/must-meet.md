# bom-pack-config — must-meet (R-1580 to R-1586)

Feature: FEAT-015 · Diagnose the active environment

**Feature.** doctor, install, `nana-setup project` and the adoption hook and producer read a nana-pack.json saved with one leading UTF-8 byte-order mark as the pack's own config reader does: one mark removed, then the same JSON. Text still invalid after that stays unparseable.

**Class.** Install + hook. doctor and install change behaviour; lib/adoption.mjs sits behind the Claude Code `nana-adoption` hook and pi's `nana-handoff` producer. The lane gets the seat's land reviewer, the seat's wrong-code pairs, one independent check, the mutation runner, and the macOS install check before nana-land.

**Threat model.** In scope: honest variation — a file saved by an editor or shell that writes a UTF-8 byte-order mark, LF or CRLF endings, `PI_CODING_AGENT_DIR` set elsewhere, malformed text. Windows PowerShell 5.1 `Set-Content -Encoding UTF8` is documented to write such a mark (not run here). Out of scope: a forged file.

**Design.**
- New `packages/nana-pack/lib/json-text.mjs`, six-tag header, effects none. `parseJsonText(text)` drops exactly one leading U+FEFF, then calls `JSON.parse`, and throws whatever it throws. This mirrors pi 1.0.2's `stripBom` (`utils/text.js`) and the pack's `lib/config.ts` reader.
- Three call sites switch to it; each keeps its own catch and fallback: `steps.mjs` `readPiPackConfig` (doctor, install's `stepPiConfig`, `project` seeding and `project --check`), `adoption.mjs` `adoptionSettings` (hook and producer), and `project.mjs` `checkProject`'s parse of `.pi/nana-pack.json`.
- One shared parser, not three inline strips, so the boundary test on doctor pins all three sites.
- Unchanged: doctor.mjs, the six existing inline strips, every settings.json reader, the frozen desk, every README.
- Rows go at the end of FEAT-015's table, after R-399.

**Must-meet tests.** DD = packages/nana-setup/tests/doctor-detail.test.mjs, IN = packages/nana-setup/tests/install.test.mjs, PJ = packages/nana-setup/tests/project.test.mjs, AR = packages/nana-pack/tests/adoption-reader.test.mjs, AP = packages/nana-pack/tests/adoption-producer.test.mjs.

| Row | Requirement | Test (file::title) | Red today |
|---|---|---|---|
| R-1580 | WHEN the user-scope nana-pack.json holds one leading byte-order mark followed by a JSON object, doctor shall print its pi nana-pack.json, pi objective.projectFile and pi objective file rows exactly as for the same file without the mark. | DD::doctor reads a nana-pack.json saved with a byte-order mark and CRLF as it reads the same file without one | P1 |
| R-1581 | WHEN an existing user-scope nana-pack.json holds one leading byte-order mark and its objective.path resolves to another file, install shall create no nana-objective.md and report that objective.path already points there. | IN::objective seed: not created when a nana-pack.json saved with a byte-order mark points elsewhere | P1 |
| R-1582 | WHEN the user-scope nana-pack.json holds one leading byte-order mark and a non-empty postEdit.commands, `nana-setup project` shall skip seeding .pi/nana-pack.json, naming the shadowing reason. | PJ::project skips .pi/nana-pack.json when a user nana-pack.json saved with a byte-order mark has postEdit.commands | P2 |
| R-1583 | WHEN a project's .pi/nana-pack.json holds one leading byte-order mark, `project --check` shall count the effective post-edit commands from that file exactly as for the same file without the mark. | PJ::--check counts post-edit commands from a .pi/nana-pack.json saved with a byte-order mark | P3 |
| R-1584 | WHEN the user-scope nana-pack.json holds one leading byte-order mark and an absolute journal.path, the Claude Code adoption hook shall list the unadopted roots that journal records. | AR::hook: a nana-pack.json saved with a byte-order mark keeps its absolute journal.path | P4 |
| R-1585 | WHEN the user-scope nana-pack.json holds one leading byte-order mark, pi's adoption producer shall apply its journal.enabled false, absolute journal.path and bare objective.projectFile exactly as for the same file without the mark. | AP::adoption: a nana-pack.json saved with a byte-order mark keeps journal.enabled false, journal.path and objective.projectFile | P5 |
| R-1586 | IF the user-scope nana-pack.json is not valid JSON once exactly one leading byte-order mark is removed, THEN doctor and the adoption settings shall treat it as unparseable. | DD::two leading marks, a mark inside the object or malformed text after one mark stay unparseable for doctor and adoption | Green today by design; P6 |

**Red-today probes.** Run on main f29827a in a fresh clone under a temporary HOME; the repo was untouched.
- P1: a marked file (LF and CRLF) with objective.path at an existing file elsewhere and projectFile GOALS.md. doctor: `pi nana-pack.json` ✗ `missing or unparseable`, projectFile "per-repo OBJECTIVE.md (the default name)", objective file the agent dir's nana-objective.md ✗. `stepPiConfig` created nana-objective.md. Without the mark: ✓, GOALS.md, the configured path, `unchanged`.
- P2: `project <dir> --home` with a marked user file holding one command printed `+ .pi/nana-pack.json created`; unmarked: `skipped … would shadow them here`.
- P3: `project --check` on a marked project file printed `! post-edit commands … empty`; unmarked: `✓ … 1 effective checker command(s)`.
- P4: the hook with a marked file whose journal.path records one root printed nothing; unmarked printed the `[nana:adoption]` block.
- P5: the producer with a marked file wrote its `directory_unadopted` line to the DEFAULT journal in all three cases (enabled false; journal.path; GOALS.md present). The configured journal stayed empty, so a test that reads only the configured journal is green today.
- P6: with the change applied in the clone, the five test files above passed whole and `map:check` reported 0 problems. Two marks, a mark after `{`, and malformed text stayed ✗. Each wrong code (`/^﻿+/`, `trim()`, remove every mark) turned a fixture ✓.

**Platforms.** Every test runs on all three platforms with no skip; a byte-order mark is file bytes everywhere. Fixtures build JSON with `JSON.stringify` (Windows backslashes) and then prefix the mark.

**Known limits.**
1. pi's settings.json is still read without removing a mark (doctor's registration and package-source rows, install's package coverage); pi 1.0.2 removes one.
2. install refuses a Claude Code settings.json that starts with a mark; whether Claude Code loads one is unverified.
3. A UTF-16 file stays unparseable everywhere, pi included; PowerShell 5.1's `>` and `Out-File` default to UTF-16.
4. The frozen desk reads nana-pack.json on its own path and is unchanged.
5. Six inline one-mark strips stay as they are: config.ts, objective.ts, nana-roster, review-round, requirements-tree, product-report.
6. Adoption and seeding behaviour is homed in FEAT-015; R-148 and R-150 live in FEAT-014 SUB-016 and R-309 in FEAT-013. A share is the owner's call.
7. The seat removes HANDOFF's Roster residual sentence about the mark.
