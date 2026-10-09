# nana hardening plan — coherent and seamless (2026-10-06)

*Seat synthesis of a read-only audit of nana-pi and the live nana install on this Mac. Goal (Jake, 2026-10-06): the nana experience, and agentic coding done with nana, is coherent and seamless. Governing priority (since 2026-09-16): make the nana-pi experience consistent, coherent and effective. Evidence corpus: `docs/reviews/hardening-audit-2026-10-06/` (`findings.json` holds every finding with its evidence, Fable and sol verdicts; `sol/` holds the gpt-5.6-sol reviews; `lane-summaries.md` and `lanes/` hold the auditors' notes). Finding IDs (L1-01 …, G1a-01 …) below index into `findings.json`.*

## Rulings (Jake, 2026-10-06)

"Go, and then go with your recommendations on all, pi luna high effort worker, sol reviewer, astra land review, you as seat, fable for seat adversarial consultation only."

- **D2–D11: the recommendations below are adopted as written.**
- **D1 is answered by the roster, not by the recommendation:** the canonical builder is a pi session — `pi-worker` running `gpt-6-luna` at `--thinking high` with the lane worktree as its cwd — so builders get the gate, post-edit, the worktree's AGENTS.md, the objective and the knowledge pull (the pull until Jake's 2026-10-09 ruling). Claude Agent-tool subagents no longer build. Tranche 3.1 therefore makes `pi-worker` the installed, fail-closed lane launcher instead of a `nana-builder` Agent definition; G1d-05 (SubagentStart injection) drops out with the Agent builder path.
- **Roster** (shared memory `reference_roster.md`): seat = the Claude Code session; builder = pi `gpt-6-luna` high; slice review = pi `gpt-5.6-sol` (≤ 3 rounds); land review = pi `gpt-6-astra` on the final revision; Fable = seat adversarial consultation only.

## Seat rulings during tranche 1 (2026-10-07)

- **Plan item 1.4 / L5-02 changed:** the rm-text relaxation (skip scanning for "non-executing" commands, inline-only interpreter scanning) is SUBTRACTED — sol found destructive bypasses in two straight rounds. The gate's rm and interpreter scanning stays as before the program; R-040 restored; R-632 and R-637 retired. The template-source command exception was subtracted for the same reason; template sources are editable through edit/write only. The new code-loading floor runs AFTER the unchanged pre-program matcher (composition), and literal paths inside interpreter code operands are a declared gap.
- **t1-flake:** port-0 app listeners (a small desk change) instead of reserve-then-close test ports, because lanes run in parallel through tranche 6.
- **t1-ledger** landed before t1-gate after astra confirmed no in-flight dependency on the old verdict predicate.
- **New tranche-2 lane t2-tests** (found during tranche 1): per-file temp isolation in the runner, a guard against tests mutating tracked files, watchdog capture cleanup, the T17 timing fix, isolated knowledge logs. Plan item 6.4 (writing-trial measurement) moved into tranche 2 because transcripts roll off.

## Seat rulings during tranche 2 (2026-10-07)

