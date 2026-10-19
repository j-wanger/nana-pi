# knowledge-refresh-pin: build brief 1

Feature: FEAT-004 · Retrieve relevant context with provenance (R-1713 homes in SUB-015 under FEAT-013). Class: ordinary. Builder: pi gpt-5.6-sol through pi-worker (slate: complex). Follow packages/nana-pack/prompts/builder-preamble.md in ~/nana-pi-wt/knowledge-refresh-pin on feat/knowledge-refresh-pin. Run single test files only, each with HOME and USERPROFILE set to a fresh temp folder, as the runner does. Never edit HANDOFF.md or docs/sessions/. Do not touch lib/hook.ts, bin/nana-knowledge.ts or the extension; if a check reds because of them, stop and report.

## Change
1. Run `npm run map:impact -- <file>` on the three test files.
2. Shared rule for R-1711 to R-1713. "Rebuilt" means the index mtime is more than 60 s past the stale value AND `<home>/build.lock` is absent. Poll every 50 ms up to a named `REBUILD_DEADLINE_MS = 20000` (chosen: cold Windows CI slack). Each stale home writes its sources.json (the file's fixture src) BEFORE its first build.
3. hook.test.mjs:
   - R-1710, in a block right after the staleness block's final mtime reset. Import getMeta from lib/db.ts. Read `built_at` with openDb(dbFile) before. Set the mtime 2 h back. Run `call(payload({ session_id: "stale-1", prompt: "what is the pi review round cap" }), { spawnFn: counter })`. Read `built_at` after, then reset the mtime to now. Pass: reason ok, output names rounds.md, counter 1, `built_at` unchanged.
   - R-1711, after the malformed-stdin checks and before the lock tests. Make `stalehome` in td: sources.json, then `await build()` with NANA_KNOWLEDGE_HOME switched to it and back; mtime 2 h back.
   - Spawn `node <cli> hook` with piped stdio, `detached: process.platform !== "win32"`, env NODE_NO_WARNINGS=1 and NANA_KNOWLEDGE_HOME=stalehome. Stdin: `payload({ session_id: "stale-cli", prompt: "what is the pi review round cap" })`.
   - On `exit`, POSIX only: `try { process.kill(-child.pid, "SIGKILL") } catch {}`. Collect stdout and stderr until `close`, then wait for rebuilt.
   - Print `NOTE stale pull: exit <ms>, output closed <ms>, rebuilt before close <bool>, rebuilt <ms> after close`.
   - Pass: exit 0, empty stderr, line 0 starts `[nana:knowledge]`, at least one more line, every later line starts `- `, rebuilt inside the deadline.
   - Add `// req: R-230` above "no index: spawns a background build" and `// req: R-892` above "no index: does NOT build synchronously".
   - Header @effects gains: kills the hook command's process group on POSIX and waits for one background build to finish.
4. extension.test.mjs, block (12) before cleanup: its own stale home (sources.json, then build with the env switched), mtime 2 h back. Call the handler with session "pi-stale" while NANA_KNOWLEDGE_HOME names the stale home, then restore it and wait for rebuilt. Print `NOTE pi stale pull: injected <ms>, rebuilt <ms> after`. Pass: content line 0 starts with HEADER, at least one more line, each starts `- `, rebuilt inside the deadline.
5. hooks-win32-exec.test.mjs, a block right after KH1: set `<knowledgeHome>/index.db` mtime 2 h back. Run `spawnEntry(knowledgeEntry, { hook_event_name: "UserPromptSubmit", prompt: "quasar nebula telescope horizon findings once more", cwd: project, session_id: "win32-stale" })`. Record whether the mtime had moved on return. Sync-wait for rebuilt with `Atomics.wait` on a SharedArrayBuffer. Pass: stdout starts `[nana:knowledge]`, includes `windows-fixture.md`, rebuilt. Detail: `${detail(r)}; rebuilt when the command returned: <bool>; rebuilt <ms> later`.
6. REQUIREMENTS.md: R-1710 to R-1712 after R-897 in FEAT-004; R-1713 after R-1330 in SUB-015; exact text from the rows list.
   - Retire R-237 with Evidence "superseded by R-1710, 2026-10-19" and R-897 with "superseded by R-1711, 2026-10-19".
   - Mark R-230 and R-892 implemented, each citing the two titles it now carries.
   - Mark each new row implemented with its title once green. R-1713 cites its title plus "Windows-leg-only; the seat records the CI run".
7. Run `npm run req:tree` and `npm run map`. While the R-291 leaf total exists, set it in the check title, the literal and the message to the total `node scripts/requirements-trace.mjs` prints: 1304 on main a1d07f6; recompute after any merge.

## Tests
Titles are exact; see must-meet.md. Put `// req:` directly above, with `check("title", …` on one line. R-1710 also carries `// req: R-892`; R-1711 also carries `// req: R-230`.

## Wrong code (macOS, temp HOME only; restore after each; each must red the named checks)
W1 `detached: false` in spawnBuild: R-1711. W2 build `stdio: ["ignore","inherit","inherit"]`: R-1711, R-1712. W3 `if (freshness === "spawned") return none("stale")` after the existsSync line: R-1710, R-1711, R-1712. W4 `await build()` inside runHook when spawned: R-1710. W5 `[cli, "biuld"]`: R-1711, R-1712. W6 build env `{ NODE_NO_WARNINGS: "1", PATH, HOME }` only: R-1711, R-1712. W4 and W6 leave a build in a stray temp home or under the temp HOME; delete what they leave.

## Done
These single files are green: hook.test.mjs, extension.test.mjs, requirements-tree.test.mjs, requirements-trace.test.mjs. `node --check` passes on hooks-win32-exec.test.mjs, which SKIPs on macOS. `node scripts/requirements-trace.mjs` exits 0 with 0 off EARS form. `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check` are green. The seat reads R-1711 to R-1713 and both NOTE lines on the draft PR's Windows leg, and runs install-check before the land.

## Report (at most 10 lines)
Give the commit SHA and the files changed; each new check's PASS line; W1 to W6 with the checks each turned red; both macOS NOTE lines; the single-file counts; the trace, map, README and tree results; the leaf total; anything not done.
