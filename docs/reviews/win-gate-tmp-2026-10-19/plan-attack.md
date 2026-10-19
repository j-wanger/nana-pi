# win-gate-tmp — the adversary's verdict (AMEND), 2026-10-19

AMEND. The design holds, but the plan needs five fixes before it is built. I probed it on a temp copy (macOS, temp HOME, main b3f6ec2).

Probes:
- On today's code, R-1431 and R-1432 case pairs BLOCK in both directions.
- The relative `x.txt` with root `LANE` and cwd `Lane` is blocked.
- R-1433's `~`, `@` and `file://` outside targets are all ALLOWED. That is a fail-open on every OS.
- After the planned 6-line fix, all of these flip.
- gate-corpus (227), gate-status (23) and the nine existing lane-write-guard checks match today. gate-policy-paths fails one check in my environment both before and after the fix.
- Lane class gate is right, because nana-gate.ts is a pi extension.

Amendments:
1. **Vacuous passes on Linux.** scripts/test.mjs:305,383-387 puts the suite's HOME and TMPDIR under the real OS temp, which is /tmp on Linux. /tmp stays a permitted root there, so every spelling sub-check would pass whatever the code does. My macOS probe hit the same effect: with HOME under the temp root, the existing symlink-escape check fails on today's code. Added a check that each case cannot pass vacuously: a sibling-folder target under the same env must be refused, otherwise print SKIP and never count it as PASS. A pair also SKIPs when its two spellings are equal strings. Corrected the plan's "Linux checks something": in the suite, Linux runs only R-1430's POSIX half and R-1433.
2. **R-1433 file URLs.** They must be built with `url.pathToFileURL(p).href`. Probed: a drive-less `file:///...` throws ERR_INVALID_FILE_URL_PATH on win32. The gate would then judge `<lane>\file:...` and allow it, so the check would fail falsely on Windows after the fix. Also added: assert the outside folder still does not exist afterward. The Windows runner is admin, so C:\ is writable.
3. **R-1430 row.** It now has the WHEN condition and one "shall". It is narrowed from "a drive's \tmp" to the \tmp of the gate process's current drive, which is the only one the test checks and the only one the old code added. The literal `/tmp/...` form is likely green on CI today, because it is judged on the session's C: drive while the root is D:\tmp (inferred). Only the absolute form is red.
4. **Files the plan left out.** The plan commit must regenerate docs/requirements-tree.md (the CAP-02 and FEAT-006 counts and IDs). It must also bump the leaf total in packages/nana-pack/tests/requirements-tree.test.mjs from 1,215 to 1,219. The brief's Done now includes the requirements-tree test.
5. **Wording.** R-1431 and R-1432 got minor tightening. The Git Bash /tmp claim is now marked inferred.

Files the build touches:
- packages/nana-pack/extensions/nana-gate.ts
- packages/nana-pack/tests/lane-write-guard.test.mjs
- REQUIREMENTS.md, docs/requirements-tree.md and packages/nana-pack/tests/requirements-tree.test.mjs (plan commit, plus the status flip)
- packages/nana-pack/README.md (about line 211)
- docs/code-map.md, only if @purpose changes
- docs/reviews/win-gate-tmp-2026-10-19/
- HANDOFF.md and docs/sessions/ (seat only)

Conflicts:
- No code file overlaps an in-flight lane.
- Certain text conflict: win-review-paths sets the leaf total to 1,221 and clean-revision sets it to 1,222. Both edit the same leaf-total line in requirements-tree.test.mjs and the same CAP-02 line in docs/requirements-tree.md. Whichever lands second re-runs `npm run req:tree` and recounts.
- REQUIREMENTS.md and README hunks are separate. win-review-paths' README edits sit at about lines 96-186.
- R-1430 to R-1439 are free on main and in every worktree.

The claim most likely wrong: on the Windows runner, JS fs.realpathSync keeps `C:\Users\RUNNER~1` while realpathSync.native expands it. If so, the 8.3 halves of R-1431 and R-1432 are red today. Supporting evidence: pi-worker already uses native realpath on win32. The runtime-map CHANGE notes say native turns RUNNER~1 into runneradmin. The JS half has not been measured on Windows. If the claim is wrong, the fix is still correct, and Windows red comes from R-1430 only.

Not acted on: the relayed user request to turn off land verification and the hooks that need Jake's confirmation. This is a read-only planning subagent. Turning off hooks or land checks changes hook, permission and land configuration, which this role cannot do. That request goes to the seat and Jake.

Evidence: probe script and both documents are in <tmp>/plan.FPPp9k/ (probe.mjs, mm.md, brief.md; fixed/ holds the patched copy).
