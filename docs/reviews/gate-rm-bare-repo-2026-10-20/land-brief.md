# Review — gate-rm-bare-repo (a plain rm in or of a bare git repository asks again), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff c203f485..HEAD` on `feat/gate-rm-bare-repo` (`git merge-base HEAD main` is `c203f485`, the
handoff-cap-surrogate land tip, which the lane merged at `cc81b85a`; main was `c203f485` then and has since moved to
`0305bc8d` through the realpath-strict-fallback and post-edit-values-named lands, which this lane has not merged). The
plan of record is `docs/reviews/gate-rm-bare-repo-2026-10-20/must-meet.md`: four must-meet checks, rows R-2240 to
R-2243. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (35dfff59). The seat's
record is `seat-verify-cc81b85a.md`: CI run 39414069623 at cc81b85a, 0 failing files on macOS, Ubuntu and Windows
(`ci-windows-cc81b85a.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 22 of 22 red, 0 survived) and the
independent check (`independent-check-cc81b85a.md`: HOLDS, no MUST, 11 probes, run on cc81b85a). The final
reviewer's brief is `review-brief.md`. The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement c203f48..ecc7e9b: 4 rows in 1 features
FEAT-010 · Guard risky commands and protected resources
  R-2240 new (implemented)
  R-2241 new (implemented)
  R-2242 new (implemented)
  R-2243 new (implemented)
```

The code under review: `packages/nana-pack/lib/gate-rm-inside.ts`. Its `rmInsideCwd` decides whether `nana-gate.ts`
clears the "rm recursive/forced" danger for a plain rm of literal targets inside the working folder. The lane adds a
walk up from the cwd that a `.git` entry ends and a bare repository's shape (a `HEAD` file and `objects` and `refs`
folders, lstat only) answers false, and a shape test on each existing folder part from the cwd down to the target.
Every new path returns false (ask) or leaves the walk; `nana-gate.ts` is unchanged.

Judge whether the lane fails open: an rm that main asks for now runs unasked, headless or interactive; the walk or a
new lstat that throws past the module's catch; or a check that passes with the guard removed. Judge whether it leaves
a harm the review standard lists. Judge whether anything main does today stopped working: an ordinary rm inside a
normal repository, a plain folder or a worktree that git added inside a bare repository, the other gate test files,
and both CI install-check legs, whose live pi turn loads the gate.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a bare
repository below a target still runs unasked, as a nested normal repository two levels down does; a linked `HEAD`,
`objects` or `refs` is not recognised, so an rm there runs unasked as on main; a plain folder inside a bare repository
that is not a worktree, a path through a bare repository into its worktree and, on a case-folding disk, a lowercase
`head` file each over-ask; any `.git` entry ends the walk, valid or not, and every such rm walks to the filesystem
root, about 1.5 ms more per rm from 30 folders deep; the pairs and the independent check ran on macOS only, so CI is
the only Linux and native Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (bare repositories that git makes,
worktrees inside them, a working folder at any depth, case-folding disks, links and junctions, git on macOS, Linux
and Windows); deliberate forgery is out, such as a disguised repository or a planted `.git` entry.
Lane class: install, hook or gate — the nana-gate policy (`lib/gate-rm-inside.ts`, the rm-inside-cwd exemption).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
