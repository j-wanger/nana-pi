# Seat-script audit: roster-notice acceptance.mjs and seat-titles.mjs (2026-10-16)

Audited against the frozen plan `docs/reviews/roster-notice-2026-10-16/CHANGE.md` (plan frozen at 61b48e1, lane tip b9f66a2, merge base 2dbc817 = main).
Scripts audited unchanged (sha1 before = after): acceptance.mjs 8dfca32d…, seat-titles.mjs 5e85cbcf….
"Ran" = run in this audit; "Read" = read at the lane tip; INFERRED = neither.

**Result: 6 MUST, 18 SHOULD.** At base, every build case reads red (210/210) and every guard and harness case reads green (53/53).
No case was found that a correct build cannot reach. One case's named property cannot fail (M3). The acceptance has no case for five clause groups (M1, M2, M4, M5, M6).

---

## 1. Coverage

Case references are `acceptance.mjs:<line>` with the section letter. "(g) via X" means the clause is judged only through the builder's own test X passing in (g); the acceptance does not judge it independently.

### 1.1 New rows R-1190 to R-1215

| Row | Observable clause | Acceptance case |
|---|---|---|
| R-1190 | `--lane-size larger` + pi `largerBuilder` → pi starts with that entry (provider, model, thinking, each flag once) | (w) :582, :585 |
| R-1190 | `--lane-size larger` + null slot → the builder | (w) :580; (guard) :575 |
| R-1191 | larger + Claude Code entry → refuse, exit 1, no pi | (w) :590 |
| R-1191 | … before taking the worktree lock | (w) :592 (lock pre-held: R-1191 text, no lock message, lock untouched) |
| R-1191 | names `roster.largerBuilder`, "pi-worker starts pi entries only", both ways out as the user's choice | (w) :590 (§3.2's exact text, read from CHANGE.md) |
| R-1192 | `--json` → one JSON object holding only `roster`, every slot in print order, exit 0 | (r) :444, :458 |
| R-1192 | `--json` refusal on stderr, exit 1, empty stdout | (guard) :491 |
| R-1192 | read-back as the `roster` member of the installer's seed file (N4; README edit) | (r) :507 (×2), :517 |
| R-1193 | bullet: largerBuilder → larger or riskier lane; pi entry via `pi-worker --lane-size larger`; CC entry as subagent in the lane worktree; small lane via `--lane-size small` | (t) :714 (byte-exact §3.8 bullet after the seat land review bullet), :729 |
| R-1194 | one line | (n) :364 |
| R-1194 | starts `nana active · roster` | (n) :363, :356 |
| R-1194 | names builder, any larger-lane builder, reviewer, land by model and any thinking | (n) :356 (exact parity with the script's composer) — **reviewer thinking never non-null in any fixture: MISSING (M2)** |
| R-1195 | built from model and thinking only, never the provider field | (n) :366, :368, :356 |
| R-1196 | larger-lane builder `for larger lanes` before builder `for small lanes` | (n) :356 (pi and four CC largerBuilder scenarios) |
| R-1197 | CC entry's model followed by `(Claude Code only)`; pi entries not | (n) :356 |
| R-1198 | null land → `land seat` | (n) :356 (base4 scenarios) |
| R-1199 | no scout, set or null | (n) :371, :356 |
| R-1200 | null larger-lane builder → builder with no size label | (n) :356 (absent and explicit null) |
| R-1201 | `(default)` exactly when the resolver returned the default | (n) :374 (no file, seed, file equal to default) |
| R-1202 | refused → `nana active · roster refused:` + problem: path set aside, cut at first ` (`, controls and breaks → space, path put back | (n) :356 (13 refused kinds); :373; (guard) :348 pins six kinds' shown text |
| R-1203 | ends with `change: "roster" in` + the active agent dir's nana-pack.json | (n) :364, :356 |
| R-1204 | path under home shown with `~` wherever it appears; outside home stays absolute | (n) :370, :356 (pointer, directory and dangling refusals; two outside-home scenarios) |
| R-1205 | loaded hook prints exactly one JSON object, context beside `hookEventName` `SessionStart`, any source or none, exit 0 | (h) :404-406, :407, :408 |
| R-1206 | `systemMessage` for startup, resume, clear, fork | (h) :404-406 |
| R-1206 | `systemMessage` with no readable source: empty, non-JSON, no source | (h) :404-406 |
| R-1206 | … **an input read error included** | **MISSING (M1)**; (g) via H2 only |
| R-1206 | no `systemMessage` for compact | (h) :405, :407 |
| R-1206 | no `systemMessage` for another readable source (allowlist, not `!== "compact"`) | MISSING (SHOULD S9: no documented source reaches it) |
| R-1207 | modules fail to load → one object, both fields the unavailable notice with code or name, no path, exit 0 | (h) :416 |
| R-1207 | throws after loading, other than while reading input | not reachable from honest input (Read: `piAgentDir` and the resolver never throw); not covered by H3 either (S11) |
| R-1208 | one SessionStart entry, no matcher, siblings' timeout (POSIX, win32 exec form, real install, forced-win32 install) | (i) :619, :623, :677, :703 |
| R-1209 | install check passes only one JSON object, `systemMessage` starts the prefix and is not unavailable, context starts the prefix under `SessionStart` | (i) :661 (12 fixtures against the exported predicate); wiring in install-check.mjs via (g) I1 and the land checklist |
| R-1210 | widget is the only line of one widget, above the editor | (n) :379-383, :384 |
| R-1210 | never a notify | (n) :382, :384 |
| R-1210 | shown on startup, new, resume, fork with a UI; not on reload; not without a UI | (n) :382 (file, refused and relative rosters) |
| R-1211 | hook and extension show the same notice for one roster file | (n) :356 (31 scenarios × hook, fake-ctx extension, pi RPC) |
| R-1212 | no `--lane-size` + set slot → refuse before lock or spawn, naming `largerBuilder`, both sizes; `--lane-size=larger` counts as none | (w) :595 (×3), :597 |
| R-1213 | bullet: a seat that cannot start it stops and asks the user | (t) :714 |
| R-1214 | bullet: no `largerBuilder` → the builder builds every lane | (t) :714 |
| R-1215 | relative agent dir → unknown line + pointer, no lineup, for a valid file, a refused file and no file; `~/…` and `file://` stay absolute | (n) :356 (three relative, two absolute scenarios); (h) :408; property :376 **cannot fail (M3)** |

### 1.2 Reworded and evidence-only rows

| Row | Observable clause | Acceptance case |
|---|---|---|
| R-1120 | text insert; evidence cell unchanged | (e) :804 |
| R-1120 | default `largerBuilder` null (D1) | (r) :443, :519 |
| R-1121 | valid roster returned exactly as written, absent `largerBuilder` read as null | (r) :457-458 |
| R-1121 | no slot or field from the default | (r) :457 (indistinguishable under D1 null) |
| R-1121 | no roster from a project's `.pi/nana-pack.json` | not in the acceptance (base clause; SHOULD S15) |
| R-1122 | at most `largerBuilder`; pi or CC entry or null; CC entry exactly `runtime` + model in the four; refusal names file and slot or field; `roster.largerBuilder.model` for another CC model | (r) :481 (13 kinds), :487 (CC entry in each other slot), :457 (four names accepted) |
| R-1123 | one line per slot in order; CC `claude-code <model>`; `none` for null largerBuilder; source line; exit 0; refusal exit 1 | (r) :443, :446, :457, :481 |
| R-961 | pi args from the builder, or the entry R-1190 selects | (w) :582, :585, :587, :589 |
| R-1124 | `builder (larger lanes):` for the larger-lane builder; `builder:` otherwise; one line before attempt 1/1 | (w) :580-589 |
| R-301 | five hooks linked | (i) :626, :677 |
| R-1051 | win32 wires the roster notice to the checkout's own hook | (i) :623, :703 |
| R-1063 | roster notice entry prints one object whose `systemMessage` starts the prefix (Windows) | WIN line (Windows leg); POSIX analogue (i) :687 |
| R-1055 | doctor reports six rows on win32 | WIN line (Windows leg) |
| R-1056 | install repairs a stale roster-notice entry in place on win32 | **MISSING (M5)** |
| R-658 | eight extension functions in the front-door descriptions | (t) :740; (e) :800 |
| R-1075 | evidence cites the renamed dispatch title | (e) :822, :825 |
| all | row text, one `shall`, status, feature placement, evidence cites | (e) :765, :774, :800, :820, :822, :825, :829 |

### 1.3 §3 design

| § | Observable clause | Acceptance case |
|---|---|---|
| 3.1 | slot shape; other slots pi-only; four subagent names; normalised copy with absent → null | (r) :457-458, :481, :487 |
| 3.2 | default small while the slot is null | (guard) :573-575 |
| 3.2 | `--lane-size` not passed to pi | (w) argv exact equality |
| 3.2 | unknown or missing value refused before lock (R-960) | (w) :600-604 |
| 3.2 | LANE_USAGE and the usage list name `--lane-size` | MISSING (plan: "no check pins the last two"; SHOULD S12) |
| 3.2 | duplicate `--lane-size` refused in lane mode | MISSING (SHOULD S12) |
| 3.3 | worker-config names and values | (r) :519 |
| 3.3 | roster-notice-config names and values | (n) :389 |
| 3.3 | sealed literals live only in L3 and N2; the composer reads them by name; provenance beside each value | MISSING (SHOULD S13) |
| 3.4 | one export `rosterNotice` | (n) :391 |
| 3.4 | @purpose and @effects none | (f) :873 |
| 3.4 | segments joined with ` · ` | (n) :356 |
| 3.4 | no provider, no absolute home path | (n) :366, :370 |
| 3.4 | reuses `tildeify` and `displayText` (no third copy) | MISSING (SHOULD S13) |
| 3.5 | static imports node built-ins only | (h) :421 |
| 3.5 | no child process | (h) :423 |
| 3.5 | `systemMessage` left out on compact | (h) :405 |
| 3.5 | reads the input in its own inner try | **M1** |
| 3.5 | unavailable notice with code or name only | (h) :416 |
| 3.5 | runs through the installed symlink (main-module check) | (i) :687 |
| 3.5 | wiring: desiredHooks, steps HOOKS, state-manifest row, install-check row, DOCTOR_NOTES.win32, exported predicate | (i) :619-661 |
| 3.5 | install-check config keeps its own prefix copies | MISSING (SHOULD S13) |
| 3.5 | uninstall removes the link and entry | (i) :695 |
| 3.6 | widget not notify, never throws, no footer chip | (n) :382 (every UI call recorded) |
| 3.6 | **no `NANA_ROLE` check** (also §3.9) | **MISSING (M4)** |
| 3.6 | RPC widget | (n) :384 |
| 3.6 | no pi prompt section | MISSING (SHOULD S14) |
| 3.7 | rule text | (t) :714 (via R-1193, R-1213, R-1214) |
| 3.8 | shared bullet and AGENTS.md region | (t) :714, :728-729 |
| 3.8 | runtime table Notify cells | (t) :723 |
| 3.8 | descriptions say eight | (t) :740 |
| 3.8 | desk README | (t) :742 (weak, S7) |
| 3.8 | EXEMPTIONS | (t) :743 (weak, S7) |
| 3.8 | pack README: "Eight", `largerBuilder`, `--json` command, "pull before you add" | (t) :733 |
| 3.8 | pack README Lane builder `--lane-size` | (t) :733 (regex not confined to its section, S7) |
| 3.8 | the rest of §3.8's doc text | **MISSING (M6)** |
| 3.8 | count comments | MISSING (SHOULD S14) |
| 3.9 | other hooks, lifecycle, pi-review, watchdog, preamble, nana-soul, objective, desk code untouched | (guard) :865, :725, :731 |
| 3.9 | no added owner name, home path, host, provider | (guard) :886 |
| 3.9 | no doctor roster row, no `set` command | MISSING (SHOULD S14) |
| 3.9 | no git call | (h) :423 |
| 4 | diff ⊆ In; HANDOFF and session entry present; D1 carry | (guard) :861; (f) :866-867 |
| 4 | six-tag headers on new modules | (f) :871 |
| 4 | test-title-map.json in the corpus | MISSING (SHOULD S17) |
| 5.1 | 36 titles and markers | (a) :273 (Ran: all 36 match §5.1 word for word, rows included) |
| 5.1 | four loop instances exist | (a) :273 |
| 5.1 | loop instances PASS on macOS | not run: install.test.mjs and win32-degrade.test.mjs are not in (g) (M5) |
| 5.2 | seven renames and R-291 total | (a) :273 (Ran: every old title exists at base, so no "gone" check is vacuous) |

---

## 2. Independence

- **Declared dependency (SHOULD S5).** The 13 refused-scenario parity cases (:356) take the build's resolver problem, read from `nana-roster`'s stderr, as the input to the script's own R-1202 transform. The header declares this. Two things limit it:
  - The guard at :348 pins the shown text of six kinds to literals.
  - The harness check at :352 pins §3.4's value-echo example.
  - Four kinds remain judged only against the build's own text: over the cap, unreadable, dangling outside home, and a Claude Code model outside the four.
- **Relative by the row's own words (acceptable).** The expected timeout in R-1208 and R-1074 (:621, :624, :638, :679, :705) is read from the build's own objective entry. R-1208 defines the timeout relative to the siblings. The settings-merge fixture in the suite pins the absolute values.
- **Self-consistency backed by an independent check (acceptable).** The read-back at :508 compares the build's second `--json` output with its first. The first is checked independently against `wantJson`.
- **Unit under test, independent expected values (acceptable).** The predicate at :661 calls the build's `rosterNoticeOutputOk`, but every expected boolean is the script's own.
- **No other case calls a build function for an expected value.**
  - The notice comes from the script's own composer. Harness checks at :266, :325 and :352-353 confirm it reproduces §3.4's three examples and the builders fragment.
  - Roster lines, `--json` objects, pi argv, row text, installer shapes and doc text are all computed from the plan or the base.

## 3. Red at base

Ran twice at b9f66a2 (49 s each): `cases: 53/263 (build cases red: 210/210; guard and harness red: 0/53)`; seat-titles 1: `57 missing`, with every old title NOT-GONE at base.

Exceptions: none.

Checked that a correct build can turn the cases green (no case that cannot pass):
- The reworded-row expected texts were recomputed from CHANGE.md and the base (Ran). None hits the "base lacks" sentinel.
- The installer expectations match the base siblings' shapes (Ran): command form, exec args, timeout 5, manifest row, install-check row and form.
- pi 1.0.2's RPC `setWidget` fields (`widgetKey`, `widgetLines`, `widgetPlacement`) match the probe (Read).
- The PASS line format of all seven existing test helpers matches (g) (Read).
- `xhigh`, `medium` and `low` are valid thinking levels (Read).
- The four loops use literal lists (Read).

Latent false-red risks are listed in S8.

## 4. Harness safety

- **Worktree.** `git status --porcelain=v1 -uall --ignored` was byte-identical before and after both runs. The only entries were the two untracked seat scripts. `git worktree list` holds no stale scratch entry (Ran).
- **Temp folders.** The OS temp folder and `/tmp` gained no entry after either run, and the acceptance's scratch folder was removed (Ran).
- **`~/.pi` (S1).**
  - The script runs `pi --version` (:238) with the real home, because `cleanEnv()` keeps `HOME`.
  - Ran in a scratch home with a folder watcher: `pi --version` creates and removes `settings.json.lock` in the agent dir (`rename:settings.json.lock`). It did not rewrite `settings.json`.
  - In the polled second run, the real agent folder's time moved in the run's first second (12:21:37). No file content in `~/.pi` changed.
  - The script header says "the real ~/.pi and ~/.claude are never written". This lock is the one exception.
  - Other processes on this machine also move that folder's time (12:20:22 and 12:30:14, outside both runs).
- **`~/.claude`.** The only changes were Claude Code's own `.claude.json` backup and skill sync, at 12:30-12:32, after both runs. None came from the acceptance.
- **Not run.** No full suite was run. The acceptance's (g) runs nine single test files, inside the 5-minute cap.

---

## 5. MUST

**M1. R-1206's "an input read error included" has no acceptance case** (R-1205's exit-0, one-object path too; pair 65).
- It is reachable: spawn the hook with stdin as a write-only file descriptor. Ran: the shared reader throws `EBADF` in a spawned child.
- Add an (h) case. It should expect exit 0, one JSON object, and the notice in both fields, not the unavailable notice.

