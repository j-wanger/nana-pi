# rm-outside-asks — build brief 1

Feature: FEAT-010 · Guard risky commands and protected resources
Lane class: gate (nana-gate policy, pi extension). Builder: pi gpt-5.6-sol through `pi-worker --lane rm-outside-asks`, in `~/nana-pi-wt/rm-outside-asks` on `feat/rm-outside-asks`, based on main after lane-guard-temp-root has landed. Follow `packages/nana-pack/prompts/builder-preamble.md`. Run single test files only. Never edit HANDOFF.md or docs/sessions/.
Read first: this lane's `must-meet.md` (design, rows, test shapes, known limits), `lib/gate-rm-inside.ts` (style, `realPath`, the `inside` helper, contract comments), `commandHit` in `extensions/nana-gate.ts`, `lib/gate-shell.ts`, and the temp-root helper lane-guard-temp-root landed.

## Change
1. `lib/gate-shell.ts`: export `commandIndex`, `base` and `PS_REMOVE`. No behaviour change.
2. New `lib/gate-rm-outside.ts`, six-tag header, named exports only: `rmOutsideTargets(segments, cwd, tool, { home, tempRoots, segmentable })` returns a Map from segment to the full path (`path.resolve`) of its first outside target. Follow must-meet "Design" exactly: `realPath` each temp root as well as the cwd; drop redirection operands found in the segment text, since `tokens(text, true)` splits `2>/dev/null` into `2` and `/dev/null`; a cd's folder is its first word not beginning with `-`; when `segmentable` is false a cd adds a folder instead of replacing one. Never throw. Vocabularies (cd words, PowerShell path and value parameters, home spellings) are named constants with `// contract: R-23nn` provenance, as gate-rm-inside does. Reuse gate-shell's `tokens`, `commandIndex`, `base`, `PS_REMOVE` and `realPath`; import the containment helper (`within`) and `acceptedTempRoots` from `lib/gate-temp-roots.ts`, which lane-guard-temp-root landed; do not add a third copy of the containment helper.
3. `extensions/nana-gate.ts` `commandHit`: keep the detection segments in their own list; after the in-folder exemption, run `rmOutsideTargets` over the exec segments, then over the detection segments when the command is unsegmentable; for a hit segment whose danger is null, set `{ reason: "rm outside the working folder: <path>", floor: false }`. Pass the roots from `acceptedTempRoots` (lib/gate-temp-roots.ts) and `os.homedir()`. Add one line about it to the file's header comment.
4. New `tests/gate-rm-outside.test.mjs`: the eight checks and test shapes in must-meet, with each `// req: R-23nn` line directly above `check("title", …` on one line. Six-tag header. Fixtures under one `tmpDir` root F; junctions for folder links on win32. Handler checks: HOME and USERPROFILE at `F/home`; TMPDIR (TEMP and TMP on win32) at `F/tmproot`, set after the fixtures exist and restored at exit. No skips: every case runs on macOS, Linux and Windows.
5. `REQUIREMENTS.md`: rows R-2330 to R-2337 in FEAT-010 after R-2243, word for word from must-meet, each `implemented` with its evidence once its check passes. Then `npm run req:tree`.
6. `packages/nana-pack/README.md`: a new gate bullet after the in-directory exemption naming the asked forms, the temp-folder and in-folder passes, the unjudged forms and the known limits, and saying pi only, since Claude Code has no nana command gate. In the exemption bullet, replace "plain `rm` and `rm -f` still pass anywhere outside the working directory, as before — making those ask too is a separate lane" with a pointer to the new bullet.
7. `npm run map`; `npm run map:check` and `npm run readme:check` green.

## Tests to run (one file at a time)
gate-rm-outside (8 PASS), gate-rm-inside (11), gate-corpus (227), gate-survives-mutation (38), gate-status (23), display-surfaces (181), pipe-guard (84), lane-write-guard, agent-dir-hostile (28), gate-self-protection, gate-policy-paths, config-project-gate-fallback. Counts other than the new file must not change.

## Wrong code to try (each must turn the named check red; revert after)
(a) no outside check → R-2330, R-2331, R-2334, R-2335, R-2336. (b) ask on every non-recursive rm → R-2332, R-2337.
(c) no temp roots → R-2333. (d) realPath the whole target, following a last-part link → R-2332. (e) lexical parent, no realPath → R-2334, R-2333.
(f) ignore cd → R-2335. (g) a target that begins with another variable asks → R-2337. (h) judge only the first target or the first rm → R-2331.
(i) treat words after `--` as flags → R-2331. (j) bash only → R-2336. (k) containment by string prefix → R-2331.
(l) reason without the path → R-2330. (m) `~`/`$HOME` left unjudged → R-2331. (n) redirection operands judged as targets → R-2332.
(o) the PowerShell `-Path` value skipped → R-2336. (p) a cd in an unsegmentable command replaces the folder instead of adding one → R-2335.
(q) temp roots compared as typed, with no realPath anywhere on them → R-2333 (macOS `/var`, Windows 8.3). (r) a cd's flag word read as its folder → R-2335.

## Done
All eight checks PASS; the listed files keep their counts; every wrong version above turns its check red; map and README checks green; the trace rail shows R-2330 to R-2337 implemented.

## Report (≤ 10 lines)
Commit SHA(s); PASS counts per file run; wrong-code results as letter → check red or not; any deviation from the design and why; anything left open.
