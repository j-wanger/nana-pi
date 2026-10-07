# Handoff — nana-pi frontier

*Frontier only. Narrative lives in this repo's `docs/sessions/`. One line per live decision; drop a line once it is obvious-default, gone, or archived — rewrite, don't accumulate.*

**No `OBJECTIVE.md` here.** nana-pi's objective IS the umbrella one, `~/nana-agent-loop/OBJECTIVE.md`: build products with agents, with nana-pi as the shared toolkit AND experience; current priority = make the nana-pi experience consistent, coherent and effective. (Both runtimes print it: the Claude Code SessionStart hook, and pi via the pack's `nana-objective`.)

## Landed (one line each; the narrative is in `docs/sessions/`)

- 2026-09-18: nana-setup, the per-repo objective, pi-review in the pack, knowledge root discovery — `docs/sessions/2026-09.md`.
- 2026-09-28/29: Jake's eight rulings, tranches 1–2, U2, E1, L5, S1, S2 — `docs/sessions/2026-09.md` (archived 2026-10-06).
- 2026-10-02: nana-pi self-hosts requirements-first — `docs/sessions/2026-10.md`.
- 2026-10-04: pi 1.0 adoption, the writing trial, the EARS form lane — `docs/sessions/2026-10.md`.
- 2026-10-05: the edge desk on pi's built-in MCP, the full audit, the code map sees the tests — `docs/sessions/2026-10.md`.
- 2026-10-06: the hardening plan and audit corpus; main pushed; tag `v0.6.3` — `docs/hardening-plan-2026-10-06.md`.
- 2026-10-07: hardening tranche 1, six lanes (docs, ledger, flake, setup, session, gate) — `docs/sessions/2026-10.md`.

## Carried residuals (live; one line each)

- U2: a project-scope policy symlink target is not on the floor. `aml-desk` and `jev-research` AGENTS.md copies name old paths (hardening 2.9 refreshes them).
- E1: nothing in the catch ledger may change review practice, models, roles or spend until a seeded-defect control and a clean-patch control run.
- L5: a broken hook symlink exits 127 before its fail-open code runs; the adoption hook is not role-gated to the seat; `nana-setup project` seeds a literal `OBJECTIVE.md`.
- S1/S2: no versioned lossless `Cwd:` encoding; desk path display; duplicated escape-token logic in `display.mjs`; look-alike dashes; `nana-knowledge` depends on `nana-pack`'s layout (a neutral `packages/nana-display` is the follow-up); the 16× pre-cap can erase later prose; no CLI-level rendering test.
- Requirements: the rail proves marker identity, not clause coverage (open question 6b, 279 untested rows); aml-desk's rail copy has 193 rows off form; basketball-geek has 2.
- Edge desk: nothing bounds the total size of the blocks one tool returns; a narrowed desk spawn drops the MCP servers and pi's other built-ins.
- pi 1.0: the seed's `asyncByDefault: true` restates upstream (drop it at the next seed revision, R-361 diff first); seven tests find pi through `npm root -g` (hardening 6.2).
- Review-ledger lane: document the force-added ignored-file exception to staging independence; strengthen the non-mutating-`check` test with a stale sentinel.
- Desk residuals live in `apps/desk/README.md` Known limits.

## Where things stand

- **The desk = "nana code"** (`apps/desk`), :7317 via `com.nana.pi-desk`, plus the two dashboards (:7320 / :7321). Discretionary desk hardening is FROZEN (hardening D4, 2026-10-06); desk usage events will feed a retain / freeze / retire ruling after two weeks.
- **Knowledge pull runs in both runtimes** — one producer (`bin/nana-knowledge.ts hook`), one `pull.log` tagged `source: pi|claude-code`; pointers framed as untrusted data, ≤ 2000 chars, per-session dedup, 1 h staleness. Monthly session archives leave automatic results under hardening D6.
- **Tool profile: measured, decided** — `apps/bench/studies/tool-profiles-2026-09-08/VERDICT.md`: pi defaults stay; `pi-web-access` is NOT installed. Don't reopen without a failure-capable task set.
- **pi lineup option (b)** — pi's public data-type exports, NOT `pi-client` RpcClient and NOT `pi-server`. `pi-durable` is parked (Jake, 2026-10-05) until a product needs crash-safe long runs.
- **UI-centric frontend slices** (nana-stage + the two dashboards) are built and review-landed; slice 1b is deferred by Jake; the AML desk is its own product at `~/aml-desk`.
- **Verified pi facts** (don't re-derive): hooks activate from `pi install` at USER scope, every session — install ≠ adoption; project trust only gates project-config OVERRIDES; `loadProjectContextFiles` loads cwd + ANCESTORS only, never descendants.

## Next

1. **Hardening program (Jake adopted all recommendations, 2026-10-06).** Tranche 1 landed on 2026-10-07: all six lanes, pushed, each live-probed. Tranche 2 runs as seven lanes. Tranches 3 to 6 follow in plan order. Detail: `docs/hardening-plan-2026-10-06.md` and the 2026-10 session archive.
2. **Writing trial verdict, 2026-10-18 or the 20th report.** The seat runs the after-measure. Jake rules adopt, extend once, or drop. HTML land pages start on adopt or drop, not on extend. The tally-hook question returns as one option at that verdict.
3. **Attention-limit trial (ruling 2), 2026-10-06 to 2026-10-20.** At most three blocking asks may stand in "Open for Jake" at once. Optional and parked asks do not count.
4. **Karpathy's other formats.** The code-drawn blast-radius diagram is unblocked. The review-timeline diagram waits with the HTML pages.
5. **Windows (ruling 6).** The supported claim is macOS and Linux plus pi on Windows. A Windows smoke test is optional evidence, not a gate.

## Open for Jake (each ask: blocking, optional or parked, and since when)

- **[optional, since 2026-10-05] Background subagents.** You reported "Subagents still not working as background processes". The seat found one real gap: a subagent started from a prompt template always runs in the foreground. Where did you see it: pi in the terminal, the desk, or Claude Code? Did the agent wait while the subagent ran, or never start one?
- **[optional, since 2026-09-28] Provenance label.** A broken `trust.json` symlink gets no diagnosis. Writability and staleness are pre-checks, not proof. The Claude hook resolves a relative override against its own cwd. The `nana-setup trust` command (hardening tranche 2) removes the start-pi-in-that-folder step.
- **[optional, since 2026-10-07] One TUI check.** In a pi TUI session in an unfocused window, trigger a gate approval dialog: expect a desktop notification "Approval needed in pi" (or a recorded notifier failure).
- **[optional, since 2026-10-04] pi 1.0 screen-only parts.** FleetView and stopping a run in the TUI have had no feel check.
- **[optional, since 2026-09-29] The process is what is unfelt.** The session-start block, the provenance label and the review ladder's cost are the surfaces you meet every session. Judge them by using them.
- **[optional, since 2026-10-02] REQUIREMENTS decisions.** Open questions 1, 2, 3, 6, 6b and 9–12 wait for you, including the three code-map questions. Six rows read `violated`: R-542 and five desk rows (R-058 closed by t1-gate, 2026-10-07).
- **[parked, since 2026-09-16] Changes-bar baseline.** The files-changed bar is git working tree versus HEAD, not attributed to the conversation. Switching is a design change.
- **[parked, since 2026-09-16] Raw-only wikis.** `agent-memory` and `agentic-engineering` are scrape-only. The index skips their `raw/` folders. This rides with hardening D2(c).
