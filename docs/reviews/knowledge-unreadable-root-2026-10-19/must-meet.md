# knowledge-unreadable-root: must-meet

Feature: FEAT-003 · Index and connect existing knowledge sources

One sentence: a build that meets a configured root, or a folder under a root, that exists but cannot be listed keeps the rows under it and prints that path UNREADABLE with exit 0, while a file deleted from a folder it could list is still purged; `status` marks such a root UNREADABLE, not ok.

Why: walk() in lib/build.ts swallows every readdir failure, and the caller counts the walked root as scanned, so the purge loop deletes every row under it. The hook starts this build in the background in both seats. A root that is briefly unlistable (a permission change, a macOS privacy-protected folder read from a context without access, a Windows deny rule) empties its part of the index until a later build.

Class: hook. bin/nana-knowledge.ts is the Claude Code UserPromptSubmit hook command and the pi extension's child; lib/build.ts runs as the hook's detached build. The two 10-19 knowledge pin plans named a change here hook-class. So: roster reviewer, land reviewer, seat wrong-code pairs, one independent check, install-check on macOS before nana-land.

Threat model: honest filesystem variation in scope (POSIX modes, macOS privacy denial, Windows deny ACLs, offline folders; macOS, Linux and Windows on Node 22). A hostile filesystem and forged index files are out.

## Design
- walk() records every directory it cannot list, the root or a folder under it, in a new `BuildStats.unreadable: string[]`, whatever the error code. A root it cannot stat or list makes walk() return false; the caller leaves it out of `roots`, so it is not scanned.
- Purge loop: a row of a configured root is kept (preserved, files and rows counted) when its root was not scanned or its path lies inside an unreadable path. Export `contains` from lib/sources.ts and reuse it; no second prefix check.
- No error-code classification. A folder that vanishes mid-build is named UNREADABLE and purged one build later; that costs no constant and no wrong-code pair that cannot be red on macOS.
- CLI build prints `  <path>  UNREADABLE (skipped, rows kept)` per entry after the MISSING lines and before the summary (setup reads the last line holding "files ").
- CLI status per root: stat fails gives MISS; a directory that `fs.opendirSync(p).closeSync()` refuses gives UNREADABLE; else ok. Root level only.
- README: the missing-root paragraph also covers a root or folder that cannot be listed. Headers of build.ts, sources.ts and the CLI updated.
- Test: new tests/unreadable-root.test.mjs, one fixture, one CLI build and one status in the denied state. Denial is chmod 000 on POSIX and `icacls <dir> /deny *S-1-1-0:(RD)` on win32, restored in finally. Precondition: statSync succeeds AND readdirSync throws for each denied folder; otherwise the four denial checks print a declared `SKIP <full title> — <reason>` (uid 0, or a Windows token that bypasses the ACL). Never a silent skip. R-883's check always runs.

## Must-meet
| Row | Requirement (EARS) | Test (file::title) | Red today |
|---|---|---|---|
| R-1910 | IF a configured root exists but cannot be listed, THEN the build shall keep that root's indexed rows searchable. | unreadable-root.test.mjs::R-1910: a root that exists but cannot be listed keeps its rows searchable | RED (probe) |
| R-1911 | IF a folder under a scanned root cannot be listed, THEN the build shall keep the rows of the files under that folder while still purging a file deleted from a folder it could list. | unreadable-root.test.mjs::R-1911: a folder that cannot be listed keeps its rows while a file deleted elsewhere under the root is purged | RED (probe) |
| R-1912 | WHEN a build meets a root, or a folder under a root, that exists but cannot be listed, the build command shall print that path marked UNREADABLE and exit 0. | unreadable-root.test.mjs::R-1912: build names an unlistable root and an unlistable folder UNREADABLE and exits 0 | RED (probe) |
| R-1913 | WHEN a configured root exists but cannot be listed, the status command shall mark it UNREADABLE instead of ok. | unreadable-root.test.mjs::R-1913: status marks a root that cannot be listed UNREADABLE, not ok | RED (probe) |
| R-883 pin | WHEN a root is missing, it shall be reported, treated as non-fatal, and keep its rows searchable. | unreadable-root.test.mjs::R-883: build names a missing root MISSING and status marks it MISS, both exiting 0; markers on incremental-build `missing root reported, not fatal`, `missing root: it is still reported missing`, `missing root: its rows are still searchable` | green; W12, W13 red |
| R-207 pin | Rows shall be purged only when the file vanished from a root that was actually scanned or the root left sources.json. | markers on incremental-build `deleted file is removed from the index`, `missing root: nothing is removed`, `root dropped from sources.json: its rows are purged` | green; W15-W17 red |

## Evidence (adversary probe: main 32d6aa8b, temp clone, temp HOME, macOS, Node 22.22.2)
- Today: 4 files indexed; delete one file, chmod 000 root a and folder b/locked: build "removed 3", status "ok" for a, no line names either path.
- Draft test on today's lib and bin: R-1910 to R-1913 FAIL, R-883 PASS. On a sketch of about 20 lines (no error-code set): all five PASS; incremental-build 27, discovery 37, hook 98, extension 38 PASS alone. Trace exit 0, ears 0; req:tree moves only the CAP-01 and FEAT-003 lines; readme 0 problems.
- Wrong code on the sketch, each red: W1 root listing failure counted scanned: R-1910, R-1912. W2 folder failure not recorded: R-1911, R-1912. W3 an unlistable folder keeps its whole root: R-1911. W5 no UNREADABLE line: R-1912. W6 status by existence: R-1913. W12 no MISSING line, W13 status ok for a missing root: R-883. Incremental-build: W15 purge every unseen row, W16 never purge, W17 keep an unconfigured root's rows: the R-207 checks.

## Cut by the adversary
- R-203, R-235, R-236 pins and a README junction line: not this feature; nine rows broke the cap of eight; R-203's Windows junction typing is unverified and a red would turn a pin into a fix mid-lane. They stay untested for a later pin lane.
- The ENOENT/ENOTDIR "gone" set (see Design).

## Known limits
- A discover parent that cannot be listed drops its discovered roots from the configured set, so their rows purge (probed today and on the sketch: removed 1). A missing parent takes the same catch (read, not probed). Residual for a later lane.
- A folder that lists but whose entries cannot be stat'd (POSIX r-- without x) still purges them.
- An unreadable single file keeps its rows silently, as today; status checks roots only.
- The hook's background build prints to no one; the fix that matters is no purge.
- A file really deleted under an unlistable folder stays indexed until the folder lists again.
- Windows is inferred: that the icacls deny makes readdir and opendir fail while stat succeeds. The CI Windows leg decides; a SKIP there is a residual. Root on POSIX prints SKIP.