# Change declaration — roster: the per-machine roster, the default pattern, the Windows launch and the seat land review

*Lane `roster` · `feat/roster` · `~/nana-pi-wt/roster`, from `main` `9974218`; rebases on `feat/process` after it lands (§4) · 2026-10-13.
Features: FEAT-006 (FEAT-007 also applies), FEAT-013 SUB-012, FEAT-014 SUB-019, FEAT-019; new R-1120–R-1128 (range R-1120–R-1139);
reworded R-961, R-684 and, after the rebase, process's R-1105; none retires. Class: GATE, two plan-review rounds at most (this is
round 2): lane mode gains a refusal, and a fail-open fallback would run the default provider where the roster names another.
Builder: Sonnet 5.5 subagent in the worktree, per the 10-13 split (Jake "agreed on the worker split"; its wording is the seat's): four
code files, nine rows, a lane refusal, the Windows launch. Reviews: sol plan and build, astra land. Install check before `nana-land`:
`nana-soul.md` and the nana-setup README live under `packages/nana-setup/` (Jake, 2026-10-12). Evidence: this folder's research and
fact-checks; sol's round 1 (two MUSTs; last section).*

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
- **A Windows seat cannot start either launcher** (sol r1 MUST 1). Both start pi only at `pi-watchdog.mjs:107`, `spawn('pi')` with no
  shell, which cannot start npm's `pi.cmd` (`windows-triage.md:466-469`, observed on hosted CI); the installer already launches pi
  through `findPi` and `winCommand` (`steps.mjs:981-987`; R-1033–R-1035, R-1039). Once pi starts that way, three more things stop a
  Windows run: the watchdog polls only `child.pid`'s CPU (`pi-watchdog.mjs:68-82`), which becomes `cmd.exe`'s; process's R-1105
  hands pi the multi-line review standard as one argument, which `winCommand` refuses (line feed, `win-command.mjs:49-58`); lane mode
  compares `realpathSync` forms, which keep an 8.3 or differently cased cwd while git returns the long form (triage :463-469).

**Outcome.** Every seat reads the default pattern; one command prints this machine's roster; pi-worker builds with it and names that
builder on every lane launch; a Windows seat runs both launchers as `node "$HOME/…"`; with no land model the seat writes its land review
into the reviewed change. **Threat model** (Jake's 10-11 words). In: honest variation — a typo in a provider, model or thinking; a
valid but unintended model in the roster (shown on every lane launch, R-1124, not refused); a BOM from PowerShell 5.1's
`-Encoding UTF8` or UTF-16LE from its `>` (E10); CRLF; an 8.3 or differently cased Windows path; npm's `pi.cmd`; a roster, a project
`.pi/nana-pack.json` or a `PI_CODING_AGENT_DIR` carried between machines. Out: deliberate forgery.

## 2. Requirement delta
Main's highest ID is R-1092; process holds R-1100–R-1111. Each row carries one `shall`.

| ID | Change | Text (draft) |
|---|---|---|
| R-961 | reworded (FEAT-006) | WHEN pi-worker runs in lane mode, it shall refuse every caller argument after --, --retries greater than zero and a roster the roster resolver refuses, and construct pi arguments using the resolved builder's provider and model, its thinking level when one is set, the tools read,grep,find,bash,edit,write, the rendered preamble path, validated brief path, and fixed lane instruction. Evidence note: "reworded 2026-10-13 (roster lane) from 'using the roster openai-codex, gpt-6-luna, high, …'". |
| R-1120 | added, FEAT-006 after R-961 | WHILE the user-scope nana-pack.json in pi's active agent dir is absent or holds no roster key, the roster resolver shall return the default roster: no scout, builder openai-codex gpt-6-luna high, reviewer openai-codex gpt-5.6-sol, and land openai-codex gpt-6-astra, the last two with pi's default thinking. Evidence note: Jake named the roles (2026-10-06); the provider and model ids are the seat's. |
| R-1121 | added, FEAT-006 | WHEN the user-scope nana-pack.json in pi's active agent dir holds a valid roster, the roster resolver shall return its scout, builder, reviewer and land exactly as written, taking no slot or field from the default and reading no roster from a project's .pi/nana-pack.json. |
| R-1122 | added, FEAT-006 | IF the user-scope nana-pack.json is present but unreadable, not a regular file, over the bounded-read cap, or not a JSON object after one leading byte-order mark is removed, or its roster is not an object holding exactly scout, builder, reviewer and land, where builder and reviewer are entries, scout and land are entries or null, and each entry holds exactly a provider and model that are non-empty with no whitespace or control character and a thinking that is one of pi's seven levels or null, THEN the roster resolver shall return a refusal naming the file and the failing slot or field. |
| R-1123 | added, FEAT-006 | WHEN the roster command runs, it shall either print one line per slot giving provider, model and thinking (`default` for null), `none` for a null scout and `seat` for a null land, then a source line naming `default` or the file, and exit 0, or print the resolver's refusal on stderr and exit 1. |
| R-1124 | added, FEAT-006 after R-1123 | WHEN pi-worker lane mode has resolved the roster, it shall print to stderr, before starting pi, exactly one line `pi-worker: builder: <provider> <model> <thinking>; source: <source>`, with `default` for a null thinking and, as the source, `default` or the user-scope file's path. |
| R-1125 | added, FEAT-006 after R-1124; FEAT-007's "Also applies" gains it | WHERE the platform is win32, pi-worker and pi-review shall start pi through findPi and winCommand as the installer does, first moving each appended system prompt that holds a line break into a file in the attempt's capture directory, end the attempt naming the reason on stderr without spawning when no pi is found or the launch is refused, judge liveness by the CPU time of the started process and all its descendants, and resolve a lane's paths by native real path. |
| R-1126 | added, SUB-019 after R-1104 (after R-683 on today's main) | The shared working pattern shall state that a change that touches code with tests goes through the pattern and questions and one-line fixes get a direct answer, with the builder, reviewer and land models of the roster that `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"` prints, and that where pi-worker and pi-review are not on PATH a seat runs `node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs"` and `node "$HOME/nana-pi/packages/nana-pack/bin/pi-review.mjs"`. |
| R-1127 | added, SUB-019 after R-1126 | The shared working pattern shall state that, when the roster sets no land model, the seat writes its land review as `docs/reviews/<lane>-<date>/seat-land.md` in the lane's reviewed change before the final round, and that the independent slice review still covers every land. |
| R-1128 | added, SUB-012 after R-301 (the row that installs nana-soul) | nana-soul shall carry the shared working pattern's default-pattern and seat land review bullets byte for byte, as the Claude Code seat's copy. |
| R-684 | reworded (FEAT-019); only this clause changes, its one `shall` stays | "…on Windows the Claude Code hooks run from the checkout and need Claude Code `CLAUDE_CODE_EXEC_FLOOR` or later, no PATH command, and the review and builder launchers run through node from the checkout; launchd macOS-only — …" (was "…launchers unavailable…"). Canonical line: "…none of the pack's PATH commands are linked, and the review and builder launchers run through node from the checkout; launchd is macOS-only." |
| R-1105 | reworded after the rebase (process's row, SUB-008) | The pi-review child shall receive the text of `prompts/review-standard.md`, not its path, exactly once as an appended system prompt after the immutable-checkout sentence; on win32 that text reaches pi in R-1125's capture-directory file. Evidence note: "reworded 2026-10-13 (roster lane): win32 carriage". |

R-301, R-350, R-598, R-682 (stays in SUB-005), R-683, R-700, R-716, R-732, R-859, R-919, R-1033–R-1035, R-1039 keep their text.
Tree: 1,100 after process → 1,109; main 1,088 → 1,097.

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
pi 1.0.2 `args.js:6`); the one-token rule is chosen (one argv token, one printed line). `@purpose` and `@outputs` updated. The Windows
launch adds no tunable: the process query and the prompt-file name are mechanism (chosen), and the PATHEXT and suffix vocabulary stay
in `lib/win-command-config.mjs` as landed.

**Resolver and roster command: new `bin/nana-roster.mjs`** (six-tag header; `@effects` disk). It exports `resolveRoster(agentDir)` →
`{ok:true, roster, source}` or `{ok:false, file, problem}`, and runs as a CLI when invoked directly (the `nana-land.mjs` pattern); only
the CLI reads `piAgentDir()`. Absent = ENOENT or ENOTDIR with no symlink; a dangling symlink is refused (`config.ts:309`). It reads
with `readBounded` (1 MiB), strips one leading BOM as `config.ts:316` does, then applies R-1122 in order, naming the first failure.

**pi-worker lane mode.** Resolve right after the caller-argument refusal (`:91`), before the preamble temp dir, lock and spawn; a
refusal goes through `laneFailure("roster refused: <file>: <problem>")`, never a fallback. On success it prints the R-1124 line, e.g.
`pi-worker: builder: openai-codex gpt-6-luna high; source: default`, the same tokens the roster command prints, so a valid but wrong
model is visible before any work (sol r1 MUST 2). The argv takes the builder's provider and model, `--thinking` only when non-null, and
`-t LANE_DEFAULTS.tools`. Non-lane mode reads no roster and prints no builder line. Header `@inputs`, `@outputs` and `@errors` gain the
roster and the line; new lines never contain `admit` or `complete` (R-732's regex, `review-ledger.test.mjs:128`, which also scans
block comments). pi-review reads no roster (the seat passes models from the roster command), so it gets no such line.

**Windows launch (sol r1 MUST 1; R-1125).** Both launchers start pi only in `pi-watchdog.mjs` `runOnce` (`:107`), so the change lives
there and `pi-review.mjs` is unchanged.
- New export `piLaunch(piArgs, { platform, env, cwd, exists, captureDir })`. Not win32: `{ command: 'pi', args: piArgs, options: {} }`,
  today's spawn. win32: `findPi({ env, cwd, exists })` (R-1033: four suffixes, PATH order, never the cwd); none → refused
  `pi is not on PATH`. Each value after `--append-system-prompt` that holds CR or LF is written, BOM-free, to
  `system-prompt-<n>.md` in the attempt's capture dir and replaced by that path; pi appends an existing file's text
  (`cli.md:219-220`, `resource-loader.js:100-114`). Then `winCommand(pi, args, { comspec })`, ComSpec found case-insensitively as
  `steps.mjs:984` does. A `.cmd` refusal for a line break adds the hint "pass a multi-line prompt as @<file>".
- `runOnce` spreads `options` (verbatim arguments for a `.cmd`) into its spawn options, keeping `detached`, stdio and env. On a
  refusal it writes `[<tag>] pi launch refused: <reason>` to stderr, closes the capture fd, removes the capture dir (R-919) and
  returns `ok:false` with that text, spawning nothing. pi-review's failure path then releases the reservation (R-716).
- **Liveness.** Through ComSpec the child is `cmd.exe`, whose own CPU stays flat while pi runs (INFERRED from the wrapper; W4 shows
  it). On win32 `cpuSeconds` runs `powershell -NoProfile -NonInteractive -Command` with `Get-CimInstance Win32_Process` as JSON
  through `execFileSync` (no shell), and new pure export `treeCpuSeconds(rootPid, rows)` sums `UserModeTime + KernelModeTime`
  (100 ns units) over the root and every descendant, accepting one object or an array. POSIX keeps `ps -o time= -p`. `killGroup`
  already ends the whole tree with `taskkill /T /F` (`:89-96`).
- **Lane paths.** `fsReal` in pi-worker (`:119`) uses `realpathSync.native` on win32 only; POSIX keeps `realpathSync`.
- **What a Windows seat passes.** Lane mode passes only file paths and a fixed instruction: nothing is refused. pi-review: process's
  review standard reaches pi through the capture-dir file (R-1105 reworded). The README's `-p "$(cat brief.md)"` holds line breaks and
  is refused, named; on Windows the seat passes `-p "@<absolute brief path>"`, which pi includes in the first prompt (`cli.md:35-39`);
  absolute, because pi-review's child runs in the immutable checkout.

**The seat's land review (no code).** With no land model, the seat writes `docs/reviews/<lane>-<date>/seat-land.md` into the reviewed
change before the final round, like HANDOFF and session notes; the slice reviewer's final round covers that tip, and `nana-land` needs
only its LAND. The seat passes reviewer and land models from the roster command as `pi-review … -- --provider P --model M [--thinking T]`.

**Carriers (E8).** The shared region is the primary carrier: a pi seat reads it through `AGENTS.md` (Jake runs both seats on Windows),
a Claude seat through the `CLAUDE.md` symlink where it resolves. nana-soul is the Claude-side copy: it reaches only Claude Code seats
where `nana-setup install` ran (R-301 symlink; R-350 win32 copy, refreshed by re-running install).
- The shared file's "Working pattern" list gains the two bullets of `shared-text.proposed.md` ("Default pattern", "Seat land review";
  98 words) before "Project-specific overrides"; `AGENTS.md:68-97` is a byte copy (R-859); `nana-soul.md` "Work habits" ends with the
  same two (R-1128). No model names: the process lane's seat decision ("the shared file names no models"). The launcher names stay
  plain words, not backticked.
- **Windows path form (E9) and R-598.** Every seat-facing command is `node "$HOME/nana-pi/…"`: it expands in Bash and PowerShell 5.1
  and 7.x, where `~/…` stays literal before 7.6. The TS checker drops a token outside `[A-Za-z0-9._/+-]` (`readme-check.mjs:316`), the
  Python one a token holding `$` or `<` (`readme_check.py:267`), so neither form makes a path claim; `node …` is a command claim that
  checks only npm-family scripts and make/just runners. A bare backticked `.mjs` or `.md` name would fail R-598 (pair K5).
- `AGENTS.md:66` becomes "See the shared working pattern below for the defaults and the roster command. Local overrides are explicit
  in each project."; Layout adds `nana-roster` to `bin/`. The Support line (`AGENTS.md:5`, root `README.md:5`, nana-setup
  `README.md:374`) takes R-684's new canonical line. Pack README: "Lane builder" (`:200`) drops the literal roster and names the
  builder line; a "Machine roster" subsection (schema, example, nulls, user scope, BOM, no fallback, the `"$HOME/…"` command, passing
  models to `pi-review`); a "Windows" paragraph (the `node "$HOME/…"` launcher form, the ComSpec start, the refused characters,
  multi-line appended prompts as files, `-p "@<absolute brief path>"` for a review).

**Jake's work machine after the land:** `git -C "$HOME/nana-pi" pull`; `node "$HOME/nana-pi/packages/nana-setup/bin/nana-setup.mjs" install`;
one file edit, a `roster` block in `<agent dir>\nana-pack.json` with his gateway's name where the repo shows `example-gateway` (scout
luna medium, builder luna high, reviewer sol, `"land": null`); check it with the roster command; build and review with
`node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs"` and `…/pi-review.mjs` until the PATH lane links them. No work name enters the repo.