**M2. R-1194's "any thinking level" is never exercised for the reviewer.**
- Every fixture's reviewer has null thinking (`base4`, `lgPi`, `DEF`, echo).
- So a composer that drops the reviewer's thinking passes every case.
- Add one file-roster scenario whose reviewer has a thinking level.

**M3. The relative-dir lineup check (:376) cannot fail on the property it names.**
- `L.split(SEP)[0]` is always `nana active`, because the prefix `nana active · roster` contains ` · `.
- Ran: the predicate returns false for a notice that names "builder a, reviewer b, land c".
- Only its judged count can fail. Test the segment between the prefix and the pointer instead.

**M4. §3.6 and §3.9's "no `NANA_ROLE` check in either seat" has no case.**
- `cleanEnv()` strips `NANA_*` from every probe, so a build that adds a role guard passes.
- Rerun one scenario's hook, extension probe and RPC with `NANA_ROLE=worker` and with `NANA_ROLE=reviewer`. Expect the same notice.

**M5. R-1056 (reworded: "all six entries on win32") has no case for repairing a stale roster-notice entry in place.**
- (g) does not run `win32-degrade.test.mjs`, where the plan says lines 210-238 cover the six.
- Nor does it run `install.test.mjs`, so (g) never checks PASS for the three macOS loop instances §5.1 adds.
- Fix by either of these:
  - add a forced-win32 install over a settings file whose roster-notice entry points outside the checkout, and expect the entry replaced in place in exec form;
  - add both test files to (g), with their loop-instance PASS lines.

