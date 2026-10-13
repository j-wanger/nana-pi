# Research: per-machine worker roster for pi-worker (lane roster, 2026-10-13)

Against main 9974218, pi 1.0.2. Read only. "INFERRED" marks claims not verified by running code.

## 1. What is sealed today

- `packages/nana-pack/bin/worker-config.mjs:11-17`: `LANE_DEFAULTS = {provider:'openai-codex', model:'gpt-6-luna', thinking:'high', tools:'read,grep,find,bash,edit,write'}`, frozen. The comment reads "roster changes are an edit to this one value and require a requirements diff". The header `@purpose` (line 3) names only the ceiling. That is existing drift.
- `packages/nana-pack/bin/pi-worker.mjs:91`: lane mode refuses every caller pi argument. `:98` builds the argv from `LANE_DEFAULTS` only. `:131` takes the lock after all lane validation. `:49-54` `laneFailure` exits 1 with `pi-worker: lane refused: <reason>` and cleans up the preamble and lock. `:65-66` says non-lane parsing stays byte-identical to the pre-lane launcher.
- `REQUIREMENTS.md:341` R-961 names the roster literally: "construct pi arguments using the roster openai-codex, gpt-6-luna, high, read,grep,find,bash,edit,write, …". It sits in FEAT-006 "Launch builders with execution limits" (`REQUIREMENTS.md:326-347`).
- `packages/nana-pack/tests/worker-lane.test.mjs:87-90` pins the literals: `defaultPairs = [["--provider","openai-codex"],["--model","gpt-6-luna"],["--thinking","high"],["-t",…]]`, titled "lane passes only the sealed roster and fixed brief instruction" (R-961). `:92-94` covers caller-override refusal. `:142-144` gives the sealed-pin precedent: `config.LANE_MAX_SECS === 28_800` (R-963).
- No other test or source pins the roster literals. `git grep` outside docs, research and bench finds only `worker-config.mjs`, `pi-worker.mjs:98`, `worker-lane.test.mjs:87`, `REQUIREMENTS.md:341` and the pack README.
- `packages/nana-pack/README.md:200` states "provider `openai-codex`, model `gpt-6-luna`, `--thinking high` … The sealed roster is one value in `bin/worker-config.mjs` … Caller overrides are not supported."
- The test env isolates by HOME only: `worker-lane.test.mjs:33-36` and `:108` (`{...process.env, PATH, HOME: temp}`). `PI_CODING_AGENT_DIR` from the developer's shell passes straight through. On win32, `os.homedir()` reads USERPROFILE, not HOME. That does not matter yet, because this file is a declared win32 SKIP (`docs/reviews/windows-ci-2026-10-11/windows-triage.md:463-469`).

## 2. How pi resolves a provider such as `example-gateway` (pi 1.0.2)

- A custom provider is a key under `providers` in `<agent dir>/models.json`, for example `{"providers":{"example-gateway":{"baseUrl":…,"api":"openai-responses","apiKey":"$KEY","models":[{"id":"gpt-6-luna"}]}}}`. Sources: `docs/models.md:45-66` and `docs/configuration.md:16`. A provider extension can also register one through `pi.registerProvider("name", …)` (`docs/custom-provider.md:19-30`). This Mac's `models.json` has one such provider, `local`.
- `--provider <name>` restricts the `--model` lookup to that provider and requires `--model`. `--thinking` overrides a `:level` suffix on the model (`docs/cli.md:63-74`). The provider lookup is case-insensitive over every registered model, including models.json and extension models (`dist/core/model-resolver.js:307-312`).
- So `pi --provider example-gateway --model gpt-6-luna --thinking high` is accepted as is. pi-worker needs no change beyond which strings it passes.
- Failure modes pi itself gives:
  - Unknown provider: an error diagnostic, `Unknown provider "x"` (`model-resolver.js:313-318`). pi then exits 1 (`dist/main.js:742-751`), and the watchdog reports FAILED with pi's text in `--out`.
  - Known provider, unknown model id: only a warning, "Using custom model id" (`model-resolver.js:441-455`). The request goes to the provider with that id. This is a residual, and the gateway decides what happens.
  - Invalid `--thinking`: only a WARNING, and pi continues on the default level (`dist/cli/args.js:125-135`; the vocabulary is `args.js:6`: off, minimal, low, medium, high, xhigh, max). A typo in the thinking value therefore drifts silently. This is the concrete reason pi-worker must validate thinking itself.
  - `--provider` and `--model` values are consumed verbatim as the next argv item (`args.js:62-67`). A value cannot be read as a flag, so no argv-injection rule is needed.
