# claude-review-launcher · adversary pass (main 09e38e7d, 2026-10-22)

Probes ran in a mktemp folder under $TMPDIR with a temp HOME, a temp git repo and a fake `claude`. The repo was read only. Count: 2 M, 7 S, 7 N, plus 8 extra wrong-code pairs.

## M — must change the plan

- **M1 · A second test pins the refusal that R-2563 reverses.** `packages/nana-pack/tests/nana-roster-set.test.mjs:130` (R-1402) expects `set reviewer claude-code sonnet` to be refused. Once `CLAUDE_CODE_SLOTS` holds `reviewer`, that case goes red. The plan names only `nana-roster.test.mjs:259`. Fix: name this flip and replace the case with a pi-only slot (`land claude-code sonnet` or `scout ...`), so R-1402 still pins a refused Claude Code entry.
- **M2 · The roster change reaches every seat on the machine; the docs reach none of them.** After the land the seat runs `set reviewer claude-code opus`. That changes the reviewer for every project and both runtimes at once. Every instruction surface still says the reviewer launcher is `pi-review` and the reviewer model comes from the roster: `templates/_shared/working-under-nana-pi.md:25,30`, `packages/nana-setup/claude/rules/nana-soul.md:48` (a Claude rule loaded in every project) and `AGENTS.md`.
  - A pi seat (TUI or desk) has no documented route. pi-review needs `-- --provider --model`, and a Claude Code entry has no provider.
  - The notice will read `reviewer opus (Claude Code only)` (`lib/roster-notice-config.mjs:25`; the draft misquotes it as "(Claude Code)"). That tells a pi seat it cannot run the reviewer, yet claude-review is a node command any seat can run.
  - A Claude seat that follows the larger-builder line ("a Claude Code entry as a Claude Code subagent") may start an Agent subagent instead. That records no ledger round, so the review is wasted.
  - Precedent: `bin/pi-worker.mjs:106-108` says outright that the notice reaches every project while the shared bullet does not, and that lane added a refusal because of it.
  - Fix, either one: (a) in this lane, update `nana-soul.md:48` (in the repo, no template tag) and nana-pi's own AGENTS section to name claude-review for a Claude Code reviewer and say what a pi seat does, and put "names both launchers" into R-2562's row (today only the draft says it); or (b) hold the `set` step until the template line lands.

## S

- **S1 · A large prompt crashes the launcher with EPIPE.** Probe: review-ledger refused admission (tracked `--out`) or could not start `claude` without reading stdin. A naive parent that writes stdin got `Error: write EPIPE` and an unhandled stack at 100 KB and above; at 70 KB and below it was clean. Large prompts are the plan's own reason for using stdin (D3). Fix: handle `child.stdin` errors, and add a refused-admission case with a brief of about 256 KB to R-2565's test (no `EPIPE` or stack on stderr).
- **S2 · The subtraction breaks pi-review's standard-refusal harness.** `tests/review-standard.test.mjs:63-68` copies `bin/` plus four named lib files. If pi-review imports a new `lib/review-standard.mjs`, the copy fails with ERR_MODULE_NOT_FOUND, and R-1106 and R-1680 to R-1682 go red. The plan says "pi-review's ... tests stay unchanged". Fix: name the change to the copy list, or drop the subtraction and have claude-review read the standard itself (about 10 lines).
- **S3 · Nothing pins the reviewer sentence's read-only and plain-verdict clauses.** R-2561 covers only "naming the item and the reviewed tree", and a test that imports `REVIEWER_SENTENCE` by name passes a build that drops both clauses. Read-only is instructed, not enforced (known limit), and the verdict clause stops unread verdicts. Fix: add a sealed-literal test for `REVIEWER_SENTENCE` and `STANDARD_HEADING`, or widen R-2561 to name both clauses.
- **S4 · `--tree` should be required.** `review-round.mjs:553` defaults the tree to the launcher's cwd, and a seat runs from the main checkout. If `--tree` is left out, an Opus round reviews main's HEAD, and nana-land refuses the result later. The wrapper took the worktree as a required positional. Fix: refuse a missing `--tree`, and run R-2560's test from a cwd outside the tree, asserting the fake's cwd is the tree.
- **S5 · The plan never says what `--brief` is relative to.** The wrapper read `$wt/$brief`, relative to the worktree. pi-worker resolves against cwd (`pi-worker.mjs:96`). A seat that keeps the wrapper habit and runs from main reads main's file of the same name, or no file at all. Fix: state the base in the usage line and pin it with a brief that exists under only one base.
- **S6 · A refused roster is not covered.** R-2562 tests only a pi entry. A build that reads `result.roster.reviewer` without checking `ok` throws a TypeError stack on a malformed `nana-pack.json` and still passes every planned test. Fix: add a refused-roster case to R-2562's test: exit 1 naming the file, before admission.
- **S7 · The README contract becomes false.** `packages/nana-pack/README.md:268` says builder and reviewer "are required entries of provider, model and a thinking". It also defines Claude Code models as the names the Agent tool starts a subagent with, but the reviewer's model goes to `claude --model`, a different consumer. The provenance at `bin/worker-config.mjs:32-35` says the reviewer stays pi-only. D5 adds a new section but does not fix either.

