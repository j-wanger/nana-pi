# lane-guard-temp-root: must-meet

Feature: FEAT-006 · Launch builders with execution limits
Sentence: while NANA_WORKTREE_ROOT is set, the lane write guard counts a temp folder as writable only when it resolves to something other than a drive or filesystem root, the home folder, or a folder above home. On Windows it also reads TMP, under the same rule as TEMP.
Class: install, hook or gate (the pi extension nana-gate, lane write guard). The install check is not required: it never sets NANA_WORKTREE_ROOT.
Threat model: honest variation in temp variables, home location and platform is in scope. A builder that rewrites its own environment is out of scope, and so is deliberate forgery: the guard is advisory by load path. Today, a temp variable that names a drive root, home or a folder above home lets a builder write anywhere on that drive or in home.

## Design (probed on main 72abe19a, macOS, throwaway clone, temp home)
- Change `laneWriteHit` only.
  - Candidates: `os.tmpdir()`, plus `process.env.TMP` on win32 when it is set.
  - Resolve each candidate with the gate's `real()`, falling back to `path.resolve`. Resolve home the same way from `os.homedir()`.
  - Drop a candidate when `path.parse(t).root === t` or `within(home, t)`.
  - `/tmp` stays unconditional on macOS and Linux (R-1430). The refusal reason does not change.
  - The probe diff was 4 lines added and 2 removed.
- There is no "temp folder above the worktree" clause. The probe showed it turns R-962 "temporary output remains allowed" and R-1431 red, trading a rare wrong allow for a likely wrong refusal.
- The test fixture's import-time HOME and USERPROFILE move from the worktree to homeFixture. With the worktree as home, the real temp folder sits above home and gets dropped, and the probe turned R-962 and R-1431 red. With homeFixture, every existing check stays green (probed: 16 pass, 1 skip).
- The text of R-1430 and R-1431 is narrowed so that neither contradicts the new rows. Their tests do not change.
- Empty HOME is not a new gap: main's gate already blocks every gated tool when HOME is empty (probed).
- map:check stays green with the change (probed). The module header does not change.

## Must-meet (file packages/nana-pack/tests/lane-write-guard.test.mjs)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-2270 | IF NANA_WORKTREE_ROOT is non-empty and the OS temp folder resolves to a drive or filesystem root, THEN the gate shall refuse an edit/write target under that root unless the lane folder or another temporary root the gate counts holds it. | a temp variable naming a drive root opens nothing outside the lane | Yes. It FAILs on main's gate (probed, macOS). On Windows, the second-drive sub-case is the only proof of the root clause on its own. |
| R-2271 | IF NANA_WORKTREE_ROOT is non-empty and the OS temp folder resolves to the home folder or a folder that contains it, THEN the gate shall refuse an edit/write target in the home folder unless the lane folder or another temporary root the gate counts holds it. | a temp variable naming the home folder or a folder above it opens no home file | Yes. It FAILs on main's gate (probed). |
| R-2272 | WHEN NANA_WORKTREE_ROOT is non-empty and the OS temp folder resolves to a folder inside the home folder, the gate shall allow an edit/write target in that temp folder. | a temp folder inside the home folder still takes temp output | No, it is green by design. This is the Windows default layout. It is the only check that catches a home test run in both directions on Linux. On macOS, R-1431 catches it too (probed). |
| R-2273 | WHERE the platform is win32, WHEN NANA_WORKTREE_ROOT is non-empty and TMP names a different folder from TEMP, the gate shall count the TMP folder as a temporary root under the same root and home exclusions as the OS temp folder. | on Windows a differing TMP counts as a temp folder under the same rule as TEMP | Windows only. By code reading, main never reads TMP. A macOS simulation (a patched gate reading TMP) turned 3 sub-cases red on main, 2 on P6 and 2 on P7. Marker: `// req-candidate: R-2273 (...)`. Status `untested`. Off Windows it is a real SKIP. |
| R-1430 (text narrowed) | WHEN NANA_WORKTREE_ROOT is non-empty, the gate shall allow an edit/write target under `/tmp` on macOS and Linux, and refuse one under the `\tmp` folder of the gate process's current drive on Windows when that folder lies outside the lane folder and every temporary root the gate counts. | unchanged | row text only |
| R-1431 (text narrowed) | WHEN NANA_WORKTREE_ROOT is non-empty and an edit/write target names a file in the OS temp folder through another spelling of that folder than the temp variable holds (letter case on a case-insensitive volume, an 8.3 short or long name, or a link), and that folder is neither a drive or filesystem root nor the home folder or a folder that contains it, the gate shall allow it. | unchanged | row text only |

Each new check also requires that an in-lane file stays allowed under the same temp setting, so code that blocks everything cannot pass. A refusal counts only when its reason includes "lane write boundary", so "gate analysis failed" cannot pass either.

## Seat wrong-code pairs (probed on macOS unless marked)
- P1, drop the home clause: R-2271 red.
- P2, drop the root clause: green on macOS, because `/` always contains home. On Windows, R-2270's second-drive sub-case goes red.
- P3, test home in both directions: R-2272 and R-1431 red. P3b, the inverted test: R-2271, R-2272 and R-1431 red.
- P4, compare to home by equality only: R-2271 red.
- P5, discard on unresolved strings: R-2271 red, on the link and the /var spelling.
- P6, never read TMP: R-2273 red on the Windows leg (simulated on macOS).
- P7, add TMP without the rule: R-2273 red on the Windows leg, on the TMP-as-root and TMP-as-home cases (simulated).
- P8, the worktree-ancestor clause: R-962 "temporary output remains allowed" and R-1431 red.
- A seat pairs script must not spell a pi launch as a literal spawn("pi" text. The desk's home-isolation test scans review scripts for it.

## Known limits
- A temp folder that is a mount point or another broad folder still counts when it is neither a root nor above home. The parent of all lane worktrees is one example.
- On macOS and Linux, the guard counts only the folder Node picks: TMPDIR, then TMP, then TEMP.
- On macOS and Linux, the root clause has no check of its own, because `/` always contains home.
- On macOS, a temp variable typed through the data-volume firmlink path of home is not recognised as home. This is inferred, not probed.
- The refusal reason does not say a temp folder was set aside.
- On Linux, R-1431's spelling checks still SKIP in the suite. This is an existing residual.
- Bash writes stay outside the guard (R-962).