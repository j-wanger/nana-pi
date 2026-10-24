Feature: FEAT-014 · Create or adopt a project workspace. Lane project-check-line, rows R-2760 to R-2765 (R-2624 and R-2628 retire). Class: hook (the SessionStart stale-copy producer's output and the nana-rulings extension's output change). Builder: pi-worker (larger lane). Build session 1 of 1: the whole lane.

Work in the lane worktree on feat/project-check-line. The spec is `docs/reviews/project-check-line-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ: the by-hand rule covers AGENTS.md absent with CLAUDE.md odd (S2); the gate read and the rows' text read use the producer's bounded, fatal, BOM-kept decode (S3); the objective arm tests an entry by lstat (S4); both command spans take the no-path fallback (S5); `projectFileRows` guards only the CLAUDE.md read (S7); R-2623's one last-line assertion changes as S1 says. Read the draft for its measurements, design D1 to D8, the row texts (verbatim), the tests, the Windows notes and the docs list, and `plan-attack.md` for every fixture the must-meet adds. Before editing, run the map impact command on packages/nana-setup/lib/project.mjs and packages/nana-setup/lib/stale-copies.mjs, and work from the blast radius. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Precedent:
- packages/nana-setup/lib/project.mjs — `checkProject` and its closures `fileState`, `seed` and `monthFiles` and the row blocks for the four seeds, the working region, the navigation file and CLAUDE.md (these move into the new shared module as `projectFileRows`); `seedEntry`, `lstat`, `today`, `CLAUDE_IMPORT` and `PLACEHOLDER_RE` (these move with them and are imported or re-exported back).
- packages/nana-setup/lib/working-region.mjs — `markerLines`, `readSharedWorking` and `regionVerdict`, unchanged; the gate's marker test uses `markerLines`.
- packages/nana-setup/lib/stale-copies.mjs — `projectStaleLine`: the role guard, the root walk, the skips, the bounded fatal read, and the fix rendering with its no-path fallback; `staleNotice` is the model for the by-hand sentence.
- packages/nana-setup/lib/stale-copies-config.mjs — the prefix, section, label, root phrase and no-path characters, all reused unchanged.
- packages/nana-setup/bin/nana-setup.mjs — the check's ✓/!/✗ rendering and its by-hand summary, which R-2763 compares against; unchanged.
- packages/nana-setup/bin/stale-copies.mjs and packages/nana-pack/extensions/nana-rulings.ts — the two callers; code unchanged, headers only.
- packages/nana-pack/lib/bounded-read.mjs and packages/nana-pack/lib/display.mjs — `BOUNDED_READ_CAP`, `CODE_SPAN_CAP` and `codeSpan`.
- packages/nana-setup/tests/project-stale.test.mjs — the harness (`repository()`, `childEnv`, `sectionsFor`, `within`, `CASE_LIMIT_MS`, `expectedLine`, the child-process preload) and the R-2624 and R-2628 fixture lists that move.
- packages/nana-setup/tests/project-odd-seeds.test.mjs — how a test parses the check's by-hand summary.

Named moves the brief accepts: `checkProject`'s file-row closures and row blocks, `seedEntry`, `lstat`, `today`, `CLAUDE_IMPORT` and `PLACEHOLDER_RE` → new `packages/nana-setup/lib/project-rows.mjs` (six-tag header; imports only `node:fs`, `node:path` and working-region.mjs), imported or re-exported back by project.mjs. No other helper moves.

Traps:
- The lift must keep `project --check` byte for byte: every row's label, ok, detail, note and order. An AGENTS.md read error still reaches `checkProject` (S7).
- The producer starts no child process and imports no TypeScript; it never calls `checkProject` or `setupProject` (R-2627).
- The line carries no text read from an entry: no detail, no link target.
- On win32 the symlink, mode and double-quote cases SKIP with their reason; fixtures seed a prior-month log so no case depends on today's month, except the this-month-directory fixture, which skips if the month changes mid-case.
- Keep every escaped `\n` in test template literals that you do not mean to change.
- A needed change to the hook entry, `hook-producer.mjs`, settings wiring, install, uninstall, doctor, the gate, nana-land or the review tools stops the build: report it instead.

Steps, in order:
1. Rows first: R-2760, R-2761, R-2763, R-2764 and R-2765 in SUB-016 beside R-2623 to R-2627, and R-2762 in SUB-021 in R-2628's place, each `untested`, with the draft's verbatim texts; retire R-2624 ("replaced by R-2762, R-2764 and R-2765") and R-2628 ("replaced by R-2762"). Add `Read by: R-327 · prompt: packages/nana-setup/bin/stale-copies.mjs` and `Read by: R-327 · prompt: packages/nana-pack/extensions/nana-rulings.ts` after R-327's last reader line, before its park line.
2. Tests in project-stale.test.mjs with `// req:` markers directly above and the must-meet's exact titles, every case the draft and the must-meet's decisions list. Check by hand once that each new check is red on main's code, and say so in the report (do not commit those checks).
3. Code as the must-meet's decisions and the draft's D1 to D8 say.
4. Docs: the READMEs and headers as the draft's docs list says. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: project-stale, project, project-odd-seeds, project-working-region, project-dismiss, stale-copies, hook-producers, hooks-closed-output, rulings and adoption-reader test files each alone with `CLAUDE_CONFIG_DIR` unset and a scratch TMPDIR and HOME; `node scripts/requirements-tree.mjs --check` (no `deliverable note:` line); `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `npm run test:locked`. You cannot run Windows here; reason about its paths from the code and say what you could not run.

Seat check: `node docs/reviews/project-check-line-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and was red on main, `project --check` output is unchanged on every fixture the existing tests use, the tree check prints no note, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main; each existing test you edited and why; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace and seat-check status; what you could not run.
