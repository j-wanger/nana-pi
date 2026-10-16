# Research: the lineup's data model and launch paths

*Read-only research for the fleet lane, at main `2dbc817` on 2026-10-16. Stakes: medium and reversible. A roster-shape bug stops every lane launch on a
machine. It fails closed and names the cause, and reverting the edit undoes it. Markers: `file:line` is at 2dbc817; "Ran" means run on this Mac today;
INFERRED means not read or run. The probe beside this file is `probe-shapes.mjs`. The owner is called "the owner" throughout, so text can move into a
public corpus unchanged.*

## 0. Answers in brief

- **(a) Today.** One resolver reads exactly one file and accepts exactly four slots. It refuses the whole roster on the first bad slot or field. It
  returns either the frozen default, by identity, or the file's own object. Two consumers read it: the roster command and lane-mode pi-worker.
  Twelve roster checks in `nana-roster.test.mjs` and six in `worker-lane.test.mjs` pin it, plus one Windows check (§1.6).
- **(b) Recommended shape: B.** Add one optional slot for the larger-lane builder. It holds either today's pi entry or a two-field Claude Code entry,
  `{"runtime":"claude-code","model":"sonnet"}`. `builder` stays a pi entry. It means "small lanes, and every lane when no larger-lane builder is set".
  - Existing files stay valid.
  - An older checkout refuses a file that holds the new slot, naming it. Ran: the probe printed `roster has an unexpected field largeBuilder`.
  - pi-worker's default path does not change.
  - Nothing changes on Windows, because pi-worker never starts a Claude entry in this lane.
  - Making the lineup *usable* on a pi seat needs one lane-mode option that picks the slot. With it, a pi seat can run a pi model for larger lanes. A
    Claude Code entry is refused with a named reason, which is the hook point for later work.
  - Shapes A, C and D are weaker (§2).
- **(c) Headless Claude builder.** It is feasible, but it belongs in a **later lane**. The shared watchdog hard-codes pi's launcher, including the
  Windows npm-entry logic that pi-review also uses. Its stall test is untested for `claude`. The permission mode a headless builder runs under is a
  security choice the owner has not made. The preamble also needs a print-mode rule. The fleet line needs none of this (§3).

## 1. (a) How the roster works today

### 1.1 Where it is read
- The agent dir is `piAgentDir()`. That is `PI_CODING_AGENT_DIR` passed through pi's own path normalising and resolve, else `~/.pi/agent`
  (`packages/nana-pack/lib/agent-dir.mjs:67-77`). It never throws (`:21-24`).
- The file is `<agent dir>/nana-pack.json` (`packages/nana-pack/bin/nana-roster.mjs:99`). This is the same user-scope file that holds `objective`. A
  project's `.pi/nana-pack.json` is never read, because `resolveRoster` takes only the agent dir (`:98`). A test pins this
  (`tests/nana-roster.test.mjs:108-123`).
- Ran `node packages/nana-pack/bin/nana-roster.mjs` on this Mac. It printed the default roster and `source: default`. This Mac's file holds only
  an `objective` key (Ran, keys listed), and `PI_CODING_AGENT_DIR` is unset (Ran).

### 1.2 How the file is read
- The read is bounded at 1 MiB: `readBounded(file, BOUNDED_READ_CAP)` (`nana-roster.mjs:28`), with `BOUNDED_READ_CAP = 1024 * 1024`
  (`lib/bounded-read.mjs:12`).
- Each read error maps to a result (`nana-roster.mjs:25-43`):

  | Read result | Outcome |
  |---|---|
  | `ENOENT` or `ENOTDIR` | absent, unless the path is a dangling symlink, which is refused (`:31-36`) |
  | `EISDIR` | refused (`:37`) |
  | `ERR_NOT_REGULAR` | refused (`:38`) |
  | `ERR_TOO_LARGE` | refused (`:39`) |
  | any other error | refused (`:40`) |

- The text is decoded as UTF-8 and one leading byte-order mark is stripped. Invalid JSON is refused, and the message is cut to 160 characters
  (`:103-108`). The top level must be a plain object (`:109-111`).
- An absent file gives `{ok:true, roster: ROSTER_DEFAULTS, source:'default'}` (`:101`). So does a missing `roster` key (`raw.roster === undefined`,
  `:112`). Defaulting covers the whole roster only. Nothing merges slot by slot (README `packages/nana-pack/README.md:218`).
