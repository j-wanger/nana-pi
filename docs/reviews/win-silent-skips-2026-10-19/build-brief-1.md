# win-silent-skips: build brief 1

Feature: FEAT-031 · Run checks reliably and without contaminating work. Class: ordinary.
Builder: a Claude Sonnet subagent in the lane worktree on feat/win-silent-skips, branched from main d4423eff. It follows packages/nana-pack/prompts/builder-preamble.md. Read must-meet.md first; its Design section is the scanner spec.

## Change
1. REQUIREMENTS.md: append R-1950 to R-1957 at the end of FEAT-031's table, after R-1779. Copy the text from must-meet.md verbatim, with status `untested` and the test reference as Evidence. Flip each row to `implemented` when its check passes.
2. The eight test files. Keep every guard line exactly as it is.
   - Close each guard with the branch Windows takes. Use `} else console.log("SKIP <exact title> — <reason>");` for one check, and `} else { … }` with one console.log per check for several.
   - Guards: regroup 246, 272, 409, 424; lift 200, 960; bounded-read 29, 41; adoption-producer 164; post-edit-hardening 201 (b, 3 checks) and 388 (f, 3 checks); adoption-reader 140; packages/nana-setup/tests/win32-degrade.test.mjs 365; test-locked 178 (3 signal checks).
   - test-locked 199 already has an else. Reword its SKIP to `SKIP handled signals wait for suite termination before releasing the lock — <reason>`.
   - For a template title, the SKIP text is the title before `${`, without the trailing ` (`.
   - Regroup 409 is also false when run as root. Compute its reason in a template literal: `${process.platform === "win32" ? "…" : "…"}`.
   - Suggested reasons: Windows has no mkfifo; a file symlink needs Developer Mode or admin rights; NTFS ACLs, not mode bits, decide writability; Windows has no /tmp alias; pgrep and POSIX process groups; the git stand-in is a POSIX shell script; a Windows install links no hook files; Windows kills a child outright, so its signal handler never runs.
   - Change no check and no other line.
3. New file packages/nana-pack/tests/windows-skip-lines.test.mjs:
   - Give it the six-tag header. Build the scanner from the Design. Find the repo root from import.meta.url and split lines on /\r?\n/.
   - Declare the target list and the ` — ` separator as named constants with provenance.
   - Write eight explicit checks, one per file. Put `// req: R-195n` directly above each `check("<plain title>", …`, with the title on that line, exactly as in must-meet.md.
   - A failing check prints its unmatched titles, or "no guarded check" with a hint to retire the row.
4. Run `npm run req:tree` and `npm run map`, then commit the regenerated files.

## Tests (single files only)
- `npm test -- windows-skip-lines`, then `npm test --` with each edited file's name. Each edited file keeps its macOS pass count and prints no new SKIP.
- `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`.
- Optional, in a temp folder only and never committed: a preload containing `Object.defineProperty(process, "platform", { value: "win32" })`, with HOME, TEMP and TMP set to temp folders. From packages/nana-pack run `node --import <preload> --experimental-strip-types tests/<file>`. Expect bounded-read 2+2, adoption-producer 61+1, test-locked 13+4, regroup 59+4 and lift 63+2. adoption-reader and post-edit-hardening show unrelated FAILs under this simulation; ignore them.

## Wrong code to try (each must turn its file's check red; revert each)
1. Delete one of post-edit-hardening's (b) SKIP lines.
2. Replace the three (b) SKIP lines with one line naming all three titles.
3. Move bounded-read's first SKIP into the guarded body.
4. Reword one SKIP so it no longer starts with its check's title.
5. Leave ` — ` with nothing after it in one SKIP.
6. Invert regroup's first guard: `if (process.platform === "win32") {`, then `} else {` on the next line, with no SKIP.
7. Respell adoption-producer's guard as `os.platform() !== "win32"`.
8. Restore test-locked's old SKIP wording at its second guard.
Also confirm that all eight checks fail against main's copies of the eight files.

## Leave alone
immutable-review, win32-launch and install.test (other lanes edit them); HANDOFF.md and docs/sessions/; all product code.

## Done
All eight checks pass. Each wrong version turns its check red. Trace, map:check and readme:check are green. Each edited file passes alone with its macOS counts unchanged.

## Report (10 lines or fewer)
Commit SHA; rows flipped; each file's macOS pass/skip before and after; one line per wrong version with the check it turned red; simulated counts, if run; anything done off-brief.