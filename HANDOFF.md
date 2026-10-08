# Handoff — nana-pi frontier

*Frontier only. Narrative lives in this repo's `docs/sessions/`. One line per live decision; drop a line once it is obvious-default, gone, or archived — rewrite, don't accumulate.*

**No `OBJECTIVE.md` here.** nana-pi's objective IS the umbrella one, `~/nana-agent-loop/OBJECTIVE.md`: build products with agents, with nana-pi as the shared toolkit AND experience; current priority = make the nana-pi experience consistent, coherent and effective. (Both runtimes print it: the Claude Code SessionStart hook, and pi via the pack's `nana-objective`.)

## Landed (one line each; the narrative is in `docs/sessions/`)

- 2026-09-18 to 10-05: setup and the per-repo objective, the 09-28 rulings, self-hosted requirements, pi 1.0, the writing trial, the edge desk on pi MCP, the code map seeing tests — `docs/sessions/2026-09.md`, `docs/sessions/2026-10.md`.
- 2026-10-06 to 10-08: the hardening plan (tag `v0.6.3`) and tranches 1 to 3, twenty-one lanes — `docs/hardening-plan-2026-10-06.md`, `docs/sessions/2026-10.md`.

## Carried residuals (live; one line each)

- U2: a project-scope policy symlink target is not on the floor. `aml-desk` and `jev-research` AGENTS.md copies name old paths; the marker region exists, the refresh command does not yet (plan 2.9, tranche 3 wave A).
- E1: nothing in the catch ledger may change review practice, models, roles or spend until a seeded-defect control and a clean-patch control run.
- L5: a broken hook symlink exits 127 before its fail-open code runs; the adoption hook is not role-gated to the seat; `nana-setup project` seeds a literal `OBJECTIVE.md`.
- S1/S2: display and encoding follow-ups — a lossless `Cwd:` encoding, desk path display, one escape-token helper, look-alike dashes, a neutral display package, the 16× pre-cap, a CLI rendering test.
- Requirements: the rail proves marker identity, not clause coverage (open question 6b, 279 untested rows); aml-desk's rail copy has 193 rows off form; basketball-geek has 2.
- Edge desk: nothing bounds the total size of the blocks one tool returns; a narrowed desk spawn drops the MCP servers and pi's other built-ins.
- pi 1.0: the seed's `asyncByDefault: true` restates upstream (drop it at the next seed revision, R-361 diff first); seven tests find pi through `npm root -g` (hardening 6.2).
- Review-ledger lane: document the force-added ignored-file exception to staging independence; strengthen the non-mutating-`check` test with a stale sentinel.
- Tranche 3: the suite-lock wrapper lives outside the repo (the canary's one manual bridge); the land helper does not defend a branch switch in the main checkout mid-merge; reviews refuse repositories with submodules.
- Tranche 2: native Windows paths unexecuted; an install re-run reports the four linked skills as "skipped"; doctor prints Node's SQLite warning; the trial rubric scores only decisions the extractor finds. Full list: the 2026-10-07 session entry.
- `~/nana-agent-loop` still tracks the retired hook's empty `.claude/.context-warned`.
- Desk residuals live in `apps/desk/README.md` Known limits.

## Where things stand

- **The desk = "nana code"** (`apps/desk`), :7317 via `com.nana.pi-desk`, plus the two dashboards (:7320 / :7321). Discretionary desk hardening is FROZEN (hardening D4, 2026-10-06); desk usage events will feed a retain / freeze / retire ruling after two weeks.
- **Knowledge pull runs in both runtimes** — one producer (`bin/nana-knowledge.ts hook`), one `pull.log` tagged `source: pi|claude-code`; pointers framed as untrusted data, ≤ 2000 chars, per-session dedup, 1 h staleness. Monthly session archives leave automatic results under hardening D6.
- **Tool profile decided** (`apps/bench/studies/tool-profiles-2026-09-08/VERDICT.md`): pi defaults stay; no `pi-web-access`. Reopen only with a failure-capable task set.
- **pi lineup (b):** pi's public data-type exports, not `pi-client` or `pi-server`. `pi-durable` is parked until a product needs crash-safe long runs (Jake, 2026-10-05).
- **UI-centric frontend slices** (nana-stage + the two dashboards) are built and review-landed; slice 1b is deferred by Jake; the AML desk is its own product at `~/aml-desk`.
- **Trust is recorded** (2026-10-07, decision D3) for aml-desk, the-hive, jev-research, basketball-geek and nana-pi: post-edit runs there and the untrusted label is gone.
- **Verified pi facts** (don't re-derive): hooks activate from `pi install` at USER scope, every session — install ≠ adoption; project trust only gates project-config OVERRIDES; `loadProjectContextFiles` loads cwd + ANCESTORS only, never descendants.

## Next

1. **Hardening program (Jake adopted all recommendations, 2026-10-06).** Tranches 1 to 3 are done. Lanes now start with `pi-worker --lane` and finish with `nana-land`. Tranches 4 to 6 follow in plan order. Detail: `docs/hardening-plan-2026-10-06.md` and the 2026-10 session archive.
2. **Writing trial verdict, 2026-10-18 or the 20th report.** The seat runs the committed extractor's session-unit after-measure (baseline 0/32 strict). Jake rules adopt, extend once, or drop. HTML land pages start on adopt or drop, not on extend. The tally-hook question returns as one option at that verdict.
3. **Attention-limit trial (ruling 2), 2026-10-06 to 2026-10-20.** At most three blocking asks may stand in "Open for Jake" at once. Optional and parked asks do not count.
4. **Karpathy's other formats.** The code-drawn blast-radius diagram is unblocked. The review-timeline diagram waits with the HTML pages.

## Open for Jake (each ask: blocking, optional or parked, and since when)

- **[optional, since 2026-10-05] Background subagents.** You reported "Subagents still not working as background processes". The seat found one real gap: a subagent started from a prompt template always runs in the foreground. Where did you see it: pi in the terminal, the desk, or Claude Code? Did the agent wait while the subagent ran, or never start one?
- **[optional, since 2026-09-28] Provenance label.** A broken `trust.json` symlink gets no diagnosis. Writability and staleness are pre-checks, not proof. The Claude hook resolves a relative override against its own cwd. Trust is now recorded for your five repos, so the label no longer fires there.
- **[optional, since 2026-10-07] One TUI check.** In a pi TUI session in an unfocused window, trigger a gate approval dialog: expect a desktop notification "Approval needed in pi" (or a recorded notifier failure).
- **[optional, since 2026-10-04] pi 1.0 screen-only parts.** FleetView and stopping a run in the TUI have had no feel check.
- **[optional, since 2026-09-29] The process is unfelt.** The session-start block, the provenance label and the review cost are surfaces you meet every session; judge them by use.
- **[optional, since 2026-10-02] REQUIREMENTS decisions.** Open questions 1, 2, 3, 6, 6b and 9–12 wait for you, including the three code-map questions. Six rows read `violated`: R-542 and five desk rows (R-058 closed in tranche 1).
- **[optional, since 2026-10-08] Codex re-imports legacy skills.** The Codex app copies `~/.claude/skills` into `~/.agents/skills` each night; `nana-setup install` then retires the copies again. Switch off its Claude-skill import, or let the seat retire the legacy dev and wiki skills (plan D2, step c).
- **[optional, since 2026-10-08] aml-desk work from the umbrella folder.** A session working on aml-desk runs from `~/nana-agent-loop`, so it gets the umbrella objective and writes aml-desk facts to the umbrella's memory. Starting it in `~/aml-desk` (decided 2026-09-18) fixes both.
- **[optional, since 2026-10-07] A stray process.** `bench3.mjs` has run for 21 days at about 64% CPU. It is not this program's. Stop it if it is stale.
- **[parked, since 2026-09-16] Changes-bar baseline.** The files-changed bar is git working tree versus HEAD, not attributed to the conversation. Switching is a design change.
- **[parked, since 2026-09-16] Raw-only wikis.** `agent-memory` and `agentic-engineering` are scrape-only. The index skips their `raw/` folders. This rides with hardening D2(c).
