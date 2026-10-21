Feature: FEAT-010 · Guard risky commands and protected resources. Lane gate-rm-gitbash-tmp, rows R-2490 to R-2497. Class: install, hook or gate. Builder: pi-worker (small lane). Build session 5: wording only, from the lane's independent check at 731f5a22.

Work in ~/nana-pi-wt/gate-rm-gitbash-tmp on feat/gate-rm-gitbash-tmp (tip d46693bd). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. No push. No change to code behaviour or to any test.

The independent check found no material problem. It found three claims this lane wrote that are not always true (all read from msys2-runtime source and probed with an emulated win32 path module):
- Git Bash resolves a link in a path before it drops a component for `..` (msys2-runtime path.cc normalize_posix_path). The gate collapses `..` first, as it does everywhere else. So `rm -f /tmp/linkout/../x`, where `linkout` in TMP links outside, runs unasked while Git Bash deletes `x` beside the link's target. The same gap holds for the working folder on every system.
- `/usr`, `/etc` and `/home` spellings do not always ask: they are read on the working folder's drive, so `/Users/u/work/x` can land inside the working folder (main reads them the same way).
- `gitBashPath` and `normalizeWindowsShellPath` in `packages/nana-pack/lib/agent-dir.mjs` both read `/c/…`, with deliberately different rules (the latter mirrors pi's tool paths, with `/mnt/c` and `/cygdrive/c`).

1. REQUIREMENTS.md, row R-2493 (FEAT-010): change "that climbs out of `/tmp` with `..` (collapsed first, as Git Bash collapses it)," to "that climbs out of `/tmp` with `..` (collapsed before any link is read),". Keep every other word, the ID, the status and the evidence.

2. packages/nana-pack/README.md, the "Plain `rm` outside the working folder asks first" bullet's known limits:
   - Replace "`/usr`,\n  `/etc`, `/home`, `/cygdrive`, `/mnt` and `//host` spellings ask;" with: "`/usr`, `/etc` and `/home` spellings are read on the working folder's drive, not where Git Bash reads them; `/cygdrive`, `/mnt` and `//host` are not read as drives and ask; `..` is collapsed before any link is read, while Git Bash follows a link first;". Rewrap the paragraph's lines as the bullet wraps today.
   - Keep every other sentence word for word. No machine path, no owner name.

3. Comment only, packages/nana-pack/lib/gate-rm-outside.ts, the doc comment above `gitBashPath`: add one sentence saying that `normalizeWindowsShellPath` in `lib/agent-dir.mjs` reads pi's tool paths with other rules (`/mnt/c`, `/cygdrive/c`), and that the two are kept apart on purpose because Git Bash's mount table maps neither prefix.

4. Run `node packages/nana-pack/tests/gate-rm-outside.test.mjs` (14 PASS, 3 SKIP on macOS), `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`. Commit with explicit paths. No full suite this session; the seat runs it at the land.

Seat check: `node docs/reviews/gate-rm-gitbash-tmp-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- The row, README and comment say what the code does; nothing else changed.
- The test file, map:check, req:tree, readme:check and the trace are green; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the README sentence and the row text as written, quoted; check results.