- **Subtract over build on side surfaces:** the pi-1.0 acceptance probe (a docs script) keeps its forced exit and R-899 stays `untested` rather than gaining timer machinery; R-867 shrinks to "receipt controls hidden" (the key is ignored; the desk is frozen); the trial rubric scores only decisions the extractor finds (five more found by hand are a declared residual).
- **The writing-trial verdict compares like with like:** the after measure uses the baseline's unit (the last 80+ word message per treated session); the all-message count is a labelled audit only.
- **Keep rules, fix text:** the adoption rule (complete structure, R-152) stays; the hook's sentence now says what the rule checks.
- **Smallest live change on install:** foreign links on the four newly managed Claude skills are preserved and reported; `requirements` keeps its pre-program behaviour; Windows does not mirror the four new skills.
- **Not done in tranche 2, carried to tranche 3 wave A:** 2.8 (memory hygiene: doctor link checks; aml-desk facts into its product memory) and 2.9's mechanism (`nana-setup project` refreshes and `--check` compares only the marker region; refresh the product copies once). 2.3 (one roster) was done by the seat on 2026-10-06.
- **Tranche 3 waves** (Fable consult on the lane specs, 2026-10-07): A = review immutability and the reviewer role (3.3, D7) with the pipe guard (3.5) and the 2.8/2.9 carry; B = the launcher (3.1 as ruled by D1) with the land helper (3.4), branched after A lands, because the land helper reads the verdict field the review lane adds. 3.2 (nana-pi's own post-edit checks) and 3.7 (the canary) are seat acts after B.

## Seat rulings during tranche 3 (2026-10-07/08)

- **D1 as built:** `pi-worker --lane` owns the whole builder argv (one sealed roster value), refuses caller pi arguments, retries and duplicate options, and never reclaims a stale lock automatically. No `nana-builder` Agent definition.
- **Review isolation (3.3):** reviews run in an immutable checkout; repositories with initialized submodules are refused (none on this machine uses them).
- **Pipe guard (3.5):** the Claude hook abstains unless it hits; pipefail exempts only as the first command in canonical form; heredoc bodies are skipped only for quoted delimiters; commands built at run time are a declared gap.
- **Land helper (3.4):** one ff-only merge with pre- and post-checks; a branch switch in the main checkout mid-merge is a declared residual. The seat's compare-and-swap design was wrong and was subtracted.
- **2.8/2.9 carried in:** region refresh landed; dangling memory links are informational (the memory convention allows them); the aml-desk memory move waits until the session writing it ends; jev-research and the-hive copies were refreshed, aml-desk waits.
- **Builder:** Jake ruled "if anything use sonnet 5.5"; a blind A/B on the land helper tied; luna stays the default.
- **Proportional stopping:** on low-risk lanes, rare edge cases after three rounds become declared residuals; over-cap rounds go only to builder bugs on named cases, regressions and safety findings.

## Seat rulings during tranche 4 (2026-10-08)

- **IDs re-declared, not widened:** the three-digit space below R-995 had 78 never-assigned IDs; tranche 4 used R-578–R-599, R-626–R-629 and R-686. The `[RG]-\d{3}` grammar every rendered project inherits stays as it is.
- **Fable consult on the lane drafts:** the objective-producer change in 4.4 was cut (the seeded DRAFT line already is the not-ratified notice; entry points perform ratification); 4.2 imports 4.3's release helper instead of writing a second one; 4.5 shrank to three rows inside the existing four renders, with PATH-link policing and stale-exemption failure cut; 4.1's drift line became required.
- **Release by CI:** the root workflow runs the suite on macOS (blocking) and Linux (non-blocking) and, on a green push to main with template changes since the newest tag, runs the acceptance gate in-process and cuts the next annotated patch tag. The first green run cut `v0.6.4` (2026-10-08, run 37840989837). Tags are never cut by hand.
- **The acceptance gate's first run** found rendered TypeScript projects failing their own type check (TS2375 from the Part G lane); a two-line fix lane closed it before any tag carried it. Every template-touching lane now runs the gate before its land review.
- **Hosted CI's first runs** found three host assumptions in tests (a depth-1 checkout, a default branch named main, pi's install prefix); one lane fixed them with local reproductions. One Linux-only symlink check stays declared.
- **One suite lock:** `npm run test:locked` is the repository's full-suite lock; the seat's bash wrapper is a thin bridge onto it until no worktree predates it.
- **4.7 product handoffs:** edge-screener names `p87-setup` as its land branch (local commit; publishing and moving `main` are Jake's). The aml-desk ruling line and the basketball-geek dormant line wait until those sessions are idle.

## Seat rulings during tranche 5 (2026-10-08/09)

- **IDs re-declared, not widened:** tranche 5 used R-995–R-999, R-950–R-959, R-900–R-907, R-908, R-909, R-804, R-871, R-872, R-687 and R-688 (never assigned before). R-373–R-375 stay unused, as the writing-rule test comment says.
- **Fable consult on the six drafts:** 5.2 and 5.4 became one doctor lane; the state manifest is the one inventory and uninstall consumes its rows; the unexecutable Windows hook launchers were cut (Windows keeps only the knowledge hook); a README-versus-behaviour equivalence row was cut; `update` stays a documented sequence, not a command.
- **Subtract on safety boundaries over configurable layouts:** `state --paths` archives by default-deny and refuses overlapping or patterned roots instead of modelling aliases; uninstall validates every destination from its outermost root and refuses a symlinked settings file; per-entry pi removal hints and a test-isolation source scanner were subtracted.
- **Hooks move to Node in place:** the managed bash SessionStart entries are rewritten in place, retired links removed, and install and doctor name any leftover retired command. The seat backed up the Claude settings, landed, and ran install in one chain; every hook exited 0 when run by hand.

## Seat rulings during tranche 6 (2026-10-09)

- **6.7 deferred to Jake's 6b method ruling.** No tranche-6 tool prints a coverage, judged or covered count. When the state is built, it binds each judged row to its current Requirement text (two rows were rewritten after judgement within five days). One row missing its closing pipe was invisible to the TypeScript rail and was fixed; the class is declared in Open question 9. G-022 stays untested: its check pins only stale inline package-script claims (stale paths, flags and files are unpinned).
- **6.6 is a seat measurement, not a lane.** Baseline 2026-10-09: zero summaries written or picked up since the role marker went live (which sessions were eligible is not measurable exactly). The user-scope compaction-summary store and `nana-handoff.ts` are frozen until Jake rules; the replay re-runs on 2026-10-23.
- **6.4: the 2026-10-18 backstop binds.** A temporal proxy (a checker call earlier in the same turn) counts 20–23 candidate checked reports, but it cannot show each checked the report that followed, so it does not establish the twentieth-report stop. Nothing in the writing rule, checker or extractor changes before the verdict.
- **IDs:** R-239–R-241, R-601, R-648, R-649, R-689 and R-699 re-declared (R-241 reserved for a randomized arm, consumed only if the one-arm bound cannot decide); R-285–R-299 stay the reserve.
- **Lanes landed (2026-10-09):** desk usage line (0278aa8), the real-pi RPC contract and fixture hygiene (d872adb), knowledge outcome logging, archive filter and seed (6b652f9), test honesty — no silent pass, one pi locator (8400e4c), the candidate-rows lister (a5a2086). Subtractions: a fixed file-name list proving locator adoption was removed and the row narrowed; a Windows npm wrapper was fixed in the locator rather than skipped.
- **Knowledge injection (6.1 step 1):** 0 of 238 non-archive pointers read since the reviewer skip (pooled Wilson 95% upper 1.59%), the pre-registered FAIL by bound; 97% of pointers came from builder sessions with boilerplate prompts, and typed prompts got too few to judge. R-241 stays unconsumed. Whether to stop injection, and where, is Jake's call. **Ruled 2026-10-09 (Jake, the seat's recommendation):** every pi-worker child gets no automatic pull (R-285, R-286; lane and non-lane alike); the seat and typed pi sessions keep it until the 2026-10-23 re-measure; `nana-knowledge query` stays.

