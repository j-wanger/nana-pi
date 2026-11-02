I found nothing that blocks this round. The change since `ecac83aa` adds one known-bug line in each of `docs/known-bugs/FEAT-008.md` and `docs/known-bugs/FEAT-031.md`, plus the brief `review-brief-2.md`. It touches nothing else: no code, test, script or config.

**Are the new lines accurate to round 1?**

- **FEAT-008 line:** this matches round 1's NOTE on R-3490 almost word for word. It also sits in the right file, because the tree movement puts R-3490 and R-3491 under FEAT-008.
- **FEAT-031 line:** the figures check out.
  - **249.5 s alone on the laptop:** this matches round 1 and `suite-run-win32-merged.txt:20`.
  - **264 s on the hosted Windows runner:** round 1 never gave this number, so I checked the Windows CI logs. Four of the six recent successful runs I read took 264.4 to 265.3 s (runs 41375912080, 41372778873 and 41372734222 among them). So the number is real.
- **What the FEAT-031 line leaves out:**
  - **NOTE:** round 1's SHOULD said the file timed out at 300.3 s in the full run on the merged tip (`suite-run-win32-merged.txt:12`). The line says only "close to the 300 s per-file limit", so it understates what happened. It is a wording issue in a known-bug line, not a harm the standard lists. It still records the risk and points the next person to the file.
  - **NOTE:** the six hosted runs I read range from 204.9 s (this lane's build tip, run 41378502850) to 265.3 s, so "264 s" is the top of that range, not a steady figure.

**Other round 1 notes:** the two notes not recorded are the FEAT-008-versus-FEAT-031 placement and the `m3-blocks.mjs` coverage. Both are about bookkeeping or lane scripts, not product bugs, so leaving them out is reasonable.

**Checks I ran (read-only):**
- `node scripts/known-bugs.mjs --root .` → `names=0 sizes=0`, exit 0.
- `npm run readme:check` → exit 0.
- `identity-scan --root .` → exit 0.
- The worktree stayed clean afterwards.

**Harms:** none. Only Markdown changed. Nothing writes outside the worktree, and nothing main does today stops working.

VERDICT: LAND
