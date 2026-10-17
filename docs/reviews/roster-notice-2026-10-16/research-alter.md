# Research: how a user changes the roster, and what the start-up notice must say

Main at 2dbc817, 2026-10-16, read-only. Tags: `file:line` = read at 2dbc817; "Ran" = run on this Mac in this session; INFERRED = not read or run. Memory files are cited by name and line; they are machine-local, not repo facts. Probes: `probe/malformed-probe.mjs` and `probe/notice-probe.mjs` beside this file (both write only to temporary folders they delete).

**Stakes.** Medium and reversible for the notice text. If the lane adds a command that writes the roster, it becomes high-blast: that file also holds the user's gate block.

## 0. Answer in six lines

1. Today a user changes the roster only by hand-editing the user-scope `nana-pack.json` (`packages/nana-pack/README.md:216-222`). No nana-setup step, doctor row, desk form or pi command shows or changes it. The roster command prints it, and only the pack README says how to change it.
2. A shape slip refuses only the roster. A JSON syntax slip does three things (Ran):
   - it refuses the roster;
   - it stops every gated tool at pi's next fresh start;
   - it silently drops the user's objective path in both seats.
3. Recommended notice: the roster by model and thinking, with no providers. Then end on one pointer, `change: "roster" in ~/.pi/agent/nana-pack.json`, at every start in both seats. Show a refusal only up to its first ` (`, because the text inside the parentheses can quote provider names (Ran).
4. A one-command `set` is the only true one-step change. It is also the first nana command that would rewrite the gate's policy file, and the gate cannot see it (Ran). Recommend shipping the notice with the file pointer now and `set` as its own small lane, guarded by `PI_SESSION_ID` / `NANA_ROLE`. Whether users need one command at launch is the owner's call (§9).
5. Never show:
   - providers;
   - host names;
   - absolute home paths;
   - raw JSON-parse text;
   - the owner's name or work context in anything the lane commits.

   Model ids are safe when they are public names. A private provider's own model ids are unknown (residual).
6. Name the builder for each lane size only when the roster holds two builders. A pi seat shows a Claude Code builder as `sonnet (Claude Code only)` and never quietly swaps in another builder. The seat asks the user, which honours the owner's request for a configurable lineup.

## 1. Every way to see or change the roster today

### 1.1 Where the roster lives

- One file per machine: `<agent dir>/nana-pack.json`. The agent dir is `PI_CODING_AGENT_DIR` when set, else `~/.pi/agent` (`packages/nana-pack/lib/agent-dir.mjs:67-77`, `packages/nana-pack/bin/nana-roster.mjs:98-99`).
- On Windows the home is `os.homedir()`, so the default is `%USERPROFILE%\.pi\agent\nana-pack.json` (INFERRED from Node's documented `os.homedir()`; not run on Windows). A win32 shell-style `PI_CODING_AGENT_DIR` is normalised (`agent-dir.mjs:30-36`).
- The `roster` key shares the file with `gate`, `objective`, `postEdit`, `notify`, `journal`, `handoff` and `receipts` (`packages/nana-pack/lib/config.ts:238-246`). The gate's schema has no `roster` key, so the gate never reads the roster (Ran: a bad roster shape left the gate's patterns applied).
- This Mac's file holds only `objective`, so the roster is the sealed default (Ran: `cat ~/.pi/agent/nana-pack.json`; Ran: `nana-roster.mjs` printed `source: default`).

### 1.2 Seeing it