## How this was produced

- **Scan:** 15 read-only Opus 5.5 auditors. Ten planned lanes (session start, legacy layer, project lifecycle, the agentic loop, pack runtime, desk, knowledge and memory, proof machinery, instruction surfaces, install and platform) plus five gap lanes a completeness critic named (Jake as reader, the loop in product repos, seat continuity, the canonical builder launcher, instruction surfaces beyond READMEs).
- **Verification of record: gpt-5.6-sol through `pi-worker`**, blind to every other verdict, over all 165 findings, plus a sol completeness critic. Fable 5.1 had already checked the 122 first-round findings (two refuters per high finding); where the two disagree, sol's verdict stands (Jake, 2026-10-06: sol is the independent reviewer).
- **Seat checks:** the seat reproduced two findings itself (fresh-clone red suite, truncated AGENTS.md rule) and the 09-28 rulings record. Live state was snapshotted before and diffed after: no repo, config or hook changed (one auditor created and removed a stray 29-byte file in `~`).
- **Baseline:** `npm test` on main `86958c1`: 95/95 files, 5,811 checks pass, 4 skip, 315 s. `nana-setup doctor`: all good — which is itself a finding (doctor is blind to most of what follows).
- **Result:** 165 findings → **156 kept** (19 high, 89 medium, 48 low), **9 dropped** by sol (6 by design, 3 refuted). Sol corrected the claim, severity or fix of 132 of the kept findings; the fixes below are sol's corrected versions.

## Bottom line

The core works as documented — the 10-05 audit proved that with live runs, and the suite is green. What is not coherent is the experience *around* the core. Five root causes explain most of the 156 findings:

1. **Two generations of nana are installed side by side.** The Claude Code seat still loads May copies of `spec`, `py-lint`, `py-review`, `py-test` from nana-dev-kit (same names as the pack's, different contracts), plus legacy scaffolders (`py-init`/`ts-init`/`nana-init`) that rebuild the retired 17-hook stack; pi loads 22 Codex-rewritten legacy skills with broken paths; global `enforce*` flags still arm legacy gates in six repos; a third memory store (the MCP memory server) is wired into both runtimes; the context-size hook the 09-27 plan retired still runs and dirties repos. `nana-setup` only ever adds, and doctor sees none of it. (L1-03, L1-04, L2-01…L2-10, L7-05, L7-11, L9-03, L10-01, L10-07)
2. **One missing decision record disables two features.** No pi trust decision exists on this machine, so every project's post-edit checks are ignored (seven ignored-config events in aml-desk, zero receipts ever), and every product objective arrives labelled "UNTRUSTED DATA … never instructions" in the same block that says it governs. Ruling 8 (09-28) made trust a one-time owner act per repo; the act was never done and nothing in setup bridges it. (L1-01, L3-02, L5-01, L10-12, G1d-07)
3. **The loop the seat actually runs is not an artifact.** Builders moved to Claude Code Agent-tool subagents on 10-04: they load the seat's cwd instructions instead of the worktree's, five wrote concurrently in nana-pi's main tree on 10-02, they get no gate, no post-edit, no budget cap and no session-start context. AGENTS.md describes a launcher nobody uses; the roster is told five different ways; standing brief rules are hand-copied. Review rounds are voided by tree edits (6 of 59) and the cap's identity is the reviewer's cwd, which let one item take six rounds without an override. (G1d-01/03/04/05/08, L4-01/02/03/07/09, L7-03, G1b-01/03)
4. **Decisions do not reach where they are read.** Jake's eight 09-28 rulings live in nana-agent-loop's project memory, so nana-pi's HANDOFF still lists seven as open; the Windows claim was never narrowed (ruling 6), appetite fields never added (ruling 3), the attention-limit trial never started (ruling 2). Questions that end a session as OPEN or YOUR CALL die at `/clear` (Jake's background-subagent complaint is in no queue). (L9-02, L9-11, G1a-02, G1c-01/02, L8-10)
5. **The instruction surfaces are heavy and partly wrong.** AGENTS.md is 20.6 KB injected into every session and tells agents to read a 338 KB REQUIREMENTS.md at start; a rule sentence was truncated by the 10-05 audit's byte-copy and the copy test cannot see it; HANDOFF is 67% landed narrative; skills name commands that do not run as written; three product AGENTS.md copies tell agents to maintain `.pi/handoff.md`, the opposite of current behaviour. (L1-06, L1-11, L9-01/05/06/07, L3-05, G1e-01/02/06/07, L8-11)

Robustness gaps that bite routinely, independent of the five: **a fresh clone or worker worktree starts with `npm test` red** (five gitignored install outputs fail the README check — every lane brief has been saying "expect readme-check red") (L8-01); **`copier update` turns a clean older project red** because Part G never re-syncs (L3-01); **the desk service lifecycle is unmanaged** (bootstrap without kickstart, failure reported as skipped, doctor counts "loaded" as healthy) (L10-03); there is **no update, uninstall, CI or restore story**, and ten commits sit unpushed (L10-04, L8-03, critic S2).

## Decisions for Jake

