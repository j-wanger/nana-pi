# knowledge-refresh-pin: must-meet

Feature: FEAT-004 · Retrieve relevant context with provenance
R-1713 homes next to R-1330 in SUB-015 under FEAT-013 · Install and connect harness runtimes.

The feature in one sentence: when the index is over an hour old, a prompt in either seat still gets pointers from it at once, and a background build rebuilds the index on macOS, Linux and Windows.

Why it matters: no test runs the real background build. Every runHook call stubs spawnFn, and every CLI or pi run meets a fresh index. A broken spawn (wrong path, wrong subcommand, lost environment, build output on the hook's stdout, lost detachment) would freeze the index silently in both seats.

Class: ordinary. Tests, rows and the tree only; lib/hook.ts, the CLI and the extension stay unchanged. If a check reds on Windows because of hook code, the builder stops and reports; that fix becomes a hook-class lane. The lane touches packages/nana-setup/ (one test file), so the seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before `nana-land`.

Threat model: honest variation is in scope: macOS, Linux and Windows on Node 22; a stale index versus a missing one; a seat that tears down the hook's process group or job when the hook exits; a test that removes its temp folder right after. Deliberate forgery is out (a forged mtime, a hostile build.lock).

## Design
- Pin, not change.
- "Rebuilt" means the index mtime moved more than 60 s past the stale value AND build.lock is gone. The build checkpoints (mtime moves), then closes index.db, then drops the lock. On Windows an open index.db makes `fs.rmSync` throw, and hook.test.mjs, extension.test.mjs, hooks-win32-exec.test.mjs and the runner all remove their temp folders without a try. An mtime-only wait lets extension.test.mjs reach its cleanup while the build still holds the file.
- Each stale home writes its sources.json before its first build. A build that finds none seeds one that discovers stores under HOME.
- R-1710 runs in process in hook.test.mjs through the file's `call` wrapper (keeps the pull.log count): index mtime 2 h back, a counting spawnFn, `built_at` read before and after, mtime reset after.
- R-1711 runs the CLI with the real spawnBuild on its own stale home. POSIX: the test spawns the hook `detached` and SIGKILLs its process group on `exit`. Windows: the hook's own exit is the teardown, since libuv puts a non-detached child in the spawning process's kill-on-close job (libuv 1.51 src/win/process.c, read). One NOTE line records exit ms, close ms, rebuilt-before-close and rebuild ms.
- R-1712 drives the real pi handler on its own stale home, then the same wait.
- R-1713 follows KH1 in hooks-win32-exec.test.mjs: index mtime 2 h back, the installed command, session `win32-stale`, a fixture-matching prompt, a sync wait. Its own value over R-1711: the build is launched from the installed checkout path that holds a space and shell characters. Its detail records ms and whether the index was rebuilt when the command returned.
- Old rows: R-237 retired, superseded by R-1710; R-897 retired, superseded by R-1711. R-892 gains markers on R-1710's check and on `no index: does NOT build synchronously`; R-230 on R-1711's check and on `no index: spawns a background build`. Both flip to implemented.
- Cut: windowsHide on spawnBuild (DETACHED_PROCESS gives the build no console; hook code, out of class). Cut: R-228, R-234, R-895, R-896 (other behaviours); a HANDOFF residual the seat writes.

## Must-meet
| Row | Home | Test (file::title) | Wrong code that reds it (probed) |
|---|---|---|---|
| R-1710 | FEAT-004 | `packages/nana-knowledge/tests/hook.test.mjs::R-1710: a pull on an index older than one hour prints its pointers and returns before the index is rebuilt` | W3, W4 |
| R-1711 | FEAT-004 | `packages/nana-knowledge/tests/hook.test.mjs::R-1711: the hook command on an index older than one hour prints only the pull block and a build outside its process group rebuilds the index` | W1, W2, W3, W5, W6 |
| R-1712 | FEAT-004 | `packages/nana-knowledge/tests/extension.test.mjs::R-1712: pi on an index older than one hour injects only that index's pull block while a background build rebuilds the index` | W2, W3, W5, W6 |
| R-1713 | SUB-015 | `packages/nana-setup/tests/hooks-win32-exec.test.mjs::R-1713: on Windows the installed knowledge hook command on an index older than one hour prints the fixture's pull block and the index is rebuilt in the background` | Windows only: the file SKIPs elsewhere because exec-form entries exist only on win32 |

Row text: see the rows list. R-1711's row drops the plan's "after the command exits": under W4 the hook rebuilds before it exits and R-1711 stays green (probed). R-1710 owns that claim.

## Red today (adversary probe: main a1d07f6, temp clone, temp HOME, macOS, Node 22.22.2, libuv 1.51.0)
- Nothing is red, because the behaviour works. This is a pin lane. Drafts of all four checks with the lock-gone wait: hook.test.mjs exit 0 (96 PASS), extension.test.mjs exit 0 (36 PASS), hooks-win32-exec.test.mjs passes `node --check`. Trace exit 0 at 1304 rows, 0 off EARS form. Tree check, map:check, readme:check and the requirements-tree and requirements-trace tests were green with the leaf total at 1,304.
- Wrong code: W1 `detached: false` reds R-1711 only. W2 build stdio inherited: R-1711, R-1712. W3 stale pull returns nothing: R-1710, R-1711, R-1712. W4 build awaited in runHook: R-1710 plus the two no-index checks. W5 `biuld`: R-1711, R-1712. W6 build env without NANA_KNOWLEDGE_HOME: R-1711, R-1712.
- macOS NOTE: hook exit and output close at 74 ms; index rebuilt 104 ms after close; pi injected at 75 ms.
- Windows: none of R-1711 to R-1713 has run. Green is expected but inferred; the draft PR's Windows leg is the evidence.

## Known limits
- Windows pipe hold, revised. The plan feared the build inherits the hook's stdout and holds the seat's pipe. Node 22 calls uv_disable_stdio_inheritance at startup (src/node.cc), which clears the inherit flag on the std handles (libuv 1.51 src/win/process-stdio.c). So no hold is expected. This is read in source, not run; the NOTE line and R-1713's detail measure it.
- Claude Code's own hook teardown is unknown. R-1711 stands in with a group kill on POSIX and libuv's job on Windows.
- W1 is caught only while the build outlives the hook's exit, a margin of about 100 ms on macOS.
- Under W4, extension.test.mjs leaves a second build that starts after cleanup, recreates the stale home in the temp folder and seeds sources.json from HOME (probed). With the owner's real HOME it indexes the owner's stores into that stray folder. Wrong code runs only under a temp HOME.

## Conflicts and files
- Files: the three test files, REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md (after the hook.test.mjs header edit), and packages/nana-pack/tests/requirements-tree.test.mjs while the R-291 leaf total exists.
- No in-flight lane touches packages/nana-knowledge. win-leg-flip, parallel-runner, readme-install and adopt-closes-check change header line 11 of hooks-win32-exec.test.mjs; this lane inserts after KH1, so the merge is trivial.
- REQUIREMENTS.md, the tree, the code map and the leaf total move in every lane: regenerate and recompute after merging main. Once leaf-total-drop lands, no leaf total edit. unclaimed-tests adds an opt-in listing only. Once win-leg-flip lands, R-1711 to R-1713 must read green on the Windows leg before the final review: required evidence, not a wait.
