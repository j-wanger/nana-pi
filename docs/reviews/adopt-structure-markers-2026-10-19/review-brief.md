# Review — adopt-structure-markers (the structure-only adopt skill copies the shared working section inside its markers), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-014 · Create or adopt a project workspace (SUB-018 · Adopt or update shared working structure)

Review `git diff 22ccd849..HEAD` on `feat/adopt-structure-markers` (main was `22ccd849` when this brief was written; `git
merge-base HEAD main` is `22ccd849`). The plan of record is `docs/reviews/adopt-structure-markers-2026-10-19/must-meet.md`
(rows R-1780 to R-1782), with the adversary's `plan-attack.md` and the builder's `build-brief-1.md` beside it. The seat's
record `seat-verify-06a4493.md` holds CI, the Windows log beside it.

Tree movement (`requirements-moved.mjs --root . --base main`):

```
tree movement 22ccd84..06a4493: 3 rows in 1 features
FEAT-014 · Create or adopt a project workspace
  R-1780 new (implemented)
  R-1781 new (implemented)
  R-1782 new (implemented)
```

Judge whether an agent that follows adopt-structure step 4, from the canonical shared file or from the throwaway-render
fallback, leaves the root AGENTS.md with exactly one marked working region that `nana-setup project <dir> --check` reads
as ✓ and a later `nana-setup project <dir>` refreshes; whether both fallback `node -e` lines print only the marked block,
the same in bash, zsh, PowerShell and cmd; and whether the new checks write only inside the test's temp root and remove it.

Threat model: honest variation in our tools' output and the OS in scope: an agent following the skill honestly from
either seat, on macOS, Linux or Windows, in bash, zsh, PowerShell or cmd, and honest drift in the shared file and the
template render. Deliberate forgery out, including a hand-forged or misspelt marker. Lane class: ordinary — skill text,
one test file, the ledger and the generated maps; no install, hook, gate, land or review tool.

Check: (1) the three must-meet checks are not vacuous: R-1780 runs the real project check against the fence's lines,
R-1782 runs each `node -e` line and fails on a trailing section or a shell-special character, R-1781 needs both phrases;
(2) step 4 keeps "VERBATIM", the four `../../../../templates/_shared/` mentions, R-591's sentence and the R-929 copier
lines, and the R-591, R-592 and R-929 pins still pass; (3) the tests import the marker names and write no marker literal;
(4) no test writes outside the temp folder it owns; (5) nothing else changed beyond the five files the brief named, the
review folder, HANDOFF and the session entry; (6) HANDOFF and the session entry are true; (7) any MUST.