Each is self-contained; the seat can start everything in Tranche 1 without them.

| # | Decision | Tested / found | Trade | Recommendation |
|---|---|---|---|---|
| D1 | **Canonical builder vehicle** | Three launchers in eight days, none declared. Agent-tool builders inherit the seat's cwd, have no cap, no isolation; native `isolation: worktree` exists in Claude Code 2.1.289 but can fall back to the current dir. Headless `claude -p` carried a dollar cap that never fired in 49 launches. | Agent definition = one file carries rules, isolation, turn cap and hooks, but the cap is turns not dollars and isolation must be made fail-closed. Headless launcher = dollar cap and clean cwd, but a second process pattern and the prior print-mode pitfalls. | **A `nana-builder` Agent definition installed by `nana-setup`**: turn cap with provenance, fail-closed worktree binding plus a write-path guard, the standing brief rules in its body. Budget = turns. (G1d-01/03/04/06/08, L4-03) |
| D2 | **Retire the legacy nana-dev-kit layer on this machine** — machine state you marked as yours | See root cause 1. Sol: the scaffolder misroute is model-selected and occasional, the four stale same-name skills are routine. | Removing too much strands repos that still use `.dev-wiki` (edge-screener has one). | **Three steps.** (a) Now: the four stale Claude skill copies become links to the pack (after nana-dev-kit stops installing them, or its `cp -r` writes through the link into the pack); `py-init`/`ts-init`/`nana-init` and the 22 broken `~/.agents/skills` imports move to a dated backup outside skill roots; the two global `enforce*` flags and three repo-local spec markers go. (b) After 10-18 (the 30-day mark the pi-1.0 ruling set): measure the MCP memory server's prompt cost, migrate the-hive's unique rows, then remove it from both runtimes. (c) Per repo: `.dev-wiki` projects and `wiki-*` skills after a usage check; archive the ~6 GB of old wiki indexes. (L2-*, L7-05, L7-11) |
| D3 | **Trust your own repos** | No `trust.json` exists; post-edit is inert everywhere; the objective label fires 100% of the time. | A five-minute one-time act now vs. a small command that makes it repeatable. | **Both:** run `/trust` once (restart pi) in aml-desk, the-hive, jev-research, basketball-geek and nana-pi; and approve a `nana-setup trust <dir>` command that records the decision through pi's own `ProjectTrustStore`. Separately: keep or reword the label ("UNTRUSTED DATA … never instructions" next to "governs") — it is your T2c ruling, rows R-021–R-025. (L1-01, L3-02, L5-01) |
| D4 | **Desk: freeze, measure, then rule** | The desk carries the largest maintenance load and nothing records whether desk sessions happen; unfelt since 09-16. | Freezing parks ~10 small desk fixes as Known limits. | **Freeze discretionary desk hardening**, add desk-owned usage events, rule retain / freeze / retire after two weeks of data. Keep only the flaky-test fix (it reddens every lane's `npm test`). (L6-12, L6-01) |
| D5 | **Receipts** (your 09-28 ruling 5 deferral has run out) | Zero receipt files, no reader, no `/nana-verify`. | Subtracting removes the completion-gate path you deferred. | **Subtract receipt production**, keep post-edit feedback; accept the config key as ignored for one release. (L5-08) |
| D6 | **Knowledge pull: monthly session archives** | 53% of pointers go to monthly archives; open rate ≤ 4.5% in Claude Code, ~0.1% in pi. Sol: no no-pull control, so do not kill injection yet. | Filtering loses archive hits in automatic pull (explicit query keeps them). | **Filter monthly archives from automatic results now**; run the controlled on/off comparison before deciding injection itself. (L7-01, L1-10) |
| D7 | **Blind reviewers** | pi reviewers receive pointers to the seat's own session narrative; the knowledge pull ignores the non-writer marker. | Reviewers lose background they might use. | **Yes**: `pi-review` sets a reviewer role and the knowledge pull skips it; workers keep the pull (until Jake's 2026-10-09 ruling stopped it for builders). It protects the independence you insist on. (L7-02, L1-05) |
| D8 | **Codex** | 146 of 147 Codex session files since 09-20 are imported Claude transcripts; native use is tiny. Codex still shares `~/.agents/skills`, the MCP memory server and a legacy hook. | Declaring it unsupported means nobody keeps its wiring current. | **Declare Codex unsupported** in the runtime matrix; retire its legacy hook and MCP wiring with D2. (L2-08, G1b-05, critic S3) |
| D9 | **Release and backup** | Main is 10 commits ahead of origin; six template commits since `v0.6.2` are untagged, so new projects get older templates than this machine runs. | — | **Tag `v0.6.3` and push main** (your acts). (L10-11, L3-04, critic S2) |
| D10 | **Local `git-checkpoint.ts` extension** | Machine-only, unmanaged; its checkpoint map clears at `agent_settled`, before the usual idle-time fork. | — | **Retire it** unless a live `/fork` restore probe shows value. (L5-11) |
| D11 | **Attention-limit trial** (ruling 2 approved it 09-28; never started) | Open-for-Jake has no ages or blocking split; asks still vanish at `/clear`. | — | **Start it after the Tranche 2 HANDOFF cleanup**, two weeks, ≤ 3 active blocking asks. |


## Tranche 1 — correctness of what runs today (seat-ownable, no ruling)

