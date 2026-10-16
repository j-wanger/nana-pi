# Audit: trying to fool the roster-notice seat acceptance

Lane roster-notice, plan frozen after the second plan review's LAND. The audit ran the acceptance as it stands (`acceptance.mjs`, `seat-titles.mjs`, both uncommitted in the lane's review folder). It ran every build in a scratch copy, never in the worktree.

## Verdict

The acceptance can be passed. A minimal fake build of the plan got 263/263 cases and 0 mismatches.

The acceptance caught all 11 control wrong builds, including the ten example defects from the brief.

It passed **16 wrong builds** of 16 tried. Each one has a defect the plan forbids. They are listed under MUST below, most severe first. Each one passed with `cases: 263/263 (build cases red: 0/210; guard and harness red: 0/53)`.

## Method

1. Scratch copy: `git archive HEAD` of the worktree, plus the two uncommitted review scripts. `git init`, then a base commit on `main` and a `feat/roster-notice` branch. The merge base is the archived tip.
2. Fake build, committed on the branch. It holds the code, config, hook, extension, roster slot, `--lane-size`, `--json`, installer wiring, shared bullet, AGENTS region, rows, tree, code map, README counts, HANDOFF and session lines. It also holds the §5 titles: every new check is `check(title, true)`, and every existing check the build turns red is edited back to green. A wrong build's own tests would encode its defect, so the acceptance has to catch each defect through its own cases. Result: 263/263.
3. Wrong builds: each one copies the fake, applies one exact text edit (`mutations.mjs`), regenerates the code map, commits, and runs the copy's own `acceptance.mjs` from inside the copy. Results are in `results/<id>.txt`.
4. Witnesses: `witness.mjs` runs one probe per passing wrong build, on the wrong build and on the fake build, in a temporary HOME. The outputs are in `witness-1.txt` to `witness-3.txt`, plus the W5 run shown below.
5. The fake copies, wrong copies and witness copies have been deleted. `fake-build.patch` and the scripts can rebuild them: `fake-shared.mjs`, `fake-tests.mjs`, `fake-rows.mjs`, `mutations.mjs`, `apply-mutation.mjs`, `run-wrong.sh`, `witness.mjs`, `witness.sh`.

Harness note: the first fake copy's base commit was authored `seat`. The (f) leak guard counts the base author as an owner name, so it went red on eight files that contain the word "seat". Re-authoring the base with a neutral name fixed it. See SHOULD 7.

## Controls (caught as intended)

| id | wrong build | caught by |
|---|---|---|
| C1 | provider shown before each model | (n) parity lines, 26 MISS |
| C2 | a set scout is named | (n) parity lines, 18 MISS |
| C3 | a refusal puts the absolute path back, not `~` | (n) My (old), dangling, cap, unreadable; home-path property; 6 MISS |
| C4 | hook prints `additionalContext` at top level | (n) and (h), 48 MISS |
| C5 | extension uses `notify`, not a widget | (n) extension and RPC, 32 MISS |
| C6 | `--lane-size larger` with a Claude Code entry silently starts the builder | (w) R-1191 cases, 2 MISS |
| C7 | no refusal when `--lane-size` is missing and `largerBuilder` is set | (w) R-1212 cases, 4 MISS |
| C8 | a full Claude model name is accepted (pi string rule only) | (r) and (n) refusal cases, 6 MISS |
| C9 | `--json` drops the `roster` key | (r) `--json` cases, 12 MISS |
| C10 | a relative agent dir still shows the lineup | (n) relative cases, 6 MISS |
| C11 | the relative check uses the raw value, so `~/` and `file://` read as relative | (n) tilde and file-URL cases, 2 MISS |

## MUST: wrong builds the acceptance passes

Each entry gives the defect, the row or section it breaks, the witness, and a fix for the acceptance.

