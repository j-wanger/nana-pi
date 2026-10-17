# Windows fixes — the seat's lane plan (2026-10-17)

Sources beside this file: `rows.json` (48 in-scope failing files, each classified with log evidence), `plan.md` (the
synthesis: 14 fix classes, 13 lanes), `attack.md` (the adversary). CI run 39051580133 at 43072d8: 69 of 148 files fail
on the Windows leg; 16 desk (frozen) and 5 bench (maintainer-only) are out of scope; 25 of the 48 crash early and hide
later checks.

Order follows the 2026-10-24 priority: both seats, install and every hook. User-facing bugs first, then the test files
that prove each hook on Windows, then maintainer tools. Every lane's must-meet: each named file's Windows pass count
equals its macOS count minus declared win32 skips (each SKIP prints its reason), no other file's Windows or macOS pass
count drops, and the lane's final green Windows run id goes in its corpus. Proof loop: a draft PR per lane (about 11
minutes a run), the seat pushes and reads the log once per build; a CRLF clone on the Mac rehearses the line-ending class.

| # | Lane | Feature (what now works on Windows) | Class | Covers |
|---|---|---|---|---|
| W0 | win-readout | A failing Windows check shows its assertion detail and a crashed file its stack, so each later CI round is diagnosable | ordinary (test harness, CI) | the Windows leg runs verbose; the crash tail; no HOME change (adversary 3.2) |
| W1 | win-project-files | `nana-setup project` refreshes AGENTS.md, and CLAUDE.md works on a Windows clone | ordinary | rename over an open file (project.mjs:223-236); CLAUDE.md becomes a one-line `@AGENTS.md` import on every OS instead of a symlink that Windows clones as a 9-byte text file (adversary 1.1; verify Claude Code's import first) |
| W2 | win-line-endings | A TS project scaffolded or adopted on default Windows git passes its checks; nana-pi checks out LF | ordinary | `.gitattributes` `* text=auto eol=lf`; the TS template's splitters; the mutation runner's autocrlf; the owner's one-time re-checkout step (adversary 1.3) |
| W3 | win-claude-hooks | The Claude Code seat's hooks are proven on Windows: the knowledge pull injects, shared memory and the verifier pipe run | ordinary, or hook class if a product bug surfaces | knowledge hook/discovery/render tests, with one check that the hook prints a pull on Windows (adversary 1.2); shared-memory-hook, verifier-pipe, settings-merge |
| W4 | win-session-start | The objective and adoption producers (both seats' session start) are proven on Windows | ordinary | objective-golden, adoption-producer, adoption-reader, config-display-text |
| W5 | win-pi-extensions | The pi seat's gate, handoff, display and post-edit are proven on Windows | ordinary | gate-corpus, gate-policy-paths, agent-dir-hostile, agent-dir-parity, lane-write-guard, handoff-*, display-surfaces, post-edit-file-queue, frontier |
| W6 | win-setup-shape | The install, doctor, restore and trust tests assert the declared Windows shape | ordinary | install, skills-and-standards, retired-artifacts, state-manifest, doctor-detail, restore, trust, install-check, uninstall (declared POSIX-only, option B); the four skills stay skipped on Windows as R-665/R-666 decide (adversary 2.1) |
| W7 | win-maintainer | The land, review, builder and template tools' tests run on Windows | ordinary | land (fixture roots long-form; the 8.3 mismatch in nana-land is a known bug, adversary 2.2), immutable-review, review-ledger, worker-lane, templates-update, template-acceptance, template-release, test-runner, code-map, ci-workflow, requirements-tree, entry-guidance, product-report, mutation-runner |
| W8 | win-leg-blocking | The Windows suite leg blocks CI on main | gate (two reviewers) | desk and bench declared as win32 skips; `ci.yml:51`; R-684 and the Support lines — the owner's call |

Before 10-24: W0 to W5 is the target (both seats' user-facing fixes and every hook proven); W6 to W8 follow.
Known bugs with no lane: the gate's `/tmp` lane root on win32 (nana-gate.ts:197), doctor's unguarded `getuid`
(doctor.mjs:650), nana-land's 8.3 path comparison, the frozen desk resolver.

**The owner's answers (2026-10-17):** plan the Windows fixes now; uninstall on Windows is declared unsupported for now
and ported later (W6 option B); the Windows suite leg becomes blocking on main after two consecutive green runs, with
desk and bench declared win32 skips (W8). CI's verbose Windows output, planned as W0, rides in W1.