- Option rejected: drop the flags and let pi use `settings.json` `defaultProvider`/`defaultModel`/`defaultThinkingLevel` (`docs/settings.md:11-13`). This Mac's default is `openai-codex gpt-5.6-sol medium`, which is the TUI and reviewer model, not luna high. One default slot cannot hold builder and reviewer, and every interactive pi would change with it.
- `PI_PROVIDER` and `PI_MODEL` are outputs that pi sets for its shell commands, not inputs (`docs/environment-variables.md:28-37`). They give a free real-machine smoke check: a lane builder that runs `printf '%s/%s' "$PI_PROVIDER" "$PI_MODEL"` reports what actually ran.

## 3. The user-scope config nana-pack already reads

- The active agent dir has one implementation, `packages/nana-pack/lib/agent-dir.mjs:67-77` `piAgentDir()`: `PI_CODING_AGENT_DIR`, else `~/.pi/agent`. The desk, nana-setup and the pack all import it (lines 11-16).
- Readers of `<agent dir>/nana-pack.json`:
  - `lib/config.ts` (TypeScript, extension ctx). Its `userConfigPath` is at `:327`. `SCHEMA` at `:238-246` has the blocks gate, postEdit, notify, journal, handoff, objective and receipts. `normalizeRaw` (`:259-280`) iterates SCHEMA only, so an unknown top-level block such as `roster` is ignored silently, with no `config_invalid`.
  - `readConfigFile` (`config.ts:300-320`) strips one leading BOM (`:316`) and treats a dangling symlink as present but unreadable (`:309`).
  - `loadUserObjective()` (`config.ts:595`) reads the objective alone, user scope, for the bin producer.
  - `lib/adoption.mjs:89-101` is a plain-.mjs reader of the user-scope file (`readBounded` plus `JSON.parse`, total). It is the closest precedent for a .mjs launcher. NOTE: it does not strip a BOM.
- Scope rule: project `.pi/nana-pack.json` is read only in nana-trusted projects. User scope is always read (AGENTS.md "Config", `config.ts:27-34`). The objective block is user scope only, by design (`config.ts:565-574`): "Project trust says 'run this repo's tooling', not 'speak for the user's own priorities'". The roster belongs to the same class.
- Protection: the gate treats the agent dir's `nana-pack.json` as a protected policy file (`lib/gate-paths.ts:117`). A pi builder therefore cannot edit its own roster. This is advisory, as with all gate claims. The Claude Code seat has no nana gate and can edit it.
- The desk settings editor refuses unknown keys on write (`apps/desk/server.mjs:1383-1385`, `NANA_PACK_KEYS` = gate, postEdit, notify, journal, handoff, receipts). It already cannot save the `objective` block. A `roster` block joins that known limitation, and the desk is frozen (D4, 2026-10-06). Record it under Known limits; do not fix it here.

## 4. nana-setup seeding

- `packages/nana-setup/lib/steps.mjs:586-600` `stepPiConfig` seeds `<piHome>/nana-pack.json` from `packages/nana-setup/pi/nana-pack.seed.json`, which contains only `{"objective":{"projectFile":"OBJECTIVE.md"}}`.
- `seedFile` (`packages/nana-setup/lib/fsops.mjs:114-126`) is seed-if-absent and never merges. An existing file is "already present, left untouched".
- Consequence: a `roster` block added to the seed reaches only machines with no `nana-pack.json` yet. It never reaches this Mac, whose file exists with `objective` only, or any machine already installed.
- It would also define the Mac values twice, in the seed JSON and in `LANE_DEFAULTS`, which breaks "defined once".
- Doctor checks only that the file parses: `doctor.mjs:445`, through `readPiPackConfig` (`steps.mjs:604`), with no BOM strip. NOTE: a BOM-saved file (Windows Notepad) reads as FAIL in doctor while the pack reads it fine. That is adjacent and out of scope.

## 5. Recommended design (smallest)

**The default stays in code. An optional per-machine override goes in the user-scope `nana-pack.json`. Nothing is seeded.**

```json
{ "objective": { "projectFile": "OBJECTIVE.md" },
  "roster": { "builder": { "provider": "example-gateway", "model": "gpt-6-luna", "thinking": "high" } } }
```

