# checkout-spelling-converge — must-meet (amended by the adversary)

Feature: FEAT-013 · Install and connect harness runtimes (uninstall rows R-2203 and R-2204 under FEAT-018)
Class: install, hook or gate. It changes nana-setup install (skill links, settings merge) and uninstall. Needs wrong-code pairs, the land reviewer (or the seat's land review), one independent check, and install-check on macOS before nana-land.
Threat model: honest variation is in scope. That covers two spellings of one checkout: another letter case on a case-insensitive volume, and a link to the checkout (a checkout moved, with a link left at its old path). It also covers a home an earlier install wrote through either spelling, and a second copy of the repository on the same machine. Out of scope: a forged link, a hand-edited look-alike entry, and the home folder's own spelling.

Falsifiable sentence: on macOS and Linux, install through the checkout's on-disk spelling converges each link and the knowledge hook entry that an earlier install wrote through a letter-case or linked spelling. Uninstall --yes removes that knowledge entry without an install first. A link or entry naming another copy stays foreign or a variant, as today.

## Design
- A link or entry is ours when the native lookup (`realPath(x, { mustExist: true })`) resolves it to exactly what this checkout's own path resolves to. A dangling link, another copy's same-named folder or file, and every other target are foreign. The code is made to match the setup README (HANDOFF residuals 625, 658, 659).
- `steps.mjs` `linkSkill`, preserve branch: test for foreign only when the link's text, resolved against its folder, differs from `path.resolve(source)`. When the two real paths match, take the ordinary relink.
- `settings.mjs`: add one private predicate for a respelled knowledge entry.
  - The entry has no `args`, and `installerKnowledgeTarget` accepts both its command and the wanted command.
  - Its command differs from the wanted command, but every other key equals the installer's entry.
  - Its target and the wanted CLI are the same file under `realPath(…, { mustExist: true })`.
  - On win32 the predicate is false by construction, because the wanted entry has `args`.
  - `removeInstallerHooks` removes an exact or a respelled entry.
  - `mergeRepoHooks` also replaces a healthy "posix"-form entry that is the same file but has another command; the win32 path does not change.
  - Lines ~515-516 keep `fs.realpathSync`, with a comment saying why.
- `uninstall.mjs` `settingsVariants` reads `previewSettings`, the settings after removal.
- `scripts/test.mjs` SKIPS: add the new file on win32 only. Without it, an all-SKIP file is a runner FAIL on the Windows leg. Probe: "no check passed and no skip was declared".
- Measured: the candidate on a temp clone of aa5f25cd turned R-2200, R-2202 and R-2203 green for both spellings, with both guards green. retired-artifacts 47, settings-merge 221, uninstall 31 and checkout-spelling 6 passed, all with 0 FAIL.

## Must-meet tests (all in `packages/nana-setup/tests/checkout-converge.test.mjs`)
- Spellings: "link" (a temp link to the copied checkout) on every POSIX host, plus "case" when the swapped-case path exists. Each check runs every available spelling.
- Earlier home: install through the on-disk spelling, then rewrite every link text and hook command to the other spelling. The check FAILs if no skill link or no knowledge entry changed.
- The file is new because the runner skips checkout-spelling.test.mjs on case-sensitive volumes (R-1986).

| Row | Test title | Red today (temp clone of aa5f25cd, macOS) |
|---|---|---|
| R-2200 | `R-2200: install rewrites every link an earlier install wrote through another spelling of the checkout, the four newly managed skills included` | Yes, both spellings: 16 relinked; spec, py-lint, py-review and py-test "unchanged", old text kept |
| R-2201 | `R-2201: a newly managed skill link to another copy's skill folder keeps its text and reads as foreign` | No; a guard. Exit 1, texts kept, 4 foreign rows, on main and candidate. W2 made it red: exit 0, texts changed, 0 foreign rows |
| R-2202 | `R-2202: install rewrites a knowledge hook entry written through another spelling of the checkout` | Yes through "link" ("already wired", link spelling kept); "case" is green today |
| R-2203 | `R-2203: uninstall removes a knowledge hook entry written through another spelling of the checkout` | Yes, both spellings: "settings hook variant skipped left", entry left |
| R-2204 | `R-2204: uninstall leaves a knowledge hook entry naming another copy, or respelled with another key changed, as a variant` | No; a guard. Both left, 2 variant rows. W6 made it red: entry B removed |

Row text: see rows. Platforms: macOS runs "link" and "case", and Linux runs "link". On win32 the runner skips the file with a declared reason: skill links are copies there and uninstall refuses there. Each check also keeps its own `skip(...)` for a direct run. Every row is provable on this Mac, so no row needs a req-candidate marker.

## Known limits
- On Windows, nothing changes. Forced-win32 install through a link kept all six hook entries in the link spelling (probe). A real junction has not been run.
- A checkout moved with no link left makes install exit 1 with 4 "foreign link" rows (probe, main and candidate). Its old links dangle, and the lane leaves that unchanged.
- A newly managed link that reaches this checkout through the owner's own intermediate link is rewritten to the on-disk path, as the other 16 links already are.
- Install never writes a linked spelling itself; it comes only from a moved checkout.
- Install reports the knowledge rewrite as "added", as it does today for an unhealthy entry.
- The dry runs are untested for these homes.
- Where the native lookup fails (realpath-strict-fallback), a case spelling reads as another copy again.
- The new file repeats checkout-spelling.test.mjs's copy and repoint helpers. On Linux, the copied-checkout install has never run in CI (inferred to work).
- Seat: a wrong-code script under docs/reviews must not spell a pi launch as a literal `spawn("pi"`.