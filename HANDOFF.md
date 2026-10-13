# Handoff — nana-pi frontier

*Frontier only. Narrative lives in this repo's `docs/sessions/`. One line per live decision; drop a line once it is obvious-default, gone, or archived — rewrite, don't accumulate.*

**No `OBJECTIVE.md` here.** nana-pi's objective IS the umbrella one, `~/nana-agent-loop/OBJECTIVE.md`: build products with agents, with nana-pi as the shared toolkit AND experience. Current priority (Jake, 2026-10-10; review 2026-10-24): nana working consistently in terminal mode, without the desk, for both seats (Claude Code, or pi with nana-pi), on macOS and Windows, installation and every hook included. (Both runtimes print it: the Claude Code SessionStart hook, and pi via the pack's `nana-objective`.)

## Landed (one line each; the narrative is in `docs/sessions/`)

- 2026-09-18 to 10-05: setup and the per-repo objective, the 09-28 rulings, self-hosted requirements, pi 1.0, the writing trial, the edge desk on pi MCP, the code map seeing tests — `docs/sessions/2026-09.md`, `docs/sessions/2026-10.md`.
- 2026-10-06 to 10-09: the hardening program, six tranches and forty lanes, complete; CI cuts the template tags — `docs/hardening-plan-2026-10-06.md`, `docs/sessions/2026-10.md`.
- 2026-10-09: builders lose the automatic knowledge pull (Jake) — `docs/sessions/2026-10.md`.
- 2026-10-10: the new priority line in the umbrella `OBJECTIVE.md` (sol LAND, 10/10). Rulings: nothing reaches main unless an independent reviewer accepted it; rm runs freely only inside the working directory; Jake requires Windows testing now; the desk stays frozen; the export rule gets an explicit pi carve-out; a study stops when it cannot write its evidence.
- 2026-10-10: the requirements tree (capabilities, features and subgroups; shared rows; feature lifecycle) and four-digit requirement IDs landed together on Jake's checkpoint-2 acceptance, after sol and astra final reviews — `docs/sessions/2026-10.md`.
- 2026-10-10: the land rule — `nana-land` refuses any commit no review covers and any revision with a verdict other than LAND, keeps every reviewer's verdict, and has no exemption; landed on Jake's checkpoint-2 acceptance after sol and astra reviews — `docs/sessions/2026-10.md`.
- 2026-10-11: main pushed (Jake), CI cut template v0.6.8; Windows now runs in hosted CI as a non-blocking suite leg. Its first run reached `npm test` with 69 of 133 test files failing on the default checkout (64 in a measurement run that kept LF line endings), sorted into five product bugs and fix lanes — `docs/reviews/windows-ci-2026-10-11/windows-triage.md`.
- 2026-10-11: the verdict reader takes a review's verdict from its final line, or from a plain first line when the final line carries none. yokai-world's lands work again: its reviewers put the verdict first — `docs/sessions/2026-10.md`.
- 2026-10-11: on Windows, install now registers nana with pi. It runs the first pi on PATH (npm, pnpm, Volta or Scoop) and runs a `.cmd` shim through cmd.exe with quoted arguments. A pi that is found but broken is a problem, not a skip, except a macOS or Linux pi whose interpreter is missing. Doctor checks pi there too, and post-edit reports a missing Windows tool as "could not run" — `docs/sessions/2026-10.md`.
- 2026-10-11: Jake's process rulings. Every plan names its threat: honest variation in our tools' output is in scope, deliberate forgery is out. Small lanes get one plan review, gate and format lanes two; after that only a named fail-open bug reopens a plan. Once every reviewer says LAND, the seat edits nothing more. Urgent fixes ship alone and get hardened later. Builders: time one lane with Sonnet 5.5 and one with luna before any roster change.
- 2026-10-11: the product report is a feature. One command builds a readable page from the requirements, the open asks and stored assessments. Each assessment shows as current, out of date or unassessed, and refresh packets let any seat refresh one — `docs/sessions/2026-10.md`.
- 2026-10-12: the Claude Code seat's hooks run on Windows. Install writes all five as a plain node call with no shell. The verifier also watches PowerShell, and doctor checks each hook. They need Claude Code 2.1.139 or later. Your Windows machine is the only real proof — `docs/sessions/2026-10.md`.
- 2026-10-13: CI installs pi as the registry stood when the seat first installed pi 1.0.2. A new pi-codemode release had broken fresh installs for our tests, and the macOS suite is green again — `docs/sessions/2026-10.md`.
- 2026-10-13: Jake's review ruling. A review blocks only on a material problem: a realistic input with a consequence that matters. No blocking finding means LAND, and a confirmation round checks only the change since the last round.
- 2026-10-13: one command installs nana into a temporary home and runs every hook the way Claude Code and pi do. CI runs it on macOS and Windows and blocks on either; both pass with no expected failures — `docs/sessions/2026-10.md`. Main's run 38414636460 passed it on both, so the CI half of the 2026-10-24 "done" is met.
- 2026-10-13: every review now gets one standard text from pi-review: the last-line verdict and Jake's materiality bar. The working pattern carries his plan rules, the builder preamble has twelve refreshed rules, and fresh-machine step 8 trusts the clone — `docs/sessions/2026-10.md`.
- 2026-10-13: Jake's rulings. Sonnet builds larger or riskier lanes, and luna builds small lanes with every test named. Any change that touches code with tests goes through the worker and reviewer pattern. A machine may leave the land model unset; then the seat gives the land review.

