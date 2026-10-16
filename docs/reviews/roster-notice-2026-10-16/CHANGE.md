# Change declaration — roster-notice: a configurable builder lineup, shown with how to change it at every session start in both seats

*Lane `roster-notice` (the fleet lane) · `feat/roster-notice` · `~/nana-pi-wt/roster-notice`, from current `main` once `feat/regroup` lands (at most two lanes at once)
· cites at `2dbc817` · 2026-10-16 · seat draft 6 (seat revisions 3 to 6, change log at the end), after sol's plan review round 1; replaces the fleet half of `../CHANGE.md`, whose rulings half moves
to a later lane. Features: FEAT-006, FEAT-023, FEAT-013 (SUB-012, SUB-013, SUB-015), FEAT-014 (SUB-019), FEAT-015, FEAT-018, FEAT-032; test literals only in FEAT-011
(R-082, R-083, R-780), FEAT-017 (R-954, R-958), FEAT-021 (R-685) and FEAT-028 (R-291). Class FORMAT (the roster file gains a slot and an entry kind; lane mode gains an
option and two refusals): two plan-review rounds. Builder: the larger-lane builder (the Claude Code model `sonnet`, a Claude Code subagent in the lane worktree; many files, a
hook, a lane-mode change). It touches `packages/nana-setup/` and a hook: install check on macOS before `nana-land` (`AGENTS.md:147`). Stakes: medium, reversible — a new
hook entry on every machine, Windows included, and a roster and lane-mode change whose bug stops every lane launch (it fails closed and names the cause; a revert undoes it).
Evidence beside this file: `research-roster.md`, `research-surfaces.md`, `research-alter.md`, `design-critique.md`, `design-critique-r3.md`, `factcheck.md`, `factcheck-r3.md`,
`probe-shapes.mjs`, `fc/`, `fc3/`, `probe/`, `r4probe/`, `notice-lengths.mjs`, `sol-plan-r1.md`; `../factcheck-repo.md`, `../research-startup.md`; `hooks.md` is the Claude Code hooks reference
saved from code.claude.com on 2026-10-12 into the seat's scratchpad (`../../hooks.md`), not beside this file. "Ran" = run on this Mac; "Read" = read at `2dbc817`, not run; INFERRED = not read or run. The owner
is "the owner" throughout, with no name and no word-for-word quote, so this file can enter a public review corpus unchanged.*

## 1. Why

On 2026-10-16 the owner asked that every session start tell the user the current builder lineup, which also tells the user that nana is active. The seat proposed that a pi
seat's small-lane builder build every lane; the owner declined, asked for a lineup the user can configure, and named that as the notice's purpose: the user sees the lineup
at start-up and can change it. The owner also asked that the plan carry no name and nothing about the owner's work.
- **No seat shows the lineup.** Plain SessionStart stdout reaches the model only; `systemMessage` is the field "shown to the user", and `additionalContext` counts only inside
  `hookSpecificOutput` with `hookEventName` (saved docs `hooks.md:726,810,1006,1013,1115,1261-1263`). Ran `strings` on the 2.1.299 binary: it holds the warnings "Did you
  mean hookSpecificOutput.additionalContext…" and "unrecognized keys (ignored)" (`cc-strings.txt:212115-212116`) and the schema line that `hookSpecificOutput` must include
  `hookEventName` (`:174964`); that a top-level `additionalContext` is dropped is INFERRED from them. pi shows only `nana-pack ✓` (`nana-lifecycle.ts:47`).
- **The lineup cannot hold the builder split, and no seat rule uses one.** The roster has one builder slot of pi entries only (`nana-roster.mjs:77-91`,
  `worker-config.mjs:19-34`); the 2026-10-13 split (a Claude Code builder for larger or riskier lanes, the pi builder for small lanes with every test named) lives in the
  Claude seat's memory, so editing the file changes nothing about who builds larger lanes, and a pi seat never sees the split. The shared working pattern says only that the
  builder comes from the roster (`templates/_shared/working-under-nana-pi.md:30`). This Mac prints luna as the only builder (Ran `nana-roster.mjs`, `source: default`).
- **No surface says how to change it, and a change is a whole-roster hand edit.** The only route is a hand edit of the `roster` block that only the pack README describes
  (`README.md:214-224`); a roster replaces every slot, so changing one slot means writing them all; doctor, state, the desk and pi show nothing of it (`research-alter.md` §1.2).

**Threat model.** In scope, honest variation in our tools' output and users' files: a roster absent, default, valid with or without `largerBuilder` or a scout, holding a pi or a
Claude Code entry, a Claude Code entry naming a model the Claude Code seat cannot start (a full model name, a bracketed variant), or refused for each refusal kind (bad
JSON, a non-object, a missing or extra slot or field, a bad value, a directory, over the cap, a dangling symlink, an unreadable file); a BOM or CRLF; a model id that
contains its provider string; two providers serving one model id; `PI_CODING_AGENT_DIR` inside or outside the home folder, `~`-prefixed, relative (the seat's folder and a
lane worktree then resolve it to two different files), holding ` (`, or set only in the shell profile; an older checkout reading a
newer file, a newer checkout reading an older one, and a revert; `--lane-size` missing its value, unknown, absent while `largerBuilder` is set, written as
`--lane-size=larger`, or given to an older pi-worker; a user-scope file that already holds other keys (the installer seeds `objective`); another extension's info notice at
the same start; empty, malformed, missing or unreadable hook stdin; a Claude Code child that pi-subagents starts; every Claude source and pi reason; no UI; Windows
exec form from a checkout path with a space, `$`, `%` or `'`; a refusal that echoes a provider, quoted file text or the absolute home path. Out: deliberate forgery — a
misleading model name, a forged roster file or hook input. A finding outside the model is a residual.

## 2. Requirement delta

Main's highest ID is R-1183; `feat/regroup` (now `656dc86`, main merged in) adds R-1170 to R-1180, R-1184 and R-1187; R-1185 and R-1186 are mutation fixtures; R-1190 to
R-1219 are unused on main, `feat/regroup`, every other local and remote branch and both worktrees' files (Ran 2026-10-16, grep count 0; R-1215 to R-1219 re-Ran in seat revision 6). One `shall` per row. A new row enters `planned` and flips to `implemented`, with its evidence
cell, in the commit whose code turns its marked tests green; in between the trace rail is red, because it fails a `planned` row that a marker traces
(`templates/typescript/template/tests/requirements-trace.ts:16-21`). A reworded row stays `implemented` and lands in the commit whose test pins its new clause. Rows are
placed by feature ID, never by line, because the regroup moves lines.

| ID | Change | Text |
|---|---|---|
| R-1120 | reworded (FEAT-006; D1) | Requirement text only: inserts "no larger-lane builder," after the builder (rest unchanged); under D1's other answer the insert reads "larger-lane builder the Claude Code model `sonnet`,". Its evidence cell holds the owner's name (Read, `REQUIREMENTS.md:342`) and stays as it is: the cited `nana-roster.test.mjs:40` check keeps its title and gains one assertion. |
| R-1121 | reworded | WHEN the user-scope nana-pack.json in pi's active agent dir holds a valid roster, the roster resolver shall return its scout, builder, larger-lane builder, reviewer and land exactly as written, reading an absent larger-lane builder as null, taking no slot or field from the default and reading no roster from a project's .pi/nana-pack.json. |
| R-1122 | reworded | …or its roster is not an object holding exactly scout, builder, reviewer and land and at most `largerBuilder`, where builder and reviewer are pi entries, scout and land are pi entries or null, `largerBuilder` is a pi entry, a Claude Code entry or null, each pi entry holds exactly a provider and model that are non-empty with no whitespace or control character and a thinking that is one of pi's seven levels or null, and each Claude Code entry holds exactly `runtime` `claude-code` and a model that is one of the Claude Code subagent model names, THEN the roster resolver shall return a refusal naming the file and the failing slot or field, `roster.largerBuilder.model` for any other Claude Code model. |
| R-1123 | reworded | WHEN the roster command runs without `--json`, it shall either print one line per slot in the order scout, builder, largerBuilder, reviewer, land, giving provider, model and thinking (`default` for null) for a pi entry, `claude-code` and the model for a Claude Code entry, `none` for a null scout or largerBuilder and `seat` for a null land, then a source line naming `default` or the file, and exit 0, or print the resolver's refusal on stderr and exit 1. |
| R-961 | reworded | "the resolved builder's provider and model" becomes "the provider and model of the roster's builder, or of the entry R-1190 selects under `--lane-size larger`" (rest unchanged). |
| R-1124 | reworded | …exactly one line `pi-worker: builder: <provider> <model> <thinking>; source: <source>`, with `builder (larger lanes):` in place of `builder:` when it starts the larger-lane builder, `default` for a null thinking… (rest unchanged). |
| R-1190 | added, FEAT-006 | WHEN pi-worker lane mode receives `--lane-size larger`, it shall start pi with the roster's larger-lane builder when that slot holds a pi entry, and with the builder when that slot is null. |
| R-1191 | added, FEAT-006 | IF pi-worker lane mode receives `--lane-size larger` and the roster's larger-lane builder is a Claude Code entry, THEN it shall refuse before taking the worktree lock or starting pi, naming `roster.largerBuilder`, stating that pi-worker starts pi entries only, and naming both ways out as the user's choice: asking the user to start it as a subagent from a Claude Code seat, or to put a pi entry in `largerBuilder`. |
| R-1192 | added, FEAT-006 | WHEN the roster command runs with `--json`, it shall either print one JSON object holding only a `roster` key whose value is the resolved roster with every slot in print order, and exit 0, or print the resolver's refusal on stderr and exit 1. |
| R-1193 | added, SUB-019 | The shared working pattern shall state that, when the roster sets `largerBuilder`, a seat builds a larger or riskier lane with it, a pi entry through `pi-worker --lane-size larger` and a Claude Code entry as a Claude Code subagent in the lane worktree, and a small lane through `pi-worker --lane-size small`. |
| R-1194 | added, FEAT-023 | The roster notice shall be one line that starts `nana active · roster` and names the builder, any larger-lane builder, the reviewer and the land, each entry by its model and any thinking level. |
| R-1195 | added, FEAT-023 | The roster notice shall build each roster entry from its model and thinking only, never from its provider field. |
| R-1196 | added, FEAT-023 | WHERE the roster sets a larger-lane builder, the roster notice shall name it `for larger lanes` before the builder `for small lanes`. |
| R-1197 | added, FEAT-023 | The roster notice shall follow a Claude Code entry's model with `(Claude Code only)`. |
| R-1198 | added, FEAT-023 | WHILE the roster's land is null, the roster notice shall read `land seat`. |
| R-1199 | added, FEAT-023 | The roster notice shall name no scout, set or null. |
| R-1200 | added, FEAT-023 | WHILE the roster's larger-lane builder is null, the roster notice shall name the builder with no size label. |
| R-1201 | added, FEAT-023 | The roster notice shall carry `(default)` after `roster` exactly when the resolver returned the default roster. |
| R-1202 | added, FEAT-023 | IF the roster resolver refuses the roster, THEN the roster notice shall start `nana active · roster refused:` followed by the resolver's problem with the roster file's path set aside, then cut before its first ` (`, then every control character and line break replaced by a space, then the path put back. |
| R-1203 | added, FEAT-023 | The roster notice shall end with `change: "roster" in` and the path of the user-scope nana-pack.json in pi's active agent dir. |
| R-1204 | added, FEAT-023 | WHERE the roster file lies under the home folder, the roster notice shall write its path with the home folder as `~` wherever the notice holds it. |
| R-1205 | added, SUB-012 | WHEN the roster notice hook has loaded its modules, it shall print exactly one JSON object holding the roster notice as `hookSpecificOutput.additionalContext`, beside `hookEventName` `SessionStart`, whatever source its input holds, if any, and exit 0. |
| R-1206 | added, SUB-012 | WHEN the roster notice hook has loaded its modules, it shall also print the roster notice as `systemMessage` only when the input's source is startup, resume, clear or fork, or the hook can read no source from its input, an input read error included. |
| R-1207 | added, SUB-012 | IF the roster notice hook cannot load its modules, or throws other than while reading its input, THEN it shall print one JSON object whose `systemMessage` and `hookSpecificOutput.additionalContext` read `nana active · roster notice unavailable (<error code or name>)`, holding no path, and exit 0. |
| R-1208 | added, SUB-013 | The installer shall add the roster notice hook as one SessionStart entry with no matcher and the timeout of the other SessionStart entries. |
| R-1209 | added, FEAT-015 | The install check shall pass the roster notice hook only when its stdout is one JSON object whose `systemMessage` starts `nana active · roster` and is not the unavailable notice, and whose `hookSpecificOutput` holds `hookEventName` `SessionStart` and an `additionalContext` that starts `nana active · roster`. |
| R-1210 | added, FEAT-023 | WHEN a session starts, the roster notice extension shall show the roster notice as the only line of one widget above the editor, never as a notify, only when the session has a UI and its reason is startup, new, resume or fork. |
| R-1211 | added, FEAT-023 | The roster notice hook and the roster notice extension shall show the same roster notice for one roster file. |
| R-1212 | added, FEAT-006 | IF pi-worker lane mode receives no `--lane-size` and the roster's larger-lane builder is not null, THEN it shall refuse before taking the worktree lock or starting pi, naming `largerBuilder`, `--lane-size larger` and `--lane-size small`. |
| R-1213 | added, SUB-019 | The shared working pattern shall state that a seat that cannot start the roster's larger-lane builder stops and asks the user rather than starting another. |
| R-1214 | added, SUB-019 | The shared working pattern shall state that, when the roster sets no `largerBuilder`, the builder builds every lane. |
| R-1215 | added, FEAT-023 | WHILE `PI_CODING_AGENT_DIR` is set to a value that stays relative after pi's path normalisation, the roster notice shall read `nana active · roster unknown: PI_CODING_AGENT_DIR is relative, so each folder may read a different roster file` then the change pointer, naming no lineup whatever the roster resolver returns. |
| R-301 | reworded (SUB-012) | "the four Claude Code Node hooks" becomes "the five" (rest unchanged). |
| R-1051 | reworded (SUB-015) | …shall wire the objective, adoption, shared-memory, roster notice and verifier-pipe settings entries to the checkout's own `packages/nana-setup/claude/hooks/<hook>.mjs`. |
| R-1063 | reworded (SUB-015) | Adds "and the roster notice entry one JSON object whose `systemMessage` starts `nana active · roster`" after the shared-memory clause (rest unchanged). |
| R-1055 | reworded (FEAT-015) | "each of the five hook settings rows" becomes "each of the six". |
| R-1056 | reworded (FEAT-018) | "all five entries on win32" becomes "all six". |
| R-658 | reworded (FEAT-032) | "all seven extension functions" becomes "all eight". |
| R-1075 | evidence only (FEAT-015) | Its cell's citation `install-check.test.mjs::dispatch: the three SessionStart entries start before any of them finishes` takes the renamed title (§5.2). R-1051's and R-658's cells likewise take their renamed titles. |

