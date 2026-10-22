# Change declaration — roster: the per-machine roster, the default pattern, the Windows launch and the seat land review

*Lane `roster` · `feat/roster` · `~/nana-pi-wt/roster`, from `main` `9974218`; rebases on `feat/process` after it lands (§4) · 2026-10-13.
Features: FEAT-006 (FEAT-007 also applies), FEAT-013 SUB-012, FEAT-014 SUB-019, FEAT-019; new R-1120–R-1128 (range R-1120–R-1139);
reworded R-961 and R-684; process's R-1105 keeps its text; none retires. Class: GATE: lane mode gains a refusal, and a fail-open
fallback would run the default provider where the roster names another. Plan rounds: r1 SEND-BACK 6/10, r2 LAND 9/10; the owner ordered a
third for the Windows launch switch ("Yes switch, but go through plan review", 2026-10-13; last section).
Builder: Sonnet 5.5 subagent in the worktree, per the 10-13 split (Owner "agreed on the worker split"; its wording is the seat's): four
code files, nine rows, a lane refusal, the Windows launch. Reviews: sol plan and build, astra land. Install check before `nana-land`:
`nana-soul.md` and the nana-setup README live under `packages/nana-setup/` (Owner, 2026-10-12). Evidence: this folder's research and
fact-checks, `research-node-entry.md` for the Windows launch and its two fact-checks, `factcheck-node-entry-external.md` and
`factcheck-node-entry-repo.md`; sol's rounds 1–2 (last sections).*

## 1. Why
A Claude Code seat on the owner's Windows work machine treated the builder/reviewer/land pattern as opt-in. The owner's rulings, verbatim:
"sure" (to the seat's proposal: the pattern for any change that touches code with tests, a direct answer for questions and one-line
fixes); "land can be optional due to token allowance, seat will take on landing review if no land model set".
- **The roster has no home off this Mac.** `AGENTS.md:66` points at shared memory `reference_roster.md`, which a fresh machine
  lacks (empty seed; `nana-shared-memory.mjs:89`). No surface a pi seat reads makes the pattern the default.
- **The builder cannot reach another provider.** `LANE_DEFAULTS` (`worker-config.mjs:11-17`) alone feeds `pi-worker.mjs:98`'s argv,
  and lane mode refuses caller pi arguments (`:91`). pi 1.0.2 resolves any `models.json` provider via `--provider`
  (`model-resolver.js:307-318`); a bad `--thinking` only warns (`args.js:125-135`). The work machine's pi version is unverified (E16).
- **No rule covers an unset land model.** `nana-land` needs only the slice reviewer's LAND (`nana-land.mjs:91`): the seat's needs a place.
- **A Windows seat cannot start either launcher** (sol r1 MUST 1). Both start pi only at `pi-watchdog.mjs:107`, `spawn('pi')` with no
  shell, which cannot start npm's `pi.cmd` (`windows-triage.md:466-469`, hosted CI). The owner's work machine showed it on 2026-10-13:
  pi-worker failed twice with `spawn pi ENOENT` while a direct `pi` worked (his Claude Code seat's diagnosis, photographed). Running
  the shim through `cmd.exe` breaks a multi-line argument (`shell: true` joins arguments unescaped; `winCommand` refuses a line feed,
  `win-command.mjs:49-58`) and makes `cmd.exe` the watched process. pi's own Windows launcher runs pi's Node entry with
  `process.execPath` instead (pi.dev `install.ps1:1456-1489`), and the owner's seat ran a worker end to end that way (§3). Lane mode also
  compares `realpathSync` forms, which keep an 8.3 or differently cased cwd while git returns the long form (triage :463-469).

**Outcome.** Every seat reads the default pattern; one command prints this machine's roster; pi-worker builds with it and names that
builder on every lane launch; a Windows seat with an npm-installed pi runs both launchers as `node "$HOME/…"`; with no land model the
seat writes its land review into the reviewed change. **Threat model** (Owner's 10-11 words). In: honest variation — a typo in a
provider, model or thinking; a valid but unintended model in the roster (shown on every lane launch, R-1124, not refused); a BOM from
PowerShell 5.1's `-Encoding UTF8` or UTF-16LE from its `>` (E10); CRLF; an 8.3 or differently cased Windows path; npm's `pi.cmd` in
its global or `.bin` layout; a pnpm global, Volta or pi.dev-managed pi on Windows (refused, named); a roster, a project
`.pi/nana-pack.json` or a `PI_CODING_AGENT_DIR` carried between machines. Out: deliberate forgery.

## 2. Requirement delta
Main's highest ID is R-1092; process holds R-1100–R-1111. Each row carries one `shall`.

| ID | Change | Text (draft) |
|---|---|---|
| R-961 | reworded (FEAT-006) | WHEN pi-worker runs in lane mode, it shall refuse every caller argument after --, --retries greater than zero and a roster the roster resolver refuses, and construct pi arguments using the resolved builder's provider and model, its thinking level when one is set, the tools read,grep,find,bash,edit,write, the rendered preamble path, validated brief path, and fixed lane instruction. Evidence note: "reworded 2026-10-13 (roster lane) from 'using the roster openai-codex, gpt-6-luna, high, …'". |
| R-1120 | added, FEAT-006 after R-961 | WHILE the user-scope nana-pack.json in pi's active agent dir is absent or holds no roster key, the roster resolver shall return the default roster: no scout, builder openai-codex gpt-6-luna high, reviewer openai-codex gpt-5.6-sol, and land openai-codex gpt-6-astra, the last two with pi's default thinking. Evidence note: the owner named the roles (2026-10-06); the provider and model ids are the seat's. |
| R-1121 | added, FEAT-006 | WHEN the user-scope nana-pack.json in pi's active agent dir holds a valid roster, the roster resolver shall return its scout, builder, reviewer and land exactly as written, taking no slot or field from the default and reading no roster from a project's .pi/nana-pack.json. |
| R-1122 | added, FEAT-006 | IF the user-scope nana-pack.json is present but unreadable, not a regular file, over the bounded-read cap, or not a JSON object after one leading byte-order mark is removed, or its roster is not an object holding exactly scout, builder, reviewer and land, where builder and reviewer are entries, scout and land are entries or null, and each entry holds exactly a provider and model that are non-empty with no whitespace or control character and a thinking that is one of pi's seven levels or null, THEN the roster resolver shall return a refusal naming the file and the failing slot or field. |
| R-1123 | added, FEAT-006 | WHEN the roster command runs, it shall either print one line per slot giving provider, model and thinking (`default` for null), `none` for a null scout and `seat` for a null land, then a source line naming `default` or the file, and exit 0, or print the resolver's refusal on stderr and exit 1. |
| R-1124 | added, FEAT-006 after R-1123 | WHEN pi-worker lane mode has resolved the roster, it shall print to stderr, before starting pi, exactly one line `pi-worker: builder: <provider> <model> <thinking>; source: <source>`, with `default` for a null thinking and, as the source, `default` or the user-scope file's path. |
| R-1125 | added, FEAT-006 after R-1124; FEAT-007's "Also applies" gains it | WHERE the platform is win32, pi-worker and pi-review shall start a `.cmd` or `.bat` pi that findPi locates as the running Node executable, with the `pi` bin entry of the @earendil-works/pi-coding-agent package that npm's global or `.bin` layout places beside that shim as the first argument and the pi arguments unchanged after it, start a located `.exe` or `.com` pi directly with those arguments, write a named `pi launch refused` reason on stderr and start nothing when no pi is found or that package, its `pi` bin or its entry file is missing, unreadable, not that package or outside it, and resolve a lane's paths by native real path. Evidence note: `review-ledger run` still starts its command by name, so `review-ledger run -- pi …` is not covered on Windows. |
| R-1126 | added, SUB-019 after R-1104 (after R-683 on today's main) | The shared working pattern shall state that a change that touches code with tests goes through the pattern and questions and one-line fixes get a direct answer, with the builder, reviewer and land models of the roster that `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"` prints, and that where pi-worker and pi-review are not on PATH a seat runs `node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs"` and `node "$HOME/nana-pi/packages/nana-pack/bin/pi-review.mjs"`. |
| R-1127 | added, SUB-019 after R-1126 | The shared working pattern shall state that, when the roster sets no land model, the seat writes its land review as `docs/reviews/<lane>-<date>/seat-land.md` in the lane's reviewed change before the final round, and that the independent slice review still covers every land. |
| R-1128 | added, SUB-012 after R-301 (the row that installs nana-soul) | nana-soul shall carry the shared working pattern's default-pattern and seat land review bullets byte for byte, as the Claude Code seat's copy. |
| R-684 | reworded (FEAT-019); only this clause changes, its one `shall` stays | "…on Windows the Claude Code hooks run from the checkout and need Claude Code `CLAUDE_CODE_EXEC_FLOOR` or later, no PATH command, and the review and builder launchers run through node from the checkout with an npm-installed pi; launchd macOS-only — …" (was "…launchers unavailable…"). Canonical line: "…none of the pack's PATH commands are linked, and the review and builder launchers run through node from the checkout with an npm-installed pi; launchd is macOS-only." |

R-301, R-350, R-598, R-682 (stays in SUB-005), R-683, R-700, R-716, R-732, R-859, R-919, R-1033–R-1035, R-1039 and process's R-1105
keep their text: node carries the multi-line review standard to pi as one argument (VERIFIED from libuv's quoting and Microsoft's
argument rules; observed only when the Windows leg runs), so R-1105 needs no Windows clause.
Tree: nine leaves over the base at rebase — 1,100 → 1,109 after process alone; 1,104 → 1,113 if fresh-install's four rows land
first too; main 1,088 → 1,097.

## 3. Design
**Roster home: a `roster` block in the user-scope `<agent dir>/nana-pack.json`, user scope only like `objective`
(`config.ts:565-574`); nothing seeded.** pi-worker finds the dir through `piAgentDir()` (`lib/agent-dir.mjs:67-77`); a Claude seat
runs the roster command, which spawns nothing. The pack's reader ignores the block (`config.ts:259-280`); the gate protects the file
from pi builders (`gate-paths.ts:117`; advisory). **Schema:** four slots, whole roster, no merge; `land: null` = the seat gives the
land review; `scout: null` = no pi scout; builder and reviewer mandatory. README example (placeholder provider only):
`{"roster":{"scout":{"provider":"example-gateway","model":"gpt-6-luna","thinking":"medium"},"builder":{…"high"},"reviewer":{…"gpt-5.6-sol","thinking":null},"land":null}}`.

**Sealed values (`bin/worker-config.mjs`, the pack's declared surface for launcher values).** `LANE_DEFAULTS` keeps its four values
byte-identical, the one definition of the default builder and the sealed tool list; its comment names it the default builder that a
machine roster replaces, with provenance "roles: the owner, 2026-10-06; provider and model id: the seat's". `ROSTER_DEFAULTS`, deep-frozen
(provenance: R-1120, the owner's roles, the seat's ids): `scout: null` (chosen: this Mac runs no pi scout); `builder` reads `LANE_DEFAULTS`
provider, model and thinking by name; `reviewer` openai-codex gpt-5.6-sol and `land` openai-codex gpt-6-astra, each `thinking: null`
(INFERRED: the ledger records no thinking). `ROSTER_SLOTS`, `NULLABLE_SLOTS` (contract: R-1122); `THINKING_LEVELS` off…max (contract:
pi 1.0.2 `args.js:6`); the one-token rule is chosen (one argv token, one printed line). The Windows launch adds pi's package
vocabulary: `PI_PACKAGE` `@earendil-works/pi-coding-agent` and `PI_BIN_NAME` `pi` (contract: pi 1.0.2 `package.json` `name` and
`bin` `{"pi":"dist/bundle/cli.js"}`, read 2026-10-13), and `NPM_DIRS` `node_modules` and `.bin` (contract: npm 10.9.7's bin-links
5.0.0 `bin-target.js`). The desk holds the same package string (`apps/desk/pi-session.mjs:65`); a cross-component import is not
allowed, so it stays duplicated. `@purpose` ("the sealed launcher values: the lane ceiling, the default builder and roster, and pi's
npm package identity") and `@outputs` updated. PATHEXT and the suffixes stay in `lib/win-command-config.mjs` as landed.

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

**Windows launch (sol r1 MUST 1; R-1125; the owner's switch, 2026-10-13).** Both launchers start pi only in `pi-watchdog.mjs` `runOnce`
(`:107`), so the change lives there and `pi-review.mjs` is unchanged. Evidence: `research-node-entry.md` (this folder).
- New export `piLaunch(piArgs, { platform, env, cwd, exists, isFile, readText, execPath })` → `{ command, args }` or
  `{ refused }`. Not win32: `{ command: 'pi', args: piArgs }`, today's spawn. win32, every path in `path.win32`:
  `findPi({ env, cwd, exists })` (R-1033 as landed: four suffixes, PATH order, never the cwd, and it returns its own lowercase
  candidate name, not the on-disk case); none → `pi is not on PATH`. A `.exe` or `.com` → `{ command: <findPi's path>, args: piArgs }`.
  A `.cmd` or `.bat` → the package folder is `<shim folder>\..\<PI_PACKAGE>` when the shim folder's last two names equal `NPM_DIRS`
  ignoring case (`node_modules\.bin`, npm's local layout), else `<shim folder>\node_modules\<PI_PACKAGE>` (npm's Windows global
  layout); one candidate each, no search. Its `package.json` must parse to an object named `PI_PACKAGE`; the bin is a string `bin`,
  else `bin[PI_BIN_NAME]`; it must resolve inside the folder and pass `isFile` → `{ command: execPath, args: [entry, ...piArgs] }`,
  no shell, no verbatim arguments. Defaults: `exists` stays undefined, so `findPi` keeps its own lstat check (module-private in the
  frozen `win-command.mjs`; never imported or copied); `isFile` = `statSync(p).isFile()`, false on any error, as pi does;
  `readText` = `readFileSync(…, 'utf8')`; `execPath` = `process.execPath`.
- **The rule is pi's own.** pi's managed Windows launcher does the same bin lookup, containment check, `statSync(entry).isFile()`
  test and `process.execPath` spawn (pi.dev `install.ps1:1456-1489`, `:1480` for the file test, fetched 2026-10-13), and npm's
  `pi.cmd` runs `node` with the same entry first (cmd-shim 7.0.0's template). Only the folder locator is ours. Real-machine
  evidence: the owner's seat built the same approach on his work machine (node plus pi's `cli.js` for npm's global and `.bin` layouts on
  win32, bare `pi` elsewhere) and a worker returned READY, exit 0, where it had failed with `spawn pi ENOENT`; that branch is not
  visible to us, so its details are INFERRED. Seat prototype (macOS): an argv holding LF, CRLF, `%`, `!`, `"` and a trailing `\`
  reached the entry byte-identical with the launcher as its parent; an escaping bin, a missing entry and a Volta-shaped folder were
  refused, named.
- **Refusals**, each `[<tag>] pi launch refused: <reason>` on stderr, nothing started: pi not on PATH; a shim with no package beside
  it (the reason names a pnpm global install, Volta and the pi.dev installer as unsupported); a `package.json` unreadable or not
  `PI_PACKAGE`; no `pi` bin; a bin outside the package; an entry that is not a regular file (`isFile`). A pnpm project's
  `node_modules\.bin\pi.cmd` meets the `.bin` locator through pnpm's package link and may be accepted (INFERRED; it is the real
  package). `runOnce` computes the launch from the attempt's argv (with `--name`) and the child's env before it creates the capture
  dir, so a refusal returns `ok:false` with that text and leaves nothing to remove; pi-review's failure path releases the
  reservation (R-716). A spawn error after a resolution stays today's `pi spawn failed: …`.
  A refusal counts as a failed attempt, as today's `spawn pi ENOENT` does: runWatchdog retries it (pi-review's default three
  attempts print it three times), both launchers write it to `--out`, and both end with today's "FAILED after N attempt(s)
  (endpoint likely in a bad stretch)" line. Declared, not changed: stopping early would make frozen pi-review's attempt count
  false (§6 item 18).
- **Liveness and kill.** The watched process is pi itself (Node running the entry), so today's `Get-Process -Id <pid>` CPU poll
  (`:68-82`) and `killGroup`'s `taskkill /T /F` (`:89-96`) stay as landed. `detached` stays; libuv turns it into
  `DETACHED_PROCESS`, so pi runs with no console window (§6 item 13).
- **Watchdog header.** `pi-watchdog.mjs`'s six tags change with `piLaunch`. `@purpose`: "Start pi (on win32 through its npm Node
  entry) under a CPU-liveness watchdog that kills and retries attempts whose CPU time stays flat and cleans up child trees on
  termination signals." `@inputs` gains PATH, PATHEXT and, on win32, pi's `package.json`; `@outputs` gains `piLaunch`'s
  `{command, args}` or `{refused}`; `@effects` gains the win32 disk reads (PATH lookup, `package.json`, the entry's stat) and spawns
  pi by name, its `.exe`, or node with its entry; `@errors` gains the refusal, returned as `ok:false` with its text. A separate
  launch module would split the two jobs more cleanly; the four-code-file budget keeps `piLaunch` here.
- **Lane paths.** `fsReal` in pi-worker (`:119`) uses `realpathSync.native` on win32 only; POSIX keeps `realpathSync`.
- **What a Windows seat passes.** From the launcher on, the arguments reach pi unchanged, a multi-line `-p` and process's multi-line
  review standard included (VERIFIED from libuv's quoting and Microsoft's argument rules; observed only when the Windows leg runs), so
  R-1105 keeps its text. The seat-to-launcher hop belongs to the seat's shell. In Git Bash the README's `-p "$(cat brief.md)"` works.
  In PowerShell it does not: `cat` is `Get-Content`, whose lines join with spaces inside `"$(…)"`, and Windows PowerShell 5.1's legacy
  argument passing drops embedded `"`. The pack README's Windows paragraph gains one line: from PowerShell, pass a brief as a quoted
  `"@<full path>"` argument, which pi reads itself (pi `docs/cli.md`, `@path`; quoted, or PowerShell reads `@` as splatting; a full
  path, since pi resolves `@path` from its cwd, which for pi-review is the temporary checkout). The form sidesteps both shell
  problems and the 32,767-character limit (INFERRED; not run on Windows). No test pins that line; the launchers are unchanged by it.
- **Why win32 only.** On macOS and Linux, npm's `pi` is a symlink to the entry and pnpm's and the managed launcher end in `exec`, so pi
  is already the watched process with its argv intact. One rule everywhere would refuse working pnpm and managed installs there and
  break the four test files that start a `#!/bin/sh` stub `pi` through the watchdog: `worker-lane`, `immutable-review`,
  `review-ledger` and `handoff-writer-role`. The forced-win32 titles run the branch on every leg; K7 pins that POSIX keeps `pi` by name.
- **Dropped (subtraction).** The prompt-file move and its `@` hint, `captureDir`, `winCommand` with ComSpec and its refused characters,
  the `options` spread, `treeCpuSeconds` and its `Get-CimInstance` query, and process's R-1105 reword. Node takes the argv intact, and
  pi is the child, so none of them has a job left.

**The seat's land review (no code).** With no land model, the seat writes `docs/reviews/<lane>-<date>/seat-land.md` into the reviewed
change before the final round, like HANDOFF and session notes; the slice reviewer's final round covers that tip, and `nana-land` needs
only its LAND. The seat passes reviewer and land models from the roster command as `pi-review … -- --provider P --model M [--thinking T]`.

**Carriers (E8).** The shared region is the primary carrier: a pi seat reads it through `AGENTS.md` (Owner runs both seats on Windows),
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
  models to `pi-review`); a "Windows" paragraph (the `node "$HOME/…"` launcher form; pi started through its Node entry from npm's
  global or `.bin` layout, a `pi.exe` directly; a pnpm global install, Volta and the pi.dev installer refused, named; arguments
  passed unchanged; from PowerShell, a brief passed as a quoted `"@<full path>"`; `review-ledger run -- pi …` not covered).

**The owner's work machine after the land:** drop his local launch branch (it takes R-1044; R-1125 now carries that launch);
`git -C "$HOME/nana-pi" pull`; `node "$HOME/nana-pi/packages/nana-setup/bin/nana-setup.mjs" install`;
one file edit, a `roster` block in `<agent dir>\nana-pack.json` with his gateway's name where the repo shows `example-gateway` (scout
luna medium, builder luna high, reviewer sol, `"land": null`); check it with the roster command; build and review with
`node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs"` and `…/pi-review.mjs` until the PATH lane links them. No work name enters the repo.

## 4. Scope
**In.** Code (four files, budget five): `packages/nana-pack/bin/` `worker-config.mjs`, `pi-worker.mjs`, `nana-roster.mjs` (new),
`pi-watchdog.mjs`. Tests: `nana-roster` (new), `win32-launch` (new), `worker-lane`, `templates-render`, `requirements-tree`. Text:
`nana-soul.md`, the shared file, `AGENTS.md` (Support line, region, `:66`, Layout), root `README.md` and nana-setup `README.md`
(Support line only), pack README, `REQUIREMENTS.md`, the tree, the code map, HANDOFF and session entry before the final round, the corpus.
**NOT.** `pi-review.mjs` (its launch is the watchdog's), `review-ledger.mjs`, `review-round.mjs` (§6 item 15), `nana-land.mjs`,
`lib/win-command.mjs` and `lib/win-command-config.mjs` (`findPi` used as landed; the launchers need no `winCommand`), the watchdog's
`cpuSeconds` and `killGroup`, `packages/nana-setup/lib`; the pi.dev managed install (§6 item 12); the PATH links for the launchers
(the queued PATH lane); desk code and README (`apps/desk/README.md:272-273` covers unknown keys); `scripts/test.mjs`; shared memory;
`@AGENTS.md`; downstream repos. Never a merge, `tools` override, project roster, seed or fallback, nor a committed work name or
gateway URL.
**Expected conflicts with `feat/process`:** the shared Working-pattern list and its `AGENTS.md` copy (process inserts after "Review
ladder", this lane before "Project-specific overrides"; INFERRED clean); SUB-019; `worker-lane.test.mjs:85-90` (process's R-1110);
`checkInstructionContracts`; R-291's literal at `requirements-tree.test.mjs:38`, `:52`, `:53`; the tree; the pack README. Process's
`pi-review.mjs` edit and R-1105 are untouched here, and its POSIX `immutable-review` titles stay green because the launch change is
win32-only.
**Expected conflicts with `feat/fresh-install` (`454a801`):** R-291's literal at the same three lines (it moves 1,088 → 1,092) and the
tree; its nana-setup README edits sit away from the Support line (`:374`; INFERRED clean). At rebase R-291's literal becomes the
base's leaf total plus nine, whichever lanes landed first (§2).

## 5. Verification
Exact titles under `// req:` lines, frozen in `seat-titles.mjs`; DONE = `0 missing` (29 new, 2 refits, 1 renamed); phrases normalise CR.
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
  line. `requirements-tree.test.mjs`: R-291's "…leaf counts total <base>" → the base plus nine ("1,100" → "1,109" after process alone;
  "1,104" → "1,113" if fresh-install lands first too).
- `win32-launch.test.mjs` (new; six-tag header; imports `pi-watchdog.mjs`'s namespace through `pathToFileURL`, so a missing
  `piLaunch` fails each forced title, not the file). **Every leg, forced win32** with an injected env, `exists`, `isFile`,
  `readText` and `execPath` over one file map keyed without case, as NTFS looks names up; every path `path.win32`. R-1125: "win32
  launch runs the npm pi package's bin entry with the running node and the arguments unchanged" (PATH `C:\a;C:\npm`, only
  `C:\npm\pi.cmd` and its package exist → `command` is the injected execPath; `args[0]` is the literal
  `C:\npm\node_modules\@earendil-works\pi-coding-agent\dist\bundle\cli.js`, the one literal pin of `PI_PACKAGE` and `PI_BIN_NAME`;
  then piArgs unchanged, values holding LF, CRLF, `%`, `!`, `"` and a trailing `\`; also `PI.CMD`, a string `bin`, a `.bat`, and
  `C:\p\node_modules\.bin\pi.cmd` and `C:\p\Node_Modules\.BIN\pi.cmd` → the entry under that folder's `node_modules\<PI_PACKAGE>`);
  "win32 launch starts a pi.exe directly" (`C:\npm\PI.EXE` on disk → `command` equals `findPi`'s return for the same PATH,
  `C:\npm\pi.exe`, args unchanged); "win32 launch refuses with a named reason when pi, its package, its bin or its entry is missing"
  (each case is the valid fixture with exactly one defect, and each asserts its own reason fragment, built from the constants by
  name: no pi → `pi is not on PATH`; Volta-, pnpm- and pi.dev-shaped `pi.cmd` with no package → the reason naming all three; a wrong
  `name` with a valid bin and an existing entry; invalid JSON; no bin; bin `..\..\..\evil.js` with `C:\npm\evil.js` present as a
  file; a missing entry; an entry that is a directory); "non-win32 launch is pi by name with the arguments unchanged" (`darwin`,
  `linux`). **Windows leg only** (printed SKIP elsewhere). Fixture: a fake package named `PI_PACKAGE` (imported by name), `bin
  {"pi": "dist/bundle/cli.js"}`, whose entry appends `{execPath, entry, argv, ppid, cwd}` to a record, may spin busy, then prints
  `VERDICT: LAND`. npm packs it and installs the tarball through `process.execPath` and `npm_execpath`
  (`pi-registration.test.mjs:319-325`): `install --global --prefix "<tmp>\nana pi prefix &()" --offline --ignore-scripts <tgz>`,
  which writes `pi`, `pi.cmd`, `pi.ps1` and the package. The prefix goes first on PATH; HOME, USERPROFILE, TEMP and an empty
  `PI_CODING_AGENT_DIR` sit in the test's temp dir. Each title first checks that `findPi` returns `<prefix>\pi.cmd`. R-1125 and
  R-1124: "Windows: lane pi-worker prints the builder line and starts the npm-installed pi entry with node and the lane argv"
  (`execPath` the test's node; `entry` the installed `cli.js`; the lane argv from `LANE_DEFAULTS` by name, preamble and brief paths,
  the fixed instruction, `--name`; `ppid` the pi-worker child's pid, nothing between). R-1125: "Windows: non-lane pi-worker hands pi
  line breaks, %, !, quotes and a trailing backslash unchanged"; "Windows: pi-review hands the review standard to pi as text"
  (`--tree` a temp repo that commits one file as `100755` through `git update-index --chmod=+x`; caller `-- --provider p --model m
  -p` with a two-line brief; the recorded argv holds the brief, the immutable sentence, `prompts/review-standard.md`'s bytes, then
  `--name`; exit 0; it prints `INFO Windows pi-review revision: <revision>` from the test's ledger); "Windows: a busy pi is not
  stopped as stalled" (`--stall-secs 3 --poll 1`, 12 s spin → exit 0, no STALL line); "Windows: a pi.cmd with no npm package beside
  it starts nothing and leaves no capture directory" (a Volta-shaped `pi.cmd` first on PATH → exit 1, `pi launch refused` with the
  named reason, no record, no `pi-review-*` dir in the test's TEMP); "Windows: lane pi-worker starts pi from a short or differently
  cased worktree path" (sol r2 SHOULD: the worktree sits under a long-named folder; one launch from its long path with the drive
  letter and one folder's case flipped, one from its 8.3 short path read through PowerShell's `Scripting.FileSystemObject`
  `ShortPath`; each exits 0 with the lane argv; when the volume keeps no short name, the short launch prints SKIP naming why and the
  case launch still runs).
- **Windows reds before the change.** The builder commits `win32-launch.test.mjs` before the code, together with the three sealed
  constants `PI_PACKAGE`, `PI_BIN_NAME` and `NPM_DIRS` in `worker-config.mjs` (provenance and `@outputs` included), and pushes it to
  the draft PR. With the constants present, the fixture's named import links and `npm pack` gets a package name, so no title reds on
  the fixture or the `findPi` precondition. That run's Windows leg must show all ten titles FAIL, each for a named cause: `piLaunch`
  missing, `spawn pi ENOENT`, `cwd is not the repository root`, or no `pi launch refused` line. The seat records those lines in the
  corpus.

**Wrong code first.** Each pair edits code or text, never an assertion, and must red exactly the named titles; pair 40 and K7 red
more: pair 40's set is listed by title, K7's by file, and the seat's runner records K7's titles. Shared-text pairs edit
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
- R-1125 → entry title: 40 win32 returns `pi` by name, no `findPi` (also reds the `.exe` and refusal titles); 41 retune
  `PI_PACKAGE`; 42 take the package folder from `%APPDATA%\npm` or the cwd, not the shim's folder; 43 run the `.cmd` through
  `winCommand` and ComSpec; 44 ignore a string `bin`;
  45 drop the `.bin` layout. → `.exe` title: 46 start a `.exe` through node. → refusal title: 47 drop the name check; 48 drop the
  containment check; 49 drop the entry-file check; 50 fall back to `pi` on a refusal.
- R-1126 → its title: 51 delete the pi-review launcher command; 52 `"$HOME/` → `~/` in the pi-worker launcher command.
- Kept clauses. K1 delete the `:91` refusal → "lane mode refuses all caller pi arguments before lock or spawn", "lane refuses caller
  tools without edit and write", "lane refuses tool-control forms …" and "lane refuses resource-disabling forms …". K2 delete the
  retries refusal → "lane refuses retries before launch". K3 brief before preamble → "verified lane passes preamble and validated brief
  as ordered file paths". K4 alter the fixed instruction → refit title. K5 add a bare `nana-roster.mjs` to bullet 1 → R-598's "checkout
  shared-section claim paths resolve" and the four "… all declared skill paths resolve independently" (INFERRED; launch run confirms).
  K6 restore "the review and builder launchers are unavailable" in `AGENTS.md` alone → R-684's title. K7 apply the win32 launch on
  every platform → "verified lane passes preamble and validated brief as ordered file paths", "pi-worker runs a worker under the
  watchdog (exit 0, output written)", "non-win32 launch is pi by name with the arguments unchanged", and every other POSIX title
  that starts the stub `pi` through pi-worker or pi-review: the rest of `worker-lane`'s, and those in `immutable-review`,
  `handoff-writer-role` and `review-ledger`.
- **Windows-only clauses.** The real spawn (argv through `CreateProcess`, pi as the child and its CPU), a refusal leaving no capture
  dir, and the native lane path have no pair the seat can red on this Mac. Their reds are the tests-first run above, and the triage
  holds the spawn and 8.3 reds (:463-469); their passes are the Windows leg on the reviewed tip.

**Seat acceptance, before and after the build.** Titles `0 missing`; pairs 1–52 and K1–K7; one `shall` per new row; shared file,
region, nana-soul and `shared-text.proposed.md` bullets match; the three Support lines equal R-684's canonical line; empty merge-base
diff on `pi-review.mjs`, `review-ledger.mjs`, `review-round.mjs`, `nana-land.mjs`, `lib/win-command.mjs`,
`lib/win-command-config.mjs`, `packages/nana-setup/lib`; no `winCommand` in `pi-watchdog.mjs`; no work name shared memory holds in any
committed file, the corpus included; no `reference_roster` in `AGENTS.md`; the roster command prints `source: default` on this Mac and
`land: seat` with a temp roster; a lane launch with a stub pi prints `pi-worker: builder: openai-codex gpt-6-luna high; source:
default`, and with a temp roster names that file; a non-lane `pi-worker` with a stub pi and a malformed roster exits 0; the
tests-first run's ten Windows reds are on record; on the draft PR's CI run of the reviewed tip, the Windows leg shows PASS for the six
Windows titles (lane and non-lane pi-worker, pi-review, the busy pi, the refusal, the alternate path) and the four forced-win32
titles, and the seat records the INFO revision line (§6 item 15) — a non-blocking leg, so the seat reads these lines before land; `npm
run test:locked`, `map:check`, `readme:check`, `node scripts/requirements-tree.mjs --check`; the install check (`node
packages/nana-setup/bin/install-check.mjs`) before `nana-land`. If a Windows title fails, the builder reports BLOCKED with the log
lines; the seat fixes it within the fifth code-file slot or narrows the Windows claims (Support line, shared bullet, pack README) to
what passed. No Windows claim lands that the leg did not show.
**The claim most likely to be wrong:** that a Windows seat, once the launch works, can carry a lane through land. pi-review's snapshot
takes each file's mode from its owner-x bit (`review-round.mjs:223`; by design, `review-ledger.test.mjs:762`), and Node on Windows
reports no execute bit (INFERRED from libuv's stat). A reviewed tree holding a `100755` file would then record a `<sha>+snap:<hash>`
revision, and `nana-land` accepts only a LAND at a plain SHA (`nana-land.mjs:91`); nana-pi holds nine such files. The pi-review
Windows title's INFO line decides it; if it shows `+snap`, §6 item 15 becomes a named carry and the pack README's Windows paragraph
says so. Next most likely: that Windows delivers LF, `"` and a trailing `\` byte for byte (VERIFIED from libuv's quoting and
Microsoft's argument rules, not yet observed); the non-lane Windows title decides it.

## 6. Residuals and open questions (each becomes one HANDOFF line; no YOUR CALL for the owner in this lane)
1. **Open for the owner (work machine):** `git config --get core.symlinks`, `type CLAUDE.md` in the clone; a 9-byte stub = nana-soul only.
2. **Residual — Windows evidence is a fake pi.** The leg proves the launch with a fake pi package that real npm installs; no real pi
   has run a lane or review through this code on Windows. The owner's seat ran the same approach on his work machine (a worker returned
   READY, exit 0): real-machine evidence for the design, its details INFERRED. That a Windows seat obeys the rule after the land stays
   INFERRED.
3. **Residual — BOM elsewhere.** Doctor (`steps.mjs:606`) and `adoption.mjs:94` strip no BOM: a BOM-saved file fails doctor only.
4. **Seat decision — roster home.** A `roster` block in the user-scope `nana-pack.json`, not a seeded file, and the seat passes reviewer
   and land models from the roster command, `pi-review` unchanged: a seed cannot carry a per-machine provider and never merges
   (`fsops.mjs:114-126`), and a roster-reading `pi-review` collides with process's edits. Both ideas were the seat's, not the owner's ruling.
5. **Residual — model typo.** A typo under a known provider runs as a custom id with only a warning (`model-resolver.js:441-455`); the
   builder line (R-1124) shows it on every lane launch; pi-review's models are the seat's own typed arguments.
6. **Residual — desk.** The frozen desk's settings editor refuses to save a user file holding `roster`, as for `objective` today.
7. **Residual — non-lane.** No row pins that non-lane pi-worker reads no roster; only the seat's acceptance checks it.
8. **Residual — Windows test files.** `worker-lane.test.mjs` still fails on the Windows leg (its POSIX `sh` stub); the Windows evidence
   is `win32-launch.test.mjs` and `nana-roster.test.mjs`.
9. **Carry — downstream.** Projects get the two bullets when their region is refreshed (process lane's carry 7 names them).
10. **After the land, a seat memory edit:** `reference_roster.md` points at the roster command; the seeded-file wording is marked the seat's.
11. **The owner's option, no repo change:** `"land": null` on this Mac drops astra and saves tokens the same way.
12. **Carry, top — the pi.dev managed install.** pi's README lists it first for Windows. A `pi update` that updates an npm install
    advises migrating to it after its "Updated pi from X to Y" line; an up-to-date or failed run prints nothing (pi 1.0.2
    `package-manager-cli.js:952-963`, VERIFIED). After a migration the launchers refuse, named. Support is a
    second locator (`<agent dir>\install\managed-install.json` → `install\releases\<current-version>\node_modules\<PI_PACKAGE>`, same
    bin rule) plus `PI_MANAGED_INSTALL_ROOT` in the child env, as pi's launcher sets. Out of this lane: the owner's machine runs npm, and
    the Windows leg cannot install it without the network.
13. **Note — no console window.** libuv v1.x starts a `detached` child with `DETACHED_PROCESS`, so pi gets no console (libuv
    `src/win/process.c:1128`; Microsoft, "Process creation flags"); Node's doc sentence (`child_process.md:920-923`) does not hold here.
14. **Carry — PATH links.** The queued PATH lane links pi-worker and pi-review on Windows; until then seats use the `node "$HOME/…"` form.
15. **Carry (likely) — Windows reviews may not land.** The §5 claim most likely to be wrong: on Windows a reviewed tree holding a
    `100755` file may record a `+snap` revision that `nana-land` does not accept. The fix belongs to `review-round.mjs` (mode from the
    index where the filesystem has no execute bit), a review-boundary module outside this lane. The INFO line decides whether it is real.
16. **Residual — other Windows installs.** A pnpm global install and Volta 2.x (`.cmd` shims since 2.0.0, 2024-08-11) are refused,
    named; a pnpm project's `node_modules\.bin\pi.cmd` may be accepted (INFERRED, §3). Volta 1.x through 1.1.1 (2023-01-25) made
    `pi.exe` a symlink to `volta-shim.exe`: findPi accepts it, the launcher starts it directly, and the watched process is the shim
    (Volta v1.1.1 `shim.rs`, VERIFIED; its flat CPU while pi works INFERRED; not handled). An npm alias install
    (`npm i -g pi@npm:@earendil-works/pi-coding-agent`) puts the package under `node_modules\pi` and is refused with the no-package
    reason, which does not name it. The launcher runs pi on the Node running it, where npm's shim prefers a `node.exe` beside it; the
    two match for the Node installer (its prefix holds no `node.exe`, VERIFIED) and nvm-windows (one prefix per Node version, beside
    the active `node.exe`; the match INFERRED). A command line over 32,767 characters fails at spawn (VERIFIED, Microsoft's
    `CreateProcessW` page); a quoted `"@<full path>"` carries a brief of any size (§3).
17. **Open for the owner — his local launch branch.** It takes R-1044 for the same launch; this lane does not use R-1044, so he drops that
    branch before pulling main.
18. **Residual — a refusal is retried.** A launch refusal counts as a failed attempt, as today's `spawn pi ENOENT` does: pi-review's
    default three attempts print it three times, both launchers write it to `--out`, and both end "FAILED after N attempt(s)
    (endpoint likely in a bad stretch)". No regression; stopping early needs a pi-review edit, which this lane does not make.
19. **Residual — `review-ledger run` on Windows.** It starts its command by name with no shell (`review-ledger.mjs:88`), so
    `review-ledger run -- pi …` still fails with `spawn pi ENOENT`; R-1125's evidence note and the pack README's Windows paragraph
    say so (R-729 unchanged).

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
   (Items 1 and 4 are superseded for the launch mechanism by the Node-entry amendment below.)

## Plan review r2 (2026-10-13)
sol r2: LAND 9/10, no MUST; one SHOULD, a Windows test that launches from an explicitly alternate short, long or differently cased
path. Folded in by the amendment below (item 11).

## Seat amendment (2026-10-13): Node entry
The owner's ruling: "Yes switch, but go through plan review" (2026-10-13). Windows evidence: his Claude Code seat's photographed diagnosis
(pi-worker failed twice with `spawn pi ENOENT`; npm installs `pi`, `pi.cmd`, `pi.ps1` and no `.exe`; a direct `pi` works; `shell: true`
breaks the multi-line brief), and his seat's local run of the same approach (a worker returned READY, exit 0; details INFERRED).
1. R-1125 rewritten: on win32 a `.cmd`/`.bat` pi starts as `process.execPath` plus its npm package's `pi` bin entry, arguments unchanged.
2. R-1125 also starts a `.exe`/`.com` directly, refuses with a named reason and starts nothing, and keeps the native lane path.
3. Win32 only: POSIX installs already make pi the child; one rule everywhere would refuse pnpm and managed installs there (§3).
4. Dropped: the prompt-file move, its `@` hint and `captureDir` (§3).
5. Dropped: `winCommand`, ComSpec and the refused characters in the watchdog, and the `options` spread (§3).
6. Dropped: `treeCpuSeconds` and its `Get-CimInstance` query; today's `Get-Process` CPU poll stays, since pi is the child (§3).
7. Dropped: process's R-1105 reword; node carries the multi-line standard intact (INFERRED; the Windows leg decides) (§2).
8. Dropped: residual 12's refused characters and the README's refused-character list; the 32,767-character limit stays in residual
   16, and `@<path>` returns only as the README's PowerShell line (§3, §6).
9. Added: `PI_PACKAGE`, `PI_BIN_NAME` and `NPM_DIRS` in `worker-config.mjs`, with contract provenance (§3).
10. Added: npm's `.bin` layout beside the global one, as the owner's local resolver does (INFERRED detail; bin-links `bin-target.js`).
11. Added: sol r2's SHOULD as the sixth Windows title, a lane launch from a short or differently cased worktree path (§5).
12. Added: a tests-first Windows run whose ten reds go on record before the code (§5).
13. Changed: a refusal is decided before the capture dir exists, so nothing needs removing (§3).
14. Changed: R-684's canonical Support line scopes the Windows launchers to an npm-installed pi (§2).
15. Changed: forced-win32 titles rewritten (four); Windows titles now run a real npm install of a fake pi package (six) (§5).
16. Changed: pairs 40–50 replace 40–47; the R-1126 extras become 51–52; K7 adds the non-win32 title (§5).
17. Changed: the claim most likely wrong is now Windows reviews landing; it becomes carry 15 if the INFO line shows `+snap` (§5, §6).
18. Residuals: managed install as the top carry (12), the console-window note (13), other installs (16), the owner's branch (17).
19. Not taken: the research's split into R-1125, R-1129 and R-1130, which would make eleven rows against the nine-row budget.
20. R-1125 keeps one `shall`; its status is its weakest clause, the Windows-leg titles.
21. Unchanged: nine rows R-1120–R-1128, four code files, tree 1,100 → 1,109 after process and 1,088 → 1,097 on main.
22. Fact-check X17: the console-window decision and its question for the owner are dropped; `DETACHED_PROCESS` gives pi no console (§6 item 13).
23. Fact-check X18: `-p "$(cat brief.md)"` fails in PowerShell; the pack README's Windows paragraph names a quoted `"@<full path>"` (§3).
24. Fact-check X13: Volta 1.x through 1.1.1 made `pi.exe` a symlink to its shim; `.cmd` shims arrived in 2.0.0 (§6 item 16).
25. Fact-check X10: only a `pi update` that updates an npm install advises migrating; other runs print nothing (§6 item 12).
26. Fact-check X9 and repo WRONG 3: the entry check is piLaunch's own `statSync(entry).isFile()`; findPi keeps its private default (§3).
27. Fact-check X16: a pnpm project's `.bin` shim may be accepted (INFERRED); only a pnpm global install is refused (§1, §3, §6 item 16).
28. Fact-check X2: an npm alias install is refused with a reason that does not name it (§6 item 16).
29. Fact-check X6 and X8: argv carriage and the 32,767-character limit are VERIFIED from source; the Windows leg observes the
    first (§2, §3, §5).
30. Repo WRONG 1: four test files start a stub `pi` through the watchdog, not six; they are named (§3).
31. Repo WRONG 2: `research-node-entry.md` and both fact-checks are copied into this folder (header).
32. Repo WRONG 4: the tests-first commit carries the three sealed constants, so each Windows red shows a named cause (§5).
33. Repo WRONG 5: pair 40 and K7 red more than their named titles; pair 40's set is listed by title, K7's by file (§5).
34. Repo GAP 6: each refusal case is the valid fixture with one defect, and each asserts its own reason (§5).
35. Repo GAP 7: a refusal still counts as a failed attempt; declared as residual 18, not changed (§3, §6).
36. Repo GAP 8: the watchdog's six-tag header changes are named; `piLaunch` stays in the watchdog under the four-file budget (§3).
37. Repo GAP 9: the `.exe` title compares against findPi's lowercase return; the `.bin` match ignores case, with a flipped-case
    fixture (§3, §5).
38. Repo GAP 10: `review-ledger run -- pi …` is named as not covered in R-1125's note, the pack README and residual 19 (§2, §3, §6).
39. Repo GAP 11: fresh-install joins the expected conflicts; R-291's literal becomes the base's leaf total plus nine (§2, §4, §5).
40. Repo GAP 12: item 8 is reworded; residual 16 keeps the 32,767-character limit, and `@<path>` returns as the PowerShell line (§6).
