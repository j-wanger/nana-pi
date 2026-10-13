# Fact-check — CHANGE.md (process lane), external and process claims

Checked 2026-10-13 against: installed pi 1.0.2 (`$(npm root -g)/@earendil-works/pi-coding-agent`), `.github/workflows/ci.yml`,
`~/.pi/agent/review-ledger*.jsonl`, `~/nana-agent-loop/{OBJECTIVE.md,app/tests/review-round.test.ts,app/scripts/review-round.mjs}`,
`~/yokai-world/docs/reviews/`, `HANDOFF.md`, `docs/sessions/2026-10.md`, `~/.claude/nana-memory/shared/*.md`. Repo read-only.
Repo-internal code claims (line cites, test counts, tree totals) were left to the code fact-check unless they bear on a ruling.

## External tools

| # | Claim (CHANGE §) | Verdict | Evidence |
|---|---|---|---|
| E1 | pi 1.0.2 appends a missing PATH as literal text, no warning (§3.3, `resource-loader.js:100-114`) | VERIFIED | `resolvePromptInput` at `dist/core/resource-loader.js:100`: `existsSync` false → `return input`; no warning. (An existing-but-unreadable file warns, then also falls back to literal text.) |
| E2 | pi repeats the flag and joins parts with a blank line (§3.3, cites `cli.md:219`) | VERIFIED, citation half-wrong | `cli/args.js:75-76` pushes each flag; `core/agent-session.js:1243` joins with `"\n\n"`. `cli.md:219` says only "Appends text or an existing file … and is repeatable" — it says nothing about the join. Cite agent-session.js:1243. |
| E3 | Order of appended parts follows argv, so the standard can sit after the immutable sentence | VERIFIED | `resource-loader.js:480-482` maps `appendSources` in order. Today `pi-review.mjs:177` appends the immutable sentence after the caller's own `--append-system-prompt <brief>`, so the standard lands last, after the brief. |
| E4 | `template:accept` renders only into temp folders (§3.2) | VERIFIED | `scripts/template-acceptance.mjs:73,78` `mkdtempSync(os.tmpdir()…)`. |
| E5 | `CLAUDE.md` links to `AGENTS.md` (§3.2) | VERIFIED | `CLAUDE.md -> AGENTS.md` symlink; markers at `AGENTS.md:68` and `:97`. |
| E6 | Suite exit gates land and release (`nana-land.mjs:104-106`, `ci.yml:70`) (§3.7) | VERIFIED | `ci.yml:70` `npm test`; `release: needs: [suite, install-check]` (`:73`); `nana-land.mjs:104-106` returns code 1 on suite failure. |
| E7 | CI macOS suite 746 s (§3.7) | VERIFIED (±2 s) | `ci-macos-a907b45.log`: `npm test` 13:55:22 → job post-steps 14:07:50 ≈ 748 s; research file says 745 s. |
| E8 | Install check runs doctor outside the clone, so CI never proves step 8 (§6.11) | VERIFIED | `lib/install-check.mjs:180,295`: doctor runs with `cwd: <temp home>/project`. |
| E9 | A templates change cuts a tag, so model names in the shared file would cut one (§3.1) | VERIFIED | `RELEASE_SURFACE = ["templates","copier.yml"]` (`lib/release-status.mjs:12`); CI release on every main push. Shared file names no model today (grep). |
| E10 | `pi-review` on PATH runs from main (§6.11) | VERIFIED | `~/.local/bin/pi-review -> ~/nana-pi/packages/nana-pack/bin/pi-review.mjs`; the agent-loop forwarder also imports main's `review-round.mjs` by relative path. |
| E11 | `nana-agent-loop/app/tests/review-round.test.ts:42-44` asserts override with a free-text reason (§3.4) | VERIFIED (lines 41-43) | `it('overrides only with a stated reason')` at :41, `roundCapVerdict(4,'worker rewrote the buffer path')` at :42. Forwarder re-exports only `REVIEW_ROUND_CAP, roundFromOutPath, roundCapVerdict`, so a new export breaks nothing there. |
| E12 | User ledger 09-28→10-13: nana-pi 79 overrides (64 free, short ×10, standard ×5); yokai 16 short; trading-zone 17 standard (§1) | VERIFIED, with a caveat | Counts match `kind:"override"` records in the AUDIT log `~/.pi/agent/review-ledger.jsonl` exactly. The never-rotated tally (`review-ledger.rounds.jsonl`) holds 36 nana-pi over-cap records (5/4/27). Say "audit-log override records", not "overrides". |
| E13 | Umbrella `OBJECTIVE.md` rule of 2026-09-16 allows "instrument/implement" plus a free-text reason (§6.1) | VERIFIED | `~/nana-agent-loop/OBJECTIVE.md:13`: `--over-cap "<what changed since r3>"`; added by `0d94f0f` (2026-09-16, "Jake 2026-09-16"). |
| E14 | yokai-world briefs ask for a first-line verdict with LAND-WITH-FIXES (§1) | VERIFIED | e.g. `v2-base-2026-10-12/astra-v2-base-land-brief-3.md:7`. |
| E15 | "yokai's brief template" drops "verdict nowhere else" (§6.8) | UNVERIFIED | No template file found in yokai-world or its memory; the wording repeats across individual briefs under `docs/reviews/v2-*`. |
| E16 | Memory note asks for a first-line verdict (§1) | VERIFIED | `reference_pi_review_procedure.md:93` "first line exactly `VERDICT: LAND \| LAND-WITH-FIXES \| SEND-BACK`" (its line 73 says "ending in a VERDICT line" — self-contradictory). |
| E17 | `nana-setup trust <dir> [--yes]` exists and asks before recording (§3.6, §5) | VERIFIED | `nana-setup.mjs:51`, `:434` (needs `--yes` without a TTY). Doctor `!` row at `doctor.mjs:451-457`; any `!` → "NOT verified", exit 1 (`nana-setup.mjs:323-335`). `.pi/nana-pack.json` is tracked. |
| E18 | Acceptance script: "`req:tree` … pass" (§5) | WRONG (minor) | `npm run req:tree` is `requirements-tree.mjs --write`; it regenerates and cannot fail on drift. The check is `node scripts/requirements-tree.mjs --check`. |