| # | Change | Findings | Cost | Falsifier |
|---|---|---|---|---|
| 1.1 | `readme-check.config.json` `externalPaths` for `node_modules`, `apps/bench/.ext`, `apps/bench/.ext/pi-web-access` (each with its reason); delete the "expect readme-check red" line from briefs | L8-01 | S | `git clone` into a temp dir, `npm test` exits 0 |
| 1.2 | Restore "carried in someone's head." and the blank line in AGENTS.md; R-859's test also asserts the preamble paragraph before the shared suffix | L1-11, L4-13, L9-01 | S | Re-applying the `d3c9e5a` splice fails the test |
| 1.3 | **Review ledger integrity:** verdict shape `/^[^\w\r\n]*VERDICT\b/m` with two negative probes; detect stdout/stderr regular files inside the reviewed tree by dev+ino at admission (refuse tracked, exclude or refuse untracked) and move every README example to scratch; cap identity = the reviewed tree's git common dir (`--tree`), refuse outside git; SIGINT/SIGTERM/SIGHUP kill and reap the child tree and release the reservation | L4-06, L4-01, G1b-01, L4-05 | M | An aborted review earns no round; an in-tree log redirect is refused before the review runs; a scratch cwd cannot open a fresh cap scope; Ctrl-C leaves no pi child |
| 1.4 | **Gate:** anchor the policy-file regex in both copies (`gate-paths.ts` and `nana-gate.ts`); skip rm-text scanning only for structurally non-executing commands (echo, printf, grep, rg, git message/read subcommands) and give headless blocks a recovery line; floor pi's own code-loading files (active and default `auth.json`, `settings.json`, `mcp.json`, `extensions/**`, project `.pi/{settings,mcp}.json`, `.pi/extensions/**`, the subagent `config.json`); one bounded regular-file reader (`O_NONBLOCK`, fstat, cap) for config, handoff and adoption reads | L5-03, L5-02, L5-04, L5-09 | M | Corpus: template configs ALLOW to `git diff`/`cat`; `grep -r "rm -rf" docs/` ALLOW; subagent config write BLOCK; a FIFO config stops the gate with a reason instead of hanging |
| 1.5 | **Session-start correctness:** adoption counts the complete nana structure (root HANDOFF.md + AGENTS.md + docs/sessions) and skips OS temp roots; the three pi injectors set `systemPromptOptions.sections` instead of forcing the whole prompt; notify fires on `ui_prompt_start` with a fixed short body; OSC write only when `ctx.mode === "tui"`; post-edit imports the shared path resolver | L1-02, L3-07, L5-07, L5-05, L5-06, L5-12, L5-10 | M | nana-pi leaves the adoption report; the session transcript shows the objective and writing sections; a gate dialog raises a desktop notification; RPC stdout carries no OSC |
| 1.6 | **Setup correctness:** doctor `pi packages` checks each extension dir is covered; desk = bootstrap then kickstart, failures are PROBLEM, doctor requires `state = running` and the plist's node ≥ 22.19; a dead knowledge-hook path reads ✗; `project --check` accepts any `YYYY-MM.md` | L10-02, L10-03, L10-09, L3-06 | M | Unregistering nana-pack turns doctor red; a stopped desk turns doctor red; a moved clone turns doctor red |
| 1.7 | Flaky `stage-key-persistence`: first make the runner print a red file's FAIL lines (no retained output names the failing assertion, so the cause is a hypothesis); then a sealed tests-only confirmation-budget override, the overlap case under a generous budget, the default-1000 ms boundary case kept, R-492 updated if 1000 ms is contractual | L6-01 | S | 20 consecutive full `npm test` runs, zero failures in that file |
| 1.8 | Text fixes: requirements skill `map:impact` per runner (pnpm no `--`, npm with `--`); drop the baked `--check` from `readme:check`; root README says the pull runs in both runtimes; front-door summaries say seven extensions; qualify AGENTS.md's "no opt-out" objective sentence; pack README tally shape; the banned word in HANDOFF | L8-11, G1e-06, L9-13, L9-12, L9-05, G1b-09, G1a-12 | S | readme check + a grep for each old string |

## Tranche 2 — one source of truth (subtraction and declaration)

