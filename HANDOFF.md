# Handoff — nana-pi frontier

*Frontier only. Narrative lives in this repo's `docs/sessions/`. One line per live decision; drop a line once it is obvious-default, gone, or archived — rewrite, don't accumulate.*

**No `OBJECTIVE.md` here.** nana-pi's objective IS the umbrella one, `~/nana-agent-loop/OBJECTIVE.md`: build products with agents, with nana-pi as the shared toolkit AND experience; current priority = make the nana-pi experience consistent, coherent and effective. (Both runtimes print it: the Claude Code SessionStart hook, and pi via the pack's `nana-objective`.)

## Landed today (2026-09-18, main `7a90d3a`)

- **nana-setup LANDED 2026-09-18** (`packages/nana-setup`): the Claude Code half + user-scope pi config + PATH + desk service install from this repo (`node packages/nana-setup/bin/nana-setup.mjs install|doctor`); hooks/rules are symlinks into the repo. Fresh-machine feel test not yet run. Corpus `docs/reviews/nana-setup-2026-09-18/`.

- **Per-repo objective** (`39f2462`) — `nana-objective` now reads a repo's own `OBJECTIVE.md` when the owner opts in via `objective.projectFile` in `~/.pi/agent/nana-pack.json`, prints the umbrella line alongside it, and matches the Claude Code hook's behaviour. Live-verified in `~/aml-desk` (which owns an `OBJECTIVE.md`); repos without one keep seeing the umbrella only.
- **`pi-review` moved into the pack** (`f264dd5`) — canonical source is `packages/nana-pack/bin/{pi-review,review-round}.mjs` (the Codex-stall watchdog + the 3-round cap), same CLI contract and exit codes; `~/.local/bin/pi-review` puts it on PATH so reviews run from any cwd. nana-agent-loop keeps a spawn forwarder + re-export at the old `app/scripts` paths. Round-cap test ported as a zero-dep node test (21 checks).
- **nana-knowledge root discovery** (`652b1e5`) — optional `discover` block in `sources.json`: under each listed parent, an immediate child holding a `.git` entry is a repo, and each named subdir it has (docs / research / knowledge) becomes an `articles` root, unioned with the explicit roots and deduped by resolved path (explicit wins). Fixes the real gap: every product repo was invisible to the pull until someone remembered to add it. `exclude` extends the ONE skip mechanism; an existing `sources.json` is never rewritten (opt-in by editing); 22 checks. **A nested-root bug is being fixed on branch `tooling-portable` right now — fix in flight.**

## Where things stand

- **The desk = "nana code"** (`apps/desk`), the product surface. Jake's five-item UX batch landed `fb2175a` (files-changed bar + floating diff window, `/reload` + skill auto-detect, `/skill:` collapse, activity line, streaming thinking card) after sol r1–r3 BLOCK → r4 LAND. Launchd desk (`com.nana.pi-desk`) restarted onto it 09-16.
- **Hardening is done and reviewed** — the 09-08 pass (9 commits) plus the three astra mediums CLOSED 09-09 on `d6c53e0` (buffers: four caps · races: one stage-generation counter, `resync()` the single door · stage key design B: per-session key files, ledger = live ∪ recorded). Three mechanisms were REMOVED under review (lock store, adoption heuristic, fork-recovery hook). Residuals are one line each in `apps/desk/README.md` Known limits: per-child status/widget/dialog maps unbounded, `/export` reads whole files, `stage-*` e2e teardown gaps, fixed test ports.
- **Knowledge pull runs in both runtimes** — one producer (`bin/nana-knowledge.ts hook`), one `pull.log` tagged `source: pi|claude-code`; Claude Code via `UserPromptSubmit`, pi via `before_agent_start` (`215fdef`; the "needs a tool" premise was wrong). Pointers are framed as untrusted data, ≤ 2000 chars, per-session dedup, 1 h staleness, hard 1500 ms bound.
- **Tool profile: measured, decided** — `apps/bench` study `studies/tool-profiles-2026-09-08/VERDICT.md`: 132/132 correct (ceiling effect) → cost-only verdicts, every non-default profile a regression. **pi defaults stay; `pi-web-access` is NOT installed.** Don't reopen without a failure-capable task set.
- **pi lineup option (b)** — use pi's public data-type exports (pi-ai `Usage`/`calculateCost`, pi-coding-agent `parseSessionEntries`/`migrateSessionEntries`), NOT `pi-client` RpcClient (no `extension_ui_response` path — a gate escalation would hang) and NOT `pi-server` (experimental).
- **UI-centric frontend slices** (nana-stage + the two dashboards) are built and review-landed: basketball desk :7320, edge desk :7321, chat bubble `0a33a69`. Design `docs/agent-frontend-design-2026-09-04.md`. Slice 1b (the scheduled path) is DEFERRED by Jake. The AML investigation desk left this repo on 09-16 and is its own product at `~/aml-desk`.
- **Verified pi facts** (don't re-derive): hooks activate from `pi install` at USER scope, every session — install ≠ adoption; handoff/journal/lifecycle work in any project on defaults, project trust only gates project-config OVERRIDES; `loadProjectContextFiles` loads cwd + ANCESTORS only, never descendants.

## Next

1. Land the `tooling-portable` nested-root fix, then re-seed / re-check the discovered roots.
2. Windows: the smoke test is still the standing proof gate — confirm the `nana-pack ✓` chip on the Windows box (absence = pack not installed there; `pi install` is user-scope per machine), then the win32 items below.
3. Let the objective line + knowledge pointers run a week of `pull.log`, then decide the citation checker (measure before more retrieval machinery).

## Open for Jake

1. **Changes-bar baseline** — the files-changed bar is git working-tree vs HEAD (incl. untracked), not conversation-attributed. Say if that's wrong; switching to tool-call attribution is a design change, not a tweak.
2. **Raw-only wikis in or out** — `agent-memory` and `agentic-engineering` are scrape-only, so `raw/` is skipped and they are OUT of the knowledge index. Add their `raw/` as roots if scrape-level pull is wanted, or leave them out until absorbed.
3. **win32 untested** — the nana-pack taskkill branch, the 09-16 desk UX batch, and the notify fallback have never run on Windows.
4. **`pull.log` → citation checker** — waits on a week of log (item 3 of Next); it is the one instrument that answers "is retrieval actually used?".
5. **Tier-2 by feel** — the test-ran gate (`/nana-verify` reading the post-edit check receipts) stays deferred until the receipts prove felt-useful in dogfood.
6. **Feel check on the desk and on the two dashboards** (:7320 / :7321) — everything since 09-16 is review-landed but unfelt.