## Jake's rulings and house rules

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| P1 | 10-11: plan names its threat model; plan caps 1 (small) / 2 (gate or format); reopened only by a named fail-open bug; no edits after all-LAND; urgent fixes alone (§1, R-1100–R-1103) | VERIFIED | `feedback_lane_process_2026_10_11.md` items 1-3; `HANDOFF.md:18`; `docs/sessions/2026-10.md:75`. Ruled class is "gate / ledger-format / cross-repo-parser". |
| P2 | Install-check rule is 10-12, "the queue text says 10-11" (§1) | VERIFIED date; WRONG attribution | Memory item 5 and `MEMORY.md:59` say 2026-10-12. HANDOFF's queue item (Next 6) says nothing about the install check. The 10-11 date comes only from the workflow task text. The rule also says "locally on macOS … as part of its land checklist, before `nana-land`"; R-1114 drops "on macOS" and moves it out of the land checklist (into AGENTS.md outside the markers; the reason given — downstream repos have no nana-setup — is sound). |
| P3 | §1 "Its rulings live only in HANDOFF, the session archive and memory" | PARTLY WRONG | The 10-12 install-check ruling and the 10-13 builder split are in shared memory only (not in HANDOFF, not in the archive). |
| P4 | 10-13 materiality bar; no MUST → LAND; LAND-WITH-FIXES retired; confirmation round = delta (§1, R-1104, R-1108, R-1109) | VERIFIED | `feedback_review_materiality.md`; `HANDOFF.md:22`; `docs/sessions/2026-10.md:29`. |
| P5 | Standard's consequence list includes "a broken install, hook **or CI gate**" (`review-standard.proposed.md`) | UNVERIFIED | The memory bar says "a broken install or hook". "CI gate" appears only in the workflow task text, not in any primary source. |
| P6 | Builder: Sonnet 5.5 for the whole lane per Jake's 10-13 split; sol plan and build, astra land (header) | VERIFIED | `reference_roster.md` "Builder split — Jake, 2026-10-13": Sonnet for gate-adjacent, multi-file, many-row lanes; sol slice reviewer, astra land. |
| P7 | Sonnet runs as a Claude subagent and never receives the preamble (§1) | VERIFIED | Roster: Sonnet runs as a seat-spawned Claude subagent; only `pi-worker.mjs:92` appends the preamble. |
| P8 | Class GATE-FORMAT (two plan rounds) (header) | VERIFIED as allowed; NOTE | Jake's queue calls it "a small process lane". The gate classification rests mainly on §6 item 1 (over-cap refusal), which is itself a YOUR CALL. If Jake declines item 1, the class should be re-read (1 round). |
| P9 | Jake's caps are plan-review caps; "Maximum three rounds per item" stays; memory "change it" was the seat's note (§6.2) | VERIFIED | Ruling item 2 reads "one plan-review round …"; HANDOFF:18 "Small lanes get one plan review". The "change it" line is in the seat-written "How to apply". |
| P10 | Threat-model wording "tools, machines and registries" is a seat widening of the ruled "our own tools' output" (§6.3, R-1100) | VERIFIED as stated; see scope S2 | No primary source says "machines" or "registries" (grep of memory, HANDOFF, archive). Only the workflow task text says it. |
| P11 | "Suite green before commit" = touched tests per commit, full suite before the last (§3.5, "the seat's 10-11 rule") | UNVERIFIED | The 10-11 seat change is "impact-selected tests per round, full locked suite once before external review" — about review rounds, not builder commits. The queue item said "suite green before commit"; the plan narrows it. |
| P12 | Preamble carries the recurring rules 7-18 (queue) | PARTLY | R-1115 covers rules 7, 8, 11, 12, 13 (both halves), 14 (await), 16 plus the four queued items. Rules 9, 10, 15, 17, 18 are omitted without a stated reason (they are seat-side: session splits, the seat re-runs mutations, cross-repo corpora, "stays" pairs, differential lexers). §1 says all 7-18 recur in 3-10 lanes. Say why each is left out. |
| P13 | §3.5 "seat-script and test-deletion rules split onto two lines so each rule owns one line" | WRONG | `builder-preamble.proposed.md` puts both on one line: "No suite test runs, imports or copies a seat script. Never delete a test your brief does not name." The R-1115 delete-a-line mutation then turns two titles red, not one. |
| P14 | Desk freeze: origin-rule port-0 fix is "a test-only edit, INFERRED outside the desk freeze" (§6.6) | UNVERIFIED | `apps/desk/test/origin-rule.test.mjs:17` (default port 4391) is in the desk. Jake's 2026-10-10 ruling ("the desk stays frozen", HANDOFF:12, :55) records no test carve-out. That is Jake's call, not an inference. |
| P15 | Downstream carry list (§6.7) | PARTLY VERIFIED | jev-research, the-hive, trading-zone, yokai-world carry the marker; aml-desk, family-planner, game-world, returner carry the heading without markers. trading-zone and yokai-world are also copier projects (`.copier-answers.yml`), so "copier repos take the next CI tag" overlaps the first group; basketball-geek (copier) has no section at all. |
| P16 | Carry for `reference_pi_review_procedure.md` covers only the verdict (§6.8) | INCOMPLETE | Under item 1 that memory's "`--over-cap "<what changed since r3>"` is the only way past three" becomes false too. Add it to the carry. |
| P17 | Hardening plan 2.6 wants a smaller shared file (§6.11) | VERIFIED | `docs/hardening-plan-2026-10-06.md:126`. |
| P18 | IDs R-1100–R-1116 inside the lane range; main max R-1092; no branch ≥ R-1100 | VERIFIED | grep of `REQUIREMENTS.md` on main and every local branch. |
| P19 | Builder preamble unchanged since `df6372f` (10-08), 18 lines | VERIFIED | `git log` on the file; `wc -l` 18. |
| P20 | Standard over-cap reason in the shared pattern since `eb937f8` (2026-10-10) | VERIFIED | `git log -S` on the shared file. |

