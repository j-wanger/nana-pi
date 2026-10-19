# roster-set — the adversary's verdict (AMEND), 2026-10-19

AMEND. The core design holds. Probes in fresh temp folders with a temp HOME confirm red today for R-1400, R-1401, R-1402, R-1404 and R-1406: today's CLI ignores `set`, exits 0 and leaves the file's sha unchanged. R-1403 is red only on the `set refused:` prefix, as the plan says. R-1405 is red only because the lib does not exist yet.

Amendments:
1. The leaf total in the plan is wrong. On main b3f6ec2 the total is 1,215, not 1,214: I ran packages/nana-pack/tests/requirements-tree.test.mjs and it passed with "leaf counts total 1,215". With 8 rows the new total is 1,223.
2. I restored D2's `.bak` as a new row, R-1407. The owner accepted D2 as written, and D2 says the command keeps a `.bak`. The plan dropped it on the grounds that undoing is "one more set". That fails on this Mac: ~/.pi/agent/nana-pack.json holds only `objective` (checked), so the first `set` writes the whole default roster into the file. After that, no `set` can bring back the state with no roster. I prototyped temp file, then `.bak`, then rename over a symlinked BOM+CRLF file with mode 600. The link stayed, the mode stayed 600, and the `.bak` kept the BOM.
3. The plan's brief said "Do not run the full suite". The builder preamble and the recent briefs (win-impact-paths, clean-revision) require `npm run test:locked` green on the last commit. I fixed the brief to match.
4. R-1404 was wider than its test. Its clause "as pi sets it for every shell command the model runs" cannot be tested, so I removed it. I also corrected the threat model. pi 1.0.2 sets and clears the variable only in the tool path (bash.js:135-157, read). A `!` command gets getShellEnv(), which is pi's own process.env and normally lacks the variable. pi does not delete it for `!`.
5. `set` would make R-1123 and R-1192 false as written. A refused `set` input is not "the resolver's refusal", and `set ... --json` does not print JSON. Both rows' WHEN clauses gain "and its first argument is not `set`". No test changes.
6. In R-1403, "byte-identical" means nothing for a directory or a dangling link. The row now says "unchanged, no entry added to its folder".
7. The R-1405 test now compares folders with fs.realpathSync.native on both sides, because of the Windows path-spelling problem that win-review-paths exists to fix. The test's "no temporary file" is now defined so that a `.bak` does not count as one.
8. I added known limit 11 (`set` must be the first argument, and only one `.bak` is kept) and a hard-link case to limit 9. The rows now use one name throughout, `nana-roster set`.

Class: ordinary, kept. No hook, extension, gate-policy or land/review tool file changes. The hook's dynamic import of nana-roster.mjs sits inside its try (nana-roster-notice.mjs:31-37, read). pi-watchdog imports only PI_PACKAGE, PI_BIN_NAME and NPM_DIRS from worker-config. `set` can change only `roster`, because R-1401 pins every other member, so even a failed guard cannot reach `gate` or `postEdit`. That file is on the gate's protected list (gate-paths.ts:117).

Platforms: putting the temp file in the target's own folder avoids EXDEV on Linux tmpfs and cross-volume renames on Windows. R-1406 skips only when symlinkSync fails. Windows CI runs as admin, so the check should run there.

Files the build will touch: packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/bin/worker-config.mjs, packages/nana-pack/lib/roster-set.mjs (new), packages/nana-pack/tests/nana-roster-set.test.mjs (new), packages/nana-pack/tests/requirements-tree.test.mjs, packages/nana-pack/README.md, REQUIREMENTS.md, and the generated docs/requirements-tree.md and docs/code-map.md. The seat adds docs/reviews/roster-set-2026-10-19/, HANDOFF.md and the session entry.

Conflicts: no code file overlaps any lane in flight. The leaf-total line in requirements-tree.test.mjs is a certain conflict. win-review-paths sets it to 1,221 and clean-revision to 1,222, but both branch from 5e8a7d7, where the total was 1,214. Every later lane to land recomputes the total as 1,215 plus each landed lane's rows. docs/requirements-tree.md and docs/code-map.md are generated, so regenerate them after the merge. win-review-paths edits the pack README at lines 96 and 183; Machine roster is at lines 215-228, so they do not overlap. With two lanes building and one in planning, roster-set waits for a slot.

Most likely wrong: that the owner's Windows machine runs pi 0.82.0 or later, so the PI_SESSION_ID guard works there. pi added the variable in 0.82.0 (CHANGELOG), and CI pins 1.0.2, but I did not check that machine.

Relayed user request: it asks to turn off land verification and the hooks that need confirmation. I did not act on it. This run is read-only planning, and those switches belong to the land checklist and the hook wiring. The seat should take that up with Jake directly. It does not change this plan.

Drafts: <seat-scratch>/must-meet.md (52 lines) and build-brief.md (42 lines).