| Surface | Claude Code seat | pi seat | macOS / Windows | What it shows |
|---|---|---|---|---|
| `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"` | yes, through Bash | yes; the gate lets it through (Ran: `commandPolicyHit` → no hit) | Not on PATH on either OS (`packages/nana-setup/lib/steps.mjs:683-688` links pi-review, pi-worker, nana-land and nana-setup only). The `$HOME` form works in bash, zsh, Git Bash and PowerShell, not cmd (INFERRED). | Every slot with provider, model and thinking, then `source:` (`nana-roster.mjs:119-127`); refusal on stderr, exit 1 (`:129-134`). Named in `templates/_shared/working-under-nana-pi.md:30`, `nana-soul.md:48`, `AGENTS.md:98` and `packages/nana-pack/README.md:216`. |
| Lane launch line | when the seat runs pi-worker | same | both | The builder only, `pi-worker: builder: <provider> <model> <thinking>; source: …` (`packages/nana-pack/bin/pi-worker.mjs:96-99`, R-1124). |
| The file itself | any editor, or Claude's Read | pi's `read` tool is not gated (`packages/nana-pack/README.md:593`); `cat` through bash is a floor hit (Ran: `commandPolicyHit("cat ~/.pi/agent/nana-pack.json")` → `/\.pi[/\\](agent[/\\])?nana-pack\.json/i`) | both | Raw JSON. With no `roster` key, the defaults are invisible. |
| `nana-setup state` | yes | yes | Same command on Windows; nana-setup is not linked there (`steps.mjs:683`). | Path only: `pi pack config  durable  nana-setup  <absolute home path>/…/nana-pack.json  present` (Ran; `packages/nana-setup/lib/state-manifest.mjs:48`). |
| `nana-setup doctor` | yes | yes | both | `✓ pi nana-pack.json <path>`: present and parseable, nothing about the roster (Ran; `packages/nana-setup/lib/doctor.mjs:444-445`). It parses with no byte-order-mark strip, so a BOM file reads ✗ even though the pack and roster read it fine (`steps.mjs:605-611`; `HANDOFF.md:62`; Ran: `JSON.parse("\ufeff{}")` throws). |
| Desk settings | — | — | macOS service | Does not show the roster. Its form covers gate, postEdit, notify, journal and handoff (`apps/desk/public/app.js:2183-2190`). |
| pi footer | — | `nana-pack ✓` only | both | `packages/nana-pack/extensions/nana-lifecycle.ts:47`. |
| Claude memory `reference_roster.md` | Claude seat only, this machine only | never (pi has no shared auto-memory: `AGENTS.md:76`) | — | The 10-13 builder split (`reference_roster.md:21-24`), which the file cannot express. |

No surface shows the roster at session start (`continuity/inventory.md` §2/§7, per `factcheck-repo.md`).

### 1.3 Changing it

| Route | Claude Code seat | pi seat | Notes |
|---|---|---|---|
| Hand edit, any editor outside pi | yes | yes | The only documented route (`packages/nana-pack/README.md:216-222`). A roster replaces every slot whole, with no merge (`:218`). Nothing seeds it (`:216`). The example uses a placeholder provider (`:221`). |
| Claude's Edit/Write tool | Claude Code's own permission flow only; the Claude seat has no nana gate (`AGENTS.md:75`, "No nana command gate") | — | Same JSON-slip risk as a hand edit. |
| pi edit/write tool, or bash naming the file | — | Floor hit: `Block / Allow once` with a UI (`packages/nana-pack/extensions/nana-gate.ts:343-350`); headless runs block it (`:336-338`) | The floor covers `nana-pack.json` in the active and default agent dirs (`packages/nana-pack/README.md:510-525`). |
| pi user `!` command | — | Not gated: the pack registers no `user_bash` handler (Ran: `git grep user_bash packages/nana-pack` → nothing; pi `docs/extensions.md:127`) | Interactive editors probably fail there, because `!` output is captured, not a terminal (INFERRED from pi `dist/core/bash-executor.js`). |
| Desk save | refuses a file holding `roster` | same | `NANA_PACK_KEYS` lacks `roster` and `objective` (`apps/desk/server.mjs:1385`, `:2358-2359`; `HANDOFF.md:62`). The desk is frozen (project memory). |
| nana-setup | Install seeds `{"objective":{"projectFile":"OBJECTIVE.md"}}` only when the file is absent (`packages/nana-setup/pi/nana-pack.seed.json`; `packages/nana-setup/README.md:48`). | same | It never overwrites the file (`packages/nana-setup/README.md:270-272`). It has no roster step. Seeding a roster block was proposed and dropped in the roster lane (`reference_roster.md:26`). |
| Switching `PI_CODING_AGENT_DIR` | swaps the whole file | same | A blunt tool: it also moves auth, settings and trust (`agent-dir.mjs:67-77`). |
| Per-launch override | pi-review takes the models the seat passes; it reads no roster (`packages/nana-pack/README.md:224`) | same | Lane mode refuses caller pi arguments (R-961, `REQUIREMENTS.md:341`). |
| The Claude seat's Sonnet builder | Chosen from memory (`reference_roster.md:22`), not the file | cannot launch it | So editing the file does not change who builds larger lanes on the Claude seat today. |

## 2. What a hand edit risks (Ran: `probe/malformed-probe.mjs`, `PI_CODING_AGENT_DIR` pointed at a temporary folder)