## 4. Scope
**In.** Code (four files, budget five): `packages/nana-pack/bin/` `worker-config.mjs`, `pi-worker.mjs`, `nana-roster.mjs` (new),
`pi-watchdog.mjs`. Tests: `nana-roster` (new), `win32-launch` (new), `worker-lane`, `templates-render`, `requirements-tree`. Text:
`nana-soul.md`, the shared file, `AGENTS.md` (Support line, region, `:66`, Layout), root `README.md` and nana-setup `README.md`
(Support line only), pack README, `REQUIREMENTS.md`, the tree, the code map, HANDOFF and session entry before the final round, the corpus.
**NOT.** `pi-review.mjs` (its launch is the watchdog's), `review-ledger.mjs`, `review-round.mjs`, `nana-land.mjs`,
`lib/win-command.mjs` and `lib/win-command-config.mjs` (used as landed), `packages/nana-setup/lib`; the PATH links for the launchers
(the queued PATH lane); desk code and README (`apps/desk/README.md:272-273` covers unknown keys); `scripts/test.mjs`; shared memory;
`@AGENTS.md`; downstream repos. Never a merge, `tools` override, project roster, seed or fallback, nor a committed work name or
gateway URL.
**Expected conflicts with `feat/process`:** the shared Working-pattern list and its `AGENTS.md` copy (process inserts after "Review
ladder", this lane before "Project-specific overrides"; INFERRED clean); SUB-019; `worker-lane.test.mjs:85-90` (process's R-1110);
`checkInstructionContracts`; R-291's literal at `requirements-tree.test.mjs:38`, `:52`, `:53`; the tree; the pack README. R-1105's
reword lands only after the rebase; process's `pi-review.mjs` edit is untouched here, and its POSIX `immutable-review` titles stay
green because the prompt-file move is win32-only.

## 5. Verification
Exact titles under `// req:` lines, frozen in `seat-titles.mjs`; DONE = `0 missing` (28 new, 2 refits, 1 renamed); phrases normalise CR.
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
  roster before starting pi, naming the file". R-1121: "lane ignores a roster in project .pi/nana-pack.json". R-1124: "lane prints the
  resolved builder and roster source on stderr before starting pi" (no roster: the line from `LANE_DEFAULTS` by name and
  `source: default`; a machine roster with `thinking: null`: `default` and the file's path; exactly one such line, before
  `[pi-worker] attempt 1/1`).
- `templates-render.test.mjs`. R-1126: "shared working pattern makes the pattern the default with the machine roster" (both phrases,
  the exact roster command and both launcher commands). R-1127: "shared working pattern gives the land review to the seat when the
  roster sets no land model" (its four phrases). R-1128: "nana-soul carries the shared default-pattern and seat land review bullets"
  (both bullets, after CR removal). R-684 refit: "three front doors carry one identical scoped platform claim" holds the new canonical
  line. `requirements-tree.test.mjs`: R-291's "…leaf counts total 1,100" → "…leaf counts total 1,109".
- `win32-launch.test.mjs` (new; six-tag header; imports `pi-watchdog.mjs` through `pathToFileURL`). **Every leg, forced win32** with an
  injected env, `exists` and a temp capture dir. R-1125: "win32 launch runs pi.cmd through ComSpec with each argument quoted and pi.exe
  directly" (PATH `C:\a;C:\npm`, only `C:\npm\pi.cmd` exists → the injected ComSpec, `/d /v:off /s /c` and the one quoted line, found
  under a `comspec` key; `PI.EXE` → direct, same argv); "win32 launch moves a multi-line appended system prompt into a
  capture-directory file" (LF and CRLF values → capture-dir paths whose bytes equal the values; a one-line appended prompt and a
  positional stay text; `platform: 'darwin'` returns `pi` with the argv unchanged); "win32 launch with no pi or a refused argument
  names the reason" (no pi → `pi is not on PATH`; `-p` with LF → line feed and the `@` hint; `%` → `%`); "win32 liveness sums the CPU
  time of pi's whole process tree" (cmd root, node child, grandchild, an unrelated process, a lone object → root and descendants only,
  in seconds). **Windows leg only** (printed SKIP elsewhere): a stub `pi.cmd` first on PATH (`@"<node.exe>" "%~dp0stub-pi.mjs" %*`)
  appends its argv and each appended-prompt file's bytes to a record, may stay busy, then prints `VERDICT: LAND`; HOME, USERPROFILE,
  TEMP and an empty `PI_CODING_AGENT_DIR` sit in the test's temp dir; fixtures live under `os.tmpdir()`, an 8.3 path on the runner.
  R-1125 and R-1124: "Windows: lane pi-worker prints the builder line and starts the stub pi.cmd with the lane argv" (`LANE_DEFAULTS`
  by name, preamble and brief paths, the fixed instruction, `--name`). R-1125: "Windows: non-lane pi-worker starts the stub pi.cmd
  with the caller's argv"; "Windows: a busy stub pi.cmd is not stopped as stalled" (`--stall-secs 3 --poll 1`, stub busy 12 s →
  exit 0, no STALL line); "Windows: a refused launch starts no stub and leaves no capture directory" (`-p "a%b"` → exit 1, `pi launch
  refused` naming `%`, no record, no `pi-review-*` dir in the test's TEMP). R-1125 and R-1105: "Windows: pi-review starts the stub
  pi.cmd with the review standard in a capture-directory file" (`--tree` a temp repo; caller `-- --provider p --model m -p @<brief>`;
  argv ends with the immutable sentence, a capture-dir path whose recorded bytes equal `prompts/review-standard.md`, and `--name`;
  exit 0).

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
- R-1126 → its title: 27 delete "a change that touches code with tests goes through the pattern"; 28 delete "questions and one-line fixes
  get a direct answer"; 29 `"$HOME/` → `~/` in the roster command. R-1127 → its title: 30 delete "when the roster sets no land model";
  31 the `seat-land.md` path → a scratch path; 32 delete "before the final round"; 33 delete "the independent slice review still covers
  every land". R-1128 → its title only: 34 nana-soul alone loses bullet 2; 35 nana-soul alone writes `~/`.
- R-1124 → builder-line title: 36 print it after the run; 37 always `source: default`; 38 print `LANE_DEFAULTS`, not the resolved
  builder; 39 drop the thinking field.
- R-1125 → ComSpec title: 40 win32 returns `pi` by name, no `findPi` or `winCommand`; 41 read only an exact `ComSpec` key. → move
  title: 42 pass a multi-line appended prompt as text; 43 move a one-line prompt or a positional too. → refusal title: 44 a missing pi
  falls back to `pi`; 45 drop the `@` hint. → tree title: 46 sum only the root; 47 count an unrelated process.
- R-1126 → its title: 48 delete the pi-review launcher command; 49 `"$HOME/` → `~/` in the pi-worker launcher command.
- Kept clauses. K1 delete the `:91` refusal → "lane mode refuses all caller pi arguments before lock or spawn", "lane refuses caller
  tools without edit and write", "lane refuses tool-control forms …" and "lane refuses resource-disabling forms …". K2 delete the
  retries refusal → "lane refuses retries before launch". K3 brief before preamble → "verified lane passes preamble and validated brief
  as ordered file paths". K4 alter the fixed instruction → refit title. K5 add a bare `nana-roster.mjs` to bullet 1 → R-598's "checkout
  shared-section claim paths resolve" and the four "… all declared skill paths resolve independently" (INFERRED; launch run confirms).
  K6 restore "the review and builder launchers are unavailable" in `AGENTS.md` alone → R-684's title. K7 apply the win32 launch on
  every platform → "verified lane passes preamble and validated brief as ordered file paths" and "pi-worker runs a worker under the
  watchdog (exit 0, output written)".