26 rows added (R-1190 to R-1215), 12 reworded, none retired; R-1075 changes its evidence cell only. R-960 keeps its text: "refuse missing or invalid option values"
already covers `--lane-size`, and W4 cites it. R-1058, R-1074, R-1076, R-1081, R-680 and R-685 keep their text; their tests' literals or lists change (§5.2). R-1126, R-1127
and R-1128 stay untouched: the bullet behind R-1193, R-1213 and R-1214 is a separate bullet, so the default-pattern bullet and nana-soul's copy do not change. Each reworded
row's evidence cell gains the new check that pins its new clause, R-1120 excepted (above). Leaf total on main 1,139 (`requirements-tree.test.mjs:40,55`; the regroup tip
`656dc86` says 1,152); the lane adds 26 to whatever main holds at its base.

## 3. Design

**3.1 The lineup: shape B, one optional slot (`research-roster.md` §2).** `largerBuilder`, after `builder`, absent or `null` meaning the builder builds every lane. It holds
either today's pi entry `{provider, model, thinking}` or a Claude Code entry `{runtime: "claude-code", model}`; `builder`, `reviewer`, `scout` and `land` stay pi-only, so
pi-worker can always start `builder` and pi-review's inputs never change. A Claude Code entry's model is one of the four names the Claude Code seat can start: in this lane
the only thing that starts such an entry is the seat's Agent tool, whose `model` field in 2.1.299 takes exactly `sonnet`, `opus`, `haiku` or `fable` (Ran `strings`:
`model:U(["sonnet","opus","haiku","fable"])`, `cc-strings.txt:337100`), so a full model name or a bracketed variant would show in both notices and then fail when the seat
starts it. The resolver returns a normalised copy with an absent slot set to `null` (today it returns the file's object, `nana-roster.mjs:90`), so the roster command,
pi-worker and the notice see one form. Ran (`fc/shape-larger.mjs`, with the key `largerBuilder`; `probe-shapes.mjs` used `largeBuilder`): today's resolver, standing in for
every older checkout, refuses the new key by name (`roster has an unexpected field largerBuilder`).
- Rejected: A, an optional `claudeBuilder` string (cannot name a pi model for larger lanes, which is the pi-seat case the owner answered; a vendor name in the key); C, a
  size map inside `builder` (every launch changes; an older checkout refuses with a misleading "missing provider"; two spellings of one meaning); D, a sibling top-level
  key (an older checkout accepts it and silently hides the larger-lane builder; the lineup lives in two keys); B2, `runtime` on every entry (breaks every file or lets
  reviewer and land hold an entry pi-review cannot run).
- The key reads `largerBuilder` so that one word, "larger", names the slot, the option value and the notice label; the rows that say when it is used, the README and the new
  shared bullet say "larger or riskier", so a small but risky change is not sent to the small-lane builder because of the label.

**3.2 Lane mode picks the slot (`research-roster.md` §2.4).** One lane-only option `--lane-size <small|larger>`, default `small` while `largerBuilder` is null (today's
behaviour, so every existing seat command and brief keeps working until a file sets the slot). Once the slot is set, a launch with no `--lane-size` is refused right after
the roster resolves, before the lock and any spawn (R-1212), with one text here and in W6: `roster sets largerBuilder: pass --lane-size larger for a larger or riskier lane,
or --lane-size small for a small one`. That makes every seat in every project choose a size, whether or not its marker region carries the new bullet (§3.7). Like every own
option, only the two-word form is read, so `--lane-size=larger` counts as no `--lane-size`: refused while the slot is set, and the builder while it is null, which is what
`larger` gives then (Read: `pi-worker.mjs:26-37`; the watchdog ignores unknown options, `pi-watchdog.mjs:100-119`). Added to `ownOptionNames` (`pi-worker.mjs:26`), the
lane-only filter (`:47`), the missing-value loop (`:72-74`), `LANE_USAGE` (`:22`) and the literal three-option list that picks the usage text (`:132`); no check pins the
last two. An unknown value is refused before the lock (R-960). `larger` with a pi entry starts it through today's argv construction (`:106`); `larger` with `null` falls
back to `builder`; `larger` with a Claude Code entry is refused right after the roster resolves (`:96-97`), before the lock (`:141`) and any spawn, with one text in R-1191,
here and in W3: `roster.largerBuilder is a Claude Code entry; pi-worker starts pi entries only: ask the user to start it as a subagent from a Claude Code seat, or to
put a pi entry in largerBuilder`, so a seat that has only this text reads both ways out as the user's to take, not an order to edit the user's file. That refusal is the hook point for a later headless launcher (§6). The builder line keeps today's exact text for the small lane (R-1124 literals at
`worker-lane.test.mjs:215` stay green) and reads `builder (larger lanes):` for the larger one.

**3.3 Config, read by name.** In `worker-config.mjs` (the lane adds no name): `OPTIONAL_SLOTS = ['largerBuilder']` and `CLAUDE_CODE_SLOTS = ['largerBuilder']` (contract
R-1122), `SLOT_PRINT_ORDER` (contract R-1123, R-1192), `CLAUDE_CODE_RUNTIME = 'claude-code'` (contract R-1122; chosen name: it says which runtime starts the entry),
`CLAUDE_CODE_SUBAGENT_MODELS = ['sonnet', 'opus', 'haiku', 'fable']` (contract R-1122: Claude Code 2.1.299's Agent tool input schema, its `model` field, read from the
installed binary's strings on 2026-10-16, `cc-strings.txt:337100`; the later headless lane widens it for the command line's full names), `LANE_SIZE_SLOTS = {small:
'builder', larger: 'largerBuilder'}` (contract R-1190), `LARGER_BUILDER_LABEL = 'builder (larger lanes)'` (contract R-1124), and `ROSTER_DEFAULTS.largerBuilder = null` (D1;
chosen: every machine's lineup stays as it is until its own file names a larger-lane builder; under D1's other answer the Claude Code entry `sonnet`, chosen: the 2026-10-13
split). N2 holds the `CLAUDE_CODE_SUBAGENT_MODELS` literal; every other test imports it. New `packages/nana-pack/lib/roster-notice-config.mjs`, each value with provenance:
`NOTICE_PREFIX` `nana active · roster`, `DEFAULT_MARK` `(default)`, `REFUSED_HEAD` `refused:`, `SIZE_LABELS` `for larger lanes` / `for small lanes`, `CLAUDE_CODE_MARK`
`(Claude Code only)`, `WIDGET_KEY` `nana-roster` (chosen: one key, so a later show replaces the earlier one; contract R-1210), `CHANGE_POINTER` `change: "roster" in`
(contract rows R-1194, R-1196, R-1197, R-1201 to R-1203; the pointer can later become a `set` command line by this one value), `REFUSAL_CUT` ` (` (contract R-1202: the
values the validator echoes follow it, `nana-roster.mjs:40,57,67,71,79,107,110`; the file path, which `:34` and `:37-40` put before it, is set aside first; the key names
`:63` and `:85` echo come before it and stay, residual 8), `RELATIVE_DIR_TEXT` `unknown: PI_CODING_AGENT_DIR is relative, so each folder may read a different
roster file` (contract R-1215; chosen words: it names the variable to fix and why, as doctor's warn row does, `doctor.mjs:439-440`), `SHOW_SOURCES` `startup, resume, fork, clear, new` (chosen: a new session is a session start, so Claude Code's
clear and pi's new show it; compact and reload continue a session that has seen the notice; each seat meets only its own names, `hooks.md:1190-1194`, `types.d.ts:553-559`;
contract R-1206, R-1210). L3 alone holds the notice config's sealed literals; every other test imports the names.

