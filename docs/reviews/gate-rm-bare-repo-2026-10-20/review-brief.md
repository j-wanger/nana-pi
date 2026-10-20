# Review — gate-rm-bare-repo (a plain rm in or of a bare git repository asks again), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff c203f485..HEAD` on `feat/gate-rm-bare-repo` (`git merge-base HEAD main` is `c203f485`, the
handoff-cap-surrogate land tip, which the lane merged at `cc81b85a`; main was `c203f485` then and has since moved to
`0305bc8d` through the realpath-strict-fallback and post-edit-values-named lands, which this lane has not merged). The
lane branched from main `a112fd30`. The plan of record is `docs/reviews/gate-rm-bare-repo-2026-10-20/must-meet.md`:
four must-meet checks, rows R-2240 to R-2243, with R-1490's existing check as the guard against a walk that asks
everywhere. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (35dfff59). The seat's
record is `seat-verify-cc81b85a.md`: CI run 39414069623 on draft pull request #127 at cc81b85a, 0 failing files on
macOS, Ubuntu and Windows (`ci-windows-cc81b85a.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 22 of 22
red, 0 survived, record `seat-mutate-output-cc81b85a.txt`) and the independent check
(`independent-check-cc81b85a.md`: HOLDS, no MUST, 11 probes, run on cc81b85a). The local macOS install check runs
before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement c203f48..ecc7e9b: 4 rows in 1 features
FEAT-010 · Guard risky commands and protected resources
  R-2240 new (implemented)
  R-2241 new (implemented)
  R-2242 new (implemented)
  R-2243 new (implemented)
```

CAP-03 moves from 153 to 157 rows and FEAT-010 from 63 to 67. No existing row changed.

The code under review: `packages/nana-pack/lib/gate-rm-inside.ts`, whose `rmInsideCwd` lets `nana-gate.ts` clear the
"rm recursive/forced" danger for a plain rm of literal targets inside the working folder. It gains `lstatOrNull`,
`isBareShape` (a `HEAD` file and `objects` and `refs` folders, lstat only), step 3b (a walk up from the cwd that a
`.git` entry ends and a bare shape answers false) and one line in step 5 (an existing folder part with the bare shape
answers false). `nana-gate.ts` and `real-path.mjs` are unchanged. Tests: four new checks in
`packages/nana-pack/tests/gate-rm-inside.test.mjs` on fixtures git builds. The pack README's exemption paragraph and
its known limits change with it.

Judge whether an rm in or of a bare repository now asks, from its own folder, from any folder inside it, and for a
target that is one or passes through one; whether a worktree that git added inside a bare repository, and every
ordinary rm that runs unasked on main, still runs unasked; whether the walk and the new lstat calls can throw past the
module's catch or block a tool on an unreadable folder; and whether the README's new known limits are true.

Threat model: honest variation in our tools' output and the OS is in scope (bare repositories that `git init --bare`
and `git clone --bare` make, worktrees `git worktree add` makes inside them, a working folder at any depth inside one,
case-folding disks, links and junctions on the way, git on macOS, Linux and Windows); deliberate forgery is out, such
as a disguised repository or a stray `.git` entry planted to restore the exemption.
Lane class: install, hook or gate — the nana-gate policy (`lib/gate-rm-inside.ts`, the rm-inside-cwd exemption).

Check: (1) the must-meet checks are not vacuous: R-2240 and R-2241 fail on main's module, and each pair turns its
named check red (M1 to M22); (2) no fail-open: no rm that main asks for now runs unasked, headless or interactive;
(3) the order at each walk level, `.git` first and the shape second, matches R-2241 and R-2242 and git's own
discovery; (4) the declared residuals are what the seat says: a bare repository below a target, a linked `HEAD`,
`objects` or `refs`, the over-asks, and the walk to the root with its cost; (5) nothing main does today stopped
working, on any of the three CI legs; (6) the tests write only inside the temp folders they own, and git reads no
global config; (7) HANDOFF and the session entry are true, including the removed gate-rm-workdir residual and the
four new ones; (8) any MUST.
