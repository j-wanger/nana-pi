# Landing ruling — `feat/pi-1.0` → `main` (2026-10-04)

Ruler: Fable (read-only; this file is the only write). Inputs: `git diff main..feat/pi-1.0`
(53bcbf1, 0ba4a2e, 1c4a369, 21f181b on c0a7849), `astra-r1/r2/r3.md` + briefs, my
`architecture-ruling.md`, the unpacked pi-subagents 0.75.0 and pi 1.0.2. `[V]` = I read or ran it;
`[A]` = astra ran it, I read the log; `[I]` = inferred.

Stakes: high-blast (every pi session), reversible (two seed-if-absent files, doctor rows; no live
machine state changes in this diff).

## 1. Verdict: LAND

One reason: every clause astra opened is closed by execution, not prose — the two load-bearing
claims (the seed parses and shadows the builtin `reviewer`; depth 1 lets the parent launch and
blocks only grandchildren) were proven by running upstream 0.75.0 code `[A]`, and the three
independent mutations of `doctor.mjs` each turn a named test red `[A]`. Nothing in the diff writes
anything but two seed-if-absent files; doctor is read-only `[V]`. My own runs `[V]`:
`doctor-detail` 59/0, `install` 74/0, `map:check` 0 problems, `readme:check` 525 claims / 5
problems in the worktree, all five the worktree's missing root `node_modules` and `apps/bench/.ext`
— the main checkout reads 506/0 today, so the branch's 19 new claims pass.

## 2. Scope ratifications

