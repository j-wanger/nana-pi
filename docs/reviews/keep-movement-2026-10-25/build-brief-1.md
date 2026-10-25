Feature: FEAT-007 · Review a specific revision independently. Lane keep-movement. Class: hook. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/keep-movement. The spec is `docs/reviews/keep-movement-2026-10-25/must-meet.md`; read it whole before designing. `plan-draft.md` and `plan-attack.md` beside it are its inputs; the must-meet dropped the draft's store design, so where they differ, the must-meet holds. Do not edit: the product page code (`scripts/product-report.mjs` and anything under `docs/product-report/`), HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, the review standard (`packages/nana-pack/prompts/review-standard.md`), `packages/nana-pack/bin/claude-review.mjs`, `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/lib/review-movement-config.mjs`, `scripts/requirements-moved.mjs`, any file under `templates/` or `packages/nana-setup/`, any checker (`scripts/requirements-tree.mjs`, `scripts/deliverables.mjs`, `scripts/requirements-trace.mjs`, `scripts/readme-check.mjs`, `scripts/known-bugs.mjs`, `packages/nana-pack/tests/skill-claims.mjs`, `packages/nana-pack/tests/templates-render.test.mjs`), or any file in a review folder.

What the lane does, in one sentence: `review-ledger keep` also writes the tree movement section for the repository's HEAD against main into the lane folder as one file it replaces on each keep, computed by the launchers' own helper, and never refuses the review-text keep over it.

Precedent:
- packages/nana-pack/bin/review-ledger.mjs:52-97 — keep: arguments and repository at `:53-59`, planning at `:61-74`, the no-text refusal at `:75`, the `--into` checks at `:76-79`, the pre-check at `:80-90`, the writes at `:91-94`, the count line at `:95`; imports at `:34-37`; the warning form at `:134`.
- packages/nana-pack/lib/review-movement.mjs:16-31 — `reviewMovementSection`, its framing at `:27-30`; imported at `packages/nana-pack/bin/claude-review.mjs:16` and `packages/nana-pack/bin/pi-review.mjs:38`.
- packages/nana-pack/lib/review-movement-config.mjs:9-16 — the section's names to import (read only); MOVEMENT_FILE_NAME at `:27-28` is pi-review's temp file and is not reused.
- packages/nana-pack/bin/review-round.mjs:85-86 — KEEP_NAME_HASH_CHARS with its provenance comment; the new tunable goes after it. Its private writers at `:364-389` and `:443-472` are not used.
- packages/nana-pack/tests/review-ledger.test.mjs:57-66 — `freshHome` and `env`; `ledgerRun` and `ledgerKeep` at `:119-122`; the `tmpDir` import at `:13`; R-2573 at `:557-591`; R-2574 at `:593-612`, kept names built at `:601-602`.
- packages/nana-pack/tests/ledger-repo.mjs:27-41 — `ledgerRepo` with its cleaned git env; `reportToFile` at `:43-52`; `makeLedgerBranch` at `:54-72`.
- packages/nana-pack/tests/claude-review.test.mjs:324 — the expected section built from the file-written report; the not-computed reason taken at `:331`.
- packages/nana-pack/tests/review-movement.test.mjs:22-30 — R-2905's ledger pin; the seal form at `:31-40`.
- packages/nana-pack/tests/test-runner.test.mjs:653-662 — R-917's scan: no `mkdtempSync`, and `tmpDir` only with its exact import line.
- REQUIREMENTS.md:788-791 — R-2573, R-2574 and R-2576; R-2905 at `:727`; R-1460's lines at `:2217-2219`.
- scripts/deliverables.mjs:597-660 — how the checker reads `Made by:` and `Read by:` lines (read only).
- packages/nana-pack/README.md:245 — keep's paragraph; the Dependencies sentence at `:9`.
- AGENTS.md:157 — the land-report sentence; `packages/nana-pack/skills/requirements/SKILL.md:142` carries the same sentence.

Helper move, named (the 2026-10-22 second-caller ruling): none. review-ledger imports `reviewMovementSection` from `packages/nana-pack/lib/review-movement.mjs`, as both launchers do. `notComputedReason` is new in that module, shared from birth. Test files cannot import one another, so the new test file writes its own spawn wrappers in the form of `review-ledger.test.mjs:57-66` and `:119-122`. Report any other import or copy as a departure.

