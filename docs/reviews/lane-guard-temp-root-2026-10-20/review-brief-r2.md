# Review round 2 — lane-guard-temp-root (a temp folder setting that names a drive root, the home folder or a folder above home no longer opens that place to lane writes), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Round 1 reviewed `9ae497d8`. Claude Opus 5.5 (the final reviewer) said LAND 9/10 with SHOULD 1 (the pack README overstated the `/tmp` rule) and NOTE 5 (R-2271's link sat in a recursively deleted fixture). pi gpt-6-astra (the land reviewer) said SEND-BACK with two MUSTs: (1) on macOS, home typed through its data-volume firmlink spelling (`/System/Volumes/Data` + home) still opened home to lane writes, reproduced; (2) R-2272 passed with the feature removed. This round reviews what changed since: `git diff 9ae497d8..HEAD` on `feat/lane-guard-temp-root`.

- `1d9ba683` is build 3 (`build-brief-3.md`, the same Claude Sonnet 5 builder). `isExcludedTempRoot` in `packages/nana-pack/lib/gate-temp-roots.ts` now keeps the root clause, then excludes a candidate whose `stat` dev and inode equal those of home or of any folder on home's path to the root; only when a stat fails does it fall back to the text test `within(t, home)`. It never throws. R-2271's check in `packages/nana-pack/tests/lane-write-guard.test.mjs` gains a data-volume sub-case (runs where that spelling is the same directory as the fixture home, a real SKIP line elsewhere) and its folder link moves into an unmanaged temp root; R-2272's check keeps its handler-level checks and now also calls `acceptedTempRoots` directly (keeps a temp folder inside home, drops home itself). The pack README's sentence now says `/tmp` on macOS and Linux is a separate rule that counts regardless. The code map is regenerated.
- `9eba5d11` is the seat's pairs on 1d9ba683 (`seat-mutate.mjs`, record `seat-mutate-output-1d9ba683.txt`): 13 of 17 red, every red pair exactly its named titles. P1 to P4 are re-anchored on the new body; new P15 (build 2's text-only home test) and P16 (identity compared with home only, not the folders above it) turn R-2271 red. P5, P9, P11 and P17 survive, declared in the table: identity reads the same through any spelling, so P5 (exclusion judged on unresolved strings) and P9 (home as typed) change a decision only when a stat fails; P17 drops the stat-failure fallback, which no check reaches (a carried test gap); P11 as before.
- `4f546eff` merges `5ef07f7f`, the objective-path-shapes land tip, now main (it landed after this lane's round 1). Review it as `git show --remerge-diff 4f546eff`; the seat's merge helper kept both sides' HANDOFF and session lines and regenerated the tree and code map. `git merge-base HEAD main` is `5ef07f7f`.
- The seat's notes commit (the commit that adds this brief): `build-brief-3.md`, `seat-verify-1d9ba683.md`, HANDOFF (the Landed line covers build 3; the plan's firmlink line goes; the pairs line gains P17; two new final-review lines for `/tmp` and a drive-relative Windows TEMP), the session entry, and these briefs.

{CI}

The Windows-only pairs and the independent check ran on build 1 (350f9ce0) and were not re-run on build 3; on Windows `fs.statSync(..., { bigint: true })` gives a volume serial and file index, so the identity test also applies there, but no Windows run has executed build 3's code {WINCI}.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, at the merged tip):

```
{MOVED}
```

Threat model: honest variation in our tools' output and the OS is in scope (temp variables and their spellings, firmlinks, links, letter case, 8.3 short names, the home location, TEMP and TMP on Windows); deliberate forgery is out. The guard is advisory by load path.
Lane class: install, hook or gate — the pi extension nana-gate's lane write guard, plus the shared `lib/gate-temp-roots.ts`.

Check: (1) round 1's two MUSTs are fixed: home and every folder above it, in any honest spelling including the macOS data-volume one, now open nothing outside the lane, and R-2272 fails with the feature removed; (2) no fail-open in the new identity path: a failed stat, an unreadable folder on home's path, or a stat error never leaves home or a folder above it writable when the text test would have excluded it, and nothing throws; (3) nothing round 1 accepted stopped working: a temp folder inside home (Windows' default), `/tmp` on macOS and Linux, the ordinary layout, temp and lane spellings, and a session with no NANA_WORKTREE_ROOT; (4) the tests write only inside the temp folders and fixtures they own, and the new unmanaged link root is removed without following the link; (5) the README sentence, HANDOFF and the session entry are true about build 3; (6) the merge of 5ef07f7f keeps both sides, with nothing lost or doubled; (7) any MUST.

This is a confirmation round on the final tip after fixes to named findings and a merge of current main.
