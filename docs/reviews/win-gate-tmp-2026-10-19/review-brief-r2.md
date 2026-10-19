# Review — win-gate-tmp, confirmation round 2, 2026-10-19 (Opus final review and Fable land review)

Feature: FEAT-006 · Launch builders with execution limits

Review `git diff e97bad5..HEAD` on `feat/win-gate-tmp`. `git merge-base HEAD feat/clean-revision` is `a1ea491`.

Round 1 said LAND 9/10 (Opus) and LAND (Fable) on `e97bad5`. Since then:

- `7dff2bf` (build 4): R-1430's Windows half also asserts the drive-joined tmp spelling (Opus SHOULD 1: on CI's drive layout main's gate already refused the plain spelling); the pack README's TMP sentence says both halves (Opus NOTE 4, Fable SHOULD 2).
- `ed498f7` merged main `ca27d86`; CI run 39273747583 on it read 0 failing files on macOS, Ubuntu and Windows, with the Windows leg passing the tmp check (`ci-windows-run-4.log`).
- `8a84679` (the seat): notes corrected — the session entry and seat-verify no longer claim the forced-Windows probes show main's gate failing (Opus SHOULD 2); HANDOFF says only letter case and short names are new, links were already allowed (NOTE 3); the TMP residual names both halves.
- `715b72f` (the seat): pairs 6 of 6 red on `8a84679`.
- `62ea440` (build 5, the pi sol builder): merges `a1ea491`, the clean-revision lane's reviewed tip. Lands go in order study-stop, gate-rm-workdir, clean-revision, then this lane; each is a fast-forward, so `a1ea491` becomes main before this lane lands. **`packages/nana-pack/extensions/nana-gate.ts` conflicted with gate-rm-workdir**, which added the rm-inside-the-working-folder exemption (`lib/gate-rm-inside.ts` and its hook). The builder kept this lane's path expansion, native real-path, resolved target and per-platform temp roots, and gate-rm-workdir's import, tool-aware signature, one-segment exemption and call site. `git diff a1ea491 HEAD -- packages/nana-pack/extensions/nana-gate.ts` is exactly this lane's change on top of main-to-be.
- The seat's follow-up commit: pairs 6 of 6 red on the merged `62ea440` (`seat-mutate-output-62ea440.txt`), and this brief.

Tree movement (`node scripts/requirements-moved.mjs --root . --base feat/clean-revision`):

```
tree movement a1ea491..62ea440: 4 rows in 1 features
FEAT-006 · Launch builders with execution limits
  R-1430 … R-1433 new (implemented)
```

The builder ran alone on the merged tip: lane-write-guard (13 pass, 1 skip), gate-rm-inside (7), gate-corpus (227), gate-survives-mutation (38), display-surfaces (181), path-spelling (11) and the three requirement tests; map and README checks clean. CI on the merged tip is running; the seat lands only on a clean Windows leg.

Threat model: honest variation in our tools' output, path spellings and platforms in scope; deliberate forgery out. Lane class: gate.

Check: (1) the `nana-gate.ts` resolution keeps both lanes' behaviour — the lane write guard as this lane defines it, and rm inside the working folder as gate-rm-workdir defines it — and neither fails open; (2) build 4 and the note fixes answer round 1's findings; (3) the merges lost nothing from either side; (4) any MUST.