**M6. Most of §3.8's documentation clauses are unchecked.** The (t) cases check only "Eight extensions", `largerBuilder`, the `--json` command line, "pull before you add" and a loose `--lane-size`. Each clause below needs one substring check:
- Pack README Machine roster section:
  - "larger or riskier";
  - the Claude Code entry with its four model names;
  - `--lane-size`;
  - the `--json` edit instruction: set the `roster` member and keep every other key;
  - the sentence that a JSON syntax error stops pi's gate.
- Pack README Lane builder paragraph: the refusal-list item "a launch with no `--lane-size` once the roster sets `largerBuilder`".
- Pack README extension table: a roster-notice row.
- Pack README "What you will see" list:
  - a widget item naming the builders, reviewer and land by model and thinking, never a provider or the scout;
  - `roster unknown` while the agent dir is relative;
  - that the compaction toast still shows.
- Root README lines 11 and 166: "seven" becomes "eight".
- nana-setup README lines 37, 45 and 438: "five" becomes "six".
- `shared-memory-input.mjs`: its @purpose names both SessionStart hooks (§3.5, §4).

## 6. SHOULD

**S1. `pi --version` (:238) touches the real agent dir.**
- It runs with the real home and creates and removes pi's `settings.json.lock` there (Ran).
- Run it with a scratch home, e.g. `envFor(newHome("pi-version"))`, so the header's "never written" claim holds.