- **Windows-only clauses.** The five Windows titles, the native lane path, the refusal's capture cleanup and the flat `cmd.exe` CPU
  have no pair the seat can red on this Mac. Their evidence is the Windows leg's PASS lines on the reviewed tip. The reds before the
  change are on record for the spawn and the 8.3 refusal (triage :463-469), not for liveness, which pairs 46–47 pin on every leg.

**Seat acceptance, before and after the build.** Titles `0 missing`; pairs 1–49 and K1–K7; one `shall` per new row; shared file, region,
nana-soul and `shared-text.proposed.md` bullets match; the three Support lines equal R-684's canonical line; empty merge-base diff on
`pi-review.mjs`, `review-ledger.mjs`, `review-round.mjs`, `nana-land.mjs`, `lib/win-command.mjs`, `lib/win-command-config.mjs`,
`packages/nana-setup/lib`; no work name shared memory holds in any committed file, the corpus included; no `reference_roster` in
`AGENTS.md`; the roster command prints `source: default` on this Mac and `land: seat` with a temp roster; a lane launch with a stub pi
prints `pi-worker: builder: openai-codex gpt-6-luna high; source: default`, and with a temp roster names that file; a non-lane
`pi-worker` with a stub pi and a malformed roster exits 0; on the draft PR's CI run of the reviewed tip, the Windows leg shows PASS for
the five stub `pi.cmd` titles (lane and non-lane pi-worker, pi-review, the busy stub, the refusal) and the four forced-win32 titles —
a non-blocking leg, so the seat reads these lines before land; `npm run test:locked`, `map:check`, `readme:check`,
`node scripts/requirements-tree.mjs --check`; the install check (`node packages/nana-setup/bin/install-check.mjs`) before `nana-land`.
If a Windows title fails, the builder reports BLOCKED with the log lines; the seat fixes it within the fifth code-file slot or narrows
the Windows claims (Support line, shared bullet, pack README) to what passed. No Windows claim lands that the leg did not show.
**The claim most likely to be wrong:** that pi-review reaches its spawn on Windows. Its admission, immutable checkout and ledger have
never run there; the pi-review Windows title is their first run (INFERRED: nothing read predicts a failure).