- `roster: null` is not treated as absent. It is refused ("roster must be an object"), pinned by the `roster null` case (`tests/nana-roster.test.mjs:135`).

### 1.3 How it is validated
`validateRosterShape` (`nana-roster.mjs:77-91`) works in this order:
1. The value must be a plain object (`:78-80`).
2. It must hold **exactly** the slots in `ROSTER_SLOTS = ['scout','builder','reviewer','land']` (`bin/worker-config.mjs:21`). A missing slot gives
   `roster is missing …` (`:82-83`). An extra slot gives `roster has an unexpected field …` (`:84-85`).
3. Each slot is checked in print order, and the first problem wins (`:86-89`). `entryProblem` (`:52-74`) does the check:
   - `null` passes only for `NULLABLE_SLOTS = ['scout','land']` (`worker-config.mjs:22`; `nana-roster.mjs:53-55`).
   - The value must be a plain object (`:56-58`).
   - It must hold exactly `ENTRY_FIELDS = provider, model, thinking` (`:18`, `:59-63`).
   - `provider` and `model` must be non-empty strings with no match for `/[\s\x00-\x1f\x7f-\x9f]/`, meaning no whitespace and no C0 or C1 control
     character (`:64-69`).
   - `thinking` must be `null` or one of `THINKING_LEVELS`, pi 1.0.2's seven levels (`worker-config.mjs:23-24`; `nana-roster.mjs:70-72`).
4. On success it returns the caller's object **as written**. It makes no copy and no normalised form (`:90`). The resolver returns that object with
   `source` set to the file path (`:113-115`).

### 1.4 How the default is defined
- `ROSTER_DEFAULTS` is frozen (`worker-config.mjs:29-34`):
  - scout: null
  - builder: `{<default provider>, gpt-6-luna, high}`, read by name from `LANE_DEFAULTS` (`:12-17`, `:31`), so the two cannot drift
  - reviewer: `{<default provider>, gpt-5.6-sol, null}`
  - land: `{<default provider>, gpt-6-astra, null}`
- The provenance comment cites the 2026-10-06 roles (`:26-28`). `LANE_DEFAULTS.tools = 'read,grep,find,bash,edit,write'` is the lane tool list (`:16`).
- nana-setup seeds the user file only when it is absent, with `{"objective":{"projectFile":"OBJECTIVE.md"}}` and no roster
  (`packages/nana-setup/pi/nana-pack.seed.json`; `packages/nana-setup/lib/steps.mjs:587-589`). It never rewrites a hand edit (`lib/doctor.mjs:462`
  comment). So no machine gets a roster key unless a person writes one.

### 1.5 How it is printed and used
- **Roster command.** `formatRosterLines` prints one line per slot in `ROSTER_SLOTS` order (`nana-roster.mjs:119-127`):
  - an entry prints `<slot>: <provider> <model> <thinking|default>`
  - a null scout prints `none`, and any other null slot prints `seat` (only land can be null)
  - a last line prints `source: <default|path>`

  The CLI writes these lines to stdout and exits 0. A refusal goes to stderr as `nana-roster: roster refused: <file>: <problem>` and exits 1
  (`:129-137`). The CLI runs only as the main module (`:139`).
- **pi-worker, lane mode only:**
  - It calls `resolveRoster(piAgentDir())` (`bin/pi-worker.mjs:96`).
  - A refusal stops the launch through `laneFailure` (`:97`). That happens before the lock (`:141`) and before any spawn.
  - It prints `pi-worker: builder: <provider> <model> <thinking|default>; source: …` to stderr (`:99`).
  - It builds pi's argv from `roster.builder` only, plus `LANE_DEFAULTS.tools`, the preamble path, the brief path and a fixed instruction (`:106`).
  - Non-lane mode reads no roster: the call sits inside `if (laneMode)` (`:75`), and README `:208` says so.
- **pi-review reads no roster.** Ran a git grep: there is no roster import in `bin/pi-review.mjs`. The seat passes `--provider` and `--model` itself
  (README `:224`).
- **Other readers of the same file.** The pack config loader validates only its own schema blocks and skips unknown top-level keys
  (`lib/config.ts:266-268`). The pi gate lists the file as protected from pi edits (`lib/gate-paths.ts:117`; advisory). The suite runner scrubs
  `PI_CODING_AGENT_DIR` so a test never reads a real roster (`scripts/test.mjs:279`).