## Carried residuals (live; one line each)

- U2: a project-scope policy symlink target is not on the floor. The aml-desk AGENTS.md copy waits for an idle session to refresh.
- E1: nothing in the catch ledger may change review practice, models, roles or spend until a seeded-defect control and a clean-patch control run.
- L5: a broken hook symlink exits 127 before its fail-open code runs; the adoption hook is not role-gated to the seat.
- S1/S2: display and encoding follow-ups (lossless `Cwd:` encoding, desk path display, escape-token helper, look-alike dashes, display package, 16× pre-cap, CLI rendering test).
- Requirements: the rail proves marker identity, not clause coverage (open question 6b); aml-desk's rail copy has 193 rows off form; basketball-geek has 2.
- Edge desk: nothing bounds the total size of the blocks one tool returns; a narrowed desk spawn drops the MCP servers and pi's other built-ins.
- pi 1.0: the seed's `asyncByDefault: true` restates upstream (drop it at the next seed revision, R-361 diff first).
- Review-ledger lane: document the force-added ignored-file exception to staging independence; strengthen the non-mutating-`check` test with a stale sentinel.
- Tranche 3: the land helper does not defend a branch switch in the main checkout mid-merge; reviews refuse repositories with submodules.
- Tranche 4: the acceptance gate prints nothing on a pass; one Linux CI symlink check fails.
- Tranche 5: uninstall's preview stops at a loaded desk; its ancestor checks are preflight-only; the shared-memory hook throws on a closed pipe.
- Tranche 6: per-check SKIPs inside a test file stay invisible to the rail; nothing keeps future pi tests on the locator; a Windows machine install-and-hooks rehearsal is still unexecuted (the suite now runs in hosted Windows CI).
- Knowledge ruling: `review-ledger run` sets no reviewer role; a review-test fixture can loop forever.
- Tranche 2: an install re-run reports the four linked skills as "skipped"; doctor prints Node's SQLite warning; the trial rubric scores only decisions the extractor finds. Full list: the 2026-10-07 session entry.
- `~/nana-agent-loop` still tracks the retired hook's empty `.claude/.context-warned`.
- Four-digit IDs: aml-desk's hand copy of the rail still reads three digits (hand edit, no urgency); basketball-geek is on the older pytest-marker rail, so taking the new tag is a migration. The rails sort ID lists as text (cosmetic). A character outside the shared whitespace list between a row's opening pipe and its ID hides the row from both rails. The tree checker still splits lines on LF without CR handling (the Windows lane).
- Land rule: the helper checks that every recorded verdict is LAND, not who reviewed; the round records are a plain file; a narrow review counts for everything up to its revision; a direct commit to main bypasses it (the working pattern forbids that). Every revision reviewed before the land rule needs a fresh review.
- Install check: it proves install and hooks in a temporary home, not a live Claude Code session. Linux runs no install check. Its Windows doctor note list carries two labels that never print as notes there: one skill row passes and the other does not exist.
- Review standard: projects other than nana-pi take the new working-pattern text only when `nana-setup project` runs there. `review-ledger run` gets no standard. Nothing stages a pi-review change before it reaches every caller.
- CI pin: the install gate checks the workflow text, not the resolved packages; a check that imports pi after install is the hardening step. The cutoff does not freeze deprecations or retags. The suite's template acceptance test needs the network, and a network hiccup refused one land run.
- Claude Code hooks on Windows: uninstall still refuses there, and its leftover-entry report would miss the new form (the Windows install-shape lane). Doctor's four hook-file rows read "skipped (win32)" just above the five ✓ settings rows. On the Windows CI leg, three file-mode checks and one test that deletes its own working folder stay red (test portability). Nothing here proves how Claude Code itself starts the hooks, routes PowerShell, or how long they take. Reviewers found the PowerShell lexer's gaps one character at a time over three rounds. The hardening step: a Windows-leg test compares its comment and string spans with PowerShell's own tokenizer over generated commands.
- Windows pi launch: nana runs the first `pi.com`, `.exe`, `.bat` or `.cmd` on PATH — not PowerShell's `pi.ps1`, an alias or a function, and never a `pi.cmd` in the working folder. A `.cmd` pi whose path or package folder holds `%`, `!` or a double quote needs a manual `pi install`. Post-edit calls a missing tool a failed check when it hides behind a non-simple first word or later in a compound command. A failing command led by an internal command outside the sealed list reads as "could not run".
- Verdict reader: a plain first-line LAND followed by a rejection that avoids the word "verdict" still reads LAND. Look-alike letters outside the fold table and misspelled labels are not caught. The reader ignores a middle verdict line when the final line carries one. Notes that say "verdict" after a first-line verdict leave the round empty. yokai-world's nine empty records from before the fix stay; a session merged those revisions by hand.
- Desk residuals live in `apps/desk/README.md` Known limits.
- Product report: 37 of the 38 migrated assessments carry an inferred stamp commit, so several show out of date from day one; the installation feature's was refreshed through the guide. "Current" means "matches the stamped ledger", not "rechecked against later decisions". Packets refuse while REQUIREMENTS.md has uncommitted edits. The suite's historical stamp check needs full git history; a shallow clone fails it. No one has yet run the refresh loop with a second model as checker.
- Requirements tree: no row says the watchdog turns handoff off for every child, yet one share rests on it. Feature statuses miss partial freezes (the compaction store; desk rows in the notices feature). Brief fields and a land-time tree diff come next.