**S2. The "wrote nothing" check (:909) misses ignored files.**
- `statusOf()` omits `--ignored`, so a write under `node_modules/` or `docs/product-report/out/` inside the worktree passes.

**S3. A killed or timed-out run leaves its scratch folder.** The `finally` block runs only on a normal exit or a throw.

**S4. Red-run output carries machine detail.**
- MISS details print the absolute checkout path (30 lines at base, under the home folder with the account name).
- They also print the default roster's provider (6 lines), which is already public in R-1120's text.
- Green lines print titles only.
- Mask the checkout root and the home path in `out()`'s detail, because acceptance output enters the public corpus.

**S5. Pin the four build-derived refusal kinds with literals** (§2).
- The Claude Code model case's notice must contain `roster.largerBuilder.model` and not `sonnet-4-full`.

**S6. The relative-timeout expectations are acceptable.** If the seat wants an absolute value, pin it once.

**S7. Four checks are loose, though each can still fail:**
- The Lane-builder regex (:734) is not confined to its section. A `--lane-size` that appears only in Machine roster satisfies it; capture up to the next heading instead.
- The `EXEMPTIONS` regex (:743) is not confined to the array.
- The desk README check (:742) counts three occurrences anywhere in the file.
- The HANDOFF D1 carry check (:867) accepts `/largerBuilder/` anywhere.