- **PATH launchers.** Ran `ls ~/.local/bin`: `pi-worker` links to `~/nana-pi` main, not to a lane worktree. So "an older checkout" means a machine,
  or a revert, that is behind the lineup change.

### 1.6 Every test that pins the shape or output
`packages/nana-pack/tests/nana-roster.test.mjs`:

| Lines | Row | What it pins |
|---|---|---|
| 39-46 | R-1120 | exact JSON of each default slot; builder equals `LANE_DEFAULTS` |
| 48-59 | R-1120 | absent file (ENOENT and ENOTDIR) returns `ROSTER_DEFAULTS` by identity, `source: default` |
| 61-67 | R-1120 | a file with no `roster` key returns the default by identity |
| 69-81 | R-1121 | a valid roster replaces every slot; null scout and null land kept |
| 83-92 | R-1121 | BOM and CRLF are read |
| 94-106 | R-1121 | `PI_CODING_AGENT_DIR` wins over the home dir (CLI spawn, `lines.includes`) |
| 108-123 | R-1121 | a project `.pi/nana-pack.json` is never read |
| 125-157 | R-1122 | 19 shapes, each refused naming its token, including **extra slot `auditor`** and **extra entry field `tools`** (`:129`, `:139`) |
| 159-171 | R-1122 | C1 control characters refused, naming slot and field |
| 173-200 | R-1122 | file-level refusals: bad JSON, array or null top level, directory, over 1 MiB, dangling symlink, mode 000 |
| 202-213 | R-1123 | **exact stdout**, default and file roster, so any new printed line turns this red |
| 215-223 | R-1123 | refusal on stderr, empty stdout, exit 1 |

`packages/nana-pack/tests/worker-lane.test.mjs`:

| Lines | Row | What it pins |
|---|---|---|
| 133-136 | R-961 | the default builder pairs and the tool list reach pi, each once |
| 158-167 | R-961 | a machine roster builder reaches pi, each flag once |
| 169-177 | R-961 | a null thinking omits `--thinking` |
| 179-188 | R-961 | **exact stderr** `pi-worker: lane refused: roster refused: <file>: roster.builder is not an entry (null)\n`; no spawn, no lock |
| 190-202 | R-1121 | a project roster is ignored by lane mode |
| 204-218 | R-1124 | **exact builder lines** for the default and a file roster, printed before `attempt 1/1` |

Also:
- `tests/win32-launch.test.mjs:222-232` (R-1125, R-1124): the Windows builder line is present (`startsWith`), and the argv equals the
  `LANE_DEFAULTS` pairs.
- `tests/templates-render.test.mjs:372-378` (R-1126): the shared text names the roster command path.

Rows: R-1120 to R-1124 (`REQUIREMENTS.md:342-346`) sit in FEAT-006 (`:328-361`). R-961 (`:341`) words the lane argv as "the resolved builder's
provider and model". R-1122's text says the roster holds "exactly scout, builder, reviewer and land" (`:344`), so every shape below rewords R-1122.

## 2. (b) The smallest change that names a builder for larger lanes and one for small lanes

### 2.1 What the owner's answer requires
The owner rejected "luna builds every lane on a pi seat" and asked for a configurable lineup that the session-start notice shows, so that the user
can change it (paraphrased). INFERRED reading of that answer:
- the lineup must be able to name either a pi model or a Claude Code model for larger lanes;
- an edit to the file must change what a seat launches, on either seat, where that seat can launch it.

Facts that shape the answer:
- pi on this Mac has auth for one provider only, which serves no Claude model (Ran, `auth.json` keys only). It cannot run a Claude model as a pi entry here.
- pi itself accepts Claude models by pattern (Ran `pi --help`: `pi --model sonnet:high`). On a machine where pi holds auth for a provider of Claude models, a Claude model
  can already be a plain pi entry, but it then runs under pi, not under Claude Code.

### 2.2 The shapes compared (Ran `node fleet/probe-shapes.mjs` against today's resolver, which stands in for every older checkout)