The task:
1. Rows R-2910 to R-2913 under FEAT-007's SUB-010, after R-2576 (`REQUIREMENTS.md:791`), with the exact text the must-meet gives, `untested` until each check passes, then `implemented` with backticked `file::title` evidence. R-2905's text becomes exactly the must-meet's new text; its title and evidence stay. R-2574's evidence cell gains the new keep-movement.test.mjs test after its existing one. R-2573 keeps its text and evidence.
2. CAP-07: replace R-1460's person line (`REQUIREMENTS.md:2219`) with exactly: `Read by: R-1460 · person: the seat's land report points the owner to the lane folder's tree-movement.md, which review-ledger keep writes`. Leave its other two lines unchanged.
3. `packages/nana-pack/bin/review-round.mjs`, directly after KEEP_NAME_HASH_CHARS, exactly:
   `// chosen 2026-10-25 (keep-movement): one fixed name per lane folder, so each keep replaces the last kept tip's movement and a reader finds it without a hash (R-2910).`
   `export const KEEP_MOVEMENT_FILE_NAME = 'tree-movement.md';`
   No other change to that file.
4. `packages/nana-pack/lib/review-movement.mjs`: export `notComputedReason(section)`. It returns the text after the prefix `` `${MOVEMENT_HEADING}\n\n${MOVEMENT_LEAD}\n\n${MOVEMENT_NOT_COMPUTED} ` `` when `section` is a string starting with it, else `null`. `reviewMovementSection` is unchanged. `@outputs` names the new export.
5. `packages/nana-pack/bin/review-ledger.mjs` keep, in this order:
   a. Arguments, repository and planning as today; remove the early `if (!planned.size) die(...)` at `:75`.
   b. `const section = reviewMovementSection(resolve(repoPath))`; `notComputed = section === null ? null : notComputedReason(section)`. If `notComputed` is not `null`, print once to stderr: `review-ledger: WARNING: ${KEEP_MOVEMENT_FILE_NAME} not written: ${notComputed}`.
   c. `wantMovement = section !== null && notComputed === null`. If `planned.size === 0` and not `wantMovement`, `die` with today's message `item ${item} in this repository has no kept text`.
   d. The `--into` checks, the pre-check and the review-text writes exactly as today, `mkdirSync` included, so every existing refusal still writes nothing.
   e. If `wantMovement`: `lstat` the target `join(into, KEEP_MOVEMENT_FILE_NAME)`. If it exists and is not a regular file, or is a symlink, warn in the same form with the reason `not a regular file`. Otherwise `writeFileSync(target, section)`, overwriting any earlier copy. Any thrown error warns in the same form with `error.code ?? error.message`. Never `die` in this step.
   f. If `planned.size === 0` and the movement was not written, `die` with the same no-text message.
   g. stdout: `kept ${planned.size} review text(s) and ${KEEP_MOVEMENT_FILE_NAME} for ${item} in ${into}` when the movement was written, else today's `kept ${planned.size} review text(s) for ${item} in ${into}`; then exit 0.
   Header: `@inputs` names review-movement.mjs's section for `--repo`'s HEAD; `@outputs` names tree-movement.md in the keep folder and the movement warning; `@effects` names the process run through review-movement.mjs on keep; `@errors` says keep warns and never refuses over the movement, and exits 1 with no kept text unless it wrote the movement file.
