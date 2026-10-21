# Review — writing-adoption (the writing rule's adoption: nana-writing on PATH, a required pre-send check, a user-scope off switch for pi, a pair-safe cap, a suite check on HANDOFF's live sections), 2026-10-21 (the final reviewer)

Feature: FEAT-005 · Communicate decisions clearly (PATH rows in FEAT-013 · Install and connect harness runtimes)

Class: install, hook or gate (a pi extension, nana-setup install and doctor). Threat model: honest variation in scope — astral characters in the rule; the key absent, true, false, malformed or in a UTF-16LE file Windows PowerShell 5.1 wrote; pi's agent dir moved by `PI_CODING_AGENT_DIR`; the bin folder missing from PATH; cmd, Windows PowerShell and Git Bash on Windows; an existing install upgraded; uninstall. Deliberate forgery out (a crafted PATH entry, a forged shim, editing the sealed rule text to hide a finding).

Review `git diff 6684365d..HEAD` on `feat/writing-adoption` (main is 6684365d; the lane branched there). The plan of record is `docs/reviews/writing-adoption-2026-10-21/must-meet.md`: the seat decisions D1 to D6 (D3 keeps the key to pi after the plan adversary's six MUSTs in `plan-attack.md`; D4 uses the pack's `head` rather than `toWellFormed()`, following R-2160), six must-meet rows (R-2498 to R-2503), the sealed Check text, the rows it amends and the known limits. `build-brief-1.md` to `build-brief-4.md` are the four builder sessions (c2e488ed, 6a9fa725, 0671f92e, 0d52deb0); build 4 answered the independent check (`independent-check.md`, no material finding). The seat's record: the wrong-code pairs in `seat-mutate.mjs` and `seat-mutate-output-0d52deb0.txt` (10 of 10 red on macOS; R-2499 rests on the Windows leg, `ci-windows-6a9fa725.txt`). The macOS install check passes locally. The land runs the locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 6684365..0d52deb: 10 rows in 3 features
FEAT-001 · Keep goals and priorities in view
  R-006 text changed
FEAT-005 · Communicate decisions clearly
  R-2500 new (implemented)
  R-2501 new (implemented)
  R-2502 new (implemented)
  R-2503 new (implemented)
FEAT-013 · Install and connect harness runtimes
  R-1610 text changed
  R-1615 text changed
  R-2261 text changed
  R-2498 new (implemented)
  R-2499 new (implemented)
```

CI: run 39650393785 at 6a9fa725 (PR #157, after build 2): suite (ubuntu-latest), suite (macos-latest) and suite (windows-latest) all success, Windows 201 files, 183 PASS, 0 FAIL, 18 SKIP, checks 7172 pass, 0 fail; install-check success on macOS and Windows. On Windows, R-2499 passes through cmd.exe and PowerShell, and R-1611's sh shim passes. Since 6a9fa725 the lane changed the rule's Check section, the READMEs, AGENTS.md and the writing-rule test (build 3), and the writing extension's per-turn key read and the HANDOFF check's slicer (build 4); no shim or install code changed. The seat pushed the reviewed tip, and its CI run is not in this brief.

Judge whether the feature works for the owner and every seat, and report:
- each must-meet check is red with its feature removed or with the obvious wrong code (the seat's pairs are the record) and green with it;
- no existing install is harmed: an upgrade over main's install, a second install, doctor and uninstall behave (the independent check probed these);
- the key is read from user scope only, on the next turn, and no handler can throw; the cap never exceeds its limit nor leaves a lone surrogate;
- the HANDOFF suite check reads exactly the live sections, skips fenced code, and fails loudly on a renamed heading;
- the rule's Check section is the sealed text, and every README, AGENTS and rule claim the lane wrote says what the code does;
- the HANDOFF lines (the queue item removed, one Landed line, twelve residual lines) and the session entry are accurate, and so are the folded late notes from gate-rm-gitbash-tmp and win-leg-flakes.

Known limits already carried (do not send back for them): the pre-send run stays an instruction; the key reaches pi only; the HANDOFF check covers the live sections only, and a lane in flight with long live lines goes red after merging main; Windows PowerShell 5.1 pipes non-ASCII as `?`; the rule names a command that exists only after install; the frozen desk refuses a `writing` block; `--help` reads as a path; a table-only live section or a banned word in a link target fails the check; the pairs ran on macOS.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree, and never run install against the real home folder.