| Shape | Example | Today's resolver says (Ran) |
|---|---|---|
| A. optional `claudeBuilder` string | `"claudeBuilder":"sonnet"` | `roster has an unexpected field claudeBuilder` |
| B. one more builder slot whose entry is a pi entry or a runtime-marked Claude Code entry | `"largeBuilder":{"runtime":"claude-code","model":"sonnet"}` or `"largeBuilder":{"provider":"example-provider","model":"gpt-6-sol","thinking":"high"}` | `roster has an unexpected field largeBuilder` (both forms) |
| B2. a `runtime` field on every entry | `"builder":{"runtime":"pi",…}` | `roster.builder has an unexpected field runtime` |
| C. lane-size map in `builder` | `"builder":{"small":{…},"large":{…}}` | `roster.builder is missing provider, model, thinking` (misleading) |
| D. a sibling top-level key beside `roster` | `{"roster":{…},"builders":{"large":{…}}}` | **accepted**; the new key is silently ignored |

Comparison on the four axes the task names, plus what each shape can express:

| | A `claudeBuilder` | **B second slot + runtime** | C size map | D sibling key |
|---|---|---|---|---|
| Existing roster files | valid (absent = none) | valid (absent = none) | valid only if `builder` accepts both an entry and a map, which gives two spellings of one meaning | valid |
| Older checkout reading a new file | refused, names the key (Ran) | refused, names the key (Ran) | refused with a misleading "missing provider" (Ran) | accepted, larger-lane builder silently invisible (Ran) |
| pi-worker | unchanged; can never launch a larger-lane pi builder | unchanged by default; an optional slot picker reads the new slot | `pi-worker.mjs:98-106` must change on **every** launch, because `builder.provider` can be undefined; the picker becomes mandatory | as B, but reads a second key |
| Windows | no change | no change (pi-worker never starts a Claude entry in this lane) | no change | no change |
| Larger lanes on a pi model (pi-only machine, or a pi seat) | **cannot** | can | can | can |
| Claude Code for larger lanes | can (alias only) | can | can | can |
| Vendor name baked into the key | yes | no | no | no |
| Rows reworded | R-1121, R-1122, R-1123 (and R-1120 if the default changes) | the same, plus the picker rows | R-1120 to R-1124 and R-961 | new rows; R-1121's "the whole roster" contract gets an exception |
| Existing checks turned red | R-1123 exact stdout (`nana-roster.test.mjs:209-212`), if the slot always prints | same | same, plus R-961 and R-1124 literals if the default path changes | none, unless the command prints the new key |

Verdicts:
- **A is rejected.** It cannot name a pi model for larger lanes. That is exactly the pi-seat case the owner answered. It also builds the split rule
  into a vendor-named key.
- **C is rejected.** Every lane launch changes. An older checkout's refusal names the wrong cause. Both an entry and a map would be legal spellings.
  "small" and "large" become a vocabulary nobody needs yet.
- **D is rejected, narrowly.** It is the only shape an older checkout accepts (Ran). But the lineup then lives in two keys, the README's "a roster
  replaces every slot, whole" contract (`README.md:218`) gets an exception, and an older checkout hides the larger-lane builder silently. The repo's
  established style is a named refusal (R-1122). The stale-checkout window is short: a machine pulls, then edits its file.
- **B2 is rejected.** Making `runtime` required on every entry breaks every file. Making it optional everywhere means reviewer, land and scout
  could hold a Claude entry that pi-review cannot run.

### 2.3 Recommended: B, kept minimal
- **Slot.** Add one optional, nullable slot after `builder`. A suggested key is `largeBuilder`; its name appears in the roster command's output, so
  choose a plain one. An absent slot reads as `null`. `null` means `builder` builds every lane.
- **Entry kinds.** A pi entry is exactly today's `{provider, model, thinking}`, with no `runtime` key, so every existing entry stays valid with one
  spelling. A Claude Code entry is exactly `{runtime: "claude-code", model}`:
  - `model` uses today's string rule (`nana-roster.mjs:64-69`), which allows an alias or a full name with no whitespace.
  - It has no `thinking` or `effort`, because nothing in this lane can pass one to a seat-spawned subagent (INFERRED for the subagent; the CLI has
    `--effort`, Ran). Subtraction test: no consumer, so no field. Cost: the later headless lane adding `effort` is another format change. That is a
    residual.
  - A misspelled runtime, such as `"claude"`, is refused naming `roster.largeBuilder.runtime`.
- **`builder` stays pi-only.** pi-worker can always start it, and R-961's argv stays as it is. Reviewer, land and scout stay pi-only too.
- **Config surface.** Add `BUILDER_RUNTIMES = ['claude-code']` and an `OPTIONAL_SLOTS` list to `worker-config.mjs`, each with provenance
  (contract: Claude Code 2.1.299 `--model` takes "an alias … or a model's full name", Ran `claude --help`).