1. `bin/worker-config.mjs`:
   - `LANE_DEFAULTS` keeps its values and its provenance (Jake, 2026-10-06). It is now the default when no override exists.
   - Rewrite the comment: "the default roster; a machine overrides provider, model and thinking through `roster.builder` in the user-scope nana-pack.json; changing the default still needs a requirements diff".
   - Add `THINKING_LEVELS = Object.freeze(['off','minimal','low','medium','high','xhigh','max'])`. Its provenance is a contract value: pi 1.0.2 `dist/cli/args.js:6`, `docs/cli.md:69-70`.
   - Fix the header `@purpose` to one sentence covering all sealed lane values.
   - `tools` is NOT overridable. It stays sealed, because R-961 already refuses every tool-control form.
2. New `packages/nana-pack/lib/worker-roster.mjs` (six-tag header; `@effects` disk).
   - Export `resolveBuilderRoster(agentDir = piAgentDir())`. It is total and returns either `{ok:true, roster:{provider, model, thinking}, source:'default'|<file>}` or `{ok:false, file, problem}`.
   - The agent dir is injected, as nana-standards requires for file roots.
   - Imports: `piAgentDir` from `./agent-dir.mjs`, `readBounded` from `./bounded-read.mjs`, and `LANE_DEFAULTS` and `THINKING_LEVELS` from `../bin/worker-config.mjs`. Imports within the packages layer are free (`code-map.config.json` layers).
   - Rules:
     - ENOENT or ENOTDIR with no symlink at the path: the default.
     - Present but unreadable, not a regular file, too large, a dangling symlink, invalid JSON after stripping one leading BOM, or a top level that is not an object: refuse.
     - `roster` absent: default. `roster` present but not an object: refuse.
     - `roster.builder` absent: default. `roster.builder` present but not an object (null included): refuse.
     - `roster.builder` must hold exactly the three leaves provider, model and thinking:
       - A missing leaf or any extra leaf (for example `tools`) is refused, naming the leaf.
       - provider and model must each be a non-empty string with no whitespace or control character (chosen: the value prints on one stderr line and stays one argv token).
       - thinking must be in `THINKING_LEVELS`.
     - Other `roster.*` keys (scout, reviewer, land) are ignored by this reader. They are reserved for the seat and pi-review side of the lane.
   - No per-leaf merge. Whole-entry replacement means what you see is what runs. A provider change can never ride on the Mac's model id unnoticed.
3. `bin/pi-worker.mjs`, in the lane block between `:91` and `:92`, before the preamble temp dir, the lock and the spawn:
   - On `ok:false`, call `laneFailure(\`roster in ${file}: ${problem}\`)`.
   - Otherwise use `roster.provider`, `.model` and `.thinking` at `:98` in place of `LANE_DEFAULTS.*`. Keep `-t LANE_DEFAULTS.tools`.
   - Print one stderr line before the run, for example `pi-worker: builder roster example-gateway gpt-6-luna high (from <file>)` or `(default)`. The `trust:` notice at `:104` is the precedent.
   - Add the user-scope `nana-pack.json` to the header `@inputs`.
   - Non-lane mode is unchanged. The seat keeps passing scout and other worker arguments after `--`.
4. Never read project scope. The reason is honest variation, not forgery: a checked-in `.pi/nana-pack.json` travels between machines and would carry one machine's provider to another.
5. Docs:
   - Pack README "Lane builder" (`:200`): replace the literal roster sentence with the default, the override block, the user-scope-only rule, the refusal and the stderr line.
   - Add a desk Known-limits line for `roster`.
   - The AGENTS.md:66 pointer, which today names shared memory `reference_roster.md`, should point at `roster` in `<agent dir>/nana-pack.json`. That line is outside the marker region (markers at 68 and 97).