| # | Change | Findings | Cost | Falsifier |
|---|---|---|---|---|
| 2.1 | **Retire `context-size-check.sh`**: R-301 diff (four hooks → three), drop it from HOOKS/desiredHooks/README/tests, install removes the exact nana-managed settings entry and symlink, owner deletes the five `.claude/.context-warned` flags | L1-04, L2-06, L4-12, L7-10, L9-09, L10-07 | S | A fresh session in a large repo writes no flag; `git status` in nana-pi, the-hive, jev-research is clean of `.claude/` |
| 2.2 | **Legacy sweep (after D2)** through a provenance-checked retired-artifact manifest in `nana-setup` (exact paths, lstat, never through a link, backup to `~/.claude/backups/<date>/`, unknown content preserved); Claude Code links the four runtime-neutral pack skills; doctor fails on a stale same-name regular directory and warns on the legacy scaffolders | L2-01, L2-02, L2-03, L2-04, L2-07, L2-10, L9-03, L10-01 | M | This seat's own skill list shows the pack's `spec` description; doctor reads ✗ when a May copy is restored |
| 2.3 | **One dated roster** (shared memory `reference_roster.md`): seat, seat-spawned builder, headless builder, slice reviewer (sol via pi), contract/land reviewer (astra), land ruler, with scope and precedence (a session's declared roles override the default); AGENTS.md points to it; older role memories become history; the review ledger records provider/model per run | L1-08, L4-07, L7-03, L9-08, G1d-01 | S | One grep for "worker" across rules, memory and AGENTS.md returns one current answer |
| 2.4 | **Runtime matrix** — one tested table: Claude Code seat, Claude subagent builder, pi TUI/desk, pi reviewer/worker, Codex (unsupported) × objective, shared memory, soul/standards, writing rule, knowledge pull, gate, post-edit, compaction summary, notify. The shared section opens "the bullets below describe pi sessions". A test fails when a hook or extension has no row | L1-07, L7-12, L9-04, L2-08, L6-07, G1c-04 | S | Adding an extension without a row turns `npm test` red |
| 2.5 | **Frontier hygiene:** archive the 09-28/29 narrative (T1, T2a–c, U2, E1, L5, S1, S2) in `docs/sessions/2026-09.md`; each Landed section becomes one line plus its corpus; close the eight answered rulings and apply ruling 6 (support matrix, see 5.6) and ruling 3 (appetite / review-on fields); one Open-for-Jake line links the REQUIREMENTS open questions; add the two lost asks (the background-subagent complaint; the tally-hook question goes to the trial verdict); a dated owner line for the writing-trial stop (2026-10-18); a structural HANDOFF check (word budget, no Landed headings, numbered references resolve, explicit dates not overdue) as a report-only mode | L9-07, L4-10, L7-07, L9-02, L8-10, G1a-02, G1a-05, L9-11 | M | The check passes on the cleaned file and fails on today's |
| 2.6 | **Lean AGENTS.md:** start-up reads HANDOFF; REQUIREMENTS by row lookup only; the objective contract shrinks to the invariant plus pointers; shrink `templates/_shared/working-under-nana-pi.md` itself (gate bullet to a pointer) so every consumer slims at once; diff R-859 first | L1-06, L9-06 | M | Session-start payload in nana-pi measured before and after (today ≈ 11.5k tokens plus the mandated read) |
| 2.7 | **Continuity rule:** before an OPEN, YOUR CALL or BLOCKED final report — and before `/clear` — every unresolved item is one HANDOFF line (Next or Open for Jake). Into nana-soul and the writing rule; measure misses for two weeks before building a startup producer | G1c-01, G1c-02, G1c-07 | S | Next `/clear` crossing: Jake does not paste the carry list |
| 2.8 | **Memory hygiene:** fix the stale shared facts; doctor resolves `[[links]]` within each tier and flags cross-tier-only and dangling links; consolidate aml-desk facts into its product memory; product work starts in the product root (already decided 09-18) | L7-04, G1c-06 | S | doctor's link row is green; no aml-desk fact lives in the umbrella memory |
| 2.9 | **Product AGENTS.md:** requirement for a marker-owned region; refresh the three product copies once; `nana-setup project --check` compares only that region | L3-05 | S | Editing outside the markers never trips the check; a stale region does |
| 2.10 | Rename the pi store to "compaction summary" in user-facing text only (paths and event names stay) | L1-12, G1c-03, L5-07 | S | — |

## Tranche 3 — the loop as an artifact (after D1)

| # | Change | Findings | Cost | Falsifier |
|---|---|---|---|---|
| 3.1 | **`nana-builder`** installed and doctor-checked by `nana-setup`: worktree binding that fails closed (abort if the resolved repo root is not the lane worktree), a PreToolUse write-path guard, a turn cap with provenance, the canonical brief preamble in its body (commit on the branch, stage explicit paths, no pipes before commit, foreground waits, read-only rules for audits), SubagentStart objective injection plus a side-effect-free shared-memory renderer | G1d-03/04/05/06/08, L4-03, L4-09 | M | A builder launched from the seat writes only in its worktree; a forced isolation failure aborts the launch |
| 3.2 | nana-pi gets its own `.pi/nana-pack.json` checker set (cheap per-file checks), trusted (D3), and the builder runs the same checks | G1d-07 | S | A seeded syntax error in a builder edit is reported in the builder's own turn |
| 3.3 | **Review:** committed revisions are reviewed in an immutable detached checkout (dirty snapshots materialized exactly or refused loudly); review-before-merge is the default with named per-repo exemptions; formal rounds go only through `pi-review` (Agent reviews are declared supplemental); a land ruling sits outside the cap only when it decides on existing evidence; `review-ledger report` prints rounds, launches, role, model, duration, overrides | G1b-03, G1b-02, L4-04, L4-08 | M | A seat commit during a review no longer voids the round; the report names the model for every round since the change |
| 3.4 | **Land helper:** refuses unclean source or main trees, runs the canonical suite on the source tip, ff-only merge, verifies containment, then prints the session and HANDOFF stubs; separate safe worktree removal and `git branch -d`; one branch prefix (`feat/*`) | L4-10, G1d-10, G1b-07 | M | A red suite on the tip blocks the merge; no merged lane leaves a worktree |
| 3.5 | Verifier-pipe guard (a pipe before `git commit` without `pipefail`) as one predicate used by a user-scope Claude hook and the pi gate; loop-specific gates stay in nana-agent-loop | L4-02 | S | The 09-20 masking command is refused in both runtimes |
| 3.6 | A shared working-pattern section in `templates/_shared` (worktree root, corpus root, launchers, cap, different-lineage rule, land checklist) with explicit local overrides (the-hive's round rule, aml-desk's UI exemption) | G1b-04 | S | A new project's AGENTS.md carries it |
| 3.7 | **End-to-end canary** after 3.1–3.4: one small real product change — right start-up context, isolated builder, post-edit check fires, sol review of an immutable revision, ledger row, tested land, HANDOFF update, next-session pickup | critic S1 | S | Every step leaves its artifact; any manual bridge found is a new finding |

## Tranche 4 — projects stay current

| # | Change | Findings | Cost | Falsifier |
|---|---|---|---|---|
| 4.1 | `copier update` re-syncs Part G (requirement row first; Part G's Requirement cells as a template-updated file the rail reads, Status and Evidence stay project-owned); an update-path test renders the previous tag, updates to HEAD, runs the rail | L3-01 | M | v0.6.0 → HEAD update leaves the rail green |
| 4.2 | Template acceptance gate: render both languages × scaffold/adopt, install, run each project's full native check; runs before every tag and in CI (after 1.1); a post-green release job cuts the tag instead of failing main | L8-09, L8-03 | M | Reverting the 10-05 lint fix turns the gate red |
| 4.3 | Non-blocking release-status line (template commits since the last tag, main vs origin) in doctor and at land time | L10-11 | S | — |
| 4.4 | Entry points: keep the distinct routes, align their completion messages (ratify the objective, trust the folder), test each route's declared contract; scaffold and adopt skills gain the ratify step; adopt skills list the real rendered files; `adopt-structure` names its source skill-relative; `nana-setup` and `pi-worker` installed on PATH and doctor-checked | L3-03, G1e-03, G1e-02, G1e-08, G1e-04, L4-11, G1e-07 | S | A fresh render's first session shows no `<the one thing this project is for>` line |
| 4.5 | Claim check for skills and the shared section (render-aware: paths, commands, flags) | G1e-01 | M | Re-introducing `map:impact --` in a skill fails it |
| 4.6 | Effective post-edit diagnostics: warn when the merged command set is empty or the starter, or when project config is ignored for want of trust; doctor's knowledge row opens and queries the index | L10-12, L3-06 | S | jev-research's empty set reads `!` |
| 4.7 | Product follow-ups (each in its own product lane): basketball-geek targeted migration in inline-conflict mode; aml-desk's stale priority line and unenforced per-lane rule; edge-screener's canonical branch | L3-08, G1b-06, G1b-08 | M | — |

## Tranche 5 — install, update, recover

| # | Change | Findings | Cost | Falsifier |
|---|---|---|---|---|
| 5.1 | One updating-and-removal runbook in the setup README; `nana-setup uninstall --dry-run` from an explicit ownership inventory; `update` only as a sequencer later (quiesce desk → source update → install → doctor) | L10-04 | M | A scratch home installs, updates and uninstalls to empty |
| 5.2 | The local clone is canonical whenever `nana-setup` or the desk is used; doctor compares the effective pi package tree with the tree supplying hooks and rules | L10-05 | S | A `pi install git:` copy beside the clone reads ✗ |
| 5.3 | Stable Node hook launchers (`~/.claude/hooks/*.mjs`, links on POSIX, copies on win32); shared-memory hook ported to Node over `project-key.mjs` | L10-06, L10-09 | M | The bash re-implementation of the project key is gone; the hooks run on win32 |
| 5.4 | Fresh-machine checklist (Node 22.19, pi, pi-subagents 0.75.0, clone, setup, umbrella objective, `~/.local/bin`, doctor); doctor checks pi is executable and `pi-review` is on PATH | L10-10 | S | A clean macOS account reaches doctor all-good from the README alone |
| 5.5 | **State manifest** (durable / rebuildable / re-ratified / disposable: rules, memories, trust, ledgers, sessions, service config, credentials) and a tested restore into a clean home, secrets excluded by default | critic S2 | M | Restore in a temp home: doctor all good, memories and ledgers present |
| 5.6 | Support matrix (ruling 6 applied): macOS tested; Linux without recorded acceptance; native Windows pack partial and untested; review wrapper and Claude shell hooks unavailable on win32; launchd macOS-only | L10-08, L5-13 | S | README, AGENTS.md and the setup README make the same claim |

## Tranche 6 — instruments before more machinery

| # | Change | Findings | Cost | Falsifier |
|---|---|---|---|---|
| 6.1 | Knowledge: log eligible-query outcomes and failures (R-893 skips stay unlogged); `NANA_KNOWLEDGE_HOME` in every real-process e2e and probe; remove redundant nested roots so the-hive's docs are indexed; the D6 filter; the controlled comparison | L7-08, L7-06, L7-01, L1-10 | S | A corrupt index shows in `pull.log`; the-hive's 162 missing docs are indexed |
| 6.2 | Test honesty: undeclared whole-file SKIPs fail; the seven pack tests that find pi through `npm root -g` honour `DESK_PI_ROOT` first (desk and bench keep their separate resolver contracts); one zero-model real-RPC contract test through the desk resolver; one test-root module for runner, rail and map | L8-02, L8-05, L6-08 | M | Removing pi from PATH turns the suite red, not quietly SKIP |
| 6.3 | `map:impact --rows`: candidate rows for a file, labelled as an over-approximation | L8-04 | S | — |
| 6.4 | Writing trial: all four clauses landed in t2-trial (c439c1d); a temporal proxy counts 20–23 candidate checked reports by 2026-10-09, unverified as distinct checked reports, so the 2026-10-18 backstop binds | G1a-01, G1a-04, G1a-07, G1a-09, G1a-10, G1a-11, G1a-06, G1a-08 | S | The verdict is recomputable from committed files |
| 6.5 | Desk usage events (D4) | L6-12 | S | — |
| 6.6 | Compaction-summary store: measure interactive compactions and later use before any retirement — seat measurement; baseline 2026-10-09: 10 compactions, 0 summaries written, 0 picked up; eligibility is not measurable exactly from the journal (`docs/reviews/compaction-summary-2026-10-09/`) | L7-09, G1c-03 | S | — |
| 6.7 | A machine-readable clause-coverage state before any coverage number | L8-06 | M | — |

**Parked with the desk freeze (D4):** L6-02 (Settings cannot save the objective block), L6-03, L6-04, L6-05, L6-06, L6-09, L6-10, L6-11, L6-13 — recorded as Known limits; picked up only if D4 rules retain. The desk's surface matrix (L6-07) lands with 2.4 regardless.

## What not to do (the evidence says so)

- Do not retire `pi-worker`: it is the vehicle for sol verification (G1d-02, corrected by sol).
- Do not retire the pi-subagents seed or its doctor floor: the architecture ruling created it for interactive pi delegation (G1d-09, by design).
- Do not add a CLAUDE.md link to the templates: Claude Code 2.1.289 loads AGENTS.md when no CLAUDE.md exists (L9-10, refuted).
- Do not add SessionEnd or objective-printing PreCompact hooks (G1c-04); revisit a one-line PreCompact retention instruction only after an observed loss.
- Do not replace review snapshots with detached HEAD only: dirty-tree snapshots are a supported contract (L4-01, G1b-03).
- Do not make release lag block main (L10-11, L8-03); do not add a gate timeout; do not re-derive pi's tool-resolution grammar in the desk (L6-03, L6-09).
- Do not rename the handoff subsystem or add a glossary; only user-facing "compaction summary" (L9-12).
- Do not rewrite nana-agent-loop's pre-09-18 archive duplicates (L7-07).
- Do not build a USD-cap shim on the Agent path unless D1 picks the headless launcher.
- Do not claim the map/readme/rail machinery catches nothing: the EARS and map lanes caught real overclaims and lost edges (L8-08, refuted).

## Status of the 09-27 plan

| Item | Status | Evidence |
|---|---|---|
| 1 config safety | landed | residual: never-throw is not never-hang (L5-09) |
| 2 gate | landed | residual false positives and pi's own files outside the floor (L5-02/03/04) |
| 3 handoff trust/provenance | landed | the store has been idle since 09-28 (L7-09) |
| 4 canonical test path | landed | no CI (L8-03); fresh clone red (L8-01) |
| 5 one objective producer | landed | injection uses the forced-prompt path (L5-05) |
| 6 review-round ledger | partial | Claude-side and land reviews outside it (G1b-02, L4-04); cap scope by cwd (G1b-01) |
| 7 hard worker budget / shared launcher | dropped silently on the move to Agent builders | L4-03, G1d-06 |
| 8 pre-spend field, close score, CANNOT reader | open | G1b-06, L9-11 |
| 9 queue hygiene | open | L9-02, L8-10 |
| 10 attention-limit trial | approved 09-28, never started | D11 |
| 11 feel before hardening | not applied to the desk | D4 |
| 12 priority appetite | approved 09-28, never applied | 2.5 |
| 13 retrieval baseline | open; data now enough to act | 6.1, D6 |
| 15 /goal + settle-gate trials | /goal probe ran 09-28 (print mode does not enforce); settle gate not started | — |
| 16 evidence labels | stated in the template, unused | L4-09 |
| 17 post-edit through a real producer | open | D3, 3.2, 4.6 |
| 18 ledger and doc hygiene | partial | 2.3, 2.5 |
| 19 retire context-size-check | open | 2.1 |
| 20 pi-review liveness | open | 1.3 |
| 21 Windows | ruled narrowed 09-28, never applied | 5.6 |

## Acceptance by surface

Items that touch permission (1.4, 3.1's guard, 3.5), review authorization (1.3, 3.3), session start and context injection (1.5, 2.4, 3.1's SubagentStart, 6.1), subprocess lifecycle (1.3's signals, 1.6's desk, 5.3) or installer writes to the live machine (2.1, 2.2, 5.1–5.3) ship with deterministic tests, a mutation that reddens them, and a gpt-5.6-sol review through `pi-review` (gpt-6-astra for contract rows and land rulings), within the three-round cap. Docs-only items (1.8, 2.5–2.7, 2.10) need no agent review; their check is the readme check and the HANDOFF report mode. Every behaviour change starts as a requirement diff.

## Most likely wrong

1. **The legacy layer's practical harm.** The four stale same-name skills are routine, but sol rated the scaffolder misroute medium: the model chooses the route and projects are created rarely. If no misroute ever happened, D2(a) is hygiene, not a fix.
2. **Native worktree isolation for Agent builders.** `isolation: worktree` exists in the 2.1.289 schema, but nobody has verified it for background agents or its fallback; 3.1 may need the headless launcher after all.
3. **The knowledge pull's value.** The ≤ 4.5% open rate comes from an exact-path join with no no-pull control; in-session use may be higher than it looks, which is why D6 filters rather than kills.

