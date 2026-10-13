# Change declaration — roster: the per-machine roster, the default pattern and the seat land review

*Lane `roster` · `feat/roster` · `~/nana-pi-wt/roster`, from `main` `9974218`; rebases on `feat/process` after it lands (§4) · 2026-10-13.
Features: FEAT-006, FEAT-013 SUB-012, FEAT-014 SUB-019; new R-1120–R-1126 (range R-1120–R-1139); reworded R-961; none retires. Class:
GATE, two plan-review rounds at most: lane mode gains a refusal, and a fail-open fallback would run the default provider where the
roster names another. Builder: Sonnet 5.5 subagent in the worktree, per the 10-13 split (Jake "agreed on the worker split"; its
wording is the seat's): three code files, seven rows, a lane refusal. Reviews: sol plan and build, astra land. Install check before
`nana-land`: `nana-soul.md` lives under `packages/nana-setup/` (Jake, 2026-10-12). Evidence: this folder's research and fact-checks.*

## 1. Why
A Claude Code seat on Jake's Windows work machine treated the builder/reviewer/land pattern as opt-in. Jake's rulings, verbatim:
"sure" (to the seat's proposal: the pattern for any change that touches code with tests, a direct answer for questions and one-line
fixes); "land can be optional due to token allowance, seat will take on landing review if no land model set".
- **The roster has no home off this Mac.** `AGENTS.md:66` points at shared memory `reference_roster.md`, which a fresh machine
  lacks (empty seed; `nana-shared-memory.mjs:89`). No surface a pi seat reads makes the pattern the default.
- **The builder cannot reach another provider.** `LANE_DEFAULTS` (`worker-config.mjs:11-17`) alone feeds `pi-worker.mjs:98`'s argv,
  and lane mode refuses caller pi arguments (`:91`). pi 1.0.2 resolves any `models.json` provider via `--provider`
  (`model-resolver.js:307-318`); a bad `--thinking` only warns (`args.js:125-135`). The work machine's pi version is unverified (E16).
- **No rule covers an unset land model.** `nana-land` needs only the slice reviewer's LAND (`nana-land.mjs:91`): the seat's needs a place.

**Outcome.** Every seat reads the default pattern; one command prints this machine's roster; pi-worker builds with it; with no land
model the seat writes its land review into the reviewed change. **Threat model** (Jake's 10-11 words). In: honest variation — a typo
in a provider, model or thinking; a BOM from PowerShell 5.1's `-Encoding UTF8` or UTF-16LE from its `>` (E10); CRLF; a roster, a
project `.pi/nana-pack.json` or a `PI_CODING_AGENT_DIR` carried between machines. Out: deliberate forgery.

## 2. Requirement delta
Main's highest ID is R-1092; process holds R-1100–R-1111. Each row carries one `shall`.

| ID | Change | Text (draft) |
|---|---|---|
| R-961 | reworded (FEAT-006) | WHEN pi-worker runs in lane mode, it shall refuse every caller argument after --, --retries greater than zero and a roster the roster resolver refuses, and construct pi arguments using the resolved builder's provider and model, its thinking level when one is set, the tools read,grep,find,bash,edit,write, the rendered preamble path, validated brief path, and fixed lane instruction. Evidence note: "reworded 2026-10-13 (roster lane) from 'using the roster openai-codex, gpt-6-luna, high, …'". |
| R-1120 | added, FEAT-006 after R-961 | WHILE the user-scope nana-pack.json in pi's active agent dir is absent or holds no roster key, the roster resolver shall return the default roster: no scout, builder openai-codex gpt-6-luna high, reviewer openai-codex gpt-5.6-sol, and land openai-codex gpt-6-astra, the last two with pi's default thinking. Evidence note: Jake named the roles (2026-10-06); the provider and model ids are the seat's. |
| R-1121 | added, FEAT-006 | WHEN the user-scope nana-pack.json in pi's active agent dir holds a valid roster, the roster resolver shall return its scout, builder, reviewer and land exactly as written, taking no slot or field from the default and reading no roster from a project's .pi/nana-pack.json. |
| R-1122 | added, FEAT-006 | IF the user-scope nana-pack.json is present but unreadable, not a regular file, over the bounded-read cap, or not a JSON object after one leading byte-order mark is removed, or its roster is not an object holding exactly scout, builder, reviewer and land, where builder and reviewer are entries, scout and land are entries or null, and each entry holds exactly a provider and model that are non-empty with no whitespace or control character and a thinking that is one of pi's seven levels or null, THEN the roster resolver shall return a refusal naming the file and the failing slot or field. |
| R-1123 | added, FEAT-006 | WHEN the roster command runs, it shall either print one line per slot giving provider, model and thinking (`default` for null), `none` for a null scout and `seat` for a null land, then a source line naming `default` or the file, and exit 0, or print the resolver's refusal on stderr and exit 1. |
| R-1124 | added, SUB-019 after R-1104 (after R-683 on today's main) | The shared working pattern shall state that a change that touches code with tests goes through the pattern and questions and one-line fixes get a direct answer, with the builder, reviewer and land models of the roster that `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"` prints. |
| R-1125 | added, SUB-019 after R-1124 | The shared working pattern shall state that, when the roster sets no land model, the seat writes its land review as `docs/reviews/<lane>-<date>/seat-land.md` in the lane's reviewed change before the final round, and that the independent slice review still covers every land. |
| R-1126 | added, SUB-012 after R-301 (the row that installs nana-soul) | nana-soul shall carry the shared working pattern's default-pattern and seat land review bullets byte for byte, as the Claude Code seat's copy. |

R-301, R-350, R-598, R-682 (stays in SUB-005), R-683, R-732, R-859 keep their text. Tree: 1,100 after process → 1,107; main 1,088 → 1,095.

## 3. Design
**Roster home: a `roster` block in the user-scope `<agent dir>/nana-pack.json`, user scope only like `objective`
(`config.ts:565-574`); nothing seeded.** pi-worker finds the dir through `piAgentDir()` (`lib/agent-dir.mjs:67-77`); a Claude seat
runs the roster command, which spawns nothing. The pack's reader ignores the block (`config.ts:259-280`); the gate protects the file
from pi builders (`gate-paths.ts:117`; advisory). **Schema:** four slots, whole roster, no merge; `land: null` = the seat gives the
land review; `scout: null` = no pi scout; builder and reviewer mandatory. README example (placeholder provider only):
`{"roster":{"scout":{"provider":"example-gateway","model":"gpt-6-luna","thinking":"medium"},"builder":{…"high"},"reviewer":{…"gpt-5.6-sol","thinking":null},"land":null}}`.

**Sealed values (`bin/worker-config.mjs`, the pack's declared surface for launcher values).** `LANE_DEFAULTS` keeps its four values
byte-identical, the one definition of the default builder and the sealed tool list; its comment names it the default builder that a
machine roster replaces, with provenance "roles: Jake, 2026-10-06; provider and model id: the seat's". `ROSTER_DEFAULTS`, deep-frozen
(provenance: R-1120, Jake's roles, the seat's ids): `scout: null` (chosen: this Mac runs no pi scout); `builder` reads `LANE_DEFAULTS`
provider, model and thinking by name; `reviewer` openai-codex gpt-5.6-sol and `land` openai-codex gpt-6-astra, each `thinking: null`
(INFERRED: the ledger records no thinking). `ROSTER_SLOTS`, `NULLABLE_SLOTS` (contract: R-1122); `THINKING_LEVELS` off…max (contract:
pi 1.0.2 `args.js:6`); the one-token rule is chosen (one argv token, one printed line). `@purpose` and `@outputs` updated.

**Resolver and roster command: new `bin/nana-roster.mjs`** (six-tag header; `@effects` disk). It exports `resolveRoster(agentDir)` →
`{ok:true, roster, source}` or `{ok:false, file, problem}`, and runs as a CLI when invoked directly (the `nana-land.mjs` pattern); only
the CLI reads `piAgentDir()`. Absent = ENOENT or ENOTDIR with no symlink; a dangling symlink is refused (`config.ts:309`). It reads
with `readBounded` (1 MiB), strips one leading BOM as `config.ts:316` does, then applies R-1122 in order, naming the first failure.

**pi-worker lane mode.** Resolve right after the caller-argument refusal (`:91`), before the preamble temp dir, lock and spawn; a
refusal goes through `laneFailure("roster refused: <file>: <problem>")`, never a fallback. The argv takes the builder's provider and
model, `--thinking` only when non-null, and `-t LANE_DEFAULTS.tools`. Non-lane mode reads no roster. Header `@inputs` and `@errors`
gain the roster; new lines never contain `admit` or `complete` (R-732's regex, `review-ledger.test.mjs:128`).

**The seat's land review (no code).** With no land model, the seat writes `docs/reviews/<lane>-<date>/seat-land.md` into the reviewed
change before the final round, like HANDOFF and session notes; the slice reviewer's final round covers that tip, and `nana-land` needs
only its LAND. The seat passes reviewer and land models from the roster command as `pi-review … -- --provider P --model M [--thinking T]`.

**Carriers (E8).** The shared region is the primary carrier: a pi seat reads it through `AGENTS.md` (Jake runs both seats on Windows),
a Claude seat through the `CLAUDE.md` symlink where it resolves. nana-soul is the Claude-side copy: it reaches only Claude Code seats
where `nana-setup install` ran (R-301 symlink; R-350 win32 copy, refreshed by re-running install).
- The shared file's "Working pattern" list gains the two bullets of `shared-text.proposed.md` ("Default pattern", "Seat land review";
  77 words) before "Project-specific overrides"; `AGENTS.md:68-97` is a byte copy (R-859); `nana-soul.md` "Work habits" ends with the
  same two (R-1126). No model names: the process lane's seat decision ("the shared file names no models").
- **Windows path form (E9) and R-598.** Every seat-facing command is `node "$HOME/nana-pi/…"`: it expands in Bash and PowerShell 5.1
  and 7.x, where `~/…` stays literal before 7.6. The TS checker drops a token outside `[A-Za-z0-9._/+-]` (`readme-check.mjs:316`), the
  Python one a token holding `$` or `<` (`readme_check.py:267`), so neither form makes a path claim; `node …` is a command claim that
  checks only npm-family scripts and make/just runners. A bare backticked `.mjs` or `.md` name would fail R-598 (pair K5).
- `AGENTS.md:66` becomes "See the shared working pattern below for the defaults and the roster command. Local overrides are explicit
  in each project."; Layout adds `nana-roster` to `bin/`. Pack README: "Lane builder" (`:200`) drops the literal roster; a "Machine
  roster" subsection (schema, example, nulls, user scope, BOM, no fallback, the `"$HOME/…"` command, passing models to `pi-review`).

**Jake's work machine after the land:** `git -C "$HOME/nana-pi" pull`; `node "$HOME/nana-pi/packages/nana-setup/bin/nana-setup.mjs" install`;
one file edit, a `roster` block in `<agent dir>\nana-pack.json` with his gateway's name where the repo shows `example-gateway` (scout
luna medium, builder luna high, reviewer sol, `"land": null`); check it with the roster command. No work name enters the repo.

## 4. Scope
**In.** Code (three files, budget four): `packages/nana-pack/bin/` `worker-config.mjs`, `pi-worker.mjs`, `nana-roster.mjs` (new). Tests:
`nana-roster` (new), `worker-lane`, `templates-render`, `requirements-tree`. Text: `nana-soul.md`, the shared file, `AGENTS.md` (region,
`:66`, Layout), pack README, `REQUIREMENTS.md`, the tree, the code map, HANDOFF and session entry before the final round, the corpus.
**NOT.** `review-ledger.mjs`, `pi-review.mjs`, `review-round.mjs`, `nana-land.mjs`, `packages/nana-setup/lib`; a PATH link; the Windows
spawn; desk code and README (`apps/desk/README.md:272-273` covers unknown keys); `scripts/test.mjs`; shared memory; `@AGENTS.md`;
downstream repos. Never a merge, `tools` override, project roster, seed or fallback, nor a committed work name or gateway URL.
**Expected conflicts with `feat/process`:** the shared Working-pattern list and its `AGENTS.md` copy (process inserts after "Review
ladder", this lane before "Project-specific overrides"; INFERRED clean); SUB-019; `worker-lane.test.mjs:85-90` (process's R-1110);
`checkInstructionContracts`; R-291's literal at `requirements-tree.test.mjs:38`, `:52`, `:53`; the tree; the pack README.

## 5. Verification
Exact titles under `// req:` lines, frozen in `seat-titles.mjs`; DONE = `0 missing` (18 new, 1 refit, 1 renamed); phrases normalise CR.
- `nana-roster.test.mjs` (calls `resolveRoster`, spawns only `node`; runs on the non-blocking Windows leg; the dangling-symlink case
  SKIPs on win32). R-1120: "sealed default roster is luna high builder, sol reviewer, astra land and no scout" (the ONE literal pin of
  `ROSTER_DEFAULTS` and `LANE_DEFAULTS` provider, model, thinking); "absent user nana-pack.json yields the default roster" (ENOENT;
  ENOTDIR); "user nana-pack.json without a roster yields the default roster" (a fixture shaped like this Mac's file: an `objective`
  block, no roster). R-1121: "a valid machine roster replaces every slot, keeping a null scout and a null land"; "a machine roster
  saved with a byte-order mark and CRLF line endings is read"; "the roster is read from PI_CODING_AGENT_DIR, not the home agent dir"
  (spawns the CLI; HOME and USERPROFILE hold a second roster); "a project .pi/nana-pack.json roster is never read". R-1122: "each
  invalid roster shape is refused naming the slot or field" (missing slot; extra `auditor`; builder null, `"x"`, `[]`; reviewer null;
  roster `"x"`, null; missing provider, model, thinking; extra `tools`; provider `""`; model `gpt 6` and with `\n`; thinking `ultra`);
  "an unreadable or malformed user nana-pack.json is refused naming the file" (invalid JSON; UTF-16LE; `[]`, null; a directory; a
  valid roster padded past the cap; a dangling symlink). R-1123, both through `PI_CODING_AGENT_DIR`: "roster command prints one line
  per slot and the source" (default lines from `ROSTER_DEFAULTS` by name; a file with `seat` and `none`); "roster command prints a
  refused roster on stderr and exits 1".
- `worker-lane.test.mjs` (stub pi; no win32 skip; `run()` and `launchTogether()` set an empty temp `PI_CODING_AGENT_DIR`, redundant under
  `scripts/test.mjs`, which scrubs it at `:279`). R-961 refit: "lane passes only the sealed roster and fixed brief instruction" reads
  provider, model, thinking from `LANE_DEFAULTS` by name, keeps the literal tool list (one pin). R-961: "lane passes the machine roster
  builder to pi, each flag once"; "lane omits --thinking when the machine roster builder thinking is null"; "lane refuses a refused
  roster before starting pi, naming the file". R-1121: "lane ignores a roster in project .pi/nana-pack.json".
- `templates-render.test.mjs`. R-1124: "shared working pattern makes the pattern the default with the machine roster" (both phrases,
  the exact command). R-1125: "shared working pattern gives the land review to the seat when the roster sets no land model" (its four
  phrases). R-1126: "nana-soul carries the shared default-pattern and seat land review bullets" (both bullets, after CR removal).
  `requirements-tree.test.mjs`: R-291's "…leaf counts total 1,100" → "…leaf counts total 1,107".

**Wrong code first.** Each pair edits code or text, never an assertion, and must red exactly the named titles. Shared-text pairs edit
the shared file, the region and nana-soul alike; copier renders the dirty template (`_vcs.py:421-442`), so R-859 stays PASS.
- R-1120 → sealed-default title only: 1 retune `ROSTER_DEFAULTS.reviewer.model`; 2 retune `LANE_DEFAULTS.model`; 3 set
  `ROSTER_DEFAULTS.scout` to the builder. 4 ENOTDIR counted present → absent title. 5 a file without `roster` refused → no-roster title.
- R-1121: 6 a null scout or land takes the default slot → replace and print titles. 7 no BOM strip → BOM title. 8 the CLI passes
  `os.homedir()/.pi/agent` → PI_CODING_AGENT_DIR, print and print-refusal titles. 9 the cwd project file read → both project titles.
- R-1122 → shapes title: 10 a missing slot takes the default; 11 any thinking; 12 an extra `tools`; 13 a null builder; 14 whitespace in
  a model; 15 the refusal omits the field. → file-refusal title: 16 a dangling symlink is absent; 17 no cap; 18 `[]` read as no roster.
- R-1123: 19 `none` for a null land; 20 no source line → print title. 21 exit 0 on a refusal; 22 refusal on stdout → print-refusal.
- R-961: 23 fall back on a refusal → lane-refuses-roster title. 24 provider from `LANE_DEFAULTS`, not the roster → machine-roster title.
  25 `--thinking null` passed → omit title. 26 drop `write` from `LANE_DEFAULTS.tools` → refit title.
- R-1124 → its title: 27 delete "a change that touches code with tests goes through the pattern"; 28 delete "questions and one-line fixes
  get a direct answer"; 29 `"$HOME/` → `~/`. R-1125 → its title: 30 delete "when the roster sets no land model"; 31 the `seat-land.md`
  path → a scratch path; 32 delete "before the final round"; 33 delete "the independent slice review still covers every land".
  R-1126 → its title only: 34 nana-soul alone loses bullet 2; 35 nana-soul alone writes `~/`.
- Kept clauses. K1 delete the `:91` refusal → "lane mode refuses all caller pi arguments before lock or spawn", "lane refuses caller
  tools without edit and write", "lane refuses tool-control forms …" and "lane refuses resource-disabling forms …". K2 delete the
  retries refusal → "lane refuses retries before launch". K3 brief before preamble → "verified lane passes preamble and validated brief
  as ordered file paths". K4 alter the fixed instruction → refit title. K5 add a bare `nana-roster.mjs` to bullet 1 → R-598's "checkout
  shared-section claim paths resolve" and the four "… all declared skill paths resolve independently" (INFERRED; launch run confirms).

**Seat acceptance, before and after the build.** Titles `0 missing`; pairs 1–35 and K1–K5; one `shall` per new row; shared file, region
and `shared-text.proposed.md` bullets match; empty merge-base diff on `review-ledger.mjs`, `pi-review.mjs`, `review-round.mjs`,
`nana-land.mjs`, `packages/nana-setup/lib`; no work name shared memory holds in any committed file, the corpus included; no
`reference_roster` in `AGENTS.md`; the roster command prints `source: default` on this Mac and `land: seat` with a temp roster; a
non-lane `pi-worker` with a stub pi and a malformed roster exits 0; `npm run test:locked`, `map:check`, `readme:check`,
`node scripts/requirements-tree.mjs --check`; the install check (`node packages/nana-setup/bin/install-check.mjs`) before `nana-land`.
**The claim most likely to be wrong:** that a Windows seat obeys the rule after the land. A pi seat needs the region in its project; a
Claude seat needs install re-run; both need the checkout at `$HOME/nana-pi` (INFERRED from the README).

## 6. Residuals and open questions (each becomes one HANDOFF line; no YOUR CALL for Jake in this lane)
1. **Open for Jake (work machine):** `git config --get core.symlinks`, `type CLAUDE.md` in the clone; a 9-byte stub = nana-soul only.
2. **Residual — Windows spawn.** `pi-watchdog.mjs:107` cannot start npm's `pi.cmd` (seen in CI): no pi builder or reviewer there yet.
3. **Residual — BOM elsewhere.** Doctor (`steps.mjs:606`) and `adoption.mjs:94` strip no BOM: a BOM-saved file fails doctor only.
4. **Seat decision — roster home.** A `roster` block in the user-scope `nana-pack.json`, not a seeded file, and the seat passes reviewer
   and land models from the roster command, `pi-review` unchanged: a seed cannot carry a per-machine provider and never merges
   (`fsops.mjs:114-126`), and a roster-reading `pi-review` collides with process's edits. Both ideas were the seat's, not Jake's ruling.
5. **Residual — model typo.** A typo under a known provider runs as a custom id with only a warning (`model-resolver.js:441-455`).
6. **Residual — desk.** The frozen desk's settings editor refuses to save a user file holding `roster`, as for `objective` today.
7. **Residual — non-lane.** No row pins that non-lane pi-worker reads no roster; only the seat's acceptance checks it.
8. **Residual — Windows evidence.** `worker-lane.test.mjs` fails on the non-blocking Windows leg today; only `nana-roster` runs there.
9. **Carry — downstream.** Projects get the two bullets when their region is refreshed (process lane's carry 7 names them).
10. **After the land, a seat memory edit:** `reference_roster.md` points at the roster command; the seeded-file wording is marked the seat's.
11. **Jake's option, no repo change:** `"land": null` on this Mac drops astra and saves tokens the same way.

## Seat revision (2026-10-13)
1. `review-ledger seat-land`, its guard, old R-1124/R-1125, tests and pairs dropped; new R-1125: the seat writes `seat-land.md`.
2. Every seat-facing command is `node "$HOME/nana-pi/…"`; both path checkers skip it, so R-598 stays green (§3, pair K5).
3. The shared region is the primary carrier; nana-soul is the Claude-side copy, pinned byte for byte (E8, R-1126).
4. External fixes: E10 BOM source, E12 no win32 skip, E13 fixture, E14 count dropped, E16 marked, P6 date, P8 provenance, P13 source.
5. C2 and C3 are residual lines (§6 items 2–3); C4 is a seat decision line (§6 item 4), not a YOUR CALL.
6. Repo fixes: WRONG 1 (copier renders dirty), 4 (fixture), 5 (no desk edit), 6 (merge-base diff), 7 (exact reds); gaps 9–11, 14–16.
7. Kept: roster schema, `LANE_DEFAULTS`, `ROSTER_DEFAULTS` by name, lane refusal, command, pattern text, `AGENTS.md:66`, work-machine edit.
8. Rows R-1120–R-1126 (seven); tree 1,100 → 1,107 after process, 1,088 → 1,095 on today's main; class GATE; three code files.