Why not a separate seeded `nana-roster.json` (the seat's memory phrase "roster file seeded by nana-setup, read by pi-worker and pi-review"; that is the seat's wording, not Jake's verbatim)? A new owned file adds:

- a seed file and a step in `steps.mjs`;
- a doctor row;
- a state-manifest and uninstall entry (R-954–R-959, R-900–R-907);
- a gate protected-path entry in `gate-paths.ts:117`, which is a gate lane with a two-round cap;
- a readme-check `externalPaths` entry;
- the mandatory local install check (Jake, 2026-10-11).

It also either duplicates the Mac values or makes lane mode refuse on a machine with no install. A seed cannot carry `example-gateway` either, because that value is machine-specific. Its only gain is that the roster shows up as a file on disk. The stderr line at every lane launch and the README give most of that for about 40 lines of code.

Interaction with the land ruling (for the lane plan; pi-worker does not read it): if `roster.land` lives in the same block, "absent" must mean the Mac default (astra) and an explicit `"land": null` must mean "unset, the seat gives the land review". Otherwise this Mac, whose file has no `roster`, would silently lose its land reviewer. nana-land checks verdict coverage, not reviewer identity, so it needs no change for this reader.

## 6. Requirement rows (proposed IDs; the plan owner allocates from R-1120–R-1139)

| ID | Row (one shall) |
|---|---|
| R-961 (amend text) | WHEN pi-worker runs in lane mode, it shall refuse every caller argument after -- and --retries greater than zero, and construct pi arguments using the resolved builder roster, the sealed tool list read,grep,find,bash,edit,write, the rendered preamble path, validated brief path, and fixed lane instruction. Evidence cell: "amended 2026-10-1x (roster lane)". This follows the precedent at `REQUIREMENTS.md:1002`. The process lane keeps R-961's text, so this lane needs no text merge. |
| R-1120 | WHILE the user-scope nana-pack.json in pi's active agent dir holds no roster.builder, pi-worker lane mode shall pass the default builder roster provider openai-codex, model gpt-6-luna, thinking high (Jake's roster ruling, 2026-10-06). |
| R-1121 | WHEN the user-scope nana-pack.json in pi's active agent dir holds a valid roster.builder, pi-worker lane mode shall pass its provider, model and thinking to pi in place of the default, each flag exactly once. |
| R-1122 | IF the user-scope nana-pack.json is present but unreadable, not a regular file, or not a JSON object after one leading byte-order mark is removed, THEN pi-worker lane mode shall refuse before taking the worktree lock or starting pi, naming the file. |
| R-1123 | IF roster or roster.builder is present but not an object, or roster.builder lacks provider, model or thinking, holds any other leaf, or holds a provider or model that is empty or contains whitespace or a control character, or a thinking level outside pi's seven, THEN pi-worker lane mode shall refuse before taking the worktree lock or starting pi, naming the file and the leaf. |
| R-1124 | pi-worker shall never read a roster from a project's .pi/nana-pack.json. |
| R-1125 | WHEN lane mode starts pi, pi-worker shall print one stderr line naming the builder provider, model and thinking and whether they came from the default or the named file. |

The rows go in FEAT-006 after R-961. Regenerate `docs/requirements-tree.md`. The R-291 title literal "leaf counts total N" (`packages/nana-pack/tests/requirements-tree.test.mjs:38`) moves by +6 on top of the process lane's 1,100.

## 7. Tests (exact titles, for the seat's title check)

New `packages/nana-pack/tests/worker-roster.test.mjs` calls the reader directly. It spawns nothing and imports through `pathToFileURL`, so it runs on the Windows CI leg as well:

1. `sealed default builder roster is openai-codex, gpt-6-luna, high`. R-1120. This is the ONE literal pin, in the pattern of `worker-lane.test.mjs:144`.
2. `absent user nana-pack.json yields the default builder roster`. R-1120. It compares against the imported `LANE_DEFAULTS` with `source === 'default'`.
3. `user nana-pack.json without roster.builder yields the default builder roster`. R-1120. The fixture is this Mac's real shape, `{"objective":{"projectFile":"OBJECTIVE.md"}}`, plus `{"roster":{"land":null}}`.
4. `valid roster.builder replaces provider, model and thinking`. R-1121. Fixture: `example-gateway` / `gpt-6-luna` / `medium`, with `roster.reviewer` and `roster.land` present and ignored.
5. `roster.builder saved with a byte-order mark and CRLF line endings is read`. R-1121. This is the Windows Notepad input.
6. `each invalid roster.builder shape is refused naming the leaf`. R-1123. Cases:
   - provider missing; model missing; thinking missing;
   - thinking `ultra`; provider `""`; model `gpt 6`; a model with `\n`;
   - an extra leaf `tools`;
   - builder as `null`, `"x"` and `[]`; roster as `"x"`.
7. `an unreadable or malformed user nana-pack.json is refused naming the file`. R-1122. Cases: invalid JSON; top level `[]`; top level `null`; a directory at the path; a dangling symlink (POSIX only, skipped on win32 with a printed SKIP).

Additions to `worker-lane.test.mjs` (stub pi, POSIX; the file is a win32 SKIP):

