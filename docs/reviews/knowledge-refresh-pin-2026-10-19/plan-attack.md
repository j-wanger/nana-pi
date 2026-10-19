# knowledge-refresh-pin — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building, but four things in the plan were wrong or too broad. I checked each with a probe on a temp clone of main a1d07f6, with a temp HOME, on macOS, Node 22.22.2 and libuv 1.51.0. The real repo is unchanged.

1) The wait for the rebuild has to wait for the build to finish (cross-platform bug). The plan polled only the index mtime. The build updates the mtime when it checkpoints, but it closes index.db and drops build.lock only after that. On Windows, an open file makes fs.rmSync throw. hook.test.mjs, extension.test.mjs, hooks-win32-exec.test.mjs (its finally block) and scripts/test.mjs all remove their temp folders without a try. R-1712 sits right before the extension test's cleanup, so on the Windows leg it would intermittently crash the file. Fix: "rebuilt" now means the mtime moved past the stale value AND build.lock is gone. With that wait, every draft passes: hook.test.mjs 96 PASS, extension.test.mjs 36 PASS.

2) The R-1711 row was wider than its test. Under W4 (the build awaited inside runHook), R-1711 stays green (probed). So the row's "after the command exits" is not pinned. I dropped that phrase. R-1710 already pins it and goes red under W4.

3) The test setup is a hazard to the owner's own files (probed). A build that finds no sources.json seeds one that discovers stores under HOME. Under W4, the extension test leaves a second build that starts after cleanup. It recreates the stale home in the temp folder and seeds it from HOME. The plan's own probe likely ran this way with the real HOME: a stray 47 MB index of the owner's real stores sits in the macOS temp folder (nk-ext-Lf7lFg). That folder is not mine, so I left it for the seat to delete. My own copy was tiny under a temp HOME, and I removed it. The brief now says: write sources.json before each build, and run single files and wrong code only under a temp HOME. I also added W6 (the build loses NANA_KNOWLEDGE_HOME), which turns R-1711 and R-1712 red.

4) The plan's main Windows worry is likely wrong. Node 22's node.cc calls uv_disable_stdio_inheritance at startup. libuv 1.51 (process-stdio.c) then clears the inherit flag on the std handles. So the detached build should not hold the hook's stdout pipe. I read this in the source; it has not run on Windows. The NOTE line and R-1713's detail still measure it. I also read libuv's job setup (process.c). It has SILENT_BREAKAWAY_OK and KILL_ON_JOB_CLOSE, and it does not put detached children in the job. That confirms R-1711 catches W1 on Windows through the hook's own job.

Smaller fixes:
- The lane edits a file under packages/nana-setup/, so the seat must run install-check on macOS before nana-land. The plan missed this.
- The R-291 leaf total sits in three places: the check title, the literal and the message. It is 1304 on main a1d07f6 with these four rows (probed). audit-open-questions has landed since the plan was written.
- The brief now names R-1711's stdin.
- The hook.test.mjs header edit requires `npm run map`, so docs/code-map.md is added to the file list.
- R-1713 earns its place over R-1711: it launches the build from the installed checkout path, which holds a space and shell characters.

Every wrong code reds what the plan said: W1 R-1711; W2 R-1711 and R-1712; W3 all three; W4 R-1710 plus the two no-index checks; W5 R-1711 and R-1712. Nothing is red today, because this is a pin lane. Trace exit 0, 0 rows off EARS form. The tree check, map:check, readme:check and the requirements-tree and requirements-trace tests were green.

Class: ordinary. Only tests, rows and the tree change. Conflicts are trivial. The only shared test file is hooks-win32-exec.test.mjs: four lanes edit its header line 11, and this lane inserts after KH1. No in-flight lane touches packages/nana-knowledge. waitFor: none.

The claim most likely wrong: that R-1711 to R-1713 go green on the Windows leg with no hook change. That needs three things to hold. The detached build must escape both the GitHub runner's job and libuv's job. It must finish within 20 s. And statSync on NTFS must see the checkpoint move the mtime. None of this has run on Windows.