**3.4 One module composes the notice.** New `packages/nana-pack/lib/roster-notice.mjs`, *@purpose* "Compose the one-line session-start roster notice from a roster result
and the roster file", *@effects* none. One export, `rosterNotice(result, file, relative)`. Segments join with ` · `: the roster (or the refusal, or the unknown text), then
the change pointer. A refusal's
problem text first has every occurrence of the absolute roster path replaced by a placeholder holding no ` (`, is cut at `REFUSAL_CUT`, goes through `displayText`
(`display.mjs:109`), and then gets `tildeify(file)` back in the placeholder's place. `tildeify` (`packages/nana-setup/lib/paths.mjs:101-104`; same layer, so no third copy;
the first import from a nana-pack source module into nana-setup, where today only pack tests do, Read, and the code map's one `packages` layer allows it) rewrites only a path that starts with the home folder (Read), and `dangling symlink: ${file}` (`nana-roster.mjs:34`) puts the path after other text, so the path is set aside
rather than passed through it; a path holding ` (`, such as an agent dir under `My (old)`, then survives the cut whole. Model ids only: no provider, no host name, no absolute
home path.
- Each entry is built from its `model` and `thinking` fields only and never reads `provider`, so a model id that contains its provider string, such as provider `acme`
  with model `acme-large`, prints whole (R-1195). The notice thus names each entry by model and thinking only; `nana-roster` prints the providers
  (`nana-roster.mjs:119-127`) and a lane's builder line the one it starts (`pi-worker.mjs:99`). The provider stays out because the notice also enters the Claude seat's
  context (R-1205), and a seat that copies the line into a repository file must not carry a machine's provider: a standing rule keeps machine provider names out of
  repository files (the README's roster example uses `example-gateway`, `README.md:221`). Two providers serving one model id therefore read alike (residual 23).
- The notice never names the scout, set or null (R-1199): no nana rule or launcher starts one (residual 21), so naming it would read as part of the lineup a seat runs;
  `nana-roster` still prints it.
- Each seat passes `relative` as `piAgentDirIsCwdRelative()` (`agent-dir.mjs:84-92`): true when `PI_CODING_AGENT_DIR` is set and stays relative after pi's
  `normalizePath`, judged by the platform's own `path.isAbsolute`, so `~/…` and a `file://` URL count as absolute, as pi resolves them (`:39-55`); a check on the raw value
  would call both relative (Ran on this Mac). While it is true, the notice reads the prefix, `RELATIVE_DIR_TEXT` and the pointer, naming no lineup whatever the resolver returned (R-1215):
  the notice's process and a lane's pi-worker each resolve the value against their own folder (`agent-dir.mjs:67-76`, `pi-worker.mjs:96`), so a lineup the notice named
  could differ from the one the lane starts. The pointer names the file this process resolved. Prior art agrees: install refuses a relative value
  (`nana-setup.mjs:119-127`), doctor warns (`doctor.mjs:439-440`), and the desk pins an absolute value into each child (`apps/desk/server.mjs:157,163-164`), so a desk
  session names the lineup.
- Examples (Ran `notice-lengths.mjs`, its revision-3 strings, typed by hand; revision 6's two new counts Ran with `node -e` on the same strings): default roster under
  D1's null, this Mac, 144 characters — `nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra · change: "roster" in
  ~/.pi/agent/nana-pack.json`. Under D1's other answer, 208 characters, the builders read `builders sonnet (Claude Code only) for larger lanes and gpt-6-luna high for
  small lanes`. A file roster with all five slots set, 180 (no scout named). Refused, 169 characters — `nana active · roster refused: roster.builder.provider must be a
  non-empty string with no whitespace or control character · change: "roster" in ~/.pi/agent/nana-pack.json`. Relative, 166 characters, with
  `PI_CODING_AGENT_DIR=pi-agent` read from `~/nana-pi` — `nana active · roster unknown: PI_CODING_AGENT_DIR is relative, so each folder may read a different roster
  file · change: "roster" in ~/nana-pi/pi-agent/nana-pack.json`.
- The pointer does not name `--json`: its runnable form, `; print it: node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs" --json`, adds 78 characters and takes the
  five-slot line to 258, longer than any line draft 2 accepted (at most 247; Ran `notice-lengths.mjs`, less the scout segment). The README's roster section names it
  instead (§3.8).

**3.5 Claude Code seat.** New `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`. Static imports: node built-ins only. Inside one try it dynamically imports the
module and config, `resolveRoster` (`nana-roster.mjs:98`), `piAgentDir` and `piAgentDirIsCwdRelative` (`agent-dir.mjs:67`, `:84`) and `readHookInput` (`packages/nana-setup/lib/shared-memory-input.mjs:11`,
whose header names only the shared-memory hook today and widens to both, `:3`); reads `source` from the input in its own inner try, so an input read error, which
`readHookInput` lets propagate (`:7`), counts as no source (none also for a TTY, empty, non-JSON or source-less input); prints `{"systemMessage": L, "hookSpecificOutput":
{"hookEventName": "SessionStart", "additionalContext": L}}`, leaving out `systemMessage` for compact. It exports its runner with the input stream injected, so H2 feeds
a stream that fails on read (Ran: a directory given as a spawned child's stdin reads as empty, not as an error, `r4probe/stdin-dir.mjs`). It reads no cwd of its own;
`piAgentDir` resolves a relative `PI_CODING_AGENT_DIR` against the process cwd (`agent-dir.mjs:67-76`), as pi resolves it against its own start folder (pack README
`:858`), so with a relative value the hook names no lineup (R-1215, §3.4; residual 18). It starts no child process. The catch prints the unavailable object with `err.code ?? err.name` only, because a module error message holds an
absolute path; that one constant lives in the hook, since the fail-open path cannot rely on an import. `hook-producer.mjs:15-21` is no precedent for that: the existing
hooks' markers live in a lib they import statically, and the objective marker embeds the CLI path. It starts no second node.
- Wiring: `nodeHook("nana-roster-notice.mjs", "nana: roster notice")` in `desiredHooks` (`settings.mjs:189-228`; no matcher, so it joins the matcher-less SessionStart group
  and needs no new merge or matcher case); `HOOKS` (`steps.mjs:44`); the `state-manifest.mjs:58` list (forced: without it uninstall leaves the link, Ran red at
  `uninstall.test.mjs:253,276`); the install-check `HOOKS` row and `DOCTOR_NOTES.win32` entry `hook nana-roster-notice.mjs` (`install-check-config.mjs:10-16,33`), with its
  own `ROSTER_NOTICE_PREFIX` and unavailable prefix as independent contract values; an exported `rosterNoticeOutputOk(stdout)` used in a new branch beside
  `install-check.mjs:273-281` (R-1209). The install-check fixture's seeded file holds no `roster` key (Read: `packages/nana-setup/pi/nana-pack.seed.json`), so the check
  sees the default notice.
- Rejected (`../research-startup.md` §2): wrapping the objective hook (its `[nana:objective]` contract; the line would vanish with the objective off), adoption or shared
  memory (plain-text contracts), `statusLine` (one user-owned slot).

**3.6 pi seat.** New `packages/nana-pack/extensions/nana-roster-notice.ts` (the manifests load the folder, `package.json:22`): on `session_start` with `ctx.hasUI` and a
reason in `SHOW_SOURCES` (pi 1.0.2: startup, reload, new, resume, fork, `types.d.ts:553-559`), it calls the same composition with the same relative check and sets one widget,
`ctx.ui.setWidget(WIDGET_KEY, [L])`, above the editor (pi 1.0.2's default placement, `interactive-mode.js:1821-1853`; `types.d.ts:101`). Not `notify`: the TUI shows an info
notice as a status line, and a second info status with nothing between them replaces the first (Read: `interactive-mode.js:2270-2280`, `:3060-3078`). nana-handoff raises
`compaction summary picked up from …` as info at startup (`nana-handoff.ts:420`) and loads just before this extension (Ran: `readdirSync` order on this Mac; pi does not
sort a manifest folder's files, Read: `package-manager.js:163-171`, `:2068-2085`), so a notify would erase that notice, which main shows today and the pack README promises
(`README.md:367-375`); where the order flips, the handoff notice would erase this one. A widget shares no status line, stays until the next show replaces it or pi resets
the extension UI on new, resume, fork or reload (Read: `resetExtensionUI`, `:1866-1880`, called at `:361` from the session teardown that resume, new and fork run,
`agent-session-runtime.js:102-113`, and at `:5309` on reload), and pi's own later status lines cannot replace it. It starts no child process, so the handlers after it
(`runner.js:813-839` awaits each in turn) wait on nothing new. No `NANA_ROLE` check: every `NANA_ROLE` child runs with stdin ignored and stdout in a file
(`pi-watchdog.mjs:177`), both documented launches pass `-p` (`pi-worker.mjs:106`; pack README `:153`), where `hasUI` is false (`types.d.ts:219`), and no child with a UI was
found (Read, `git grep NANA_ROLE`). The widget even when refused, never a warning: a whole-file problem already gets config.ts's one warning (R-082), so a second warning
would report it twice. It never throws. RPC has a UI and sends a string-array widget as a `setWidget` request (`rpc-mode.js:123-135`), so desk sessions show it as a widget
box above the input (`app.js:1485-1493`) with no desk code change; the install check's `pi --mode rpc` step stays green (Read: `install-check.mjs:246` checks only the exit,
`reload-runtime` and the journal line). An eighth extension means R-658, both package descriptions and the README counts say "eight".

**3.7 What each seat does with the lineup.** The new shared bullet (R-1193, R-1213, R-1214) makes the split a rule both seats read: nana-pi's AGENTS.md now, and every project's marker region
once it is regenerated. When the roster sets `largerBuilder`, the Claude Code seat starts a Claude Code entry as a subagent in the lane worktree with the model the roster
names, and a pi entry through `pi-worker --lane-size larger`; small lanes go through `--lane-size small`. The bullet reaches a project only when `nana-setup project`
rewrites its AGENTS.md region (Read: `project.mjs:186-228`), and a Windows project whose CLAUDE.md is a copy of AGENTS.md (`project.mjs:258-260`) never gets it into the
file Claude Code 2.1.299 loads there (Ran `strings`: AGENTS.md is "loaded where the project has no CLAUDE.md", `cc-strings.txt:295057`; the combination is INFERRED). The
notice reaches every project at once. So the split does not rest on the bullet: once the slot is set, plain lane mode refuses a launch with no size (R-1212) in every
project and on every platform, and a seat that never read the bullet learns both sizes from that refusal and the Claude Code way out from R-1191's. A pi seat shows `sonnet
(Claude Code only)` and, given `--lane-size larger`, gets R-1191's named refusal before any lock or spawn; under the bullet it stops and asks the user, never substituting
another builder, and the refusal names the two ways out as the user's choice. With `largerBuilder` null, the builder builds every lane in both seats, and the bullet
says so (R-1214), so a seat that remembers an earlier split does not act on it. This lane starts no Claude Code process
from pi (§6, later lane).

**3.8 Docs.** Shared working pattern: one new bullet after the seat land review bullet, separate from the default-pattern bullet so R-1126, R-1128 and nana-soul stay
untouched, with no owner name or work detail — "- Larger lanes: when the roster sets `largerBuilder`, a seat builds a larger or riskier lane with it: a pi entry through
`pi-worker --lane-size larger`, a Claude Code entry as a Claude Code subagent in the lane worktree; a small lane goes through `pi-worker --lane-size small`. A seat that
cannot start that builder stops and asks the user rather than starting another. With no `largerBuilder`, the builder builds every lane." (Ran `fc3/claims-probe-r4.mjs`: the claim scanner finds no claim in it.) nana-pi's marker
region regenerates (`nana-setup project`; `CLAUDE.md` links to `AGENTS.md`). Pack README: the Machine roster section gains the slot
("the builder for larger or riskier lanes"), the Claude Code entry with its four model names, `--lane-size`, `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"
--json` (prints this machine's roster as `{"roster": …}`: set the file's `roster` member to the printed `roster` value, adding the member or replacing the one there, keep
every other key, then change one value; the installer's file already holds an `objective` block, so the whole output pasted beside the file's object makes invalid JSON, and
pasted over it drops `objective` and any `gate` or `postEdit` block — Read: `pi/nana-pack.seed.json`, `steps.mjs:63`, `:589`; Ran: this Mac's file holds only `objective`),
"pull before you add `largerBuilder`: an older checkout refuses it by name", and one sentence that a JSON syntax error in this file also stops pi's gate at its next start
until it parses (Ran, `research-alter.md` §2, `probe/malformed-probe.mjs`); the Lane builder paragraph (`README.md:208`) gains `--lane-size` and, in its refusal list, "a
launch with no `--lane-size` once the roster sets `largerBuilder`" (R-1212), and keeps its other words; "Seven extensions" (`:28`) becomes eight, with a table row; the
"What you will see" list (`README.md:367-375`) gains a widget item, the roster notice above the editor at each session start until the next reset, and says that the
compaction-summary toast it lists still shows because the notice is a widget, not a toast; the item says the notice names each builder, the reviewer and the land by model
and thinking, never a provider or the scout (`nana-roster` prints both), and reads `roster unknown` while `PI_CODING_AGENT_DIR` is relative. Root README (`:11`, the packages bullet, and `:166`), both `package.json` descriptions, nana-setup README (`:37`, `:45`, `:438` "five" becomes six), the desk README runtime matrix
(three surface lists gain "roster notice"; doc only, because contract notes live where the consumer reads them), the shared runtime table (Notify column for the three nana
rows; no new column, so "ten capabilities" holds), `skill-claims.mjs` `EXEMPTIONS` gains one name, `nana-roster-notice.mjs` (Ran: the claim scanner flags only the hook's
`.mjs` name, `sh-skill-claims.out`; an exemption for the extension name would print `STALE exemption`, `skill-claims.test.mjs:75`), count comments
(`settings.mjs:171,181,416`, `steps.mjs:522` "all five on win32", `doctor.mjs:381,383`, `nana-writing.ts:4`, `config-handlers-malformed.test.mjs:4`,
`win32-degrade.test.mjs:68,92,123,229`; `:94`'s "the other four" is history and stays).

**3.9 What NOT to do.** No change to the other hooks, `nana-lifecycle.ts`, pi-review, the watchdog, the builder preamble (R-1110), the default-pattern and seat land review
bullets (R-1126 to R-1128), nana-soul, desk code, the objective or any memory file (the seat updates its roster memory after the land). No `claude -p` launch, no `set`
command, no doctor roster row, no pi prompt section, no footer chip, no git call, no open-lanes segment, no `NANA_ROLE` check in either seat, no change to how lane mode
resolves the agent dir (residual 18). Nothing the lane writes adds a
provider, host name, absolute home path or owner name; a line it edits keeps any name already there.

**3.10 Subtraction test.**

| Part | Earns it because | Cut or kept smaller |
|---|---|---|
| `largerBuilder` slot | the only shape that names a pi or a Claude Code builder for larger lanes, keeps every file valid, and is refused by name on an older checkout | one optional slot; `builder` stays pi-only |
| Claude Code entry | the only honest form for a model pi cannot start | two fields; the model from the four names the seat's Agent tool takes; no thinking (the Agent tool takes none); no effort, because the split names none and the Agent tool's `effort` field is optional, its help saying to set it only when the user or instructions ask (Ran: `cc-strings.txt:337100`); only `largerBuilder` may hold one |
| `--lane-size` | without it a pi `largerBuilder` is display-only on a pi seat; its Claude Code refusal is the later launcher's hook point | one option; default unchanged while the slot is null |
| No-size refusal (R-1212) | the notice reaches every project at once, but the bullet reaches only projects whose region is refreshed and no Windows copied CLAUDE.md; without it a seat there runs plain lane mode and the small-lane builder builds every lane in silence | one check after the roster resolves; nothing changes while the slot is null |
| Larger-lanes bullet | without it nothing tells a seat to pass `--lane-size larger` or to stop, so the notice shows a split no pi seat carries out; its null sentence stops a seat acting on a remembered split | one bullet of three sentences; no size rule (rulings lane); the default-pattern bullet untouched |
| New hook | only `systemMessage` reaches the Claude Code user; existing plain-text contracts stay | not folded into objective, adoption or shared memory |
| New extension | one purpose; a widget reaches the TUI and the desk and, unlike `notify`, erases no other extension's info notice | not in lifecycle (three purposes already); no chip (one truncated footer line, `footer.js:252-261`); no role check |
| One module plus config | the same line in both seats (R-1211); no effects | one export; no second formatter, one tilde helper |
| Change pointer | the owner's stated purpose: the user alters the lineup | names the file only; the runnable `--json` line would add 78 characters |
| `--json` print | a one-slot change becomes set the file's `roster` member to the printed value and change one value, not every slot by hand | read-only; no `set` (D2), no doctor row |
| Refusal cut and `~` | refusals echo values, quoted file text and the absolute path (Ran) | one cut marker, one placeholder, no parser |
| Unknown line (R-1215) | with a relative agent dir the notice's folder and a lane worktree read two files, so a named lineup could differ from the one a lane starts | one config value and one boolean from the existing helper; lane mode unchanged (residual 18) |
| `additionalContext` | the Claude seat model knows the lineup and the pointer, also after clear and compact | pi gets no prompt section: the shared section names the roster command |
| Install-check branch | an unbranched row passes on empty stdout (`install-check.mjs:273`) | one predicate, its own prefix copy |

## 4. Scope

**In.** New: pack `lib/roster-notice.mjs`, `lib/roster-notice-config.mjs`, `extensions/nana-roster-notice.ts`, `tests/roster-notice.test.mjs`; setup
`claude/hooks/nana-roster-notice.mjs`, `tests/roster-notice-hook.test.mjs`. Changed: `worker-config.mjs`, `nana-roster.mjs`, `pi-worker.mjs`, `settings.mjs`, `steps.mjs`,
`state-manifest.mjs`, `install-check-config.mjs`, `install-check.mjs`, `doctor.mjs` and `nana-writing.ts` (comments), `shared-memory-input.mjs` (its @purpose names both
SessionStart hooks), `templates/_shared/working-under-nana-pi.md` (the table
and one bullet) and nana-pi's marker region, `skill-claims.mjs`, two `package.json`, four READMEs, §5.2's tests, `REQUIREMENTS.md`, the regenerated tree and code map,
`HANDOFF.md` (queue line, Landed line and the D1 carry), `docs/sessions/2026-10.md`, the review corpus (with a `test-title-map.json` for the seven renamed titles, as `win32-degrade.test.mjs:95` expects); HANDOFF and session lines paraphrase the owner and quote nothing.
**NOT.** §3.9; the rulings file. **Overlap.** `feat/regroup` rewrites `REQUIREMENTS.md` and the tree; this lane starts after it lands, rebases before the build, and cites
rows by ID. `feat/t3-land-b` has no worktree and no new commits since 2026-10-08.

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). Tunables imported by name; L3 alone holds the notice config's
sealed literals and N2 the subagent model list. PATH-less runs use an empty folder; fixture providers are placeholder strings found nowhere else in the fixture, so a leak is
a substring hit, except L2's one fixture whose model id contains its provider, which L2 checks by the exact entry text.

**5.1 New checks (36 titles, plus 4 loop instances).**
- **`packages/nana-pack/tests/roster-notice.test.mjs`:**
  L1 `// req: R-1194` `roster notice: one line that starts with the prefix and names the builders, reviewer and land by model and thinking`.
  L2 `// req: R-1195` `roster notice: each entry shows its model and thinking and never its provider field, for a default, a file and a Claude Code roster and a
  model id that contains its provider`.
  L3 `// req: R-1194 R-1196 R-1197 R-1201 R-1202 R-1203 R-1206 R-1210 R-1215` `roster notice: sealed values — prefix, size labels, Claude Code mark, default mark, refusal
  head and cut, change pointer, relative-dir text, shown start sources and widget key`.
  L4 `// req: R-1196` `roster notice: a larger-lane builder is named for larger lanes before the builder for small lanes`.
  L5 `// req: R-1197` `roster notice: a Claude Code entry's model is followed by the Claude Code mark, and a pi entry's is not`.
  L6 `// req: R-1198` `roster notice: a null land reads land seat`.
  L7 `// req: R-1199` `roster notice: a scout is never named, set or null`.
  L8 `// req: R-1200` `roster notice: a lone builder carries no size label`.
  L9 `// req: R-1201` `roster notice: only the default roster is marked default, and a file roster equal to the default is not`.
  L10 `// req: R-1202` `roster notice: every refusal kind shows the problem cut before its first ' (' with no echoed value or line break, and a roster path holding ' (' stays
  whole` (iterates the resolver's refusal kinds, including invalid JSON beside a provider string, an unexpected key holding a line feed, and a directory refusal under an
  agent dir named `My (old)`).
  L11 `// req: R-1203` `roster notice: every notice, refused ones included, ends with the change pointer and the roster file`.
  L12 `// req: R-1204` `roster notice: the roster file shows the home folder as ~ wherever it appears` (the pointer, a directory refusal and a dangling-symlink refusal; a file
  outside the home folder stays absolute).
  L13 `// req: R-1210` `extension: with a UI, startup, new, resume and fork each set exactly one widget above the editor holding only the notice, a refused
  roster included, and raise no notify`.
  L14 `// req: R-1210` `extension: no UI, and the reload reason, each set no widget and raise nothing`.
  L15 `// req: R-1211` `parity: the hook and the extension show the same notice for a default, a file and a refused roster` (agent dir outside both homes).
  L16 `// req: R-1215` `relative agent dir: the hook and the extension each show the unknown line and the change pointer, naming no lineup, for a file and a refused
  roster` (both seats started in one folder whose `rel/nana-pack.json` holds the roster, with `PI_CODING_AGENT_DIR=rel`).
- **`packages/nana-setup/tests/roster-notice-hook.test.mjs`:** H1 `// req: R-1205` `roster notice hook: one JSON object with the notice as SessionStart context on every
  source and with no source, and exit 0`. H2 `// req: R-1206` `roster notice hook: the notice is a user message for startup, resume, clear and fork, for a missing
  or unreadable source and for an input that fails on read, and not for compact` (the read failure through the injected stream, §3.5). H3 `// req: R-1207` `roster notice hook: a copy that cannot load its modules prints the unavailable notice in both fields with no path, and exits 0`.
- **`install-check.test.mjs`:** I1 `// req: R-1209` `roster notice: plain text, two objects, a missing user message, a missing SessionStart context or the unavailable notice
  each fail`.
- **`nana-roster.test.mjs`:** N1 `// req: R-1121` `a machine roster without largerBuilder reads it as null, and one with a pi or a Claude Code entry keeps it as written`. N2
  `// req: R-1122` `each invalid largerBuilder, and a runtime field in any other slot, is refused naming the slot or field` (a string, an array, runtime `claude`, a Claude
  Code entry with thinking or without model, a full model name, a bracketed variant such as `sonnet[1m]`, a model with a space, a pi entry missing thinking; null and each of
  the four subagent names accepted). N3 `// req: R-1123` `roster command prints largerBuilder after the builder: claude-code and the model, a pi entry's three fields, or
  none`. N4 `// req: R-1192` `roster command --json prints one roster object whose roster value, set as the roster member of a file holding the installer's seed, the
  resolver reads back as the same roster, for the default and a file roster` (the file starts as `pi/nana-pack.seed.json`, so the check follows the README's edit). N5
  `// req: R-1192` `roster command --json prints a refused roster on stderr with empty stdout and exits 1`.
- **`worker-lane.test.mjs`:** W1 `// req: R-1190 R-961` `lane size larger starts pi with the larger-lane builder's provider, model and thinking, each flag once`. W2
  `// req: R-1190` `lane size larger with no larger-lane builder starts pi with the builder`. W3 `// req: R-1191` `lane size larger refuses a Claude Code larger-lane builder
  before lock or spawn, naming roster.largerBuilder and both ways out as the user's choice`. W4 `// req: R-960` `lane size with a missing or unknown value refuses before pi spawn`. W5
  `// req: R-1124` `lane size larger prints the larger-lane builder line before starting pi`. W6 `// req: R-1212` `with a larger-lane builder set, a launch with
  no lane size, the --lane-size=larger form included, is refused before lock or spawn, naming largerBuilder and both sizes`.
- **`templates-render.test.mjs`:** T1 `// req: R-1193` `shared working pattern sends a larger or riskier lane to the roster's larger-lane builder, a pi entry through
  lane size larger and a Claude Code entry as a subagent in the lane worktree`. T2 `// req: R-1213` `shared working pattern says a seat that cannot start the larger-lane
  builder stops and asks the user`. T3 `// req: R-1214` `shared working pattern says the builder builds every lane when the roster sets no larger-lane builder`. Each
  reads the shared file's `- Larger lanes:` bullet, as R-1128's check reads its two bullets.
- **`hooks-win32-exec.test.mjs`** (Windows leg only): X1 `// req: R-1058` `roster notice: exit 0 within its own timeout, no module-resolution error`. X2 `// req: R-1063`
  `roster notice: one JSON object whose user message starts with the roster notice prefix`.
- Loop instances from extended lists: `hook nana-roster-notice.mjs is a symlink into the repo` (`install.test.mjs:99`, R-301 R-985); `doctor: "settings SessionStart roster
  notice" is ✓` (`hooks-win32-exec.test.mjs:182`, R-1055, Windows leg only); `win32: hook nana-roster-notice.mjs reports skipped (win32)` and `win32: settings SessionStart
  roster notice is created, not skipped` (`win32-degrade.test.mjs:61,69`, no marker; forced platform, so they run on macOS).

**5.2 Census of existing checks that change** (Ran in a scratch copy for settings-merge, install-check, uninstall, templates-render and skill-claims, `research-surfaces.md`
§4; re-read in `factcheck.md` and `factcheck-r3.md`). Lines are at `2dbc817`. Once `feat/regroup` lands, templates-render lines move by +2 after `:188` and +49 after
`:473` (`:274`, `:342`, `:407` become `:276`, `:344`, `:409`; the claim-scanner lines `:551`, `:573`, `:580`, `:739`, `:749`, `:756` become `:600`, `:622`, `:629`,
`:788`, `:798`, `:805`) and root README `:166` becomes `:167` (Ran: `git diff -U0` and a title match against `656dc86`); the build works from titles.

| Check | Row | Change |
|---|---|---|
| `settings-merge.test.mjs:35` five active hook entries are wanted | — | red; renamed "six", count 6 |
| `settings-merge.test.mjs:117` empty settings: all five active entries added | — | red; renamed "all six", count 6 |
| `settings-merge.test.mjs:138` the other five are added | — | red; renamed "the other six", count 6 |
| `settings-merge.test.mjs:142` nana SessionStart hooks appended to the same group | R-316 | red; group length 4 becomes 5 |
| `settings-merge.test.mjs:302`, `:304` POSIX desiredHooks deep-equals today's fixture; with no platform | R-1061 | red; fixture gains the entry; marker gains R-1208 |
| `settings-merge.test.mjs:392` forced-win32 removeInstallerHooks removes exactly the five entries | R-1050 | red; renamed "six", count 6 |
| `settings-merge.test.mjs:799` install migrates the three exact legacy commands in place… | R-908 | red; only `migrated.length` changes, 5 to 6: `migrated[4]` still reads the foreign `after` entry, because the migration runs first (`steps.mjs:521`) and `mergeHooks` (`:527`) pushes the new entry to index 5 (`settings.mjs:532`) |
| `settings-merge.test.mjs:278` win32 desiredHooks: the four hook entries name packages/nana-setup/claude/hooks/ | R-1051 | green today; renamed "five", list gains the hook (pins the reworded row); R-1051's evidence cell takes the new title |
| `install-check.test.mjs:45` sealed hook table and allowed entry shape | R-1074 | red; 6 rows, labels gain `hook roster notice` |
| `install-check.test.mjs:474` pin R-1074 R-1082: the hook table with its form columns… | R-1074, R-1082 | red; gains the row |
| `install-check.test.mjs:242` environment: every child gets the base environment… | R-1071, R-1075, R-1079, R-1084 | red (Ran); the `isHook` regex at `:251` gains `roster-notice` |
| `install-check.test.mjs:758` pin R-1081: the doctor note list | R-1081 | red; win32 gains `hook nana-roster-notice.mjs` |
| `install-check.test.mjs:357` and the 14 single-FAIL checks (`:585`, `:587`, `:589`, `:591`, `:593`, `:595`, `:610`, `:616`, `:618`, `:620`, `:622`, `:624`, `:626`, `:825`) | R-1070, R-1076, R-1077, R-1083 | red once the output branch exists (Read: the stub's empty fallback at `:219`; `assertOnlyHookFails` at `:576-582`); the stub gains a roster notice branch beside `:204-217`, no check edited |
| `install-check.test.mjs:321` platform: NANA_SETUP_PLATFORM in the caller changes nothing | R-1071 | red from the stub until its branch exists; also edited: the regex at `:328` gains `roster-notice` and `>= 5` at `:329` becomes 7 (Ran `fc3/hookcount.mjs` on the test's own fixture stub: the regex matches 6 calls today on linux and darwin — objective, adoption, shared memory, knowledge, verifier hit and miss — and 7 with the hook, so a floor of 6 would stay green under pair 36) |
| `install-check.test.mjs:289` spawn: every child goes through the injected spawn… (list at `:297`); `:517` dispatch: each hook runs in the fixture project… (regex and `>= 5` at `:519`) | R-1084; R-1075 | green with the hook; the `:297` list gains `nana-roster-notice.mjs`; the `:519` regex gains `roster-notice` and its floor becomes 7 (6 today, Ran as above) |
| `install-check.test.mjs:523` dispatch: the three SessionStart entries start before any of them finishes | R-1075 | green with the hook; renamed `dispatch: every SessionStart entry starts before any of them finishes`, its script set and count read from the sealed `HOOKS` table; R-1075's evidence cell takes the new title |
| `uninstall.test.mjs:292` dry-run lists manifest pieces without writes… | R-903 to R-907 | red (Ran); labels at `:288` gain `hook nana-roster-notice.mjs` |
| `state-manifest.test.mjs:65` every path created by install maps to a nana-setup-owned manifest row (hook list `:56`, `Array(17)` at `:61`) | R-954 | green; list gains the hook, `Array(18)` |
| `restore.test.mjs:51` non-durable fixture stores | R-958 | green (Read: `:119-120` uses the list only as a filter); list gains the label, for coverage |
| `win32-degrade.test.mjs:61`, `:69` | — | green; lists gain the hook |
| `config-handlers-malformed.test.mjs:21` extension list | R-082, R-083, R-780 | green (Ran in draft 2 with a notify-form stub; the widget form is Read, not run); gains the extension; its fake UI holds `notify` and `setStatus` but no `setWidget` (`:110`), so the extension, which never throws (§3.6), sets nothing there and adds no warning to the check's count |
| `templates-render.test.mjs:342` shared runtime matrix declares four runtime surfaces, ten capabilities… | R-680, R-985 | red (Ran); `RUNTIME_INVENTORY_TEXT` gains two keys; three table-row literals change |
| `templates-render.test.mjs:274` AGENTS.md marker-owned section is byte-identical to the shared file | R-859 | red until `nana-setup project` regenerates the region (the table and the new bullet) |
| `templates-render.test.mjs:407` desk matrix states nana resources for every spawn class… (marker `:406`) | R-685 | red; three literals gain "roster notice" |
| `templates-render.test.mjs:551`, `:573`, `:580`, `:739`, `:749`, `:756` (8 instances); `skill-claims.test.mjs:39`, `:78`, `:80` | R-598 (R-599, R-629) | red (Ran); fixed by one `EXEMPTIONS` name, no check edited |
| `nana-roster.test.mjs:40` sealed default roster is luna high builder, sol reviewer, astra land and no scout | R-1120 | green; gains one assertion for `largerBuilder` (null, or the Claude Code entry under D1's other answer); title kept, so R-1120's evidence cell stays as it is |
| `nana-roster.test.mjs:209` roster command prints one line per slot and the source | R-1123 | red; both exact stdouts gain `largerBuilder: none` after the builder |
| `readme-check.test.mjs:75` front-door descriptions name both runtimes and all seven extensions (marker `:74`) | R-658 | renamed "all eight", list gains `roster notice`; R-658's evidence cell takes the new title |
| `requirements-tree.test.mjs:40` …leaf counts total 1,139 | R-291 | red; the total at the base plus 26 |
| `requirements-trace.test.mjs:61` REQUIREMENTS.md and the markers the suite carries agree | — | red while a marker traces a `planned` row or an evidence cell cites a renamed title; green once the rows flip and the R-1075, R-1051 and R-658 cells take the new titles |
| `code-map.test.mjs:39`, `npm run map:check` | G-004, G-009, G-010 | red until the map is regenerated |

Green with no edit: settings-merge `:45`, `:276`, `:280`, `:839`, `:856`; win32-degrade `:103-109`, `:126`, `:132-135`, `:210-238` (cover R-1056's six); hooks-win32-exec
`:100`; install-check `:539`, `:551`; `install.test.mjs:333` (Read: the space-in-home loop at `:331` runs every SessionStart command through bash with empty stdin and asserts exit 0
and no missing-file text, so it runs the new hook too); every existing worker-lane check (the default lane is unchanged); `win32-launch.test.mjs:222-232`; nana-roster
`:55`, `:66` (the default is still returned by identity), `:75`, `:89`, `:103`, `:120`, `:154`, `:167`, `:197`, `:220`; templates-render `:373-382` (R-1126, R-1127), `:392`
(R-1128) and `:398` (R-1142; the new bullet has its own label).

**5.3 Fact-check fold-in.** `../factcheck-repo.md` (draft 1): items 1-9 and 13 stay folded as draft 2 recorded them; 10-12 belong to the rulings lane; the owner has
answered where the split lives, and the default value is D1. `factcheck.md` (draft 2), each WRONG item: 1, the trace rail is in the census and R-1075's evidence cell in §2,
with R-1051's and R-658's; R-1120 keeps its cited title instead. 2, the path is set aside before the cut and comes back as `tildeify(file)`; L12 and pair 16 add the
dangling-symlink refusal. 3, pair 33 reds the `win32-degrade.test.mjs:69` instance, and the `hooks-win32-exec.test.mjs:182` instance is named Windows-only. 4, pair 35 reds
the `install.test.mjs:331` instance, which is also in Green with no edit. 5, FEAT-017 is in the header. 6, R-1120's evidence cell keeps the name; the lane changes only its
requirement text. 7, D2 is qualified. 8, one `EXEMPTIONS` name. 9, moot: the open-lanes segment is cut, and the fixture now sees the default notice. 10, §3.1 cites
`fc/shape-larger.mjs`. 11, §1 says the drop is INFERRED from strings. 12, §3.3's `REFUSAL_CUT` provenance names `:34`, `:37-40`, `:63` and `:85`. 13, §3.2 names `:47`,
`:72-74`, `:22` and `:132` in the right roles. 14, the census cites readme-check `:75`, templates-render `:407`, state-manifest `:56` and `:61`, install-check `:328` and
`:329`. 15, the acceptance cites `hooks.md:1013` only. 16, §3.8 lists the other count comments. 17, `:321` has one census row, and the refusal has one text (§3.2, R-1191, W3). `factcheck-r3.md`: MUST 1 and 2 are seat revision 3's items 14
and 15; its SHOULD items are folded as seat revision 4 lists (item 12).

**5.4 Wrong code first.** Each pair edits code or text, never an assertion, and must red exactly the named checks (N/N in the seat's mutation runner on macOS, where the
win32-degrade checks run under the forced platform; X1, X2 and the `hooks-win32-exec.test.mjs:182` instance run on the Windows leg only and are outside the runner). Each
pair on the larger-lanes bullet (60, 63, 64) edits the shared file and nana-pi's regenerated region alike, as pair 57 does, so `templates-render.test.mjs:274` stays
green. 68 pairs.

| # | Wrong code | Reds |
|---|---|---|
| 1 | the notice prints each provider before its model | L1, L2 |
| 2 | the notice drops the thinking level | L1 |
| 3 | segments join with a line feed instead of ` · ` | L1, L10 |
| 4 | `NOTICE_PREFIX` changed in the config | L3 |
| 5 | `CHANGE_POINTER` changed in the config | L3 |
| 6 | the small-lane builder is named first | L4 |
| 7 | the size labels stay when `largerBuilder` is null | L8 |
| 8 | the Claude Code mark is left out | L5 |
| 9 | pi entries get the Claude Code mark too | L5 |
| 10 | a null land prints nothing | L6 |
| 11 | the notice names a set scout | L7 |
| 12 | a file roster equal to the default is marked `(default)` | L9 |
| 13 | the whole refusal is shown, value echo included | L10 |
| 14 | the problem text skips `displayText`, so a key holding a line feed survives | L10 |
| 15 | the cut runs before the path is set aside, so a path holding ` (` is cut in half | L10 |
| 16 | the path goes through `tildeify` alone, so a dangling-symlink refusal keeps the absolute path | L12 |
| 17 | the change pointer prints the absolute path | L12 |
| 18 | a refused notice leaves out the change pointer | L11 |
| 19 | the extension sets the widget with no UI | L14 |
| 20 | the extension sets the widget on reload | L14 |
| 21 | the extension skips fork | L13 |
| 22 | the extension shows a refused roster as a warning notify instead of the widget | L13 |
| 23 | the extension formats its own line without the change pointer | L15 |
| 24 | the hook sets `systemMessage` on compact | H2 |
| 25 | the hook drops the context on compact | H1 |
| 26 | the hook puts `additionalContext` at the top level | H1 |
| 27 | the hook prints a plain line before the JSON | H1, L15 |
| 28 | the hook leaves out `systemMessage` when its input is empty | H2 |
| 29 | the fail-open path exits 1 | H3 |
| 30 | the fail-open path prints plain text | H3 |
| 31 | the fail-open reason is the error message, which holds the module path | H3 |
| 32 | the roster notice entry gets timeout 10 | settings-merge `:302`, `:304` |
| 33 | `desiredHooks` leaves out the roster notice row | settings-merge `:35`, `:117`, `:138`, `:142`, `:278`, `:302`, `:304`, `:392`, `:799`; the `win32-degrade.test.mjs:69` instance (INFERRED from the edited counts and lists); the `hooks-win32-exec.test.mjs:182` instance on the Windows leg |
| 34 | the state manifest leaves the hook out | uninstall `:253`, `:276`, `:292`; state-manifest `:65` |
| 35 | `steps.HOOKS` leaves the hook out | the `install.test.mjs:99` instance; the `install.test.mjs:333` instance for this hook; state-manifest `:65`; the `win32-degrade.test.mjs:61` instance (uninstall `:292` stays green, Read: an absent link row still lists) |
| 36 | the install-check table drops the roster notice row | I1; install-check `:45`, `:474`, `:289`, `:321`, `:517` |
| 37 | the roster notice branch accepts plain text | I1 |
| 38 | the roster notice branch accepts the unavailable notice | I1 |
| 39 | `DOCTOR_NOTES.win32` leaves the hook out | install-check `:758` |
| 40 | the resolver returns the file's object as written, so an absent `largerBuilder` reads as undefined | N1 |
| 41 | runtime `claude` is accepted | N2 |
| 42 | a `runtime` field on `builder` is accepted | N2 |
| 43 | a Claude Code entry with thinking is accepted | N2 |
| 44 | a Claude Code entry's model gets only the pi string rule, so a full model name is accepted | N2 |
| 45 | the command prints `largerBuilder` after the reviewer | N3, nana-roster `:209` |
| 46 | the command prints a Claude Code entry with a provider column | N3 |
| 47 | `ROSTER_DEFAULTS.largerBuilder` changed | nana-roster `:40`, `:209` |
| 48 | `--json` prints the roster without the `roster` key | N4 |
| 49 | `--json` prints a refused roster's problem on stdout and exits 0 | N5 |
| 50 | `--lane-size larger` starts the builder although `largerBuilder` holds a pi entry | W1, W5 |
| 51 | `--lane-size larger` refuses a null `largerBuilder` instead of falling back | W2 |
| 52 | lane mode passes a Claude Code entry's model to pi | W3 |
| 53 | the Claude Code refusal comes after the lock is taken | W3 |
| 54 | the Claude Code refusal leaves out the pi-entry way out | W3 |
| 55 | an unknown lane size runs as `small` | W4 |
| 56 | the larger-lane line prints `builder:` | W5 |
| 57 | the shared matrix and the regenerated region drop the hook name | templates-render `:342` |
| 58 | the front-door package bullet leaves out the roster notice | readme-check `:75` |
| 59 | the desk README matrix drops "roster notice" | templates-render `:407` |
| 60 | the larger-lanes bullet says a seat that cannot start that builder uses the builder instead | T2 |
| 61 | lane mode with no `--lane-size` runs the builder although `largerBuilder` is set | W6 |
| 62 | the extension also raises the notice as an info notify, which erases nana-handoff's startup notice | L13 |
| 63 | the larger-lanes bullet sends a pi entry through plain `pi-worker --lane` | T1 |
| 64 | the larger-lanes bullet leaves out its sentence for a roster with no `largerBuilder` | T3 |
| 65 | the hook reads its input inside the module try, so an input read error prints the unavailable notice | H2 |
| 66 | the notice removes each provider string from the line, so model `acme-large` under provider `acme` prints as `-large` | L2 |
| 67 | the larger-lanes bullet leaves out the small-lane route through `pi-worker --lane-size small` | T1 |
| 68 | the notice ignores its `relative` argument, so a relative `PI_CODING_AGENT_DIR` shows the lineup or the refusal | L16 |

Recount: notice 1-18, 66 and 68 (20), extension 19-23 and 62 (6), hook 24-31 and 65 (9), installer and install check 32-39 (8), roster and lane mode 40-56 and 61 (18),
text 57-60, 63, 64 and 67 (7); 20 + 6 + 9 + 8 + 18 + 7 = 68, numbered 1 to 68 with no gap (61 to 68 appended so earlier pair numbers keep their meaning). Every new check
except the Windows-only X1, X2 and the `hooks-win32-exec.test.mjs:182` instance has at least one pair the runner runs (T1 63, T2 60, T3 64, L16 68; Ran
`fc3/claims-probe-r4.mjs`: the claim scanner finds no claim in the bullet or in pair 63's or 64's text).

**Seat acceptance** (seen failing at the base). On this Mac: the hook with `{"source":"startup"}` prints one JSON object holding §3.4's default line; `pi --mode rpc
--no-session` in the repo writes one `setWidget` request whose `widgetLines` hold only the same text, and no `notify` request (R-1211 by hand); `claude -p --output-format
stream-json --verbose --no-session-persistence` in a temporary folder shows the hook's `systemMessage` (`hooks.md:1013`; one small paid call). Lane mode with a temporary
agent dir and a stub pi: `--lane-size larger` refuses a Claude Code `largerBuilder` by name with both ways out as the user's choice; with a pi `largerBuilder` it prints the larger-lane line;
with none it starts the builder; with any `largerBuilder` and no `--lane-size` it refuses naming both sizes. `nana-roster.mjs --json` with a temporary agent dir whose file
is the installer's seed: its `roster` value, set as that file's `roster` member by the README's words, resolves to the same roster and `objective` stays. Then `npm run
test:locked`, `map:check`, `readme:check`, the tree check, the trace rail, and `install-check.mjs` on macOS. Windows: the PR's leg passes H1-H3, X1 and X2; CI's Windows
install check passes the roster notice row (`DOCTOR_NOTES` included).

**The claim most likely wrong:** that the user sees the notice as meant. pi now shows it as a widget above the editor, which no status line replaces, but it stays until the
next reset, and at 80 columns the 144- to 208-character lines wrap to two or three rows (INFERRED from the lengths and the widget's one-column padding,
`interactive-mode.js:1840`); whether that is too much screen is the feel check's question. Claude Code documents `systemMessage` as a "Warning message" (`hooks.md:1013`);
its look is unobserved. The RPC check above proves the call, not the look; the owner's feel check in each TUI, macOS and Windows, decides. Next most likely: that seats pick
the right size. R-1212 makes every seat name a size once the slot is set, but which size is the seat's judgment, and a seat in a project without the bullet has only the
refusal text to go on (INFERRED).

## 6. Decisions and residuals (each becomes one HANDOFF line)

**The owner's calls (ask before the build; each recommendation is the plan's default).**
- D1 Default larger-lane builder. The code default is null (recommended). Today the default prints luna as the only builder (Ran). The costs in plain numbers:
  - With null, this Mac needs 1 file edit (set the file's `roster` member to the `roster` value `--json` prints, keeping the file's other keys, then change one value)
    before its next larger lane; until then, under the new bullet, its larger lanes go to the small-lane builder. Once a file sets the slot, every lane launch on that
    machine must name a size (R-1212). The Windows machine needs 1 edit under either answer. Every other machine changes nothing.
  - With `sonnet`, this Mac needs 0 edits. Every new machine's default larger-lane builder becomes a Claude Code subagent, which runs outside 4 lane-mode protections: the
    worktree lock, the branch check, the 8-hour ceiling and the pi gate's worktree write guard. The seat's own records treat a seat-started subagent as unfit to build by
    default, with one exception for this builder; `sonnet` makes that exception the public default. A pi-only machine can never start it, so every larger lane there stops
    and asks. Under R-1212 every lane launch on every new machine must also name a size, so a plain `pi-worker --lane` command or brief there is refused until it
    does. A machine with a roster file ignores the default slot (R-1121), so the Windows machine (reported to hold one, INFERRED from the seat's memory) still needs its
    edit.
  - Recommend null: it changes nothing for anyone else and puts the split in the file the user edits. Your call: it sets what every new machine's lineup says.
- D2 One-command change. This lane adds the read-only `--json` print and points at the file. A guarded `nana-roster set <slot> …` (refuses inside pi model shells and
  builder children, keeps every other key, writes a temporary file then renames, keeps a `.bak`) makes it one command and never writes broken JSON; a hand-edit typo can
  stop pi's gate (Ran: one trailing comma). Recommend `set` as the next small lane. Your call: it would be the first command-line writer of the file that holds the gate rules,
  and the first writer of `roster` anywhere; the desk's settings save already replaces the whole file and keeps a `.bak` (`apps/desk/server.mjs:1385-1395`, `:2354-2359`),
  but refuses a body that holds `roster`.
- D4 One larger-lane builder per machine. This is a live case: the owner runs both seats on one Windows machine with one file (INFERRED from the seat's memory). One slot set
  to a Claude Code model makes that machine's pi seat stop and ask on every larger lane; a pi model in it makes the Claude Code seat build larger lanes with that pi model.
  A per-seat slot would remove the trade at the cost of a second format change. Recommend one slot now and a per-seat slot only on demand. Your call: it is a lineup rule,
  and the owner's own machine is the case.
- D5 A pi seat starting a Claude Code builder stays a later lane's question (below): whether a pi seat should ever start one, and the permission mode a headless builder
  runs under.

**Decided by the owner (2026-10-16; replaces D3).** No name sweep now: the repository will be archived and republished once it has outside users. This lane adds no name,
and a line it edits keeps any name already there. R-1120's evidence cell holds the owner's name (Read, `REQUIREMENTS.md:342`), so the lane changes only that row's
requirement text and keeps the cited check's title.

**Seat decisions (declared, not asked).** S1 Shape B, key `largerBuilder`, Claude Code entry `{runtime, model}` with the model from the four subagent names. S2 The picker
ships here (placement ii: one lane, the lineup as its first commit group), because the owner tied the notice to altering the lineup and a slot no seat can start from lane
mode would be display-only. S3 The notice says "roster", the word the user edits and the command prints; "fleet" stays a lane nickname. S4 One notice form in both seats,
`(Claude Code only)` included, naming models and thinking but never a provider or the scout, and no lineup under a relative agent dir (§3.4). S5 pi shows a widget, never a notify: an info notify would erase another extension's info notice at the same start (§3.6), and a warning
would repeat config.ts's (R-082). S6 Shown at every session start in both seats: startup, resume and fork, plus Claude Code's clear and pi's new, since a new session is a session
start; compact and reload continue a session and stay out; Claude context on every source; no pi prompt section. S7 `--json` ships here as the
read-only half of changing the lineup; the notice's pointer stays the file, and `set` stays D2. S8 Both the new shared bullet and the refusal text tell a seat what to do
with a builder it cannot start, the refusal as the user's choice, and R-1212's refusal makes a seat choose a size where the bullet has not reached. S9 The desk README matrix is updated as a contract note;
no desk code. S10 Class FORMAT, two plan rounds, larger-lane builder.

**Residuals and carries.** 1. An older checkout or a revert refuses a file holding `largerBuilder`, naming it, so lane mode stops: pull first (README says so); `--json`
always prints the slot, null included. 2. An older pi-worker ignores `--lane-size` and runs the small-lane builder (Ran: unknown options are ignored); the builder line is
the only signal. 3. A Claude Code entry has no effort field; adding one later is another format change. 4. Lane size is the seat's judgment under the bullet's "larger or
riskier"; the detailed size rule stays in the seat's memory until the rulings lane. 5. After the land the seat updates its roster memory to take the larger-lane builder
from the roster, not from memory. 6. Carry (D1): after the land, with the owner's yes, write a `largerBuilder` into the user-scope file on each of the owner's machines,
this Mac and the Windows machine; the Windows file keeps its own other slots. 7. The notice's look in either TUI is unobserved: one feel check per seat, macOS and Windows.
In pi the widget stays above the editor until the next reset and wraps to two or three rows at 80 columns; if that is too much, clearing it at the first prompt is one more
handler and one more check. 8. A `PI_CODING_AGENT_DIR` outside the home folder prints absolute; an unexpected key name survives the cut; a private provider's model id could
carry a company word (the validator accepts any pi id). 9. A JSON slip in the file stops pi's gate at the next start (existing; now documented, and the notice shows
`invalid JSON`). The `--json` edit is by hand: the README says to set only the `roster` member, because the installed file already holds `objective`; `set` (D2) would
remove the hand edit. 10. Desk sessions show a widget box above the input from each start until the next reset. 11. Counts in R-301, R-1051, R-1055, R-1056 and R-658 change
again with the next hook or extension; `state-manifest.mjs:58` keeps its own hook list. 12. A machine gets the hook only when `nana-setup install` runs there; Windows also
needs Claude Code 2.1.139 or later. 13. A Claude Code subagent model name outside the four, such as a new alias, needs a nana update; until then the roster refuses it by
name. 14. Any headless `claude -p` run without `--setting-sources ''` now gets a `systemMessage` in its stream-json output and the notice in its context (`hooks.md:1013`);
the repo's bench judge passes the flag (Read: `apps/bench/lib/catch-judge.mjs:115`); other callers on a machine are unknown. 15. Another project's marker region carries the
new bullet only after `nana-setup project` runs there, and a Windows project whose CLAUDE.md is a copy never carries it in the file Claude Code loads (INFERRED; §3.7).
R-1212 makes every seat there choose a size once the slot is set, so the remaining effect is that the choice rests on the refusal text alone. 16. The roster command ignores
any argument other than `--json`, as it ignores all today, so a typo prints the plain lines. 17. A non-lane `pi-worker` or `pi-review` call whose pi arguments leave out
`-p` or ask for RPC is outside the documented launch; such a child could put the notice into its output file (INFERRED). 18. A relative `PI_CODING_AGENT_DIR` resolves
against each process's own folder, as pi does today (pack README `:858`), so the notice names no lineup then (R-1215) and points at the file its own process resolved.
Lane mode keeps today's behaviour: pi-worker resolves the value against the lane worktree (`pi-worker.mjs:96`) and starts that folder's builder, whose model and source
its builder line prints (R-1124); a relative value's lineup is visible only there. 19. The hook runs with Claude Code's environment (`hooks.md:414`, `:754`), while Claude
Code's Bash tool starts from the user's shell profile (INFERRED): a `PI_CODING_AGENT_DIR` exported only in the profile, with Claude Code started from an app or an IDE,
makes the notice read the home agent dir while the seat's `pi-worker` reads the other one; the notice's path shows which (INFERRED). 20. Residual 14 has a known caller:
pi-subagents 0.75.0, the version doctor requires (`doctor.mjs:164`), starts Claude Code children with `--setting-sources user` (Read: `claude-code-adapter.js:222`), so
each child runs the hook, and its environment allowlist (`:14-47`) holds no `PI_CODING_AGENT_DIR`, so a child's context can name a different roster file from the pi seat's.
21. The notice never names the scout (R-1199), because no nana code or rule starts one (re-Ran: `git grep -i scout` outside tests finds only the roster's own parse and
print, the README and the desk's note on pi-subagents' built-in scout agent); `nana-roster` still prints it, and a later lane that gives the scout a launcher adds it to
the notice with one row. 22. The desk's nana-pack editor posts every top-level key of the file back (Read: `apps/desk/public/app.js:2186`) and the server refuses any key outside its
list (`apps/desk/server.mjs:1385`, `:2358-2359`): it already refuses every save of the user-scope file on an installed machine, which holds `objective`, and once that file
holds `roster` it also refuses that key by name; the lane invites users to add the key and does not change the desk. 23. The notice names each entry by model and
thinking only (R-1195; §3.4 gives the reason), so two providers serving one model id read alike in it; `nana-roster` and a lane's builder line name the provider
(`nana-roster.mjs:119-127`, `pi-worker.mjs:99`).

**Later lanes.** (a) Headless Claude Code builder through lane mode (D5): replaces R-1191's refusal with a launch; needs a runtime-chosen launcher in the shared watchdog
(touches R-1125, which pi-review shares), a stall threshold measured for `claude`, D5's permission mode, a print-mode preamble rule (rewords R-1110), a Windows `claude`
lookup, a cost cap with provenance, the command line's full model names in `CLAUDE_CODE_SUBAGENT_MODELS`, and a `NANA_ROLE` guard in this hook so its children print
nothing. (b) `nana-roster set` (D2). (c) The rulings lane: one copy in nana-pi installed to the user-level pi folder; it needs no hook point here, and if it wants the
start-up line to point at the file, that is one more segment and one config value in `rosterNotice`. (d) An open-lanes segment is a possible later option the owner may ask
for, shown only in a repository whose AGENTS.md carries the nana marker region and silent when `main` is absent.

**INFERRED.** SessionStart does not fire for a Claude Code subagent; the pi widget wraps to two or three rows at 80 columns; a Windows project's copied CLAUDE.md never
carries the new bullet; pair 33's red list beyond the checks its edited counts name; the Agent tool's four model names hold in versions other than 2.1.299; the owner's
Windows machine has a roster file and runs both seats; Claude Code's Bash tool starts from the shell profile while hooks do not (residual 19).

## Seat revision 3 (2026-10-16)

Each seat decision on `design-critique.md` and `factcheck.md`, as applied:
1. Critique M3: the open-lanes segment is cut — its three rows, four tests, nine pairs, four tunables (`OPEN_LANES_SHOWN`, `GIT_TIMEOUT_MS`, `MAIN_BRANCH`, `LANE_PREFIX`),
   the `openLanes` export, the git call in both seats and the two residuals only it needed. §6 Later lanes (d) records it as a possible later option.
2. Critique M1: R-1193, T1, pair 60 and one new "Larger lanes" bullet in the shared working pattern (§3.8), separate from the default-pattern bullet, so R-1126, R-1128
   and nana-soul stay untouched; nana-pi's marker region regenerates.
3. Critique M2: `CLAUDE_CODE_SUBAGENT_MODELS` (Claude Code 2.1.299's Agent tool schema, read from the binary's strings 2026-10-16) in R-1122, N2 (a full model name and a
   bracketed variant) and pair 44; the `CLAUDE_CODE_RUNTIME` provenance no longer cites the command line's `--model`.
4. D1: the code default is null and recommended, still the owner's call, with critique S1's costs in plain numbers; carry 6 writes a `largerBuilder` on this Mac and the
   Windows machine after the land, with the owner's yes.
5. Critique S3 (R-1202 sets the path aside before the cut; L10 and pair 15), S4 (each split names a draft-2 ID first, then today's IDs: R-1195 split into R-1198 to R-1201; R-1201 into R-1205 and R-1206; R-1192 into R-1194 and
   R-1195; R-1197 into R-1203 and R-1204), S5 (R-1206 and H2 both say a missing or unreadable source; R-1209 names `additionalContext`), S6 (R-1191, §3.2, W3 and pair 54
   pin both ways out), S10 ("larger or riskier" in R-1190, R-1193, the README text and the bullet; the notice's sealed labels stay short), S11 (residual 14).
6. Critique S7: `--json` ships here (R-1192, N4, N5, pairs 48 and 49; two pairs, so that each new check has one), named in the README's roster section; measured with
   `notice-lengths.mjs`, the runnable pointer adds 78 characters (a 283-character line), so the notice's pointer stays the file. `set` stays D2.
7. Critique S8: no `NANA_ROLE` check in the pi extension; no child with a UI was found (§3.6); residual 17 records the undocumented case.
8. Critique S9: §1 paraphrases the owner; no quote and no name anywhere in the plan; HANDOFF and session lines paraphrase too.
9. D3 replaced by the owner's 2026-10-16 decision (no name sweep now); R-1120's evidence cell does hold the name at `2dbc817`, so the lane changes only its requirement text
   and the `nana-roster.test.mjs:40` check keeps its title (the draft's N0 rename is dropped).
10. D4 states critique S2's live case.
11. D5 stays a later lane's question.
12. `factcheck.md` WRONG items 1 to 17 folded as §5.3 lists; item 9 is moot after the cut.
13. Recount: 22 rows added (R-1190 to R-1211), 12 reworded, 1 evidence-only (R-1075); 32 new titles plus 4 loop instances; 60 pairs, numbered 1 to 60 with no gap; §5.2's
    census updated (trace rail added, `:321` merged, citations corrected, the `:40` rename dropped, the tree total +22).

Round-3 MUST findings (`factcheck-r3.md` MUST 1 and 2, `design-critique-r3.md` M1 and M2), each re-verified at `2dbc817`, as applied:
14. Factcheck MUST 1 (install-check floors). Ran `fc3/hookcount.mjs`: the `:328` and `:519` regexes match 6 calls today on linux and darwin, so a floor of 6 stays
    green under pair 36. §5.2 now raises both floors to 7, with the `:519` regex gaining `roster-notice` and the `:297` list gaining the hook by name; pair 36's red list
    stands as written.
15. Factcheck MUST 2 (the `--json` paste). Read: the installer seeds the user-scope file with an `objective` block (`pi/nana-pack.seed.json`, `steps.mjs:63`, `:589`,
    `state-manifest.mjs:48`); Ran: this Mac's file holds only `objective`. D1's cost line, §3.8's README text and §3.10's `--json` row now say to set the file's `roster`
    member to the printed `roster` value and keep every other key; N4 and the seat acceptance start from the installer's seed; residual 9 names the hand edit. R-1192
    keeps its shape: printing the whole file merged would print the user's gate rules and add a file read for no gain over the wording.
16. Critique M1 (the rule reaches fewer places than the notice), fix (a). Read: `project.mjs:186-228` rewrites only AGENTS.md's region and only when run; a Windows
    project's CLAUDE.md is a copy (`project.mjs:258-260`); Ran `strings`: Claude Code 2.1.299 loads AGENTS.md only where the project has no CLAUDE.md
    (`cc-strings.txt:295057`); Read: `--lane-size=larger` is not an own option (`pi-worker.mjs:26`) and the watchdog ignores it. New row R-1212 (FEAT-006, unused on
    main and on `feat/regroup` at `656dc86`, Ran) makes lane mode refuse a launch with no `--lane-size` while `largerBuilder` is set, before the lock, naming both
    sizes; W6, pair 61, §3.2's one refusal text, §3.7, §3.10's row, the README's Lane builder paragraph, the threat model, D1's costs (a `sonnet` default would now
    also refuse every plain lane launch on every new machine), S8, residual 15 and the second most-likely-wrong claim follow. Fix (b) is not taken: R-1212 reaches
    every seat and project with no region refresh and no nana-soul change, so R-1126 to R-1128 stay untouched.
17. Critique M2 (the pi notice erases nana-handoff's startup notice), option one. Read: back-to-back info statuses merge (`interactive-mode.js:2270-2280`,
    `:3060-3078`); nana-handoff raises its pickup notice as info at startup (`nana-handoff.ts:420`); pi keeps a manifest folder's `readdirSync` order
    (`package-manager.js:163-171`). The extension now sets one widget above the editor under the new chosen value `WIDGET_KEY` and never notifies: R-1210 reworded,
    L3 seals the key, L13 and L14 retitled, pairs 19, 20 and 22 reworded and pair 62 added (an extra info notify reds L13), §3.6, §3.10, S5, residuals 7 and 10, the
    seat acceptance's RPC step and the INFERRED list follow. Read: RPC sends a string-array widget (`rpc-mode.js:123-135`) and the desk draws it
    (`app.js:1485-1493`), so the desk needs no code change; pi clears widgets on new, resume, fork and reload (`interactive-mode.js:1866-1880`, `:361`, `:5309`;
    `agent-session-runtime.js:102-113`), so resume and fork show it again and new and reload leave it cleared, as `SHOW_SOURCES` says. This also retires the
    draft's top risk that pi's own status lines replace the notice. The new cost, a widget that stays and wraps to two or three rows at 80 columns, goes to the
    owner's feel check (residual 7). M2 is closed by the plan, not as an owner decision; it reopens nothing else.
18. Recount after 14 to 17: 23 rows added (R-1190 to R-1212), 12 reworded, 1 evidence-only (R-1075); 33 new titles plus 4 loop instances; 62 pairs, numbered 1 to 62
    with no gap; the tree total is the base plus 23.

## Seat revision 4 (2026-10-16)

Each seat decision on `design-critique-r3.md` S1 to S11 and `factcheck-r3.md`'s SHOULD items, each re-verified at `2dbc817`, as applied:
1. S1: the bullet gains "With no `largerBuilder`, the builder builds every lane." as its own row, R-1214, with T3 and pair 64; §3.7, §3.8 and §3.10's bullet row follow,
   so D1's and §3.7's null-slot claims now rest on the bullet.
2. S2: R-1193 keeps the route by entry kind; the stop-and-ask clause moves to its own row, R-1213. T1 is retitled to the route and new pair 63 (a bullet that sends a
   pi entry through plain `pi-worker --lane`) reds it; T2 is new and pair 60 now reds T2. Pairs 60, 63 and 64 edit the shared file and the regenerated region alike.
3. S3: R-1190 drops "which a seat passes for a larger or riskier lane"; R-1193 already says a larger or riskier lane goes through `--lane-size larger`.
4. S4: R-1195 now says each entry is built from its model and thinking only, never from its provider field. L2 is retitled and gains a fixture whose model id
   contains its provider; §3.4 and §5's preamble say so; new pair 66 (the notice strips provider strings) reds L2. Refusal leaks stay with L10, so pair 13 reds L10.
5. S5: R-1205 is scoped to a hook that loaded its modules, R-1206 counts an input read error as no source, and R-1207 leaves input reads out. §3.5 reads the input in
   its own inner try and injects the stream (Ran `r4probe/stdin-dir.mjs`: a directory stdin reads as empty, so a spawn cannot make a read fail). H1 and H2 are
   retitled; new pair 65 (the read inside the module try) reds H2.
6. S6: the paste wording stays as revision 3 applied it. Residual 22 adds the desk editor, re-read: `app.js:2186` posts every top-level key, and `server.mjs:1385` with
   `:2358-2359` refuses any outside its list; with factcheck SHOULD 19, `objective` already makes it refuse every user-scope save on an installed machine.
7. S7: `SHOW_SOURCES` gains Claude Code's clear and pi's new; compact and reload stay out. R-1206, R-1210, H2, L13, L14, §3.3's provenance, §3.5 and seat decision S6
   follow. Pair 24 moves from clear to compact; pair 20 (reload) keeps its meaning.
8. S8: residuals 19 (the hook's environment versus the Bash tool's shell profile, INFERRED), 20 (pi-subagents' Claude Code children, re-read:
   `claude-code-adapter.js:222` passes `--setting-sources user` and the allowlist at `:14-47`, not `:14-30`, holds no `PI_CODING_AGENT_DIR`; doctor requires 0.75.0,
   `doctor.mjs:164`) and 21 (a set scout is shown though nothing starts it, Ran `git grep -i scout`). The threat model gains both inputs.
9. S9: §3.8 adds the pack README's "What you will see" list (`README.md:367-375`; the heading is `:367`): a widget item and the note that the compaction toast still shows.
10. S10: §3.10 gives the true reason for no effort field (Ran: `cc-strings.txt:337100` holds `effort` as optional, with help to set it only when asked). Residual 3 stands.
11. S11: R-1191, §3.2's refusal text, W3's title, the acceptance and S8 put both ways out as the user's choice; W3 keeps both ways out.
12. Factcheck-r3 SHOULD, by number: 1, §2 cites `656dc86` (Ran; R-1190 to R-1219 still unused on every branch and in both worktrees; tree total still 1,152);
    2, §1's cc-strings lines; 3, `types.d.ts:219`; 4, pack README `:153`; 5, `steps.mjs:522` joins the count comments; 6, `:799` changes only `migrated.length`;
    7, the code-map row's markers; 8, §3.5 says `hook-producer.mjs` is no precedent; 9, a relative `PI_CODING_AGENT_DIR` in the threat model, §3.5 and residual 18;
    10, §3.4 names the first pack source import from nana-setup; 11, `shared-memory-input.mjs`'s header in §4; 12, root README is two places; 13, R-1206, R-1210 and
    R-1211 in EARS form; 14, the public corpus copies are scrubbed (`corpus/`); 15, §5.2 names the regroup line drift (Ran: the claim-scanner lines land 2 below the
    factcheck's numbers); 16, `assertOnlyHookFails` at `:576-582` and `install.test.mjs:333`; 17, the header names where `hooks.md` lives and its date; 18,
    revision 3's item 5 marks its draft-2 IDs; 19, residual 22. The optional title map joins §4. The INFERRED list drops the claim-scanner claim (Ran,
    `fc3/claims-probe-r4.mjs`, on the new bullet and pairs 63 and 64) and the fixture claim (Read in `factcheck-r3.md`), and adds residual 19.
13. Recount: 25 rows added (R-1190 to R-1214), 12 reworded, 1 evidence-only (R-1075); 35 new titles plus 4 loop instances; 66 pairs, numbered 1 to 66 with no gap;
    the tree total is the base plus 25; residuals 1 to 22.

## Seat revision 5 (2026-10-16)

1. Once `largerBuilder` is set, R-1212 refuses a launch with no size, so the bullet now also says that a small lane goes through `pi-worker --lane-size small`; R-1193
   carries it (one behaviour: the route by lane size and entry kind). T1 asserts it, and a new pair 67 (the bullet drops the small-lane route) reds T1. Pairs: 67.

## Seat revision 6 (2026-10-16): sol plan r1

Each seat decision on `sol-plan-r1.md`, each repo fact re-verified at `2dbc817`, as applied:
1. MUST 1 (a relative agent dir can show one lineup and launch another). New row R-1215 (FEAT-023; unused on main, on `feat/regroup` at `656dc86`, on every branch and in
   every worktree, Ran): while `PI_CODING_AGENT_DIR` stays relative after pi's normalisation, the notice reads `roster unknown: …` and the change pointer and names no
   lineup. Read: `piAgentDir` resolves a relative value against the process cwd (`agent-dir.mjs:67-76`) and lane mode resolves it in the lane worktree
   (`pi-worker.mjs:96`). The notice detects it with the existing `piAgentDirIsCwdRelative()` (`agent-dir.mjs:84-92`), which applies the platform's `path.isAbsolute` to
   pi's normalised value, so `~/…` and `file://` stay absolute (Ran: it returns true for `rel` and false for `~/x`, `file:///tmp/x` and `/abs`, where a raw
   `path.isAbsolute` is false for the first three). `rosterNotice` gains a `relative` argument (§3.4); the hook
   and the extension pass it (§3.5, §3.6); `RELATIVE_DIR_TEXT` joins the notice config with its provenance (§3.3); L3 seals it and gains R-1215; new L16 checks both
   seats; new pair 68 reds L16. Lane mode is unchanged (§3.9); residual 18 is rewritten to say so. §3.10 gains a row, §3.8's README item and the threat model name the
   case, and §3.4 gives a 166-character example. Prior art, Read: install refuses (`nana-setup.mjs:119-127`), doctor warns (`doctor.mjs:439-440`), the desk pins
   (`apps/desk/server.mjs:157,163-164`).
2. SHOULD 2 (the provider). Kept out: the notice also enters the Claude seat's context, and a seat that copies it into a repository file must not carry a machine's
   provider, which a standing rule keeps out of repository files (the README's example uses `example-gateway`, `README.md:221`). §3.4, S4 and §3.8's README item now
   say the notice names each entry by model and thinking and that `nana-roster` prints providers (`nana-roster.mjs:119-127`); new residual 23 says two providers serving
   one model id read alike.
3. SHOULD 3 (the scout). The notice never names the scout: R-1194 names the builder, any larger-lane builder, the reviewer and the land; R-1199 becomes "name no scout,
   set or null". L1 and L7 retitled; pair 11 becomes "the notice names a set scout"; §3.4 gains a bullet; the five-slot example drops to 180 characters and its `--json`
   form to 258 (Ran with `node -e`); the threat model adds a set scout; residual 21 is rewritten (re-Ran `git grep -i scout`).
4. Recount: 26 rows added (R-1190 to R-1215), 12 reworded, 1 evidence-only (R-1075); 36 new titles plus 4 loop instances; 68 pairs, numbered 1 to 68 with no gap
   (pair 68 appended); the tree total is the base plus 26; residuals 1 to 23.