6. A new `packages/nana-pack/tests/keep-movement.test.mjs` with the six-tag header. It imports `tmpDir` with its exact line, uses `ledgerRepo`, `makeLedgerBranch`, `ledgerText` and `reportToFile` from `./ledger-repo.mjs`, and starts review-ledger with `HOME` and `USERPROFILE` set to a scratch home inside its temp folder and the ledger fixture's cleaned git env. It records rounds with `review-ledger run --item <item> --role <role> --out <file outside the repository> -- <node> -e <write a review text>`, recorded before any uncommitted edit. keep runs with `cwd` set to the temp folder, outside every repository, and `--repo` naming the repository. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives: R-2910, R-2911, R-2912 (both cases in one check), R-2913 (both cases in one check), the R-2574 ledger-repository case, and the seal marked `// req: R-2910 R-2911 R-2912 R-2913`. Every assertion imports KEEP_MOVEMENT_FILE_NAME (from `../bin/review-round.mjs`), MOVEMENT_HEADING, MOVEMENT_LEAD and MOVEMENT_NOT_COMPUTED; only the seal writes the literal `"tree-movement.md"`. Each expected section is checked against both `reportToFile`'s report wrapped as `claude-review.test.mjs:324` wraps it and `reviewMovementSection(repo)` called in the test.
7. `packages/nana-pack/tests/review-ledger.test.mjs`: one comment line directly above `const empty = ledgerKeep(` (`:583`), exactly: `// R-2573's empty case exits 1 because repository A commits no ledger; R-2913 owns the no-text exit rule.` No other change to that file.
8. `packages/nana-pack/tests/review-movement.test.mjs:29`: the person-line assertion matches the new line from step 2 exactly. No other change to that file.
9. `AGENTS.md:157` and `packages/nana-pack/skills/requirements/SKILL.md:142`: replace each line's last sentence, "The seat's land report points the owner to the movement, in the review folder or the brief, instead of pasting it.", with exactly: "The seat's land report points the owner to the lane folder's tree-movement.md, which review-ledger keep writes before the final round." No backticks in the new sentence; R-598 reads a backticked `.md` name as a path claim. Do not touch AGENTS.md's managed region.
10. `packages/nana-pack/README.md:245`: replace "An item with no kept text exits 1." with exactly: "When the repository's HEAD commit holds a REQUIREMENTS.md, keep also writes tree-movement.md into the folder: the tree movement section the review launchers send, for HEAD against main. Each keep replaces it, so the folder holds the movement of the last kept tip. With no committed ledger keep writes no movement file and says nothing about it. A movement that cannot be computed or written gets one warning and no file, and the review texts are still kept. An item with no kept text exits 1 unless keep writes the movement file." At `:9`, "The review launchers start the repository's" becomes "The review launchers and review-ledger keep start the repository's". Write the file name without backticks; fix the README, never the checker.
11. `npm run map` and `npm run req:tree` regenerated; every new or changed module header current.

Keep every escape sequence in test literals intact: a `\n` inside a string passed through `JSON.stringify` to a child, or a `\\n` inside generated source, stays as written; an unescaped one passes on macOS and breaks the Windows leg. Write no home path and no absolute user-folder path into any committed file; tests build paths from their temp folder. Do not run the install check; this lane has none. Do not push.

Try each red case by hand on macOS, see the named check turn red, restore, and say so in your report; do not commit them:
- keep's movement step removed → R-2910, R-2913.
- `reviewMovementSection(process.cwd())` in place of the `--repo` path → R-2910, R-2913.
- the section written with a trailing `\n` → R-2910.
- the write with `{ flag: 'a' }` → R-2910.
- the count line left in today's form after writing the movement → R-2910.
- the count line naming the movement file when none was written → R-2911.
- a `null` section treated as not computed → R-2911.
- `notComputedReason` returning `null` always → R-2912, R-2913.
- the movement-write `catch` calling `die` → R-2912.
- the warning without its reason → R-2912.
- the early no-text `die` restored before the movement step → R-2913.
- the movement write moved above the review-text pre-check → the R-2574 ledger-repository test.
- KEEP_MOVEMENT_FILE_NAME set to `'movement.md'` → the seal.
- R-1460's person line restored to its old text → R-2905.

Checks before your one commit: `npm test --` with each of keep-movement.test.mjs, review-ledger.test.mjs, review-movement.test.mjs, claude-review.test.mjs, immutable-review.test.mjs, requirements-moved.test.mjs, requirements-deliverables.test.mjs, requirements-tree.test.mjs, templates-render.test.mjs and test-runner.test.mjs; then `npm run test:locked` whole, with its output kept out of the worktree; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`, and `node scripts/requirements-tree.mjs --root .` must print `deliverables: 21 of 21 made and read by code, 21 parked`; `node scripts/known-bugs.mjs --root .`; then `git status --short` must print nothing after the commit.

Seat check: `node docs/reviews/keep-movement-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Commit once, at the end, with explicit paths (`git add <path> ...`, never `git add -A` or `.`).

Done: the four rows, their tests, the R-2574 test and the seal exist and pass; R-2905 and R-1460's person line read as the must-meet says and the tree checker prints `21 of 21 made and read by code, 21 parked`; keep writes, replaces, omits and warns as the rows say and never refuses the review-text keep over the movement; every red case fails by hand; the map, readme, trace, tree and known-bugs checks are green; the full suite is green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; keep-movement.test.mjs's run time on macOS; the full suite's summary line; the tree checker's deliverables line; map, readme, trace, tree, known-bugs and seat-check status; any departure from the Precedent files or the must-meet, with its reason.
