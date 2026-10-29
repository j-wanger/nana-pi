# reader-at-land · plan (planner, 2026-10-29)

Feature: FEAT-039 · See the product and its decisions in one report

Written from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. One adversary attacked it (`plan-attack.md` beside it: 2 MUST, 5 SHOULD, 5 NOTE); the seat took all of them, and this revision carries them. Plans get no review round.

## Purpose

The owner's top idea B was an outside reader: a fresh model reads the product page the way a newcomer would and names its weaknesses against the project's purpose. He picked "B 1, but should consider wiring for 2". Reading 1, a one-off run by hand, is done (2026-10-29, scratch record: Playwright text render, `pi -p`, four weaknesses, three of them judged new against FEAT-039's known bugs afterwards). On 2026-10-29 he said "yes plan the reader wiring". That is the agreed reading: reading 2, the outside reader runs as one step of the lane loop, not by hand.

With this lane, on a lane that changes the product page, the seat runs one command after first-look at build 1. The command reads first-look's accessibility diff as its focus and the lane's after page as context, cold, with the project's objective and the feature's known-bug lines. It asks for at most a few new weaknesses, or none. The seat shows the owner the top new finding in its report, beside the first-look "is this the shape?" card. It writes a known-bug line only for a finding that is a real defect. The reader's value is owner-facing judgment, not a growing defect list (attack M2).

## Assumptions

- A1. Product page only. The desk stays frozen until the owner reopens it, so a desk run is out of scope. The command also takes `--url`, so a desk run later needs only a seat-guide sentence.
- A2. The reader reads what first-look already left in its output folder: `after-report.html` (the page) and `accessibility-diff.txt` (the lane's change). First-look removes only its temporary worktree. `--from <first-look folder>` reads both. `--url <url or file path>` reads one page with no diff, for a by-hand read of the live public page; a file path becomes a `file://` URL before `#view` is added (attack N4).
- A3. Verified (adversary, 2026-10-29): `pi -p --no-tools --no-session -ne -ns -nc --provider openai-codex --model gpt-6-astra @p.md "go"` in an empty scratch folder printed `ok` and exited 0, so the subscription login survives `-ne`. The plan adds `-np` (no prompt templates), so the reader runs with no tools, session, extensions, skills, context files or prompt templates, in an empty temporary folder. Neither AGENTS.md, the knowledge pull nor the repo reaches it.
- A4. The prompt goes to pi as an `@file` argument plus one short message, never as one long argument, because Windows caps a command line near 32 K characters.
- A5. The purpose text comes from the existing objective producer (`node packages/nana-pack/bin/nana-objective.mjs --cwd <root>`), which already emits bounded, marker-derived intent. When it prints nothing (objective off at user scope), the command prints one line and does not start pi.
- A6. The one-off's evidence does not transfer whole (attack S1). Its prompt held no known bugs, and "3 of 4 new" was judged afterwards by the seat. This design adds the known-bug lines and the diff. Repeat suppression stays the model's job plus the seat's read; no deterministic matcher can tell a reworded known bug from a new one. This is the claim most likely to be wrong in practice. The seat records the first real run's new, already-known and noise counts in the lane's session note.
- A7. Known-bug input is the bullet lines of `docs/known-bugs/FEAT-039.md`, not the file's header. When the lines exceed the sealed cap, the command keeps the newest lines that fit and adds one line saying how many earlier lines it left out. The file is 17 KB and 107 lines today.
- A8. The one-off's first run stalled; the cause is unknown, and it may have been a long server-side think with flat CPU (attack S3). The model run therefore uses a wall-clock limit only: the watchdog's flat-CPU stall is switched off for this run (stall seconds `Infinity`, the precedent `CLAUDE_BUILDER_STALL_SECS`), the wall-clock ceiling is 600 s (the one-off's working rerun), and there is no retry. One attempt costs at most 600 s.
- A9. The reader's output goes to a folder outside git, as first-look's does. Only lines the seat chooses to write enter the repo.
- A10. The adversary confirmed both fixture files pass `scripts/identity-scan.mjs --stdin` (exit 0, rechecked by the planner). The builder copies them unchanged; if a later scan flags a word, the builder scrubs that word and keeps every quote the fixture's findings rely on.

## Open choices

- O1, decided: a new script `scripts/outside-reader.mjs` with its sealed values in `scripts/outside-reader-config.mjs`, not a mode of first-look. One purpose per module: first-look compares two pages; the reader judges one.
- O2, decided: first-look's private `resolvePlaywright` gets its second caller, so it moves to a shared module `scripts/playwright-resolve.mjs` that both import (ruling 2026-10-22). First-look's behaviour does not change. No test runs the real resolver (attack N3), so the seat runs `npm run first-look -- --page product` once after the build.
- O3, decided: the reader prompt is a tracked file, `packages/nana-pack/prompts/outside-reader.md`, read by name from the config module, beside `planner.md`. It asks for "at most N new weaknesses, or say none", asks first about what the diff changed, and allows at most one standing weakness outside the diff. N is sealed.
- O4, decided: the views are the landing view plus the one-off's four (`overview`, `product`, `decisions`, `issues`), at both of first-look's widths (attack S2). The four are checked to be members of first-look's `PRODUCT_VIEWS`; the widths are imported from it.
- O5, builder: the answer format. The split ignores any preamble before the first numbered finding (attack N5; the one-off opened with "DONE — This review serves…"). A finding may carry several quotes, in straight or curly double quotes.
- O6, decided: the seat-guide step is a new bullet, not an extension of the first-look bullet. R-1140 moves from thirteen rules to fourteen, and its prose names the new rule.

## Questions for the owner

1. Question: When should the reader run?
   Default: After build 1, right after first-look, only on a lane that changes the product page. It reads that lane's diff as its focus and the lane's after page as context.
   Cost of a wrong guess: easy to undo — one seat-guide sentence and its pinned test.
   If answered otherwise: "before the final round" moves the sentence and nothing else. "On a schedule against the live page" drops the seat-guide step for a scheduled job, likely a CI workflow since launchd is macOS-only. Its findings would then need issues, since no lane would carry them.

2. Question: Where do the reader's new findings go?
   Default: The seat shows the owner the top new finding in its report, beside the first-look card. It writes a known-bug line in the page feature's file only for a finding it judges a real defect.
   Cost of a wrong guess: easy to undo — one seat-guide sentence.
   If answered otherwise: "every finding as a known-bug line" grows the file the reader reads back, so repeats get harder to suppress. "An issue" means one `next` issue per finding, each passed through `scripts/identity-scan.mjs --stdin` first and posted by the seat only.

3. Question: Which model reads?
   Default: The roster's first pi entry among `scout`, `land`, `builder`, in that sealed order (on this machine: `land`, openai-codex gpt-6-astra). `--provider`, `--model` and `--thinking` override one run.
   Cost of a wrong guess: easy to undo — one sealed slot list.
   If answered otherwise: a dedicated `reader` roster slot edits `worker-config.mjs` and `nana-roster.mjs`, which the roster-notice hook imports, so the lane becomes a hook lane with heavier checks. A Claude Code reader means launching through `claude-review.mjs`'s path instead of pi.

## Threat model

In scope is honest variation in our own tools and inputs: no Playwright or no browser binary, a page that fails to load, a view with no text, no pi entry in the roster, a pi run that hangs or exits non-zero, a model answer with a preamble, curly quotes, punctuation inside a quote, a quote spanning page elements, a "none" answer, an empty or oversized known-bug file, a missing diff, the objective turned off, Windows command-line length. Deliberate forgery is out. One residual sits at the edge: anyone can open an issue on the public repo, and issue titles appear on the page, so a title can carry text aimed at the reader. The reader has no tools and writes only to a folder outside git, and the seat reads every finding before acting, so the harm is a misleading finding, not an action.

## Precedent

- `scripts/first-look.mjs`: the CLI shape (`parseArgs`, injected seams, bounded one-line failures, the `INSTALL_LINE` degrade, `page.goto(url#view)` per view, `pathToFileURL` for a report path). Its private `resolvePlaywright` moves to `scripts/playwright-resolve.mjs` and both scripts import it.
- `scripts/first-look-config.mjs`: `PRODUCT_VIEWS` and `VIEWPORT_WIDTHS`, imported by name; the config-module-with-provenance pattern for the new config.
- `packages/nana-pack/bin/pi-watchdog.mjs`: `runWatchdog(tag, { piArgs, cwd, childEnv, retries, stallSecs, maxSecs, accept })`, used for its wall-clock ceiling and child-tree kill.
- `packages/nana-pack/bin/worker-config.mjs`: `CLAUDE_BUILDER_STALL_SECS = Infinity`, the precedent for switching off the flat-CPU stall; `REVIEWER_CHILD_ENV` (`NANA_ROLE`, `NANA_HANDOFF: off`) as the child env.
- `packages/nana-pack/bin/pi-review.mjs`: how a launcher composes pi args, child env and an `accept` predicate for the watchdog.
- `packages/nana-pack/bin/nana-roster.mjs` with `packages/nana-pack/lib/agent-dir.mjs`: `resolveRoster(piAgentDir())` to pick the model; a Claude Code entry is skipped, not launched.
- `packages/nana-pack/bin/nana-objective.mjs`: the bounded objective block, called as a child with `--cwd`.
- `packages/nana-pack/lib/known-bugs-config.mjs`: `KNOWN_BUGS_DIR`, so the folder name is not repeated.
- `packages/nana-pack/prompts/planner.md`: where a tracked prompt file lives.
- `packages/nana-pack/tests/first-look.test.mjs`: fake browser and fake runner seams; no test launches a real browser or model.
- `packages/nana-pack/tests/fixtures/`: where the one-off's `reader-out.md` and `page-text.txt` go, as `outside-reader/`.
- `packages/nana-setup/claude/rules/nana-seat.md` and `packages/nana-setup/tests/seat-rule.test.mjs`: the guide bullet and R-1140's rule list.
- `README.md` (the first-look paragraph near line 282): where the command's README sentence goes; the readme check runs every command it names.
- map:search took: `pi-watchdog.mjs`, `pi-review.mjs`, `worker-config.mjs` (watchdog query); `nana-roster.mjs` (roster query); `known-bugs-config.mjs` (known-bugs query); `nana-objective.mjs` and `lib/objective.ts` (objective query; the child CLI is used, not the TypeScript library); `nana-rulings.ts` (seat-guide query: the pi seat gets the same guide file, so one edit serves both runtimes). The render-text query returned nothing closer than first-look.
- Followed as a record, not imported: the one-off's scratch `render.mjs` and `prompt.md` (untracked). Their view list, per-view caps and prompt wording are the starting values.

## Outside precedent

- Playwright, Apache-2.0, `adopt`: the browser driver first-look and the desk e2e tests already load; the reader uses `document.body.innerText` per view, as the one-off did.
- browser-use, MIT, `skip`: an agent that drives a browser with tools. The owner's idea is a cold reader of a fixed page, and a tool-using browser agent widens what a page's text can make it do.

## Must-meet

Rows from R-3060. Each check carries its `// req:` marker directly above it. Tests use a fake browser, a fake objective child and a fake pi launch; none starts a real browser or model.

1. **R-3060 · The prompt holds only the purpose, the known bugs, the change and the page.** With `--from <dir>`, the command writes `<out>/prompt.md` holding, in order: the sealed prompt with N filled in, the objective block, FEAT-039's known-bug bullet lines (newest first within the cap, plus a left-out count line when over it), the accessibility diff capped, and each sealed view's visible text at both widths, landing view included, each capped. With `--url <file path>` it reads that page as a `file://` URL and writes no diff section. Pins: the section order; a known-bug line and the landing view's text present; the left-out count line for a fixture over the cap; the `file://` URL the fake browser received.
2. **R-3061 · pi runs once, cold.** The command starts pi exactly once through the watchdog with `-p --no-tools --no-session -ne -ns -nc -np`, the roster's provider and model, the prompt as an `@file` argument, a cwd that is an empty temporary folder outside the repo, stall seconds `Infinity`, no retry and the sealed wall-clock ceiling. It saves the answer as `<out>/reader.md`. Pins: the exact flag set, the `@file` form, a cwd not under the repo root, and the watchdog options.
3. **R-3062 · Honest quotes pass the quote check.** The command drops any preamble before the first numbered finding and splits the answer into findings. For each finding it takes every double-quoted phrase, straight or curly. It normalises curly quotes and apostrophes to straight, strips leading and trailing punctuation inside the quote, and collapses whitespace in both quote and page text. It matches against the page text with element boundaries joined by whitespace. A finding passes when at least one of its quotes matches; a finding with none gets `quote not found on the page`. It prints `outside-reader: <n> findings, <m> quotes not found; saved in <dir>`. Pins: the one-off's own `reader-out.md` against its `page-text.txt` (fixtures in `packages/nana-pack/tests/fixtures/outside-reader/`) gives every finding passing, `m = 0`; one invented quote added to a copy gives `m = 1`.
4. **R-3063 · A "none" answer asks for nothing.** When the reader answers that it found no new weakness, the command prints `outside-reader: 0 findings; nothing to show the owner` and exits 0. Pins: that line for a fake "none" answer, and that no finding text follows it.
5. **R-3064 · It degrades without a browser, a model or a purpose.** With no Playwright or no launchable browser, it prints one install line and exits 0. With no pi entry in the sealed slot order and no override flags, it prints one line naming `--model` and exits 0. With an empty objective block, it prints one line and exits 0. In each case the fake launcher is called zero times. Pins: the three lines, exit 0 and the zero call count.
6. **R-3065 · A failed or timed-out model run fails in one line.** When the one attempt exits non-zero, prints nothing or hits the wall-clock ceiling, the command prints `outside-reader: the reader run failed` with no raw error text, keeps `prompt.md`, writes no `reader.md` and exits 1. Pins: that line, exit 1 and the absent `reader.md`.
7. **R-3066 · Its values are sealed.** Defined once in `scripts/outside-reader-config.mjs`, each with provenance: N, the most new weaknesses asked for (chosen: 3, at most one outside the diff, one under the one-off's fixed four, which forced padding); the view list (landing plus the one-off's four, each checked against `PRODUCT_VIEWS`); the per-view text cap and the larger phone-landing cap (the one-off's 4,000 and 6,000 characters); the diff cap and the known-bug cap (chosen from the one-off's 29,884-character page text and the 17,378-byte known-bug file, so the whole prompt stays near the one-off's measured size and well under pi's input); the prompt path; the known-bug feature; the roster slot order; stall seconds `Infinity`; retries 0; the 600 s ceiling (the one-off's working rerun). Widths are imported from first-look's config. One test pins them, naming R-3066; every other assertion imports the names.
8. **R-3067 · The seat guide says when and where.** The seat guide gains this bullet, pinned word for word as `RULE_14` in `seat-rule.test.mjs`:
   "On a lane that changes the product page, after first-look run `npm run outside-reader -- --from <first-look folder> --out <folder>` outside git, show the owner its top new finding in your report, and write a known-bug line only for a finding that is a real defect."
   R-1140's prose and its test move from thirteen rules to fourteen and name the new rule.

Expected changes to existing tests (a forecast, not a limit): `packages/nana-setup/tests/seat-rule.test.mjs` (thirteen to fourteen, `RULE_14`); `packages/nana-pack/tests/first-look.test.mjs` should stay unedited after the resolver move. The builder greps the tests and checkers for `resolvePlaywright`, `thirteen` and the seat-guide bullets before editing. The map, the requirements tree and the README check are regenerated or extended with the change.

## Class and size

- Class: `node scripts/lane-class.mjs --root . --files scripts/outside-reader.mjs,scripts/outside-reader-config.mjs,scripts/playwright-resolve.mjs,scripts/first-look.mjs,packages/nana-pack/tests/outside-reader.test.mjs,packages/nana-setup/claude/rules/nana-seat.md,packages/nana-setup/tests/seat-rule.test.mjs,package.json,README.md,REQUIREMENTS.md,docs/requirements-tree.md` prints `ordinary`. The adversary confirmed `ordinary` with `packages/nana-pack/prompts/outside-reader.md` added. The fixture files are no class path.
- The plan stays ordinary on purpose: it imports pi-watchdog, worker-config and nana-roster without editing them, and touches neither nana-land nor pi-review. Running the reader inside nana-land would break "nothing is written after a land" and make this a gate lane. A new roster slot would reach the roster-notice hook in one import hop and make it a hook lane. If the builder finds it must edit `pi-watchdog.mjs`, `nana-roster.mjs` or `worker-config.mjs`, it stops and reports, and the seat re-runs lane-class.
- Size: small.