## 6. Residuals and open questions (each becomes one HANDOFF line; no YOUR CALL for Jake in this lane)
1. **Open for Jake (work machine):** `git config --get core.symlinks`, `type CLAUDE.md` in the clone; a 9-byte stub = nana-soul only.
2. **Residual — Windows evidence is a stub.** The leg proves the launch with a stub `pi.cmd`; no real pi has run a lane or review on
   Windows, and Jake's first lane there is the first real run. That a Windows seat obeys the rule after the land stays INFERRED.
3. **Residual — BOM elsewhere.** Doctor (`steps.mjs:606`) and `adoption.mjs:94` strip no BOM: a BOM-saved file fails doctor only.
4. **Seat decision — roster home.** A `roster` block in the user-scope `nana-pack.json`, not a seeded file, and the seat passes reviewer
   and land models from the roster command, `pi-review` unchanged: a seed cannot carry a per-machine provider and never merges
   (`fsops.mjs:114-126`), and a roster-reading `pi-review` collides with process's edits. Both ideas were the seat's, not Jake's ruling.
5. **Residual — model typo.** A typo under a known provider runs as a custom id with only a warning (`model-resolver.js:441-455`); the
   builder line (R-1124) shows it on every lane launch; pi-review's models are the seat's own typed arguments.