**W5. The install check never applies its roster-notice predicate (R-1209).** `install-check.mjs` exports a correct `rosterNoticeOutputOk`, but the hook branch in `runInstallCheck` never calls it. The acceptance tests only the exported predicate, so the build passes.
- Witness: `runInstallCheck` with an injected spawn where every hook prints nothing. Wrong build: `PASS hook roster notice`. Fake: `FAIL hook roster notice — no-output`.
- This is the exact failure §3.10 gives as the reason for the branch ("an unbranched row passes on empty stdout").
- The macOS install check on the land checklist would also pass the row, so no gate catches this.
- Fix: run `runInstallCheck` with a stub spawn, as `install-check.test.mjs`'s `recordingRun` does. Make the roster hook print empty output, plain text, the unavailable notice, and good JSON. Require FAIL, FAIL, FAIL and PASS for `hook roster notice`.

**W2. Refusal text keeps control characters other than line breaks (R-1202: "every control character and line break replaced by a space").** The build replaces only `\r`, `\n`, U+2028 and U+2029.
- Witness: a roster with an unexpected key `odd<ESC>[31mkey<TAB>x`. The notice carries raw ESC and TAB into the Claude Code `systemMessage` and context, and into the pi widget. The fake shows `odd [31mkey x`.
- The only control-character fixture in the acceptance is a line feed.
- Fix: give the unexpected-key scenario ESC, TAB, a C1 character (U+009B) and a bidi control (U+202E) beside the line feed. The acceptance's own `CONTROL` class already maps them.

**W3. The refusal is cut at the last ` (` instead of the first (R-1202).**
- Witness: a trailing comma, which the plan calls the common hand-edit slip. Wrong build: `roster refused: invalid JSON (Expected double-quoted property name in JSON at position 79 · change: …`, with parser text and an unbalanced parenthesis. Fake: `roster refused: invalid JSON · …`.
- When the file text holds ` (`, Node's snippet form (`Unexpected token …, "...file text..." is not valid JSON`) is cut inside the snippet, so quoted file text such as a provider reaches the notice. Inferred from the message shapes, which were run; the composed notice for that case was not run.
- No refused scenario has a problem with two ` (`.
- Fix: add a refused scenario with a trailing comma (`{"roster":{…},}`). Node 22 then reports `… (line N column M)` after `invalid JSON (`.

**W4. The path is set aside only when the problem starts with it, so a dangling symlink under a folder holding ` (` is cut mid-path (R-1202, R-1204).**
- Witness: `PI_CODING_AGENT_DIR=<home>/My (old)/agent` with a dangling `nana-pack.json` symlink. Wrong build: `roster refused: dangling symlink: /<absolute temp home>/home/My · change: …`. The path is cut in half, and because it no longer matches, it stays absolute, so the absolute home path leaks. Fake: `dangling symlink: ~/My (old)/agent/nana-pack.json`.
- The acceptance tests ` (` only with a directory refusal, where the path leads, and tests the dangling symlink only under a plain path. The plan's L10 has the same hole.
- Fix: add a refused scenario with a dangling symlink under the `My (old)` agent dir.

**W1. The notice drops the reviewer's thinking level (R-1194: "each entry by its model and any thinking level").**
- Witness: reviewer `mdl-review high`. Wrong build: `reviewer mdl-review`. Fake: `reviewer mdl-review high`.
- Every reviewer in every acceptance fixture has a null thinking (`base4`, the R-1120 default and `lgPi`), so no fixture can show the defect.
- Fix: give one (n) scenario's reviewer a thinking level, for example `lgPi`'s reviewer `low`.

**W9. A pi `largerBuilder` with a null thinking prints `<model> null` (R-1194).** The larger slot has its own formatter.
- Witness: `builders mdl-large null for larger lanes and …`. Fake: `builders mdl-large for larger lanes …`.
- In (n), the only pi `largerBuilder` has thinking `xhigh`. Null thinking appears only in (r) and (w).
- Fix: add an (n) scenario with `largerBuilder` `pe(PV[3], "mdl-large", null)`.