- Change `run()` and `launchTogether()` to set `PI_CODING_AGENT_DIR` to a temp agent dir, so a developer's real roster cannot leak in. On a machine with an override, the existing R-961 test would otherwise fail.
- Refit `lane passes only the sealed roster and fixed brief instruction` (R-961) so that `defaultPairs` reads `LANE_DEFAULTS` instead of the literals. Its title stays, because R-961 evidence cites it.

8. `lane passes the user-scope roster.builder to pi, each flag once`. R-1121.
9. `lane reads the roster from PI_CODING_AGENT_DIR, not ~/.pi/agent`. R-1121. The roster file sits only at `HOME/.pi/agent` while the env names another dir, so the run gets the default. Then the reverse.
10. `lane ignores a roster in project .pi/nana-pack.json`. R-1124.
11. `lane refuses an invalid roster before the worktree lock or pi spawn`. R-1122 and R-1123. Pre-create the lock file, then expect exit 1, a stderr naming the roster problem and NOT the lock, and no spawn marker. NOTE: "no lock file afterwards", as checked at `:94`, cannot prove the order, because `laneFailure` releases the lock. The pre-created lock can.
12. `lane names the builder roster and its source on stderr`. R-1125. Covers both the default and the file case.

Mutation pairs for the seat's runner (each named test must go red):

| Mutation | Test that goes red |
|---|---|
| Edit the `LANE_DEFAULTS.model` value | 1 only |
| The reader always returns the default | 4, 8 |
| Per-leaf merge, where a missing thinking falls back to the default | 6 |
| Drop the BOM strip | 5 |
| Use `os.homedir()/.pi/agent` instead of `piAgentDir()` | 9 |
| Also read the project file | 10 |
| Resolve the roster after `acquireLaneLock` | 11 |
| Accept any thinking string | 6 |
| Allow a `tools` leaf | 6 |
| Delete the stderr line | 12 |

## 8. Conflicts, adjacent gaps, residuals

- **Process lane** (`feat/process` f912f21; plan at `docs/reviews/process-2026-10-13/CHANGE.md`):
  - It adds R-1100–R-1111 and twelve R-1110 checks to `worker-lane.test.mjs`, on `prompt-1`, next to the R-628 check at `:86`. Expect a textual conflict in `worker-lane.test.mjs` around lines 85-90.
  - It also touches REQUIREMENTS.md near FEAT-006 (R-1110 goes "after R-628") and the R-291 leaf-count title, 1,088 → 1,100. Expect a conflict on that one line and in the regenerated `docs/requirements-tree.md`.
  - It does not touch `pi-worker.mjs`, `worker-config.mjs` or R-961's text.
  - Its AGENTS.md edits sit at lines 68-97 and after "### Shared-machine test runs" (`:136`). A change to the pointer at `:66` should rebase cleanly (INFERRED).
- **Windows: the launcher cannot start npm's pi.**
  - `pi-watchdog.mjs:107` calls `spawn('pi', args)` with no shell. The triage confirms that this cannot start `pi.cmd` (`windows-triage.md:466-469`).
  - Documenting `node <path>/pi-worker.mjs` for Jake's Windows machine in this lane would name a command that fails at spawn, unless his pi is a `.exe` (unknown). That would violate the README contract (G-012).
  - Recommendation: this lane documents only the roster override. The `node <path>` line ships with, or after, the queued launcher lane that fixes the spawn, or carries an explicit "unavailable on Windows until …".
- **Residuals:**
  - A model id unknown to a known provider runs as a "custom model id" (`model-resolver.js:441-455`), so pi-worker cannot catch that typo.
  - The desk cannot save a file that holds `roster` (frozen).
  - `adoption.mjs:94` and doctor's `readPiPackConfig` do not strip a BOM. Both are adjacent and out of scope.
  - Under the threat model, honest variation (a typo, a Notepad BOM, a file copied from another machine, a stray `PI_CODING_AGENT_DIR`) is covered. A forged roster is out of scope, and the gate's advisory protection of the file is not a boundary.
- **Install check:** the recommended design touches no `packages/nana-setup/` file and no hook, so Jake's 2026-10-11 local install-check rule does not apply. Design B (a seeded file) would trigger it.

## 9. Open for the plan

- Does pi-review read `roster.reviewer` (default model when the caller gives none), or does the seat keep composing reviewer arguments from the roster it reads? Either fits this schema. pi-worker reads only `roster.builder`.
- Where do the Mac defaults for scout, reviewer and land live, if not in code no reader uses? Suggestion: a "Roster" table in the pack README, plus the absent-versus-null rule for `land`.