## Where things stand

- **The desk = "nana code"** (`apps/desk`), :7317 via `com.nana.pi-desk`, plus the two dashboards (:7320 / :7321). Frozen by Jake on 2026-10-10 until he reopens it; its two signing-key violations stay declared limits meanwhile.

## Next

1. **Hardening program: complete, 2026-10-09.** The seat still owes the fresh-machine rehearsal (plan 5.4). Waiting for idle sessions: the aml-desk ruling line and AGENTS refresh, the basketball-geek dormant line (plan 4.7). Detail: `docs/hardening-plan-2026-10-06.md` and the 2026-10 session archive.
2. **Writing trial verdict, 2026-10-18** (a 20-report proxy is unverified). The seat runs the after-measure (baseline 0/32 strict) and sends the verdict; Jake rules adopt, extend once, or drop. HTML pages no longer wait for it: Jake lifted that hold on 2026-10-10.
3. **2026-10-23 readings:** the 6.6 compaction replay and the seat's knowledge pull; the store stays frozen until then. The desk usage tally no longer decides anything: Jake ruled the desk on 2026-10-10. The pull reading drops sessions named for pi-worker or pi-review; Jake then rules. If it stops, `nana-knowledge query` needs its own index refresh.
4. **Attention-limit trial (ruling 2), 2026-10-06 to 2026-10-20.** At most three blocking asks may stand in "Open for Jake" at once. Optional and parked asks do not count.
5. **Karpathy's other formats.** The code-drawn blast-radius diagram and the review-timeline diagram are both unblocked.
6. **Queue for the new priority, in order (Jake, 2026-10-11; at most two lanes at once):**
   - Then fresh local installs: the README, desk and bench install commands take the same cutoff, checked against CI's value. Until then a fresh install of pi breaks the desk.
   - Now: fresh install, which pins the install commands and closes the install check's leftovers.
   - Then the roster: a roster per machine, the pattern as the default, and Windows launchers that start pi.
   - Then the parallel test runner, split out of the process lane because it changes the suite's gate.
   - Then project files on Windows (the AGENTS.md refresh, TypeScript line endings), the Windows install shape, test portability (it hides about 70 checks) and the maintainer tools.
   - Jake's machine is the proof for Windows. A UTM VM here would run ARM64, so it is a rehearsal only.
   - Small fixes ride along: the G-005 pi default-export carve-out, rm inside the working directory, the study stop on unwritable evidence. Then the seat moves the confirmed audit issues to open questions and regenerates the product report.