| Mistake | Roster command | Lane launch | pi gate at a fresh start | pi gate mid-session | User objective path |
|---|---|---|---|---|---|
| Builder missing `thinking`, thinking typo `hihg`, extra key `claudeBuilder` | refused, exit 1, names slot and field (Ran) | refused before lock or spawn (`pi-worker.mjs:96-97`; R-961) | unaffected: patterns kept (Ran) | unaffected | unaffected |
| Trailing comma after the roster block | refused: `invalid JSON (…)` (Ran) | refused | **STOP**: every bash, powershell, edit and write blocked until the file parses (Ran: `stopReason` set; `config.ts:316-318`, `:511-514`; `nana-gate.ts:314-317`) | last valid policy kept (`config.ts:506-510`) | **dropped to null**, so both seats' objective falls back (Ran: `loadUserObjective()` → `"path":null`, versus the path when valid) |
| BOM plus CRLF | accepted (Ran) | ok | ok (Ran) | ok | ok; doctor reads ✗ (`steps.mjs:605-611`) |
| A Claude model as the pi builder (`<a provider of Claude models> sonnet`) | accepted (Ran) | starts pi with that provider, which should fail, because this Mac's pi lists no Claude model (Ran: `pi --list-models` → 10 models, 0 Claude; the failure itself is INFERRED) | ok | ok | ok |
| An older checkout meeting a newer key (`claudeBuilder`) | refused: `roster has an unexpected field claudeBuilder` (Ran) | refused | ok | ok | ok |

More hand-edit risk:
- The stop message says `user nana-pack.json gate block is malformed`, even when the slip was in the roster (`config.ts:346`; Ran: probe output). Its problem text, `invalid JSON (…)`, does name the cause.
- Recovery is a repair "with any editor outside pi" (`AGENTS.md:138`; `packages/nana-pack/README.md:433-436`; `nana-gate.ts:317`). A repair lifts the stop live (`packages/nana-pack/README.md:425-426`).
- Windows PowerShell 5.1 `Out-File`/`>` writes UTF-16LE. The readers decode UTF-8, so that file would read as invalid JSON and trigger the stop (INFERRED, not run).
- The pack README's roster section never says that a syntax slip there stops the gate (`packages/nana-pack/README.md:214-224`). That is a doc gap.

## 3. Options for "change it in one step"

| Option | Cost | What it earns | Malformed-config and outside-pi check | Verdict |
|---|---|---|---|---|
| **A. The notice names the file** | One pointer segment. It reuses `tildeify` (`packages/nana-setup/lib/paths.mjs:101-104`; a second copy is `packages/nana-knowledge/lib/paths.ts:30-33`; same import layer, `code-map.config.json` "packages"). | Users learn where the roster lives at every start, in both seats, on both OSes. The next start's notice acts as the check, because a refused roster shows there. | Hand edit, so the §2 risks stay. Edits happen outside pi by default. One step when a roster block exists. A first edit needs the block shape from the README. | **Ship in the fleet lane.** |
| B. A paste-ready `--json` print from the roster command | 1 flag, 1 row, about 2 tests | First edit becomes "paste, change one value" | Same slip risk as A | Cut: C covers it if C is built; the README example covers it if not. |
| **C. `set <slot> <provider> <model> [thinking]` / `set <slot> none`** | A new module (one purpose), CLI dispatch, about 4 rows and 8 tests (INFERRED estimate), README text in the pack | True one step. Valid JSON by construction. The shape is checked before writing by the existing `validateRosterShape` (`nana-roster.mjs:77-91`). | Needs care: it writes the gate's policy file, and the gate cannot see it (Ran: `commandPolicyHit('… nana-roster.mjs" set land none')` → no hit; README `:591-593`). Guard below. | **Recommend as its own small lane next.** The owner's call whether it ships with the notice (§9). |
| D. `edit` (validate after the editor closes, like visudo) | Editor launch differs per OS: `$EDITOR`, `code --wait`, Notepad | Keeps the user's formatting | Whether Windows Notepad's store build blocks until close is unverified (INFERRED) | Reject: fragile across platforms. |
| E. A pi `/roster` command | One extension | — | Writes a floored file from inside pi, against the outside-pi rule (`AGENTS.md:138`) | Reject. |
| F. nana-setup seeds a roster block | Small | Edits become "change a value" | Freezes today's defaults into every machine. Already dropped in the roster lane (`reference_roster.md:26`; README `:216` "nothing seeds it"). | Reject. |
| G. A doctor roster row | 1 row | A second place a refusal shows | Read-only | Defer: the notice already reports a refusal at every start. |