- **Resolver.** Return a normalised copy, with an absent slot set to `null`, so the fleet line, the command and pi-worker see one form. Today it
  returns the file's object as written (`nana-roster.mjs:90`). R-1121 then reads "…exactly as written, reading an absent larger-lane builder as null".
- **Roster command.** Print one more line in slot order: `largeBuilder: none`, `largeBuilder: <provider> <model> <thinking>`, or
  `largeBuilder: claude-code <model>`. The R-1123 exact-stdout check (`nana-roster.test.mjs:209-212`) changes with it.
- **Default (a decision).**
  - Option 1: the sealed default carries `{runtime:"claude-code", model:"sonnet"}`. The default then matches the 2026-10-13 builder split, and this
    Mac's notice is right with no file.
  - Option 2: the default is null, and each machine writes its own file.

  Option 1 rewords R-1120 and renames its title. Option 2 leaves R-1120 alone, but this Mac shows luna only until someone writes a roster file. The
  first plan made this a seat decision. The fact-check said it was the owner's call (`factcheck-repo.md`, Process). The owner's answer settles
  *where* the split lives. It does not settle the default value.

### 2.4 The lane-mode slot picker that makes the lineup usable on a pi seat
Without a picker, a pi seat can show a larger-lane pi builder but cannot run it through lane mode. Its only route would be non-lane `pi-worker -- …`,
which drops the lock, branch checks and ceiling. That route is not acceptable.

The smallest picker:
- **Option.** One lane-only option, for example `--lane-size larger`. Add it to `ownOptionNames` and the lane-only filter (`pi-worker.mjs:26`, `:47`,
  `:72-74`), so a missing value is refused like `--brief`'s (R-960).
- **Default.** With the option absent, lane mode uses `builder`, as today, so every existing seat command and brief keeps working.
- **`larger` with a pi entry.** pi-worker starts that entry with today's argv construction (`:106`).
- **`larger` with a null slot.** pi-worker falls back to `builder`.
- **`larger` with a Claude Code entry.** pi-worker refuses before the lock and before spawning, naming the entry, and says that pi-worker starts only
  pi models and that a Claude Code seat launches this one. **This refusal is the clean hook point.** The later headless lane replaces it with a
  launch (§3).
- **Builder line.** It names which slot ran, so a forgotten option shows on every launch. If the small-lane line keeps today's exact text, the R-1124
  literals (`worker-lane.test.mjs:216-217`) stay green, and only the larger-lane line is new.
- **Rows.** Reword R-961 ("the resolved builder for the lane size") and R-1124 if the line changes. Add a row for the picker, and a row for the
  Claude-entry refusal. New IDs start at R-1190.

**Residual, Ran.** Today's pi-worker silently ignores an unknown option of its own. Ran a temp worktree in this folder with a stub `pi` and
`pi-worker --lane probe --brief … --size large`: it exited 0 and started the default `gpt-6-luna`. Only the builder line showed which builder ran. So
a seat on an older checkout that passes the new option gets the small-lane builder, with no error. The builder line is the only signal. Pinning
"unknown lane options are refused" would close this for future options, but older checkouts still lack it.

### 2.5 Where it goes
This is a FORMAT-class change to lane mode, the code that gates every lane. With the picker, it touches three code files (`worker-config.mjs`,
`nana-roster.mjs`, `pi-worker.mjs`), two test files, the README roster section (`README.md:206-224`) and five or six rows. It does not need the fleet
hook or the extension. The fleet line needs only the resolved lineup.

Two clean placements:
- **(i) A small lineup lane first.** Two plan rounds. Under the split it goes to the larger-lane builder, because it touches gate-adjacent lane
  mode. Then the fleet lane reads the new slot.
- **(ii) Fold it into the fleet lane** as its first commit group. One fewer land. The review is bigger, and the earlier draft was already large.

INFERRED: (i) keeps each review under the materiality bar more easily. The shared working-pattern bullet already says "The builder, reviewer and land
models come from this machine's roster" (`templates/_shared/working-under-nana-pi.md:30`). It needs no edit. Editing it would also change the
nana-soul copy, which R-1128 pins byte for byte.

## 3. (c) Could lane-mode pi-worker launch a headless Claude builder for a pi seat?

