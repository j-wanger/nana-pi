# Review — install-pins (tests pin eight install and doctor promises: an owner's folder at the requirements skill path, a settings file install cannot read or will not edit, a held lock's message, hook commands carrying an operator and look-alikes, `--pi-home` over `--home` and the ambient agent folder, and a relative ambient agent folder in doctor), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (R-346: FEAT-015 · Diagnose the active environment)

Review `git diff f0d6da24..HEAD` on `feat/install-pins` (main was `f0d6da24` when the lane branched and when CI ran;
`git merge-base HEAD main` is `f0d6da24`; main has since moved to `4656f646`, the pwsh-lexer-oracle land, so a merge of
main and a confirmation round follow before the land). The plan of record is
`docs/reviews/install-pins-2026-10-19/must-meet.md` (rows R-1870 and R-1871 new; R-924, R-322, R-922, R-318, R-827 and
R-346 pinned with their text unchanged; R-304, R-381 and R-382 retired as superseded), with `plan-attack.md` (the
adversary's AMEND) and `build-brief-1.md`, the one build, beside it. The seat's record `seat-verify-8b7a25eb.md` holds
CI run 39348980616 (0 failing files on macOS, Ubuntu and Windows; the eight new checks pass by title on Windows, none
skipped), the builder's wrong-code tries, and the Windows log `ci-windows-8b7a25eb.log` beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main` at 8b7a25eb; the seat's notes commit changes
no row): six rows flipped to implemented, two added, three retired; none reworded.

```
tree movement f0d6da2..8b7a25e: 11 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-304 untested -> retired
  R-318 untested -> implemented
  R-322 untested -> implemented
  R-381 untested -> retired
  R-382 untested -> retired
  R-827 untested -> implemented
  R-922 untested -> implemented
  R-924 untested -> implemented
  R-1870 new (implemented)
  R-1871 new (implemented)
FEAT-015 · Diagnose the active environment
  R-346 untested -> implemented
```

The change under review: five test files (`install.test.mjs`, `settings-merge.test.mjs`, `skills-and-standards.test.mjs`
and `relative-agent-dir.test.mjs` under `packages/nana-setup/tests`, `agent-dir-parity.test.mjs` under
`packages/nana-pack/tests`), REQUIREMENTS.md, the tree and the code map. No install, doctor, hook, gate or land-tool code
changed. Judge whether each new check drives the real CLI and can fail for the reason its title gives. R-1870 and
R-1871: whether they run on win32 too, ahead of section 4's POSIX branch; whether "untouched" is proven well enough by
the folder staying a real directory with its SKILL.md bytes (the brief asked for "holding only SKILL.md"; the check does
not list the folder, see the seat's record), and whether the no-`.bak-` clause catches W7d. R-922: whether the control
(install exits 0, four SessionStart rows ✓, `commandInvokes` true on the shell form) keeps the ✗ half from passing
vacuously, whether each of the four rewrites (`|| true`, `2> nana.log`, `$(true)`, a dropped closing quote) reaches the
tokenizer as intended, and whether the second install's entries are found by JSON equality with the installer's own
entry, not by the code under test. R-318: whether both look-alikes stay JSON-equal and both real entries are added.
On win32, whether joining the exec-form entry through `shq` gives the shell form doctor and install read. R-924: whether
both homes (an unparseable body and `{"hooks":"disabled"}`) exit 2, name the file on stderr and leave the home snapshot
unchanged. R-322: whether the lock path, `pid 4242`, the age and `rm <lock path>` are each asserted. R-827: whether
`install --home <h> --pi-home <p>` with the ambient value set seeds only `<p>`, and whether the new home and pi folder
sit under the file's temp HOME. R-346: whether the absolute run exiting 0 with all good and no ✗ or ! line is a real
control, whether the relative run must show the same non-empty ✓ labels, exactly one ! line naming the cwd, no all
good and a non-null non-zero exit, and whether the temp home is removed in its finally. Judge whether the three retired
rows are truly superseded: R-1870 and R-1871 say "a directory that nana-setup did not make", while R-304, R-381 and
R-382 said "a regular directory", which on win32 also matched nana-setup's own copy.

Threat model: honest variation in our tools' output and the OS in scope: macOS, Linux and Windows on Node 22;
shell-form and exec-form hook entries; hand-edited settings; a lock left by an interrupted run; an absolute or relative
ambient `PI_CODING_AGENT_DIR`; a CI runner's temp and home layout. Deliberate forgery out (a forged lock, settings
shaped to fool the tokenizer). Lane class: ordinary — five test files, rows, the tree and the code map; no install,
doctor, hook, extension, gate-policy or land and review tool code. It touches nana-setup tests, so the seat runs the
macOS install check before nana-land.

Check: (1) the must-meet checks are not vacuous: each reds on the wrong code the plan names (W7b, W7c and W7d for
R-1870; W7, W7b and W7c for R-1871; W4 and W5 for R-924; W6 and W6b for R-322; W1, W2 and W3 for R-922; W1 and W3 for
R-318; W8 and W9 for R-827; W10, W11, W11b and W12 for R-346), and each row is no wider than its check; (2) no check
passes through the code under test (`entryInvokes`, `hasHook`) rather than by printed ✓ or ✗ and JSON equality; (3) no
test writes outside the temp folders it owns, and each removes what it made; (4) nothing else changed: no product code,
no new skip, no new tunable, and the regenerated tree and code map match fresh runs; (5) the retirements of R-304, R-381
and R-382 lose no promise that still holds on some platform; (6) the plan's known bug, the `--home` dry run reporting pi
packages as "would add" while the real run reports skipped, is a HANDOFF residual, and no known limit hides a bug that
stops the feature; (7) HANDOFF and the session entry are true, including the seat items carried from other lanes; (8)
any MUST.

## Chain note (the seat, after this brief was written)

Since `0964a94f`, the seat merged `32d6aa8b`, the mutation-runner-win-prune lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `32d6aa8b` becomes main before this lane lands. Review this lane's own change as `git diff 32d6aa8b...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 5dbf3b63` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 32d6aa8b`):

```
tree movement 32d6aa8..5dbf3b6: 11 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-304 untested -> retired
  R-318 untested -> implemented
  R-322 untested -> implemented
  R-381 untested -> retired
  R-382 untested -> retired
  R-827 untested -> implemented
  R-922 untested -> implemented
  R-924 untested -> implemented
  R-1870 new (implemented)
  R-1871 new (implemented)
FEAT-015 · Diagnose the active environment
  R-346 untested -> implemented
```

The merge helper kept both versions of the HANDOFF line on the occupied skill folder on Windows, since both sides touched it. The seat kept this lane's narrowed line (one older requirement left, three replaced) and dropped main's "four older install requirements" line.