- **`readme-check.config.json` — RATIFIED.** `agents/reviewer.md` and
  `extensions/subagent/config.json` (pi agent dir) and `docs/agents.md` (pi-subagents' docs) each
  name a file outside this repo that a README now cites, with a reason; none exempts a repo file.
- **The three fixtures (`desk-service`, `skills-and-standards`, `win32-degrade`) — RATIFIED.** Each
  seeds a vendor manifest at `PI_SUBAGENTS_FLOOR` by name in a throwaway home; no assertion removed
  or relaxed `[V]`.
- **R-366–R-372 — RATIFIED** as new rows (splits of R-362/R-363/R-365 and the astra r1/r2
  findings). The allowlist said R-360–R-365; splitting rather than overclaiming is the standard.
  No existing row changed `[V]`.

## 3. The marker deviation — ACCEPTED

The marker is the first BODY line, not byte 0. `frontmatter.js` requires `---` at byte 0 and
`agents.js` skips a definition with no `name`/`description` `[A]`: a byte-0 marker would stop the
seed from shadowing at all. The ownership contract (a marker doctor can check, position-pinned
by R-371's misplaced-marker test) is intact. Amends my §2 wording: read "first line" as "first
body line, by pi's own `---` boundary (`firstBodyLine()`)".

## 4. R-365 — replacement requirement cell (seat applies in the merge commit)

> WHERE mcp.json exists, parses to a JSON object and every mcpServers entry is a JSON object,
> doctor shall read ! when any server has no exposure key while autoEnableCodemode is not false,
> naming both keys.

One `shall`; the three cited tests still pin it; R-372's precedence is now explicit. Status stays
`implemented`.

## 5. Two more merge-commit edits (prose only, no test pins them)

- `packages/nana-setup/README.md:43` and `:66-67`: the pack README has **no "Known limits"
  heading** `[V]` — the new bullets sit under `## Behavior notes`. Replace "Known limits" with
  "Behavior notes" in both cross-references. (My architecture ruling misnamed it; the worker
  copied me.)
- `HANDOFF.md` item 4: replace "Awaiting astra review, then the seat's manual steps … before this
  is felt, not just built." with "LANDED on main (astra r3 LAND 9/10; `land-ruling.md`). OPEN: the
  seat's manual steps and acceptance A1–A6 — the machine's pi 1.0 adoption is NOT verified until
  they pass."

## 6. Fresh-eyes findings astra did not raise — none block

- **Seed vs upstream `[V]`:** exactly the tools line (+`bash`, −`contact_supervisor`), the marker +
  one `bash` sentence, two rewritten working rules, the supervisor paragraph, one output-format
  line. `thinking: high` and the inherit keys are upstream's. The README's "one tools change" omits
  the `contact_supervisor` drop — harmless (the bridge re-adds it under the default `always` `[A]`),
  and my ruling specified that tools line.
- **The seed as the model sees it:** an HTML comment, then a tool sentence, then the persona.
  Order is unusual but unambiguous; no instruction contradicts another (the upstream "Do not use
  shell commands… Report any test command that a supervisor must run" is gone `[V]`).
- **`asyncByDefault` is dead weight under the seed `[V]`** (`configuration.md:227`: it governs
  only the omitted-`async` default; `forceTopLevelAsync` covers depth 0, depth 1 has no nested
  calls). My subtraction test missed it. Doctor's `!` on an explicit `false` describes a case the
  depth cap prevents. Residual, not a change now — R-361 is sealed.
- **`pi mcp.json` `!` is moot while `pi-mcp-adapter` is installed** (`mcp.md:264`: pi then does
  not read `mcp.json`); doctor does not check for the adapter. The seat's step order removes it
  first. Residual.
- **Reviewer line collapses every read error to `missing → run install`** (a directory or EACCES
  at that path); install's own row then names what is there, so no loop. The config line
  distinguishes them. Residual.
- **Unmarked-reviewer remedy** "repair it by hand" invites pasting the marker into a user's own
  reviewer, which turns doctor ✓ without the bash/evidence rules. Doctor checks ownership, not
  equivalence — by my contract. Residual wording.
- **Config scope `[V]`:** pi-subagents reads one file, `getAgentDir()/extensions/subagent/config.json`
  (`config.js:209`), `PI_CODING_AGENT_DIR` honoured — no project-scope merge can override the
  floor. Doctor's layout path matches.

## 7. Residuals to record at landing — one line each

| Where | Line |
|---|---|
| nana-pack README · Behavior notes | already in diff: delegation-bridge `foregroundOnly`, explicit `extensions`/ceiling, shared-cwd handoff/notify, hand-edit reopens |
| nana-stage README | already in diff: R-263 reads the adapter's carrier shape; built-in MCP blocks are not stamped |
| nana-setup README · "pi-subagents' version, and mcp.json" | While `pi-mcp-adapter` is installed pi does not read `mcp.json` (pi 1.0.2 `mcp.md:264`); doctor does not detect the adapter, so its `!` is moot until `pi remove npm:pi-mcp-adapter`. |
| nana-setup README · same section | doctor's `pi reviewer agent` line reads any read error as `missing → run install`; install's row then names what is there (a directory, an unreadable file). |
| nana-setup README · reviewer section | An unmarked `reviewer.md` ✗ means "not nana's seed", not "broken": a reviewer you wrote reads ✗ by design, and adding the marker by hand turns it ✓ without the bash/evidence rules. |
| HANDOFF | `asyncByDefault: true` in the seed restates upstream's default and nothing reaches it under `forceTopLevelAsync` + depth 1 (`configuration.md:227`); drop at the next seed revision — R-361 diff first. |
| HANDOFF | The seven `npm root -g` tests (incl. `apps/desk/test/spawn-and-persist.test.mjs`) stay unpatched; a scratch-install lane needs `DESK_PI_ROOT`-style plumbing (architecture ruling §4). |
| HANDOFF | Status line per §5; A1–A6 open; "landed, unverified" until they pass. |
| REQUIREMENTS · Open questions | mcp.json's own shape failures (not JSON / not an object / `mcpServers` not an object) are tested by three uncited checks in `doctor-detail.test.mjs` but have no row — add an R-366-shaped row, or declare them R-365's error handling. |

## 8. Post-merge gate (the seat)

Order: merge with §4/§5 edits → on the MAIN checkout `npm test`, `npm run map:check`, `npm run
readme:check` green (my baselines: readme 506/0 on main pre-merge; astra's suite 87 PASS / 1 FAIL
(readme, env) / 1 SKIP in the worktree on 0.87.1) → the manual steps from architecture ruling §6:
`npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2` · `pi remove npm:pi-mcp-adapter`
· `pi install npm:pi-subagents@0.75.0` (confirm ONE entry in `settings.json`) · `mcp.json`:
`memory` gets `"exposure": "direct"`, `"autoEnableCodemode": false` beside `mcpServers` · `nana-setup
install` · `nana-setup doctor` exit 0 · restart the desk.

Then A1–A6 exactly as written in `architecture-ruling.md` (A1 versions + suite on 1.0.2 · A2 gate
live in a background child, journal line AND the `nana-gate … blocked (headless fail-closed)` quote,
both or fail · A3 reviewer self-serves, zero `subagent_supervisor_request` · A4 depth · A5 the
5-minute TUI · A6 handoff store mtime unchanged).

**"Verified" means all six pass on 1.0.2 with doctor exit 0.** Until then HANDOFF says landed,
unverified.

Fallbacks:
- **A4 fails** (children refused at depth 0): a requirement diff FIRST — R-361 and R-368 to depth 2,
  seed + tests, then the live file; record nested-foreground as the residual. Never a hand edit
  alone: doctor would read ✗ on `2` (R-368).
- **A5 fails** (the model serialises three requested children): one line in the seat's user
  `AGENTS.md` (ruling §1d), not a config change; re-run A5 once.
- A2 fails: the "background = gated" premise is broken — adoption stays unverified, trace
  `child-tool-plan.js` before any further subagent lane; the seed is harmless to leave.
- A3 fails: `intercomBridge.mode: "off"` in the live `config.json` (doctor tolerates extra keys
  `[V]`), one README line.
- A6 moves: the `NANA_HANDOFF=off`-for-children follow-up the pack README already names.

## The claim most likely wrong

That `asyncByDefault` is reached by nothing under the seed. `configuration.md:227` scopes it to
"tool launches that still use the internal single-run primitive"; if a depth-0 path skips
`forceTopLevelAsync`'s check yet consults `asyncByDefault`, the key earns its line and the HANDOFF
residual above is withdrawn. A2's journal line is where that would show.
