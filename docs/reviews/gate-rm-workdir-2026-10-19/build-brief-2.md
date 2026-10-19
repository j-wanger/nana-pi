# Lane gate-rm-workdir — build brief 2 (2026-10-19 · feat/gate-rm-workdir · on the seat's pairs commit after d6f0613)

**Builder: Claude Sonnet, a subagent in `<worktrees>/gate-rm-workdir`.** Same rules as brief 1: single test files only, in the foreground; no full suite; no push; no `HANDOFF.md` or `docs/sessions/`. Every rm probe runs only against fixtures in a fresh mktemp folder; never execute a real rm outside it.

The seat's wrong-code pairs (`seat-mutate-output-d6f0613.txt`, 32 of 34 red) and one independent check (HOLDS, no product hole) ran on d6f0613. Two survivors are test gaps; one finding is a README gap. The product code is right in all three; do not change `lib/gate-rm-inside.ts` or `nana-gate.ts`.

## 1. Survivor P4 — the outside target never comes first

R-1491's only two-target case is `rm -rf build ../x`, where the outside target is last. A loop that checks only the last target passes all seven checks; under it, `rm -rf ../x build` would run unasked and delete `../x`. Add `rm -rf ../x build` (outside target first) to R-1491's existing cases. Add no new check call.

## 2. Survivor P24 — home reached through a second spelling

Every R-1495 case passes the cwd spelled exactly as HOME. A guard that compares typed strings passes them all; under it, a macOS session whose cwd reaches home through a symlink or a case-changed spelling could `rm -rf` inside home unasked. Add R-1495 cases with the cwd set to (a) a symlink to HOME and (b) a case-changed HOME, the latter only where that spelling exists on disk (`fs.existsSync`), printing a SKIP line naming why otherwise. Add no new check call.

For each of 1 and 2: apply the pair's wrong code from `seat-mutate.mjs` (P4, P24) by hand, show the extended check red, restore the code, show it green.

## 3. README known limits — two targets that now run unasked

The independent check found two targets main asked for and the lane now runs unasked, both inside the working directory (so the ruling allows them): a folder that holds a git repository one level or more down (`rm -rf vendor` where `vendor/sub/.git` exists), and a bare repository folder (`rm -rf origin.git`). Add both to the rm exemption's Known limits in `packages/nana-pack/README.md`, in plain words. Run `npm run readme:check`.

## Report

First line `VERDICT: DONE | PARTIAL | BLOCKED`. Then the commits, each command with its exit code, and the red-then-green evidence for P4 and P24.