### 3.1 Flags available (Ran `claude --help` on Claude Code 2.1.299; hidden flags found with `strings` on the installed binary)

| Need | Claude Code flag | Status |
|---|---|---|
| model | `--model <alias or full name>` | listed |
| thinking | `--effort low…max` | listed |
| print mode | `-p, --print` | listed; it skips the workspace trust dialog |
| output | `--output-format text\|json\|stream-json` | listed |
| permissions | `--permission-mode acceptEdits\|auto\|bypassPermissions\|manual\|dontAsk\|plan`; `--permission-prompts host\|none` | listed |
| tool limit | `--tools "Read,Edit,…"`, `--allowedTools` | listed; tool names differ from pi's `read,grep,find,bash,edit,write` |
| turn cap | `--max-turns <turns>` | **hidden**: absent from `--help`; the binary holds "Maximum number of agentic turns in non-interactive mode … (only works with --print)" |
| cost cap | `--max-budget-usd <amount>` | listed (print only) |
| preamble and brief | `--append-system-prompt <text>` (text, not a path); `--append-system-prompt-file <file>` | the file form is **hidden**; whether it may repeat is unknown |
| session | `-n, --name`; `--no-session-persistence` | listed |
| must not use | `-w, --worktree` (creates a new worktree) | listed |

`--version` short-circuits option parsing, so it cannot test a hidden flag (Ran: an unknown flag with `--version` exits 0). No `claude -p` call was
made, because it would spend tokens.

### 3.2 What the watchdog assumes about pi, and what breaks for `claude`

| Watchdog assumption | Where | Outcome for `claude -p` |
|---|---|---|
| The child is `pi` by name off win32 | `pi-watchdog.mjs:55` | **breaks**: needs a runtime-chosen command |
| On win32, `findPi` plus the `@earendil-works/pi-coding-agent` npm entry, else refused | `:56-94`; `lib/win-command.mjs:45-47`; `PI_PACKAGE` `worker-config.mjs:37` | **breaks**: a Claude `.cmd` shim is refused. A native `claude.exe` would need its own lookup. Where Claude Code installs on the owner's Windows machine is unknown. Changing this touches R-1125, which pi-review shares. |
| Liveness is the CPU seconds of the child pid alone (`ps -o time= -p`), flat for `--stall-secs` (default 75) | `:128-142`, `:108`, `:192`, `:213-222` | **unmeasured**: the installed `claude` is a native Mach-O binary (Ran `file`). Its CPU while a long test command runs in a child process is not known, so a healthy builder could be killed as stalled. Measure before relying on it. |
| One `--name <tag>-aN-…` is appended per attempt | `:164` | works by chance: `claude` accepts `-n, --name` (Ran) |
| Env `NANA_HANDOFF=off`, `NANA_ROLE=worker`, `NANA_WORKTREE_ROOT` | `:177`; `pi-worker.mjs:110` | partial: `NANA_ROLE=worker` turns off the knowledge hook, which the Claude seat also runs (R-285). `NANA_WORKTREE_ROOT`'s write guard is pi-gate only (R-962), so no nana write confinement exists under Claude Code. |
| Success is exit 0, non-empty output, and no shape check | `:227`; R-734 | plausible: the exit code when `--max-turns` or the budget stops the run is **unknown** (not run) |
| Process-group kill on stall, ceiling or signal | `:149-156`, `:207-212` | works for any child (INFERRED) |
| Lock, branch revalidation, wall-clock ceiling | `pi-worker.mjs:113-125`, `:158-182`; R-960, R-963 | reusable as they are |
| pi trust notice | `pi-worker.mjs:112` | wrong runtime: it checks pi's trust record, and `-p` skips Claude's trust dialog |

### 3.3 Other things that would break or need a ruling
- **Permission mode is a security choice.** This Mac's `~/.claude/settings.json` sets `permissions.defaultMode = bypassPermissions` (Ran). A
  headless builder here would inherit no permission checks (INFERRED). On a machine with a stricter default, `-p` would deny Bash, so the builder
  could not run tests or commit (INFERRED). The launcher must therefore pass an explicit mode. The choices are bypass (parity with today's subagent
  builder, INFERRED), an allowlist of Bash patterns, or `auto`. That is the owner's call.