**The guard that C needs (if built):**
1. **Refuse when `PI_SESSION_ID` or `NANA_ROLE` is set.**
   - pi injects `PI_SESSION_ID` into the model's bash and powershell tools and strips it everywhere else (pi `dist/core/tools/bash.js:135-150`; pi `docs/environment-variables.md:23-30,49`). The user's own `!` command therefore still works.
   - pi-worker sets `NANA_ROLE=worker` (`pi-worker.mjs:110`).
   - The Claude seat is allowed. Its Bash tool sets `CLAUDECODE` and has no TTY (Ran), and Claude Code's permission prompt applies.
   - Unsetting the variable on purpose is forgery, which is out of scope.
   - Rejected alternative: require a TTY. It also blocks the Claude seat and pi's `!`, and neither is a TTY (Ran for Claude; INFERRED for `!`).
2. **Refuse a file that is not valid JSON**, and say "repair it with any editor outside pi". The desk precedent is `readJsonForUpdate` (`apps/desk/server.mjs:1401-1405`).
3. **Refuse a symlinked or non-regular file.** A rename would replace the link (INFERRED).
4. **Keep every other top-level key deep-equal**, the gate block above all, and pin that with a test.
5. **Write a temporary file in the same folder, then rename**, with a `.bak` copy (precedent: the desk's `backupWrite`, `server.mjs:1387-1395`). On Windows a rename can fail with EPERM while another process holds the file; it fails closed (INFERRED).
6. **On a default roster, write all four slots and say so.** After that the machine no longer follows changes to the defaults (same as a hand edit, README `:218`).

Home and pointer for C:
- Home: `nana-roster set` keeps one name for one thing; the shared section already names that command (R-1126).
- On PATH: nana-roster is on PATH on neither OS. A queued Windows PATH lane exists (`packages/nana-pack/README.md:228`), and the POSIX link list is `steps.mjs:683-688`.
- Pointer: until `nana-roster` is on PATH, a runnable `set` line is about 70 characters, too long for the notice. Keep the notice's pointer as the file, and keep its text as one config value, so it can later switch to `nana-roster set …` with one value and its sealed test.

## 4. What the notice must say (recommended rules)

Measured with the real resolver (Ran: `probe/notice-probe.mjs`):

```
nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra · open lanes: regroup, regroup-shares · change: ~/.pi/agent/nana-pack.json          [170 chars]
nana active · roster (default): larger lanes sonnet (Claude Code only), small lanes gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra · open lanes: regroup, regroup-shares · change: ~/.pi/agent/nana-pack.json   [214 chars, pi seat with a split]
nana active · roster refused: roster.builder.provider must be a non-empty string with no whitespace or control character · change: <file>
nana active · roster refused: invalid JSON · change: <file>
```

1. **End every notice with the change pointer**: the `roster` key and the file, with the home folder shown as `~` through the existing `tildeify`. Wording is the lane's choice, e.g. `change: "roster" in ~/.pi/agent/nana-pack.json`.
   - Show it on every start in both seats. Branching on default versus custom costs a test and saves about 40 characters.
   - This is the owner's stated purpose (answer 3). CHANGE.md's line has no pointer (`CHANGE.md:76-77`).
   - Keep it as the last segment of one line, not a second line. R-1190 says one line, and how either TUI renders a line break is unobserved (INFERRED).
2. **Show a refusal only up to the first ` (`.** The validator echoes values: `(got ${JSON.stringify(v)})` (`nana-roster.mjs:67,71`). Node's JSON error quotes file text, e.g. `…"roster": <provider text>"…` (Ran). The cut removes both (Ran: the probe's refused lines). This corrects CHANGE.md R-1193 (`CHANGE.md:39`, "the file and the problem").
3. **Optional, for invalid JSON only:** add that pi's gate stops at its next start until the file parses. It is the one slip that reaches beyond the roster (§2). A Claude-seat user has no other warning about it.
4. **Mark the default roster `(default)`.** That is the nudge to set one's own. Under rule §5.1 the default line hides the default roster's provider, so a new machine without that login learns about it only at its first lane launch (residual, INFERRED).
5. **Use one word, `roster`.** It matches the file key the user edits and the command (`nana-roster`), so the user meets one name for one thing. "Fleet" and "lineup" are the owner's conversational words. This is a seat decision with low blast. CHANGE.md uses `fleet:`.
6. **The notice is the check.** It is shown only at session start, so a mid-session edit shows at the next start. A lane launch already prints the builder it actually uses (R-1124).