**S8. Five spots could read red against a correct build:**
- `SHOW_SOURCES` as a Set, or `SIZE_LABELS` as a Map, reads as empty (:388). Spread any iterable instead.
- The static-import check requires the `node:` prefix (:421), but a bare `fs` import is also a built-in.
- `child_process` named in a comment reds :423.
- A new test helper that prints detail on PASS reds (g)'s exact-line match (:902).
- The composer omits `displayText`'s 400-unit cap. No fixture reaches it.

**S9. R-1206 has no unknown-source case.**
- A hook that tests `source !== "compact"` passes. Add a source such as `bogus` and expect context only.
- R-1206's text and the shared `SHOW_SOURCES` differ for a Claude Code `new` source. §3.3 makes that unreachable.

**S10. JSON `null` (or `[]`) as hook input is untested.** It parses but holds no source object.

**S11. R-1207's post-load branch is unreachable from honest input.** Neither the acceptance nor H3 covers it, so the reviewer should read that path.

**S12. §3.2 has two unchecked clauses:**
- `LANE_USAGE` and the usage-list option names, which the plan says no check pins;
- a duplicate `--lane-size` refused in lane mode.

**S13. §3.3-§3.5 structure has no static check.** Each needs one:
- the composer reads the notice config by name, with no inline sealed literal;
- it imports `tildeify` and `displayText`;
- only L3 and N2 hold the sealed literals;
- install-check config keeps its own prefix copies;
- provenance sits beside each tunable.

**S14. Three §3.9 exclusions and the §3.8 count comments are unchecked:**
- no doctor roster row;
- no `nana-roster set`;
- no pi prompt section: assert that the extension registers only `session_start`;
- the count comments listed in §3.8.

**S15. Two threat-model inputs are not in (n):**
- R-1121's "no roster from a project's `.pi/nana-pack.json`";
- a BOM plus CRLF roster file.

The existing suite covers both base behaviours, through the (g) guard on `nana-roster.test.mjs`.

**S16. R-1055's doctor rows are checked only on the Windows leg.** A forced-win32 `doctor --home` after the forced install may run on macOS. INFERRED.

**S17. §4's `test-title-map.json` for the seven renamed titles is unchecked.**

**S18. Every hook case gives the input the same cwd as the process.**
- So a hook that resolves a relative agent dir against the input's `cwd` passes.
- §3.5 says the hook reads no cwd of its own. Add one relative case where the two differ.