## N

- **N1 · Variadic flags are safe only with no positional after them.** Probe on real claude 2.1.299 (temp HOME): `claude -p --allowedTools Read,Grep stray-word </dev/null` reported "Input must be provided", because `stray-word` was swallowed as a tool name. The stdin design has no positional, so it is safe. Keep R-2560's argv assertion an exact match, not an includes-check.
- **N2 · R-2566's trigger describes review-ledger, not claude-review.** "WHEN the item has used the round cap" is review-ledger's condition; claude-review should simply forward `--over-cap` whenever it is given. Also, `--role` has no row. The wrapper passed `--role opus|fable`; the audit-only role field (`review-round.mjs:43`) silently becomes `reviewer`.
- **N3 · Dropping `--base` is safe.** review-ledger run, admit/complete and nana-land read only the item, the tree revision and the verdict (`nana-land.mjs:94-96`). The base was only prompt text (the wrapper's `git diff $base..HEAD`).
- **N4 · Stdin pass-through holds on macOS.** A 271 KB prompt holding `"`, `%`, `!` and `'` reached the fake byte-identical (sha256 match), with NANA_ROLE=reviewer and a round recorded under model `fable`. On Windows, R-2254 pins only a two-line ASCII LF input (`review-launch.test.mjs:181`). R-2564 should add CRLF and non-ASCII text, since briefs use `·` and `—`.
- **N5 · `--out` holds only the final turn.** `claude -p` text output is the final assistant turn only, so a review written before a last tool call is missing from `--out`. The wrapper had the same gap. Add it as a known-limit line.
- **N6 · A killed launcher leaves `claude` running.** review-ledger has no signal handler and does not kill its child (`review-ledger.mjs:98`). A forwarded SIGTERM leaves `claude -p` orphaned and spending. Add this to known limit 9.
- **N7 · The lane-class text does not list claude-review.** `working-under-nana-pi.md:26` lists the review tools (`nana-land`, `pi-review`, `review-round`) that make a lane install-class. claude-review is missing, so a later claude-review lane would read as ordinary. On Q5: no known limit needs to be a MUST. The live tree matches how the wrapper ran, and R-717 (unverified, round consumed) bounds the risk. The hang limit needs the seat's failure watcher at launch (ruling 2026-10-15).

## Extra wrong-code pairs

1. Write the prompt but never end stdin. The fake waits for EOF forever, so the tests need a timeout that fails rather than hangs.
2. Drop the stdin error handler. The S1 large-brief refusal case shows an EPIPE stack.
3. Read the model from `largerBuilder`. Give R-2560's fixture `largerBuilder: claude-code sonnet` so the wrong slot yields a valid but wrong model.
4. Do not forward `--tree`, and run from another cwd (S4).
5. Skip the `ok` check on resolveRoster. A malformed roster then crashes (S6).
6. Drop the read-only clause from `REVIEWER_SENTENCE` (S3).
7. Put any argument after the tool lists. The exact argv assertion goes red (N1).
8. Resolve `--brief` against `--tree` instead of the stated base (S5).