## 5. What the notice must never show

1. **Providers**, including inside a refusal (rule §4.2). They may name a private provider.
   - The Windows machine uses a private provider, and the seat's memory says its names stay out of any repo (`reference_roster.md:26`, paraphrased).
   - Separately, the owner's memory file for that machine asks that no project names or private network details from it enter the repo (`user_<owner>_windows_both_seats.md:15`, paraphrased).
   - The leak path: on the Claude seat the line enters the model's context (CHANGE.md R-1197), and a seat can copy it into HANDOFF, session notes or commits.
2. **Absolute home paths.** A macOS or Windows home path would expose the OS user name. Use `~` (rule §4.1). A `PI_CODING_AGENT_DIR` outside home still prints absolute (residual).
3. **Host or machine names.** Nothing in the roster carries one. The notice must not call `os.hostname()` (design rule; nothing reads it today, INFERRED from the CHANGE.md design).
4. **Raw JSON-parse text** (Ran, §4.2).
5. **The owner's name or work context** in anything the lane commits: fixtures, README examples, labels, review corpus. Use a placeholder provider (`feedback_public_repo_no_owner_identity.md:8,11`; README `:221` precedent).
6. **Model ids: show them.** They are the roster itself.
   - Public ids such as `gpt-6-luna` and `gpt-5.6-sol` are already in the public repo (`packages/nana-pack/bin/worker-config.mjs:14,32-33`).
   - The validator accepts any non-blank id (`nana-roster.mjs:64-68`). A private provider's deployment name could carry an organisation's word. The Windows machine's real ids are unknown and not visible from here (`user_<owner>_windows_both_seats.md:15`). This is a residual, not a reason to hide models.
7. **Unexpected key names** inside a refusal (`roster has an unexpected field <key>`, `nana-roster.mjs:85`) survive the cut. They are user-typed key names, which is low risk (residual).

## 6. Lane sizes, and a Claude builder on a pi seat

- **Name the builder for each lane size only when the roster holds two builders.** Use two fixed labels, `larger lanes` and `small lanes`; the wording comes from the 10-13 ruling (`reference_roster.md:22-23`).
  - With one builder, print `builder <model>`.
  - Never print the size rule itself. That belongs to the later rulings lane.
  - Reason: a pi seat never sees Claude memory, so the split is invisible there today (`AGENTS.md:76`).
- **A pi seat shows a Claude Code builder with `(Claude Code only)`** (Ran: the probe line).
  - pi cannot start a Claude Code subagent: no launcher exists (Ran: `git grep "claude -p\|'claude'" packages/nana-pack/bin` → nothing).
  - A headless `claude -p` builder would need isolation flags, and it loses its run when it backgrounds a command (`reference_claude_cli_headless_isolation.md:13-17,23`). That is a new launcher, out of scope.
  - Use info level, not warning. It is a configured state; a warning at every pi start teaches users to ignore warnings, so only a refused roster warns.
- **The pi seat must not quietly substitute another builder.** The owner rejected "luna builds every lane on a pi seat" in favour of a configurable lineup (owner answer 3).
  - The shared section therefore needs one sentence: a seat that cannot start the roster's builder for a lane asks the user, and it can point at the change pointer. This is a new row (INFERRED need).
- **Distinguish two meanings of a "Claude" entry:**
  - A pi entry whose provider serves Claude models runs through pi-worker from either seat when pi holds a key for that provider (pi `docs/providers.md:25-33`). This Mac's pi has none (Ran).
  - A Claude Code subagent alias such as `sonnet` (`reference_roster.md:22,32`) runs only from a Claude Code seat. The marker applies only to this second kind.
- **Dependency for the roster-shape decision (INFERRED):** CHANGE.md's `claudeBuilder` is a string slot for Claude only (`CHANGE.md:79-82`).
  - A pi-seat user then cannot name a different pi builder for larger lanes. Their only change is one builder for every lane.
  - The owner runs both seats on one Windows machine with one roster file (`user_<owner>_windows_both_seats.md:8`). If the owner wants larger lanes built by Sonnet from Claude Code but by a pi model from pi, the larger-lane slot must accept a pi entry, and pi-worker must be able to launch it.
  - Open question, §10.
- **After the lane, the Claude seat must take its larger-lane builder from the roster, not from memory.** Otherwise editing the file changes the notice but not the work (`reference_roster.md:22`). This needs shared-section or soul text plus the memory update CHANGE.md already plans (`CHANGE.md:120`).

