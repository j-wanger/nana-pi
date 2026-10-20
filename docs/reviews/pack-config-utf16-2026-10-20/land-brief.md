# Review — pack-config-utf16 (nana's readers of nana-pack.json read a file saved as UTF-16 with its byte-order mark), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 1207b69e..HEAD` on `feat/pack-config-utf16` (main was `1207b69e` when this brief was written; `git
merge-base HEAD main` is `1207b69e`, the checkout-spelling-converge land tip, which the lane merged at `69f0a82e`). The
plan of record is `docs/reviews/pack-config-utf16-2026-10-20/must-meet.md`: eight must-meet checks, rows R-2230 to
R-2237. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds
(db2e4c1b; 58e2da48, tests and row only). The seat's record is `seat-verify-6cc66daf.md`: CI run 39418143889 at
2d2ba429, 0 failing files on macOS, Ubuntu and Windows (`ci-windows-2d2ba429.log` beside it; R-2237 passes on
Windows), the wrong-code pairs (`seat-mutate.mjs`; 19 of 19 red, 0 survived, on 961f76d1, 58e2da48 and the merged tip
69f0a82e) and the independent check (`independent-check-6cc66daf.md`: HOLDS, no MUST, nine probes, run on 961f76d1).
The final reviewer's brief is `review-brief.md`. CI has not run on the merged tip; the land runs the locked suite on the
reviewed tip, and the local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement 1207b69..6cc66da: 8 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2230 new (implemented)
  R-2231 new (implemented)
  R-2232 new (implemented)
  R-2233 new (implemented)
  R-2234 new (implemented)
  R-2235 new (implemented)
  R-2236 new (implemented)
  R-2237 new (implemented)
```

The code under review: `packages/nana-pack/lib/json-text.mjs`'s new `parseJsonBytes`, which decodes a buffer marked
FF FE or FE FF as UTF-16 (mark included, an odd byte count refused first) and anything else as UTF-8, then removes
exactly one U+FEFF and parses. Seven readers of nana-pack.json switch to it, each keeping its own catch and fallback:
`lib/config.ts` (the pi gate's policy load, nana-objective and the Claude Code objective producer), `lib/adoption.mjs`,
`bin/nana-roster.mjs` and `lib/roster-set.mjs` (the roster that pi-worker, pi-review and the roster notice read), and
nana-setup's `lib/doctor.mjs`, `lib/steps.mjs` and `lib/project.mjs`.

Judge whether the lane fails open: a UTF-16 file that cannot parse no longer stops the gate; a reader that throws past
its catch, or a `resolveRoster` that throws; a check that passes with the change removed (R-2236 passes on main by
design: it guards the unparseable shapes, and the seat's decoder pairs turn it red). Judge whether it leaves a harm
the review standard lists, such as `nana-roster set` losing the original bytes or a test writing outside its temp home.
Judge whether anything main does today stopped working: every UTF-8 nana-pack.json, with or without a mark, reading as
on main; the gate, objective, roster, doctor, project and adoption tests; and both CI install-check legs, whose live pi
turn loads the gate.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a UTF-16 pi
settings.json stays unreadable to pi and to doctor; the frozen desk still reads a UTF-16 nana-pack.json as unreadable,
though its save path warns and keeps a backup first; ANSI code-page text, PowerShell 5.1's `Set-Content` default, still
turns non-ASCII characters into replacement marks; a UTF-16 file has half the room under the 1 MiB read cap; a refusal
for a still-unparseable UTF-16 file quotes parser text, as on main; nobody has seen the owner's file. Declared without
a pair: no check pins `.bak` bytes for a UTF-16 original (a probe saw them kept); `install-check.mjs` reads only the
file it seeds and is unchanged. The pairs and the independent check ran on macOS only, so CI is the only Linux and
native Windows run, and R-2237 runs only on the Windows leg.

Threat model: honest variation in our tools' output and the OS is in scope (UTF-8 with or without a mark, UTF-16LE or
UTF-16BE with a mark as Windows editors and shells write them, LF or CRLF, Windows PowerShell 5.1's `>` and `Out-File`,
on macOS, Linux and Windows); deliberate forgery is out, such as a forged or mixed encoding.
Lane class: install, hook or gate — the pi extensions' config read (the nana-gate policy load and nana-objective), the
Claude Code hooks that read through the same modules, the nana-setup doctor, install's objective seed and project setup.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