**W6. The hook reads its input inside the module try, so an input read error prints the unavailable notice (pair 65; R-1206 counts a read error as no source; R-1207 excludes input reads).**
- Witness: the exported runner fed a stream that fails with EIO. Wrong build: `roster notice unavailable (EIO)` in both fields. Fake: the default notice in both fields.
- The acceptance spawns the hook only, and a spawn cannot make the read fail (`r4probe/stdin-dir.mjs`). It never imports the runner, and it never checks that the runner export §3.5 requires exists.
- Fix: import the hook's exported runner. Check the export. Feed it a Readable that destroys itself with an error. Require the notice in both fields.

**W15. The extension composes the notice once, when it loads.** Inside one pi process, a `new`, `resume` or `fork` after a roster edit shows the old lineup.
- This breaks R-1210 and R-1211 as read: the notice is the one for the current file. It also breaks the plan's stated purpose, that the user changes the lineup and sees it.
- Witness: one process, roster edited between `startup` and `new`. Wrong build: `after: …builder mdl-build high…`, the old lineup. Fake: `after: …builder mdl-NEW…`.
- Fix: in `extProbe`, rewrite the roster file between two `session_start` calls in one child process, and require the second widget to show the new lineup.

**W7. The extension also adds a pi system-prompt section on `before_agent_start` (§3.9: "no pi prompt section").**
- Witness: handlers `before_agent_start, session_start`; after the event, sections hold `nana-roster`. Fake: `session_start` only, sections `{}`.
- `extProbe` records registrations but fires only `session_start`. The RPC probe sends no prompt.
- Fix: in `extProbe`, record the event names passed to `pi.on` and require exactly `["session_start"]`.

**W16. The extension handler has no try/catch, so it throws when `ctx.ui` lacks `setWidget` (§3.6: "It never throws").**
- Witness: a UI with `notify` and `setStatus` only, which is `config-handlers-malformed.test.mjs`'s fake UI. Wrong build: throws `ctx.ui.setWidget is not a function`. Fake: no throw.
- The acceptance's UI is a Proxy that has every method. Only the census edit to `config-handlers-malformed.test.mjs` would reach this, and the acceptance does not run that file. The fake build left the extension out of that file's list and still passed.
- Fix: run one `extProbe` case whose `ui` has no `setWidget` and require `threw: null`. Optionally check that `config-handlers-malformed.test.mjs`'s `EXT` list names `nana-roster-notice`.

**W10. The resolver reads a falsy `largerBuilder` (`""`, `false`, `0`) as null instead of refusing it (R-1122: a pi entry, a Claude Code entry or null).**
- Witness: all three print `largerBuilder: none` and exit 0. Fake: refused, `roster.largerBuilder is not an entry (got string|boolean|number)`.
- Fix: add `""`, `false` and `0` to the (r) `REFUSE` list.

**W12. A non-lane `pi-worker` launch reads the roster and refuses with R-1212's text when `largerBuilder` is set.** R-1212 is lane-mode only, and the pack README says the non-lane worker "reads no roster".
- Witness: `pi-worker --out … -- -p hi` with a pi `largerBuilder` set. Wrong build: exit 1 with the no-size refusal. Fake: `SUCCESS`.
- Every (w) case is a lane launch.
- Fix: add one non-lane run with a roster that sets `largerBuilder` and the stub pi. Require exit 0, the caller's pi arguments, and no `pi-worker: builder` line.

**W8. Both seats skip the notice when `NANA_ROLE` is set (§3.9: "no `NANA_ROLE` check in either seat").**
- Witness: the hook with `NANA_ROLE=worker` prints nothing. Fake: the full JSON.
- `cleanEnv()` strips every `NANA_` variable, so the acceptance cannot see this check.
- Fix: run one hook scenario and one `extProbe` with `NANA_ROLE=worker`, and require the same output.

