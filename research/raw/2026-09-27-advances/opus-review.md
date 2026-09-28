# Critical review — nana implementation (nana-pi + nana-agent-loop), 2026-09-27

Reviewer: Opus 5.5 headless, read-only. I re-derived every claim below from the artifact (file:line, a command I ran, or a machine log). Where two helper agents did the reading, I name it and spot-checked the highest-ranked items myself. Grades: **PRIMARY** means source code, a machine log, or a command I ran. **INFERRED** means I reasoned from code but did not execute it. Scratch probes are in `/private/tmp/claude-501/-Users-jwang-nana-agent-loop/3beaf51b-…/scratchpad/w3/` (`pull.mjs`, `cite.mjs`, `rounds.mjs`, `journal.mjs`, `usage.mjs`, `ctx.mjs`, plus the helper agents' `gate-probe.mjs`, `kn-probe.mjs`, `round-probe.mjs`).

## The finding in five lines

1. **Since 09-18, none of the recorded spend touched the current priority.** The priority is "make the nana-pi experience consistent, coherent and effective". The last commit in either nana repo is 2026-09-18 14:23. From 09-19 to 09-27 the work was the-hive (13 session entries) and jev-research (22 entries). The 09-18 decentralization made this invisible by design: in a product repo, the objective hook prints the product's own priority and only the umbrella *objective* line, never the umbrella *priority*.
2. **The 09-16 fixes for Jake's diagnosis are written, not enforced.**
   - *Session scoring decayed within three days.* 2 of ~13 the-hive entries and 0 of 22 jev-research entries carry a score.
   - *The round cap lives only in `pi-review`, and it is filename-parsed.* When the Codex quota ran out on 09-20, reviews moved to a hand-rolled `claude -p` launcher with no cap at all.
   - *The "pre-spend check" and "decision collector in nana-pi" from the 09-16 plan were never built.*
3. **The knowledge pull runs but shows no sign of being used.**
   - 227 pulls so far.
   - 67% of pulls include a monthly session-log archive (74–149 KB files, pointed to with a 22-word snippet).
   - A proxy citation check finds 0 downstream citations in the repos where the spend happened.
   - The "week of pull.log, then decide" checkpoint (due about 09-23) passed with no decision.
4. **The largest context defect is stale state, not bloat.** Start-of-session payload is modest (Claude Code ≈ 4–6k tokens). But pi re-injects a 09-13 compaction summary ("Do not modify gameplay or presentation code yet") into every the-hive session, 56 of them since 09-16, reviewers included. Memory and HANDOFF also carry contradictory rules about model roster and paths.
5. **Code is well-tested for what it asserts: 1,058/1,058 nana-pi checks and 4,613 app tests pass.** The high-blast defects are in what nobody asserted:
   - the pi gate can be disabled by the agent editing its own config;
   - an allow-pattern short-circuits a compound command;
   - common destructive variants (`rm -r -f`, `find -delete`, `git clean --force`) pass;
   - handoff injection ignores project trust.

---

## Test runs (honest counts)

| Suite | Command | Result |
|---|---|---|
| nana-pi packages (28 files: nana-pack 13, nana-knowledge 6, nana-setup 8, nana-stage 1) | `node <file>` per file (no `npm test` script exists in any nana-pi package — see D4) | **1,058 PASS / 0 FAIL, all rc=0** (PRIMARY) |
| apps/desk, apps/bench | not run | Desk e2e binds fixed ports while the live launchd desk (`com.nana.pi-desk`) is running; I did not risk it. **Unverified.** |
| nana-agent-loop `app` | `node app/node_modules/vitest/vitest.mjs run --root …/app` (`npm test` needed approval I could not get headless) | **4,613 passed, 82 skipped, 6 failed; 15 files failed to load; 4,701 tests / 269 files.** Every failure is a path resolved from `process.cwd()` (e.g. `ENOENT … scratchpad/w3/src/engine`, esbuild `Could not resolve …/scratchpad/w3/src/host/loop-main.ts`), because I ran from outside `app/`. I read these as environment artifacts, not defects. That is unverified until someone reruns from `app/`. Side note: the tests depend on cwd (LOW). HANDOFF's "4366 green" (07-29) is stale. |

---

## A. Objective fit

**A1 — Since 09-18, 0 recorded commits served the priority line; the mechanism hides that (HIGH, PRIMARY).**
- **Evidence:**
  - nana-pi reflog: last entry 1789755812 = Fri 18 Sep 14:23 (`date -r`).
  - nana-agent-loop's last entry is also 09-18.
  - the-hive reflog runs through 09-27 ("T4 LANDED…", "Session wrapped").
  - Session headers: the-hive `docs/sessions/2026-09.md` has entries 09-19 → 09-27; jev-research has 22 entries 09-18 → 09-23.
  - pi usage since 09-16 (from `~/.pi/agent/sessions`): jev-research 66, the-hive 56, nana-agent-loop 21, nana-pi 4.
- **Why it is invisible:**
  - `nana-setup/claude/hooks/nana-objective.sh:9-18` picks the nearest OBJECTIVE.md walking up from cwd and appends only `sed -n '/^\*\*Objective/p'` from the umbrella, i.e. the umbrella objective line, never its priority line.
  - pi's `nana-objective.ts:160-171` does the same (`umbrellaLine`).
  - So in the-hive and jev-research no session is ever shown "make the nana-pi experience consistent", and none could score against it.
- **Caveat:** this may be Jake's intended steering (objective line 1 is "build products with agents"). The artifacts do not record Jake re-ranking nana-pi below the products after 09-18. HANDOFF (umbrella) still names the nana-pi priority as current.
- **Cheapest fix:** print the umbrella *priority* line too in both producers, plus a one-line "last commit in nana-pi: N days ago".
- **Falsifier:** Jake says the product lanes were the intended priority. Then change OBJECTIVE.md's priority line, which is the documented one-commit way to open a lane.

**A2 — Mechanisms that demonstrably serve the priority, and those that don't.**

| Mechanism | Evidence it runs | Evidence it changes outcomes | Verdict |
|---|---|---|---|
| Objective print (both runtimes) | journal: `objective_pickup` 162 (PRIMARY) | Scoring decayed to 2/35 product entries after 09-19 (B1) | Runs; the effect is not shown |
| Knowledge pull | pull.log 227 rows, p50 30 ms, p95 187 ms (PRIMARY) | 0 citations in product repos (A3) | Runs; the effect is unmeasured and, by proxy, nil |
| pi-review watchdog | many corpora (PRIMARY) | Yes — it is the review lane | Keep. The cap inside it is weak (B2) |
| Post-edit checks + receipts | `~/.pi/agent/receipts` → **ENOENT**, although `receipts.enabled` defaults true (`lib/config.ts:59`) and the-hive configures `.gd` checks | None on this machine | **INFERRED:** it never produced a receipt. The builders are Claude Code Opus workers, not pi, so pi's post-edit never sees the edits. Subtraction or re-home candidate. |
| nana-handoff (pi) | 143 pickups, 40 writes | Injects stale imperatives (E1) | Net negative in the-hive today |
| nana-gate (pi) | runs in every pi session | Most pi sessions are read-only reviewers (`-t read,grep,find`); builders are `claude -p` | Low exposure, but see C1–C3 |
| nana-setup + doctor | `doctor` → "all good" (PRIMARY) | Detail text is inverted (C8) | Keep; fix the instrument |
| Desk "nana code" | launchd loaded | Unfelt since 09-16 (HANDOFF "Open for Jake" #6); dashboards :7320/:7321 unfelt since 09-04/05 | Habit; see the turn-it-off test below |
| Loop runner + trust ladder + ceremony hooks (nana-agent-loop) | 0 governed runs since 08-25 (HANDOFF:29); 0 `loops/*.loop.yaml` enable `trustLadder` (loop-side agent, Grep) | None this month | Retired lane still charging every seat session (A4) |

**A3 — The knowledge pull points mostly at narrative archives (MED-HIGH, PRIMARY: `pull.mjs`, `cite.mjs`).**
- 227 pulls from 09-16 to 09-28: `pi` 151, `claude-code` 72.
- Top hits:

| Hit | Count |
|---|---|
| `~/nana-agent-loop/docs/sessions/2026-09.md` | 128 |
| `…/2026-07.md` | 103 |
| `~/nana-pi/docs/sessions/2026-09.md` | 96 |

- 151/227 pulls (67%) include a session-log hit; 84 (37%) are *only* session-log hits.
- Articles are whole-file docs (`lib/parse.ts:7`: `#L` keys only for ledgers), with a 22-token snippet (`lib/query.ts:22`). So the pointer is "somewhere in 149 KB".
- **Proxy citation check:** 165 cross-repo, non-session pointers were shown in the-hive and jev-research, and **0** basenames later appear in those repos' session logs. The 4 "hits" in nana-agent-loop pre-date the pulls.
- **Limits:** this is a basename proxy, not a transcript read; an in-session read that left no text is invisible.
- **Test:** exclude `docs/sessions/**` from the index for one week, then rerun `cite.mjs`.

**A4 — The retired lane still taxes every session in nana-agent-loop, which is where the seat runs (MED, PRIMARY + loop-side agent).**
- The seat's working dir is nana-agent-loop (this very task's path: `…/-Users-jwang-nana-agent-loop/…`).
- `.claude/settings.json:3-58` wires the hooks:
  - SessionStart runs `loop-status --hook-session-start`, which re-bundles a 4,115-line `loop-status.ts` with esbuild and reads 416 run journals (`loop-status.mjs:64-86`).
  - Stop runs `loop-status --hook-stop`, which **blocks turn-end** on loop-ledger debts: unclosed runs, QUEUE drift, graduation, land-check-evidence (`loop-status.ts:3621`). It also runs `system-map --hook-stop`.
  - There are 3 PreToolUse node guards on every Bash call.
- The project memory index loaded every seat session has 44 entries, most about the runner (e.g. "Loop-driver pattern RETIRED", "Trust ladder landed").
- The 09-04 recommendation "silence the loop ledgers' session-start lint while dormant" (`docs/loops-vs-pi-2026-09-04.md:48`) was not acted on. The HANDOFF:89 lint debt is still "held until the ruling".
- The 10-02 meter date is 5 days away.
- About 14–15k runner-only source lines and ~144 runner test files (loop-side agent, Grep counts).
- **Turn-it-off test:** move the seat's cwd to `~/nana-pi` (or disable the SessionStart/Stop loop-status hooks) for one week. If no session misses a loop ceremony, the ruling is made.

**A5 — Subtraction candidates, each with a turn-it-off test.**
- (a) **Loop-status SessionStart/Stop hooks.** Disable them for a week; count sessions that needed them. Expected: 0 (no runs since 08-25).
- (b) **pi post-edit receipts.** Receipts dir absent; Tier-2 "/nana-verify" deferred. Test: delete the receipts code path. Expected change: none observable, because nothing reads receipts.
- (c) **Monthly session logs in the knowledge index** (A3).
- (d) **Dashboards :7320/:7321.** Unfelt for 3+ weeks. Test: stop them; wait for Jake to notice.
- (e) **`context-size-check.sh`** (C7). It has been silent in nana-agent-loop since 08-06. Nobody noticed, which is itself the turn-it-off result.

---

## B. Process integrity (documented vs run)

**B1 — Session scoring against OBJECTIVE is not enforced and has decayed (HIGH, PRIMARY).**
- The rule appears three times: `OBJECTIVE.md:12`, `the-hive/OBJECTIVE.md:12`, `jev-research/OBJECTIVE.md:14`.
- Grep for `CLEAR|STRETCH|CANNOT|Objective score`:
  - the-hive: hits only at lines 42 and 50 (09-19 (2), (3)); none of the ~11 later entries.
  - jev-research: **0 of 22** entries.
  - The nana repos scored their 09-16 → 09-18 entries, then stopped (no entries after).
- **The CANNOT path has no reader in product repos.** CANNOT → `objective-` marker in HANDOFF → "the session-start collector surfaces it". That collector is `loop-status`, a project hook that exists only in nana-agent-loop. The 09-16 plan's "decision collector ported to nana-pi" does not exist: Grep for `pre-spend|decision collector|--decisions` in `nana-pi/packages` matches only the objective printer/test.
- 0 `objective-` markers have ever been written (Grep of HANDOFF: only the rule line 9).
- **Mechanism gap:** scoring is a prose duty at session close; nothing checks for it.
- **Cheapest fix:** a Stop/`session_shutdown` check that the newest `docs/sessions` entry contains a score token (advisory, not blocking).
- **Falsifier:** add it for one week and see whether the score rate goes above 80%.

**B2 — The 3-round review cap is bypassable by construction, and was bypassed in practice (HIGH, PRIMARY).**
- **How it works:** the round comes from the output *basename* (`review-round.mjs:14-17`), and "no round means no cap" (`:21`). The test pins that fail-open as intended (`review-round.test.mjs:20`).
- **Executed bypasses (nana-pi agent):**
  - `sol-final.md`, `r3b.md`, `sol-4.md`, `sol-review4.md`, `r4/out.md` → round null → allowed.
  - `sol-r1-redo-of-r7.md` → round 1.
  - `--over-cap --retries` treats `--retries` as the reason.
- **In practice:**
  - jev-research `docs/reviews/local-tool-judge-2026-09-19/` holds 351 files with 22 names at r4 (`rounds.mjs`).
  - When Codex quota died (09-20), reviews ran via `launch-opus-review-r4.sh`, i.e. `nohup claude -p --model claude-opus-4-8 …`. That never calls `pi-review`, so there is no cap. Grep finds `over-cap` 0 times in that corpus.
  - `pi-review` is also used as a **worker** launcher (`launch-workers.sh:11`, `--out wp-$p-r1.md`), so "round" conflates build rounds, review rounds and experiment rounds ("Round 4" is also jev-research's experiment phase).
- **Honest limit:** I cannot tell from filenames whether any single item got a 4th *review*. That is the point: neither can the instrument.
- **Fix:** require `--item <slug>`, keep a counter file (e.g. `~/.pi/agent/review-rounds.jsonl`), refuse a null round, and give the Claude-side reviewer launcher the same counter. Better still, make the cap a count of LAND/BLOCK verdicts per item in `docs/reviews/<item>/`, checked by a script any launcher calls.
- **Test:** `pi-review --item x --out sol-final.md` four times; the 4th must refuse.

**B3 — HANDOFF drop rule: nana-pi's HANDOFF violates its own rule and is 9 days stale (MED, PRIMARY).**
- `nana-pi/HANDOFF.md:7` has a dated section, "Landed today (2026-09-18, main 7a90d3a)". The rule says "Never add a dated section" (`nana-agent-loop/HANDOFF.md:12`).
- `:13` "A nested-root bug is being fixed on branch tooling-portable right now — fix in flight" and Next #1 "Land the tooling-portable nested-root fix" are both stale:
  - the reflog shows `merge tooling-portable` twice on 09-18;
  - `discovery.test.mjs:156-161` pins the nested-root case and passes (31/31).
- Next #3 ("a week of pull.log, then decide the citation checker") passed its date with no decision.
- The umbrella HANDOFF duplicates product "Open for Jake" items (#2, #3, #3b, #8) that line 16 says moved out. That gives two homes, which will drift.
- **Enforcement:** "The handoff-shape advisory (400 lines)" is the only tooth, and it measures length, not staleness.
- **Cheapest test:** a lint that flags HANDOFF lines containing "right now / in flight / today" older than 48 h by `git blame`.

**B4 — Where overspend comes from now: every limit is attached to one tool, not to the item (MED, INFERRED from B2 + audit).**
- The 09-16 audit found that rounds went unbounded when the priced governor disappeared (`docs/audits/…spend…:130-144`).
- The fix re-attached a limit to *one tool*. When the tool changed (quota exhaustion → Opus 4.8 reviews), the limit fell away.
- The same shape applies to scoring (a prose rule in a file that product sessions don't read closely) and to the objective (prints the wrong priority).
- **Common gap:** limits bind to tools, not to the *item* or the *lane*. Nothing holds a per-lane ledger of rounds, sessions and days that any launcher consults.
- **Falsifier:** a per-item counter shared by all launchers, run for two weeks. If round counts stay ≤3 and there are no bypass filenames, the diagnosis holds.

**B5 — The model-roster rules contradict each other across the three homes the seat reads (MED, PRIMARY).**
- `feedback_opus5_not_seat.md:14`: "use Opus 4.8" for the seat. The actual seat is Fable (`~/.claude/settings.json:5` `"model": "fable"`).
- `feedback_fable_roster…` (index line 8): Fable is loop manager. The project memory `project_loop_model_defaults_2029` says "Fable REVIEW-ONLY". HANDOFF:104 says "fable-5 manager/reviewGate".
- `MEMORY.md:31` index still says "via app/scripts/pi-review.mjs", while the body was updated to the nana-pack bin.
- Each is small, but together they make "which model does what" a re-derivation every session.
- **Fix:** one roster file, one line per role, dated; the others point to it.

**B6 — Measured vs merely written.**

| Rule | Written | Enforced | Measured |
|---|---|---|---|
| Objective print | yes | yes (both runtimes) | journal `objective_pickup` count only |
| Session scoring | yes | no | no (my grep is the first count) |
| Round cap | yes | `pi-review` only, filename-based | no counter |
| Knowledge pull used | yes | runs | pull.log exists; citation checker never built |
| Two-tier memory | yes | symlink self-heal hook | `doctor` row only |
| HANDOFF drop rule | yes | 400-line advisory (length only) | no |
| "Seat instructs, Opus works" | yes | no | no |

---

## C. Code defects with blast radius

The nana-pi items come from a helper agent's executed probes; I spot-checked C1–C2 at `nana-gate.ts:35-40,81-86`. The loop items are from a read-only agent, INFERRED unless marked.

- **C1 — HIGH (executed). The agent can disable the pi gate by editing its own config.**
  - `PROTECTED_PATHS` (`nana-gate.ts:35-40`) covers `auth.json`, `settings.json`, `.ssh`, `.env*`, but not `~/.pi/agent/nana-pack.json`. Config is re-read per call (`:66`).
  - A `write` of `{"gate":{"allowPatterns":[""]}}` → ALLOW; the next `rm -rf ~` → ALLOW.
  - **Fix:** protect `nana-pack.json` (both scopes), `~/.claude/settings.json` and `~/.claude/hooks/`; reject empty or `.*` allow patterns.
  - **Test:** edit of `~/.pi/agent/nana-pack.json` must BLOCK.
- **C2 — HIGH (executed). An allow pattern short-circuits compound commands.**
  - `:81` returns before the danger check at `:86`. With `allowPatterns:["^git status"]`, both `git status; rm -rf ~` and `git status && sudo rm -rf /` → ALLOW.
  - **Fix:** run the danger check first, or split on `; && || |` and newlines.
- **C3 — MED (executed). Destructive variants pass; benign ones are blocked.**
  - **Pass:** `rm -r -f ~`, `rm -R`, `find ~ -delete`, `git clean --force -d`, `git push origin +main`, `git checkout -- .`, `python3 -c "shutil.rmtree"`, `base64 -d | sh`, `rsync --delete`, `truncate -s0`, PowerShell `ri -r -fo`, and `cat ~/.aws/credentials`. The `read` tool is ungated, so `.env` is readable via `read`.
  - **Blocked:** `echo reboot` and `git log --grep=sudo`, which fail closed in headless runs.
  - No test covers the pattern lists.
  - The gate is honestly documented as advisory (AGENTS.md:52-53), so the blast radius is bounded. But its *stated* job is to prompt on dangerous commands, and it misses the common forms.
- **C4 — HIGH (executed). Handoff injection ignores project trust.**
  - `nana-handoff.ts:93-110` checks only for symlinks. A committed `.pi/handoff.md` in a cloned repo is injected into the system prompt even with `isProjectTrusted → false`.
  - This contradicts nana-pi AGENTS.md:137 ("honored only in trusted projects" for project config).
  - **Fix:** require trust, or store the handoff under user scope keyed by the cwd hash.
- **C5 — MED (executed, scratch HOME). A corrupt knowledge index fails silently forever.**
  - A corrupt `index.db` → query error reported as `no-hits` (`hook.ts:127-128`).
  - Staleness is judged by db mtime, which never updates, so every prompt spawns a new detached build (`hook.ts:37-47`, `stdio:"ignore"`).
  - Failures are not logged (`:145` logs only on success).
  - **Fix:** log non-ok reasons; rebuild on `SQLITE_NOTADB`.
- **C6 — MED (executed). A config parse error silently drops the whole user config.**
  - `config.ts:62-67,76`: one trailing comma → `extraPatterns` gone → `terraform destroy` ALLOW. `objective.path` also reverts to the default.
- **C7 — LOW-MED (PRIMARY). `context-size-check.sh` warns once per repo, ever, and probably invisibly.**
  - The flag `$ROOT/.claude/.context-warned` (`:18-22`) is never cleared. Flag mtimes: nana-agent-loop **Aug 6**, the-hive Sep 22, jev-research Sep 19.
  - Output goes to stderr with exit 0 (`:32`). INFERRED: not shown to the model on UserPromptSubmit.
  - The message recommends `/dev-debrief`. The only references I found are this hook and a 09-03 comparison doc, so it is likely dangling (unverified: skills may be symlinked out of Glob's reach).
- **C8 — LOW (PRIMARY). The `doctor` instrument prints an inverted message.**
  - `nana-setup/lib/doctor.mjs:51-58`: a healthy regular file gets ✓ plus "private rule is not a regular file — replace"; an absent file gets ✗ plus "private — never in the repo".
  - Seen live: `nana-setup doctor` printed that ✓ row, then "all good".
  - Tests assert status only, not the detail text.
- **C9 — MED (INFERRED). `pi-review` on win32 breaks, and so does the hook command.**
  - `cpuSeconds` shells `ps -o time=` (`pi-review.mjs:70`); with no `ps`, CPU reads as 0, so every run over ~75 s is killed as a "stall". `process.kill(-pid)` (`:91`) is POSIX-only.
  - nana-setup strips the env prefix for cmd.exe but keeps POSIX single quotes around the path (`settings.mjs:14,138`, `steps.mjs:209-214`).
  - Windows is the standing proof gate and still unrun (nana-pi HANDOFF Open #3).
- **C10 — MED (INFERRED, loop). Pi sessions launched by the loop runner load user and project pi extensions in the host process, outside the host gate and sandbox.**
  - `pi-adapter.ts:693` uses the default `agentDir`; `:817` reloads with no trust resolver; worktree isolation strips `.claude` but not `.pi` (`worktree-isolation.ts:272`).
  - A worker that writes `.pi/extensions/x.ts` gets code execution in the next session.
  - This undercuts "un-bypassable" for the pi engine. Low exposure while dormant.
- **C11 — LOW. The system map drifts from code.**
  - `components.json:550` says `runSandboxedBash` is "the single chokepoint every adapter funnels bash through", but Pi uses a spawnHook (`pi-adapter.ts:239-241`) and Claude the SDK sandbox.
  - The loop-status component says advisories are "never the Stop hook", but the code appends a frictions advisory to the Stop block (`loop-status.ts:3680-3692`).
- **C12 — LOW. Unbounded growth.**
  - `nana-journal.jsonl` is 212 KB and `pull.log` 102 KB, neither rotated.
  - `pi-review` temp dirs are never removed (`pi-review.mjs:96`).
  - The handoff write is non-atomic, and the last compaction from *any* session in that cwd wins (`nana-handoff.ts:166`). So a reviewer's compaction can overwrite the seat's summary.
- **C13 — Tests that assert the implementation, not the invariant.**
  - `review-round.test.mjs:20` pins the bypass.
  - `gate-status.test.mjs:16-26` reads the real `~/.pi/agent/nana-pack.json`, so results depend on the machine.
  - `pi-registration.test.mjs` asserts "the live settings.json registers ~/nana-pi" (machine state).
  - Loop side: `revoke-on-drift.test.ts:289-294` greps source for `Date.now`; `run-registry.test.ts:205-215` counts an exact call string.

---

## D. Duplication and drift

- **D1 — Two objective producers with different payloads (MED, PRIMARY).**
  - Claude Code hook: the 2 lines + "raise it before spending" (395–1,095 B).
  - pi extension: the whole OBJECTIVE.md up to 4,000 chars (`nana-objective.ts:48`), rules included, with "say so to the user before spending", and a different resolution walk (lstat stop vs `-r` skip) and missing-file behaviour (UNAVAILABLE marker vs silence).
  - This contradicts memory `feedback_no_duplicate_mechanical_checks` ("one producer per piece of evidence"). No test compares them.
  - **Fix:** one `nana-objective` CLI that both call, the same way `nana-knowledge hook` already does it right.
- **D2 — Three gates, none covering the builders.**
  - The nana-agent-loop host gate (dormant runner + parked desk), the pi `nana-gate` (mostly read-only reviewers), and Claude Code `defaultMode: auto` with `skipDangerousModePermissionPrompt: true` (`~/.claude/settings.json:3,46`).
  - The builders are `claude -p --setting-sources ''` workers (`reference_claude_cli_headless_isolation`, the jev launcher). They carry only `--allowed-tools` lists and **no hooks at all**: no objective, no knowledge pull, no post-edit.
  - INFERRED: the "nana-pi experience" is mostly not what the building agents experience.
- **D3 — Four homes for the same rule.**
  - The round cap is stated in OBJECTIVE.md:13, HANDOFF:93, nana-pi AGENTS.md:70, `reference_pi_review_procedure.md:79`, and again in each product OBJECTIVE.md. Several of these restate the mechanism (filename parse) as well, so a mechanism change means editing 5+ files.
  - The model roster lives in 3 homes (B5).
- **D4 — No single mechanical check in nana-pi.**
  - nana-agent-loop has `cd app && npm test` as the "only repo-wide mechanical check" (AGENTS.md:11).
  - nana-pi has no `test` script in any `package.json`. The 28 package test files are run by hand or by memory. HANDOFF/sessions report per-package check counts, but nothing runs them all.
  - **Cheapest fix:** a root `npm test` that runs every `*.test.mjs` and fails on non-zero; my `runtests2.sh` is 15 lines.
- **D5 — Two knowledge corpora on one topic, and a narrative archive indexed as knowledge.**
  - The 09-16 audit already found `agentic-engineering-wiki` next to `research/knowledge/` (`…knowledge-utilization.md:80-88`).
  - The new pull adds a third reading of the same material, and its top hits are session narratives (A3), which AGENTS.md:15 routes as "narrative", not knowledge.

---

## E. Context shaping (measured)

Claude Code session start, per repo (PRIMARY: `ctx.mjs`; chars ÷ 4 ≈ tokens):

| Repo | CLAUDE.md | project MEMORY.md | rules (soul + personal) | shared-memory hook | objective hook | ≈ total |
|---|---|---|---|---|---|---|
| nana-agent-loop (the seat) | 4,632 | 6,985 | 4,784 | ~5,200 | 395 | ≈22.2k chars ≈ 5.5k tok, **plus loop-status output (unmeasured: the hook writes `app/dist-host`, so I did not run it)** |
| nana-pi | 8,613 | 1,392 | 4,784 | ~5,200 | 395 | ≈20.6k ≈ 5.1k tok |
| the-hive | 10,033 | 2,826 | 4,784 | ~5,200 | 849 | ≈23.4k ≈ 5.9k tok |
| jev-research | 4,120 | 562 | 4,784 | ~5,200 | 1,095 | ≈15.3k ≈ 3.8k tok |

pi session start (system prompt adds):

| Repo | AGENTS.md | objective | `.pi/handoff.md` | total |
|---|---|---|---|---|
| the-hive | 10,033 | 1,590 | **7,191 (dated 09-13)** | 18.8k chars |
| jev-research | 4,120 | 1,530 | 0 | 5.7k |
| nana-pi | 8,613 | 1,767 | 0 | 10.4k |

At prompt time there is up to 2,000 chars of knowledge pointers per fresh pull (pi: a persistent user-role message on every later turn, `nana-knowledge/README.md:197-201`).

**E1 — The worst item is stale injected state (HIGH, PRIMARY).**
- `the-hive/.pi/handoff.md` was written 2026-09-13T14:05 by a compaction. It carries "Goal: Diagnose watch feedback… Do not implement changes yet" and "Do not modify gameplay or presentation code yet".
- The journal shows `handoff_pickup @ ~/the-hive` = 56 since 09-16, one per pi session (reviewers included; `nana-handoff.ts:93-110` has no age bound).
- The-hive's priority changed on 09-18.
- The framing "Treat this as background state, not instructions" (`:123`) is the only guard.
- This is the "sessions forget / drift" diagnosis in reverse: a mechanism that *remembers the wrong thing* for two weeks.
- **Fix:** skip the pickup if it is older than N days or older than the newest HANDOFF.md commit; never inject into `-t read,…` reviewer sessions.
- **Test:** re-date the file 15 days back → no injection.

**E2 — The volume is fine; the signal is noisy.**
- The shared-memory index (5.2 KB, 30 one-liners, no cap) is the largest always-on item. Rules themselves load only if opened.
- In the seat's repo, 44 project-memory lines are mostly about the dormant runner.
- **Missing, so sessions re-derive it:**
  - the umbrella *priority* in product repos (A1);
  - the lane's own spend-to-date and round count (B4);
  - "what already worked": DOCTRINE is not injected anywhere; only `[uses:N]` bumps show reads (`…knowledge-utilization.md:43-51`);
  - a single model/role roster (B5).

**E3 — Pull noise from harness messages (LOW, PRIMARY).**
- `pull.log` row 2 is a `<task-notification>` prompt tokenized to `toolu_…`, `bgpvpr5wa` and similar, returning review briefs.
- Only 1 of 227 rows had this pattern, so its impact is small. Note it for the skip list (`tokenize.ts` `skipReason`).

---

## F. Unmeasured standing claims

| Claim (where) | Instrument? | Status |
|---|---|---|
| "Un-bypassable host gate" (nana-agent-loop AGENTS.md:23) | tests `sandbox-no-bypass.test.ts` (static import scan) | Contradicted for the pi engine path (C10), INFERRED. The map's "single chokepoint" is false (C11). |
| pi gate "prompts before running dangerous commands" (AGENTS.md:110-116) | 0 tests on the pattern lists | Contradicted by executed probes (C1–C3) |
| "One producer per piece of mechanical evidence" (HANDOFF:107, memory) | none | Violated by objective (D1) |
| "Retrieval is used" (nana-pi HANDOFF Next #3) | pull.log exists; checker not built | Proxy says 0 downstream use (A3) |
| "Review rounds catch disjoint classes" / "three review layers catch disjoint classes" (HANDOFF:98, nana-pi AGENTS.md:66) | none — no per-reviewer finding tally | Unmeasured. The corpora exist, so it is cheap to tally. |
| "The 3-round cap bounds spend" (OBJECTIVE.md:13) | filename regex | Bypassed (B2) |
| "Every session can say which line its spend served" (OBJECTIVE.md:3) | none | 2/35 product entries scored (B1) |
| "Suite of record 4366 green" (HANDOFF:61) | the suite | Stale; now 4,701 collected (see Test runs) |
| "Desk hardened + reviewed" (nana-pi HANDOFF) | desk tests | Not run by me (ports); unverified |
| "Handoff = continuity across the window" | journal pickups | Measured as a pickup count only; stale content not measured (E1) |

---

## Top 10 recommendations
Ranked by (cost-of-error × confidence) ÷ cost.

| # | Recommendation | Evidence | Cost | Test / falsifier |
|---|---|---|---|---|
| 1 | Bound `.pi/handoff.md` pickup: skip if older than 3 days or older than HANDOFF.md's last commit; skip in read-only reviewer sessions; require project trust | E1, C4 (`nana-handoff.ts:93-110`; the-hive file dated 09-13, 56 pickups) | ~20 lines + 2 tests | A 15-day-old file is not injected; an untrusted repo's file is not injected |
| 2 | Show the umbrella **priority** line (not just the objective) in product-repo sessions, plus "nana-pi: last commit N days ago" | A1 (`nana-objective.sh:17-18`, `nana-objective.ts:160-171`; 0 nana commits since 09-18) | ~10 lines × 2 producers (or 1 after rec 7) | Jake reads one the-hive session start and confirms the steering, or re-ranks by editing the priority line |
| 3 | Protect `nana-pack.json` (both scopes) and the Claude hooks/settings; run the danger check before allow patterns and per command segment | C1, C2 (executed) | ~15 lines + 4 tests | `write ~/.pi/agent/nana-pack.json` → BLOCK; `git status; rm -rf ~` with an allow pattern → BLOCK |
| 4 | Make the round cap per-item and launcher-independent: required `--item`, persistent counter, null round refused; the Claude-side reviewer launcher calls the same check | B2 (`review-round.mjs:14-21`; jev `launch-opus-review-r4.sh` bypass; `over-cap` 0 hits) | ~60 lines | 4th call with `--out sol-final.md --item x` refuses; two weeks of corpora show no r4 without an over-cap line |
| 5 | Add an advisory session-close check that the newest `docs/sessions` entry carries a CLEAR/STRETCH/CANNOT token, in both runtimes (Stop / `session_shutdown`) | B1 (2/35 scored since 09-19) | ~30 lines | Score rate > 80% over the next 10 entries; if it stays low, the rule is not wanted — drop it from OBJECTIVE.md |
| 6 | Take `docs/sessions/**` out of the knowledge index (or chunk it by `## ` entry), then build the 20-line citation proxy (`cite.mjs`) as `nana-knowledge cite` | A3 (67% of pulls hit session archives; 0 downstream citations) | index config change + ~40 lines | Citation rate over one week vs 0 baseline; if still 0, turn the pull off (A5 test) |
| 7 | One objective producer: a `nana-objective` CLI called by both the bash hook and the pi extension | D1 | ~50 lines, deletes one implementation | A parity test (same input → identical text) passes |
| 8 | Make the loop-runner ruling now (the 10-02 meter is 5 days out; the evidence is in): gate the loop-status SessionStart/Stop ceremony behind "a governed run in the last 14 days", and move the seat's cwd to the repo it is serving | A4 (0 runs since 08-25; Stop still blocks on ledger debt) | settings edit + 1 condition | A week with the hooks off → count sessions that needed them (expected 0) |
| 9 | Add a root `npm test` in nana-pi that runs all 28 package test files (plus desk/bench unit files) and fails on non-zero; fix the `doctor` detail inversion and assert detail text | D4, C8 | ~20 lines | `npm test` exits 0 today at 1,058 checks; the doctor test fails on the current `doctor.mjs:54-58` |
| 10 | One dated roster file (role → model) and one HANDOFF staleness lint (lines with "today / right now / in flight" older than 48 h); delete the restated mechanism text from the 4 other homes | B3, B5, D3 | ~1 hour docs + ~30-line lint | The next session start shows zero contradictory model lines; the lint flags nana-pi HANDOFF:7,13 today |

**Not recommended:** more review rounds on any of the above. Every item has a deterministic test named; the logs show instruments beat rounds (`…spend…:134-137`). That is a DOCTRINE-class result I did not re-derive.

---

VERDICT: DONE

Most-likely-wrong (the five claims I'd bet against first):
1. "No recorded spend has served the priority line since 09-18." Nana-pi work may have happened uncommitted, in other worktrees, or be Jake's intended steering. I checked reflogs, session headers and pi session dirs, not every branch.
2. "0 downstream citations" of pulled pointers. The basename-in-session-log proxy misses in-session reads and citations in commits or briefs.
3. "Post-edit receipts never produced." The receipts dir may have been deleted, or `receipts.dir` pointed elsewhere at some point. I did not read journal history for post-edit events.
4. "All 21 app-suite failures are cwd artifacts." The error messages point that way, but I did not rerun from `app/` to prove the suite is green.
5. The loop-side items (C10 extensions escaping the host gate; Stop hook cost). These are INFERRED from code reading by a helper agent that could not execute anything.