## Open for Jake (each ask: blocking, optional or parked, and since when)

- **[optional, since 2026-10-13] Report the upstream break.** pi-codemode 1.2.0 removed two exports in a minor release. That breaks pi 1.0.2 for every user who installs it fresh. Filing an upstream issue is public, so the call is yours.
- **[blocking, since 2026-10-12] Your Windows check.** Run the install check first, then the Claude Code session steps. The page of PowerShell steps covers both and takes about 20 minutes. Paste the recorded lines back to the seat. With CI green, this completes the 2026-10-24 "done" — `docs/reviews/cc-hooks-windows-2026-10-12/jake-windows-check.md`. Also open `CLAUDE.md` in your nana-pi clone: if it is one line reading `AGENTS.md`, Claude Code there sees no project instructions.
- **[optional, since 2026-10-05] Background subagents.** You reported "Subagents still not working as background processes". One real gap: a subagent from a prompt template always runs in the foreground. Where did you see it — pi, the desk or Claude Code — and did the agent wait or never start one?
- **[optional, since 2026-09-28] Provenance label.** A broken `trust.json` symlink gets no diagnosis; writability and staleness are pre-checks; the Claude hook resolves a relative override against its own cwd. The label no longer fires in your five repos.
- **[optional, since 2026-10-07] One TUI check.** In a pi TUI session in an unfocused window, trigger a gate approval dialog: expect a desktop notification "Approval needed in pi" (or a recorded notifier failure).
- **[optional, since 2026-10-04] pi 1.0 screen-only parts.** FleetView and stopping a run in the TUI have had no feel check.
- **[optional, since 2026-09-29] The process is unfelt.** The session-start block, the provenance label and the review cost are surfaces you meet every session; judge them by use.
- **[optional, since 2026-10-02] REQUIREMENTS decisions.** Open questions 1, 3, 6, 6b and 10–12 wait for you, including the three code-map questions; 9 closed with four-digit IDs. Six rows read `violated`: R-542 (fix queued) and five desk rows (declared while the desk is frozen).
- **[optional, since 2026-10-08] Codex re-imports legacy skills.** The Codex app copies `~/.claude/skills` into `~/.agents/skills` nightly; install retires them again. Switch off its Claude-skill import, or let the seat retire the legacy dev and wiki skills (plan D2, step c).
- **[optional, since 2026-10-08] aml-desk work from the umbrella folder.** An aml-desk session runs from `~/nana-agent-loop`, so it gets the umbrella objective and writes aml-desk facts to the umbrella's memory; starting it in `~/aml-desk` fixes both.
- **[optional, since 2026-10-08] edge-screener.** Its land branch is now named `p87-setup` (local commit). Moving `main` to it and publishing are yours.
- **[optional, since 2026-10-09] Backups.** `nana-setup state --paths` feeds a tar backup, but no destination is set, and some repos lack a remote or hold unpushed commits. A clean-account checklist test needs your admin rights.
- **[optional, since 2026-10-07] A stray process.** `bench3.mjs` has run for 21 days at about 64% CPU. It is not this program's. Stop it if it is stale.
- **[optional, since 2026-10-09] Read protection.** Neither runtime stops a session reading a secret. Approve deny rules and the sandbox credential block now, or hold for 10-20? The sandbox is untested with pi.
- **[optional, since 2026-10-09] Draft pull requests as a CI trigger.** CI reports only after a land. Should the land helper open a draft per lane? The ledger stays the review record.
- **[parked, since 2026-09-16] Changes-bar baseline.** The files-changed bar is git working tree versus HEAD, not attributed to the conversation. Switching is a design change.
- **[parked, since 2026-09-16] Raw-only wikis.** `agent-memory` and `agentic-engineering` are scrape-only. The index skips their `raw/` folders. This rides with hardening D2(c).