**W11. `resolveRoster` returns the file's object as written, so an absent `largerBuilder` is `undefined`, not null (pair 40; R-1121: "reading an absent larger-lane builder as null").**
- Witness: a four-slot file gives `{"hasKey":false,"value":"undefined"}`. Fake: `{"hasKey":true,"value":null}`, slots in print order.
- The CLI's `--json` printer, the plain printer and `pi-worker` all coalesce, so every surface the acceptance reads looks right. The resolver contract is broken for any later consumer.
- Fix: import `resolveRoster`, as the acceptance already imports `worker-config.mjs`. For a four-slot file, require `"largerBuilder" in roster`, a null value, and the keys in print order.

**W14. Every Node SessionStart entry's settings timeout goes from 5 to 10.** The roster-notice entry still equals its siblings, but the objective, adoption and shared-memory entries change, which §3.9's "no change to the other hooks" forbids.
- The builder's own `settings-merge` fixture moves with it. (i) compares the new entry only with the objective entry's timeout, never with a fixed value.
- Witness: desiredHooks timeouts `[10,10,10,10,5,5]`; install-check table `[5,5,5,5,5,5]`.
- The land checklist's real install check would likely catch it, because `mapHookEntries` compares `e.timeout !== expected.timeout` (read, not run). The acceptance does not.
- Fix: require the new entry's timeout to equal the sealed install-check value. Also require each other SessionStart entry to equal the base's `desiredHooks` (read `atBase`, or import it from a `git show` copy).

**W13. The desk README names the roster notice in only one of its three surface lists (R-685, §3.8).** The other two mentions sit in an added sentence.
- (t) counts `occurrences(..., "roster notice") >= 3` over the whole file.
- Fix: check each of the three matrix lines by its head phrase: `Default desk spawn |`, `Narrowed desk spawn |`, and `Current basketball and edge children`.

## SHOULD

1. **(g) proves titles exist and print PASS, not that the tests bite.** The fake build's 36 new checks were `check(title, true)` and passed. That is by design: the seat's mutation runner is the proof. Say in the acceptance's closing lines that a green run says nothing about test strength. The runner is required before review.
2. **Census tests outside the nine (g) files are not run.** The fake build left `uninstall.test.mjs` red (the `:292` dry-run labels) and the acceptance still passed. It also did not touch `config-handlers-malformed`, `restore` or `state-manifest`. The locked full suite on the land checklist covers these. The acceptance header should say (g) is not the suite.
3. **Most §3.8 doc and comment items are unread.** The fake build passed without any of these:
   - the pack README "What you will see" widget item;
   - R-1212 in the Lane builder refusal list;
   - the four Claude Code model names (present in the fake, but never checked);
   - the nana-setup README hook table and its "five" to "six";
   - the count comments in `settings.mjs`, `steps.mjs`, `doctor.mjs`, `nana-writing.ts` and the tests;
   - the `shared-memory-input.mjs` @purpose.

   The cheap ones are presence checks: the widget item, the `--lane-size` refusal clause, the model names and "six" in the nana-setup README.
4. **No macOS check of the hook's duration.** `runHook` allows 30 seconds; the settings timeout is 5. X1 is Windows-only. Record the elapsed time in (h) or (i) and require it to be well under the sealed timeout.
5. **A hand-written `tildeify` without the separator check would likely pass.** It would turn home `/x/u` and file `/x/u2/…` into `~2/…`. §3.4 says to reuse `paths.mjs`'s helper, and the acceptance checks neither the reuse nor a sibling-prefix path. Inferred, not run. Fix: add an agent dir at `<home>2/agent` and expect an absolute pointer.
6. **R-1209's branch key.** The install-check row's `shortLabel` drives the branch. W5's fix (run `runInstallCheck`) covers a wrong key too, so no separate check is needed.
7. **The (f) leak guard's base-author name is a substring count.** A base author whose name is a common word (here `seat`) turns the guard red on ordinary text. That cannot happen in the real worktree, whose author is the owner. Note it in the guard's comment, or match whole words.