- **Inherited context.** A `claude -p` in the lane worktree loads the user rules, `CLAUDE.md` → `AGENTS.md`, the SessionStart hooks and the
  verifier-pipe guard (Ran: four nana hooks are live in `~/.claude/settings.json`). That matches today's seat-spawned builder, which gets the Claude
  Code hooks (shared memory roster note, paraphrased). nana-pi has no project `.claude/settings.json` (Ran), so there is no repo Stop hook to block the run. The
  memory note's isolation flags (`--setting-sources ''`, `--system-prompt-file`) are for one-shot model calls, not builders. `--bare` drops OAuth
  (Ran help text), so a subscription login cannot use it.
- **Print-mode pitfall.** A headless worker that backgrounds a command and waits for a notification ends its run (shared memory note, 2026-09-22).
  The builder preamble has no such line, and R-1110 pins its twelve rules exactly. A Claude-only addendum, or a thirteenth rule, rewords R-1110.
- **One purpose per module.** pi-worker's purpose is "Run a pi worker under a liveness watchdog" (`pi-worker.mjs:3`). The watchdog's is "Start pi
  … under a CPU-liveness watchdog" (`pi-watchdog.mjs:3`). Lane validation is inline top-level code (`pi-worker.mjs:75-126`), not an exported
  function. A Claude launch therefore needs either a launcher function injected into the watchdog plus a refactor of the lane checks, or a second
  command that shares extracted lane checks.
- **Tests.** Today's lane tests stub `pi` as a `/bin/sh` script on PATH (`worker-lane.test.mjs:29-31`). A `claude` stub and a Windows fixture
  (`.exe` or `.cmd`) would be new.
- **Upside (INFERRED).** Today the Claude Code seat's Sonnet builder runs outside pi-worker, with no lane lock, no branch check, no ceiling and no
  builder line. A Claude path through lane mode would give both seats those protections.

### 3.4 Verdict
Launching `claude -p` from lane mode belongs in a **later lane**:
- It reworks the shared watchdog and R-1125's Windows launch, which pi-review also depends on.
- It needs a stall threshold measured for `claude`.
- It needs the owner's permission-mode ruling, a preamble rule and a cost cap with provenance.

The fleet lane needs none of this. The clean hook point in this lane is §2.4's named refusal of a Claude Code entry in lane mode, plus the `runtime`
field in the entry. The later lane swaps the refusal for a launch and changes no file shape, unless it adds `effort`.

## 4. Threat model for the lineup change
- **In scope (honest variation):**
  - the new slot absent, null, a pi entry or a Claude entry;
  - a misspelled runtime; an extra field; whitespace or a control character in the model;
  - BOM or CRLF;
  - an older checkout reading a newer file;
  - a newer checkout reading an older file;
  - a revert after a machine's file gained the slot;
  - the picker option missing its value, or given on an older checkout.
- **Out of scope:** a deliberately misleading model name, or a forged roster file. The pi gate's protection of the file is advisory
  (`gate-paths.ts:117`), and a Claude Code session can edit the file.

## 5. Residuals
1. An older checkout or a revert refuses a file that holds the new slot, so lane mode stops and names the slot (Ran). Remedy: pull before editing the
   file.
2. An older pi-worker ignores the picker option and runs the small-lane builder (Ran). The builder line is the only signal.
3. A Claude Code entry has no `effort` field. Adding one later is another format change, with residual 1 again.
4. A pi seat cannot run a Claude Code larger-lane builder until the later lane. It gets a named refusal, not a launch.
5. This Mac shows luna only if the default stays null and no roster file is written (§2.3 option 2).

## 6. Unknowns (not run or not readable here)
1. How much CPU a headless `claude -p` uses while a long tool command runs, measured against the watchdog's 75-second flat default.
2. The `claude -p` exit code and output when `--max-turns` or `--max-budget-usd` stops a run. Finding out costs an API call.
3. Whether `--append-system-prompt-file` may repeat, and whether a hidden flag is a stable contract.
4. Whether a seat-spawned Claude Code subagent can take an effort level. This decides whether a Claude entry ever needs `effort`.
5. Where Claude Code installs on the owner's Windows machine (`claude.exe` or an npm `.cmd`), and whether it is on PATH there.
6. Whether the owner's Windows machine already has a `roster` block. Memory says it names a private provider. That file was not seen.
7. The default for the larger-lane builder: the 2026-10-13 split, or null (§2.3).
8. Whether the owner wants a pi seat ever to start Claude Code builders, or prefers a pi model for larger lanes there.