## 7. Corrections to CHANGE.md that this topic implies

1. R-1193 (`CHANGE.md:39`) shows the raw problem and the absolute file path. Cut at ` (` and use `~` (§4.2, §5.2).
2. §3.1's example line (`CHANGE.md:76-77`) has no change pointer, the owner's stated purpose. Add one (§4.1).
3. The `CHANGE.md:77` claim "a seat that copies the line cannot leak a machine's provider" holds for the normal line only. As drafted, the refused line can leak one (Ran).
4. Residual 1 (`CHANGE.md:213`): an older checkout refuses a file with `claudeBuilder`. The notice cannot help, because the older checkout prints its own refusal. The README advice must say: pull, then edit (Ran: refusal text).
5. D2 (`CHANGE.md:206`), "luna builds every lane on a pi seat": replaced by the owner's answer. Use §6 instead (a marker, no quiet substitute, the seat asks).
6. Add a pack README sentence under Machine roster: a JSON slip in this file also stops pi's gate at its next start and drops the file's other settings (§2).

## 8. Candidate rows (IDs from the plan's range, R-1190 onward; one `shall` each)

- (amends R-1190) The fleet line shall name every roster slot holding an entry by its model and any thinking level, and shall contain no provider.
- (new) The fleet line shall end with a change pointer naming the `roster` key and the roster file's path, with the home folder shown as `~`.
- (amends R-1193) IF the roster resolver refuses the roster, THEN the fleet line shall show the refusal only up to its first ` (`, followed by the change pointer.
- (new, if a Claude builder slot lands) WHERE the seat is pi, the fleet line shall mark a Claude Code builder `(Claude Code only)`.
- (new) The shared working pattern shall state that a seat that cannot start the roster's builder for a lane asks the user instead of starting another builder.
- (new, README) The pack README's Machine roster section shall state that a JSON syntax error in the user-scope nana-pack.json stops pi's gate at its next start.
- Tests: a provider value, a JSON-parse quote and the home path must not appear in the line. Use distinct placeholder fixture strings; the probe in §4 shows the shape.

## 9. Decision point for the owner (candidate)

1. **What was tested.** Seven hand edits against a temporary pi folder, through the roster command and the pack's config loader.
2. **Result.** Four shape slips (including an older checkout meeting a new key) refused only the roster. One trailing comma refused the roster, stopped pi's gated tools and dropped the objective path. A Claude model in the pi builder slot passed the check but cannot start on this Mac.
3. **The trade.** Pointing at the file costs nothing new, but a typo there can stop pi. A `set` command makes the change one line and never writes broken JSON. It is, however, nana's first command that rewrites the file holding the gate's rules.
4. **Recommendation.** Ship the notice with the file pointer now. Build the guarded `set` command as the next small lane.
5. **Why it is the owner's call.** The owner set the notice's purpose, and `set` would change nana's stance of never rewriting the user's pi settings.

## 10. Unknowns and INFERRED claims

- **Most likely wrong:** that a refusal cut at the first ` (` removes every value. It holds for every problem string in `nana-roster.mjs:25-116` today (read). A future message that puts a value before ` (` would break it. Pin it with a test that iterates over the refusal kinds.
- How either TUI renders a 170–214 character line: unobserved. pi routes an info notice to a dim status line (pi `dist/modes/interactive/interactive-mode.js:2270-2279`). That line **replaces the previous status line** when nothing came between them (`:3060-3068`). At session start the pack sends only warnings (`git grep ui.notify`), but a third-party extension's info notice could overwrite the roster line (INFERRED).
- Windows:
  - `$HOME` in Git Bash can differ from `USERPROFILE` on managed machines with a network home. That affects the shared section's `node "$HOME/nana-pi/…"` command, not the `~` display (INFERRED).
  - PowerShell 5.1 writes UTF-16 (INFERRED).
  - Rename semantics for `set` (INFERRED).
  - Whether `!` commands in pi have a TTY (INFERRED no).
- Whether the Windows machine's provider uses public model ids: unknown, and not visible from this Mac.
- Open for the plan: does a machine running both seats need a different larger-lane builder per seat (§6)? This decides whether the larger-lane slot must accept a pi entry and whether pi-worker must launch it.
- The desk refuses to save any user file holding `objective`, which this Mac's file holds (`apps/desk/server.mjs:1385`; INFERRED that a desk save fails here today). The desk is frozen and outside this lane; recorded for HANDOFF.