6. **Residual — desk.** The frozen desk's settings editor refuses to save a user file holding `roster`, as for `objective` today.
7. **Residual — non-lane.** No row pins that non-lane pi-worker reads no roster; only the seat's acceptance checks it.
8. **Residual — Windows test files.** `worker-lane.test.mjs` still fails on the Windows leg (its POSIX `sh` stub); the Windows evidence
   is `win32-launch.test.mjs` and `nana-roster.test.mjs`.
9. **Carry — downstream.** Projects get the two bullets when their region is refreshed (process lane's carry 7 names them).
10. **After the land, a seat memory edit:** `reference_roster.md` points at the roster command; the seeded-file wording is marked the seat's.
11. **Jake's option, no repo change:** `"land": null` on this Mac drops astra and saves tokens the same way.
12. **Residual — Windows argument limits.** On win32 a one-line argument holding `"`, `%` or `!`, or a multi-line positional prompt, is
    refused and named (R-1035's rule); multi-line appended prompts travel as files; a review brief goes as `@<absolute path>`.
13. **Residual — console window (INFERRED).** The child stays `detached` as today; on a desktop seat Windows may open a console window
    for pi under `cmd.exe`, and closing it ends that attempt. Not observed.
14. **Carry — PATH links.** The queued PATH lane links pi-worker and pi-review on Windows; until then seats use the `node "$HOME/…"` form.

## Seat revision (2026-10-13)
1. `review-ledger seat-land`, its guard, old R-1124/R-1125, tests and pairs dropped; new R-1125: the seat writes `seat-land.md`.
2. Every seat-facing command is `node "$HOME/nana-pi/…"`; both path checkers skip it, so R-598 stays green (§3, pair K5).
3. The shared region is the primary carrier; nana-soul is the Claude-side copy, pinned byte for byte (E8, R-1126).
4. External fixes: E10 BOM source, E12 no win32 skip, E13 fixture, E14 count dropped, E16 marked, P6 date, P8 provenance, P13 source.
5. C2 and C3 are residual lines (§6 items 2–3); C4 is a seat decision line (§6 item 4), not a YOUR CALL.
6. Repo fixes: WRONG 1 (copier renders dirty), 4 (fixture), 5 (no desk edit), 6 (merge-base diff), 7 (exact reds); gaps 9–11, 14–16.
7. Kept: roster schema, `LANE_DEFAULTS`, `ROSTER_DEFAULTS` by name, lane refusal, command, pattern text, `AGENTS.md:66`, work-machine edit.
8. Rows R-1120–R-1126 (seven); tree 1,100 → 1,107 after process, 1,088 → 1,095 on today's main; class GATE; three code files.
   (Superseded by plan review r1 below; IDs in items 1 and 3 are the pre-r1 numbers.)

## Plan review r1 (2026-10-13)
sol r1: SEND-BACK 6/10, two MUSTs. Seat decisions applied; the round-1 NOTEs still hold (§3 seat land review; one `shall` per row; §5).
1. **MUST 1, Windows seats cannot follow the pattern:** R-1125 starts pi through `findPi` and `winCommand` in the shared watchdog for pi-worker (both modes) and pi-review, with prompt files, tree CPU and native lane paths; the shared text, nana-soul and Support line name `node "$HOME/…"`; five Windows-leg stub `pi.cmd` titles and four forced-win32 titles on every leg; PATH links stay out.
2. **MUST 2, a valid but wrong model runs silently:** R-1124 prints `pi-worker: builder: <provider> <model> <thinking>; source: <default|file>` on stderr before every lane spawn; direct title, pairs 36–39; pi-review reads no roster, so it gets no line.
3. **Budget:** nine new rows R-1120–R-1128 (old R-1124–R-1126 are now R-1126–R-1128); four code files (`pi-watchdog.mjs` added, `pi-review.mjs` unchanged); tree 1,100 → 1,109 after process, 1,088 → 1,097 on main.
4. **Found while closing MUST 1:** process's R-1105 hands pi the multi-line review standard, which `winCommand` refuses; R-1125's prompt-file move carries it, and R-1105 is reworded after the rebase.