## Scope creep (nothing in a ruling or the queue asked for it)

- S1. **R-1105** (the consequence list may appear only in the standard file, never in the shared pattern or AGENTS.md), with its test and mutation. No ruling asks for it. It contradicts `feedback_review_materiality.md`: "durable copy in pi-review's standard instruction and the working pattern via the process lane". It is also a text-placement lint of the kind `feedback_proportional_stopping.md` says not to build. Drop it, or state the departure from the memory note.
- S2. **R-1100 writes a widened ruling into the shared pattern**, which fans out to every project: "tools, machines and registries" for Jake's "our own tools' output". The plan files it as a seat decision. Changing the scope of Jake's ruled wording in a sealed row is his call, not the seat's.
- S3. **R-1110 extends the over-cap refusal to `review-ledger run`.** The queue says "make pi-review refuse". Justified because both launchers call `admit()`, but it is an extension. Name it in the item-1 YOUR CALL.
- S4. **A new R-719 title "review round cap is sealed at three"** duplicates the existing check "cap is 3" (`review-round.test.mjs:21`). Reuse the existing check for pair S10.
- S5. **Preamble additions beyond rules 7-18 and the queue:** "any file the brief names as the seat's" (no-edit scope widened) and "a check helper that takes a boolean refuses a function" (from rule 14's body, not its recurring rule). Small, but unrequested.
- S6. **The parallel test runner moved out of the lane.** Jake queued it inside "a small process lane". The workflow allowed recommending a split, so this is not creep, but it changes Jake's queue item and adds a lane under his at-most-two-lanes rule. Present it to Jake as a recommendation, not a done deal.
