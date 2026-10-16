# Fact-check: fleet/CHANGE.md (roster-notice, seat draft 2) against the repo at 2dbc817

Read-only, 2026-10-16. "Ran" = run here today. "Read" = confirmed by reading the cited source, not run. INFERRED = neither.
The repo, worktrees, `~/.claude` and `~/.pi` were not changed. Scratch probes are in `fleet/fc/`.
Result: 17 WRONG (most are small citation or wording errors; 1, 2, 3 and 4 change the plan), 5 UNVERIFIABLE, the rest VERIFIED.

## Recounts

- Rows: 17 added (R-1190 to R-1206, one table line each) and 12 reworded (R-1120, R-1121, R-1122, R-1123, R-961, R-1124, R-301, R-1051, R-1063, R-1055, R-1056, R-658). VERIFIED.
- New check titles: L1-L14 (14) + H1-H2 (2) + I1 (1) + N1-N3 (3) + W1-W5 (5) + X1-X2 (2) = 27, plus 4 loop instances. VERIFIED. N0 is a rename of `nana-roster.test.mjs:40`, not a new title.
- Wrong-code pairs: the table is numbered 1-61 with no gap or repeat; 16 + 9 + 6 + 7 + 7 + 13 + 3 = 61. VERIFIED.
- Every new row has a test: R-1203 is pinned only through the extended `settings-merge.test.mjs:302,:304` marker, as §5.2 says. VERIFIED.

## WRONG

1. **The trace-rail red is missing from §5.2, and R-1075 is missing from §2.** `packages/nana-pack/tests/requirements-trace.test.mjs:61` ("REQUIREMENTS.md and the markers the suite carries agree") fails on an evidence citation whose title no longer exists. It also fails on a `planned` row that a marker traces (`templates/typescript/template/tests/requirements-trace.ts:16-21`).
   - R-1075's evidence cell cites `install-check.test.mjs::dispatch: the three SessionStart entries start before any of them finishes`. The census renames that check (`:523`), and R-1075 appears nowhere in §2. So R-1075's evidence cell needs an edit.
   - The same applies to the evidence cells of R-1051 (`:278` "the four hook entries…"), R-658 (`readme-check.test.mjs:75` "…all seven extensions") and R-1120 (`nana-roster.test.mjs:40`, renamed N0). Those rows are reworded anyway, but §2 changes only their requirement text.
2. **`tildeify` cannot replace a path inside a refusal (§3.4, R-1197).** `packages/nana-setup/lib/paths.mjs:101-104` rewrites a string only when it *starts* with the home folder.
   - `dangling symlink: ${file}` (`nana-roster.mjs:34`) would keep the absolute home path.
   - L7's chosen case, "a directory refusal" (`:37`, `${file} is a directory…`), starts with the path. So a prefix-only call passes L7 and still leaks on the symlink case.
   - Fix: substitute `file` with `tildeify(file)` inside the problem text. Add the dangling-symlink refusal to L7, with a pair.
3. **Two loop instances have no wrong-code pair.** §5.4 says every new check except X1 and X2 has a pair. But the §5.1 instance `win32: settings SessionStart roster notice is created, not skipped` (`win32-degrade.test.mjs:69`) has none, and it runs on macOS under the forced platform. The `hooks-win32-exec.test.mjs:182` instance also has none; it is Windows-only but is not named in the exception. A pair such as "desiredHooks leaves out the roster notice row" would red `:69`.
4. **Pair 41's red list is incomplete, and one auto-iterating check is missing from "Green with no edit".** `install.test.mjs:327-330` ("space in home: \`<cmd>…\` runs cleanly", no marker) runs every installed SessionStart command through bash with empty stdin and `CLAUDE_PROJECT_DIR` set to a fixture project path.
   - With the change, it runs the new hook on macOS automatically (green).
   - Under pair 41 (`steps.HOOKS` leaves the hook out), there is no symlink, so `node '<home>/.claude/hooks/nana-roster-notice.mjs'` exits 1 and that instance reds too.
5. **The header's feature list leaves out FEAT-017.** §5.2 edits the test lists of R-954 (`state-manifest.test.mjs:56`, `:61`) and R-958 (`restore.test.mjs:51`). Both rows sit in FEAT-017 (`REQUIREMENTS.md:1010`, `:1016`, `:1020`).
6. **D3: "rewrites two touched lines without it" misses a third.** The lane rewords the R-1120 row under D1 (`REQUIREMENTS.md:342`). Its evidence cell holds the owner's name ("… named the roles (2026-10-06)"). The two lines the plan names hold the name too (`worker-config.mjs:26`, pack `README.md:208`).
7. **D2: "nana's first command that rewrites the file holding the gate rules" needs a qualifier.** The desk's settings save already replaces the whole user-scope nana-pack.json, gate block included, and keeps a `.bak`:
   - `NANA_PACK_KEYS` includes `gate` (`apps/desk/server.mjs:1385`);
   - with no dir, the target is user scope (`:1488-1490`);
   - the write is `backupWrite` (`:1387-1395`, `:2354-2359`).

   `set` would be the first CLI to do this, and the first writer of `roster`.
8. **§3.8: one `EXEMPTIONS` name, not two.** The probes show that the claim scanner flags only the hook's `.mjs` name (Ran: `sh-skill-claims.out`, `sh-templates-render.out` flag only `nana-fleet.mjs`). The bare extension name is not a path claim. An exemption for it would print `STALE exemption` (`skill-claims.test.mjs:75`, `templates-render.test.mjs:539-547`); it would not fail anything.
9. **§3.5: the reason given for "no `main`" in the fixture is wrong; the result holds.** Ran a fresh `git init` here with HOME set to a temp folder.
   - Apple git's system config (`/Library/Developer/CommandLineTools/usr/share/git-core/gitconfig`) sets `init.defaultBranch=main`, so HEAD is `refs/heads/main`.
   - That branch is unborn: `for-each-ref --no-merged=main …` exits 128 with "malformed object name main".
   - So the check reads `open lanes: unknown` on every platform because the repository has no commits, not because git 2.50 names the branch `master`.
10. **§3.1's "Ran (`probe-shapes.mjs`) … `roster has an unexpected field largerBuilder`" quotes output that did not run.** The probe used the key `largeBuilder`. Ran here with `largerBuilder` (`fc/shape-larger.mjs`): the message is the same. So the claim holds, but the citation is wrong.
11. **§1: "Ran: the 2.1.299 binary drops a top-level `additionalContext`" overstates the evidence.** What ran was `strings` on the binary (`cc-strings.txt:174964`, `:212115-212116`: "Did you mean hookSpecificOutput.additionalContext…", "Hook JSON output had unrecognized keys (ignored)"). The drop itself is INFERRED; nobody watched it happen.
12. **§3.3: "every value the validator echoes follows ` (`" is too broad.** The cited lines (`nana-roster.mjs:40,57,67,71,79,107,110`) do hold. But:
    - `:63` and `:85` echo key names the user typed before any ` (` (residual 7 admits this);
    - `:34` and `:37-40` echo the absolute file path before the cut (see item 2).
13. **§3.2 cites lines in the wrong order, and two lane-option places are not named.** `pi-worker.mjs:47` is the lane-only filter and `:72-74` is the missing-value loop; the text names them the other way round. Not mentioned:
    - `LANE_USAGE` (`:22`) does not list the new option;
    - `:132` holds its own literal three-option list, which decides between the usage texts.

    No check pins either.
14. **Four census citations point at the wrong line:**
    - `readme-check.test.mjs:74` is the `// req: R-658` marker; the check is `:75`.
    - `templates-render.test.mjs:406` is the R-685 marker; the check is `:407`.
    - `state-manifest.test.mjs:59` is the bin-link list; the hook list is `:56` and `Array(17)` is at `:61`.
    - In `install-check.test.mjs`, the regex is at `:328` and `>= 5` is at `:329`.
15. **§5.4 cites `hooks.md:1252` for `systemMessage` in stream-json.** That line is the `initialUserMessage` row. Only `hooks.md:1013` says `systemMessage` can arrive as an `SDKInformationalMessage` in stream-json.
16. **§3.8's list of count comments is incomplete (no check reds).** It leaves out:
    - `packages/nana-pack/extensions/nana-writing.ts:4` ("the seventh pack extension");
    - `packages/nana-pack/tests/config-handlers-malformed.test.mjs:4` ("the seven extensions");
    - `packages/nana-setup/tests/win32-degrade.test.mjs:68` ("four"), `:92` ("all five"), `:123` and `:229` ("other four").
17. **Internal inconsistency in the census (`install-check.test.mjs:321`).** One census row lists `:321` as "red … no check edited". Another lists `:321` as "lists gain it, counts 6". So it is edited. A related wording conflict, not a repo fact: the Claude Code refusal text is described three ways.
    - R-1191: "stating that pi-worker starts pi entries only".
    - §3.2: "saying a Claude Code seat starts it".
    - §3.7: "the two ways out".

    W3 pins only `roster.largerBuilder`.

## UNVERIFIABLE

- D3's "28 product files still hold 68 lines with it". The plan does not define "product files". Ran with tests, docs, research, HANDOFF, REQUIREMENTS and bench studies excluded:
  - the first name, case-sensitive: 21 files, 49 lines;
  - case-insensitive: 51 lines;
  - with the username and GitHub handle added: 30 files, 76 lines.
- `sonnet` = Claude Sonnet 5. Only machine memory says so (`reference_roster.md`, model-id note). `claude --help` says only "an alias for the latest model (e.g. … 'sonnet')".
- How `systemMessage` looks in either Claude Code terminal UI, and whether pi's own status line replaces the info notice in practice.
- Whether SessionStart fires for a Claude Code subagent. `hooks.md:51` shows only that `SubagentStart` exists.
- Windows: whether CI's git supports `%(worktreepath)`, and whether a no-shell `execFile('git')` finds git.exe from a hook.

## INFERRED claims re-checked (now VERIFIED by reading or running)

- The 16 install-check reds (`:321`, `:357` and 14 single-FAIL checks). Read: the stub's fallback returns empty stdout (`:219`); `assertOnlyHookFails` deep-equals the FAIL list (`:575-582`); `:325` and `:362` assert exit 0.
  - There are exactly 14 `assertOnlyHookFails` checks: `:585`, `:587`, `:589`, `:591`, `:593`, `:595`, `:610`, `:616`, `:618`, `:620`, `:622`, `:624`, `:626`, `:825`.
  - Other full runs (`:628`, `:634-664`, `:675-703`, `:715-736`, `:780-807`) assert single lines and stay green.
- The `:799` index shift. Read: `mergeHooks` pushes to the end of the matching group (`settings.mjs:527-532`), after the foreign `after` entry. So the check needs `migrated.length === 6` and the last-index read.
- The restore list stays green either way. Read: `restore.test.mjs:119-120` uses the list only as a filter, so a missing label loses coverage but fails nothing.
- Uninstall `:292` stays green under pair 41. Read: an absent link row prints `unchanged absent` (`uninstall.mjs`, link branch), its mark is `·` (`nana-setup.mjs:95`), and the test's row regex keeps it.
- SessionStart hooks run in parallel: `hooks.md:412`.
- pi `-p` children have no UI. Read: `types.d.ts:217` ("true in TUI and RPC modes").
- The install check's RPC step stays green. Read: `install-check.mjs:246` checks only exit, `reload-runtime` and the journal line.
- Uninstall pruning under pair 39 (timeout 10). Read: `removeInstallerHooks` matches the canonical desired entry (`settings.mjs:312-341`), so uninstall still removes the entry. Win32 repair seeds `timeout: 5` (`win32-degrade.test.mjs:218`). Pair 39 reds only `:302` and `:304`, as claimed.

## VERIFIED (cited line holds what CHANGE.md says)

- **Rows and IDs.**
  - Main's highest ID is R-1183. feat/regroup (a74b453) adds R-1170 to R-1180 and R-1184.
  - R-1185 to R-1187 are used as mutation fixtures (main and regroup review corpora). R-1188 and R-1189 are unused anywhere, so reserving them is a choice.
  - R-1190 to R-1219 are unused on every branch and in the regroup worktree (Ran).
  - The leaf total is 1,139 (`requirements-tree.test.mjs:40,54-55`); regroup's tip says 1,151.
  - Row placement is identical on main and the regroup tip for every row cited (Ran).
  - Every quoted old row text holds: R-301 "four"; R-1051's four entries; R-1055 "five"; R-1056 "all five"; R-658 "all seven"; R-961 "the resolved builder's provider and model"; R-960 "refuse missing or invalid option values"; R-1120 to R-1124 (`REQUIREMENTS.md:340-346`).
  - The feature and subgroup headings exist as named (FEAT-006 `:328`, SUB-012 `:696`, SUB-013 `:727`, SUB-015 `:782`, FEAT-015 `:919`, FEAT-018 `:1023`, FEAT-023 `:1157`, FEAT-032 `:1517`, FEAT-011, FEAT-021, FEAT-028).
- **Claude Code.**
  - `hooks.md:726`, `:810`, `:1006`, `:1013`, `:1115`, `:1261-1263` say what §1 says.
  - Installed version 2.1.299. `--model` takes "an alias … or a model's full name". `--no-session-persistence`, `--output-format` and `--verbose` exist (Ran `claude --help`).
- **pi 1.0.2 (Ran `pi --version`).**
  - `types.d.ts:553-559` (reasons), `:80`, `:84`, `:101` (notify, setStatus, setWidget above or below the editor), `:217` (hasUI).
  - `runner.js:813-839` awaits each handler in turn and catches throws.
  - `footer.js:252-261` puts statuses on one line, sorted and cut to width.
  - `interactive-mode.js:2270-2280` sends info to `showStatus`; `:3060-3078` replaces the last status; `:1491`, `:4547` and `:4738` are pi's own status lines.
  - `rpc-mode.js:87-95` turns notify into an `extension_ui_request`.
  - Desk `app.js:1469-1470` shows it as a toast.
  - `package.json:22` loads the extensions folder.
- **Roster.**
  - `worker-config.mjs:19-34` (slots and defaults); `:26` holds the owner's name.
  - `nana-roster.mjs:77-91` (validator), `:90` (returns the file's object), `:98` (resolver).
  - `pi-worker.mjs:26` (ownOptionNames), `:96-97` (resolve, then refuse), `:106` (argv), lock at `:141`.
  - `worker-lane.test.mjs:214-218` (R-1124 literals stay green on the small lane). `nana-roster.test.mjs:40` and `:209` red as stated. `:55`, `:66`, `:75`, `:89`, `:103`, `:120`, `:154`, `:167`, `:197` and `:220` stay green: they check fields one by one, check the default by identity, or check that an extra `auditor` slot is refused.
  - `parseWatchdogArgv` ignores unknown own options (`pi-watchdog.mjs:100-119`), so residual 2 holds.
  - Ran `nana-roster.mjs`: luna is the only builder, `source: default`. Ran the git query: `feat/regroup` has a worktree; `feat/t3-land-b` has none, and its last commit is dated 2026-10-08. The query took 19 ms.
  - Ran `notice-lengths.mjs`: 230 and 191 characters. These are hand-typed strings, not composed by code.
- **Setup.**
  - `settings.mjs:189-228` (desiredHooks), `:192-200` (nodeHook, timeout 5), the count comments at `:171`, `:181`, `:416`.
  - `steps.mjs:44`, `state-manifest.mjs:58`, `install-check-config.mjs:10-16`, `:33`.
  - `install-check.mjs:49`, `:53`, `:72-73`, `:188-198`, `:246`, `:258`, `:270`, `:273-281`, `:297`.
  - `hook-producer.mjs:15-21` (markers), `:33` (second node). `shared-memory-input.mjs:11`, `agent-dir.mjs:67` (no pi import), `paths.mjs:101-104`, `display.mjs:109`.
  - `doctor.mjs:381`, `:383` comments; `:335-339` iterates HOOKS; the settings rows iterate desiredHooks.
  - `code-map.config.json`: pack to setup imports are within one layer.
  - `AGENTS.md:147`; `CLAUDE.md` is a symlink to `AGENTS.md`.
- **Docs.**
  - Pack README `:28` "Seven extensions", `:208` Lane builder (holds the owner's name), `:214-224` Machine roster.
  - Root README `:11` and `:166`.
  - nana-setup README `:37`, `:45`, `:438` "five".
  - Both package.json descriptions say "seven".
  - The shared table has 10 capability columns. Desk README matrix lines `:127-129`.
- **Census.** Every other §5.2 line was read and says what is claimed:
  - settings-merge `:35`, `:117`, `:138`, `:142`, `:278`, `:302`, `:304`, `:392`, `:799`;
  - install-check `:45`, `:242`/`:251`, `:289`/`:297`, `:474`, `:517`/`:519`, `:523`, `:539`, `:551`, `:758`;
  - uninstall `:253`, `:276`, `:288`, `:292`; state-manifest `:65`; install `:99`;
  - win32-degrade `:61`, `:69`, `:103-109`, `:126`, `:132-135`, `:210-238`; hooks-win32-exec `:100`, `:124-176`, `:182-185`;
  - config-handlers-malformed `:21` (its UI check filters on the absolute file path, so an info notice using `~` stays out of it);
  - templates-render `:274`, `:294-317`, `:342-351`, `:373-384`, `:407-411`, `:551`, `:573`, `:580`, `:739`, `:749`, `:756`; skill-claims `:39`, `:78`, `:80`; code-map `:39`; win32-launch `:222-232`.
  - The research probe outputs agree: settings-merge 8 FAIL; install-check `:45`, `:242`, `:474`; uninstall `:292`, plus `:253` and `:276` without the manifest row.

## Census sweep (what else was searched)

- Searched every test, script and app for:
  - the literal hook names (`nana-shared-memory`, `verifier-pipe.mjs`);
  - extension names and "seven", "five", "four" counts;
  - `readdirSync` over hooks or extensions;
  - RPC `notify` assertions;
  - roster API consumers;
  - doctor row counts.
- Beyond the items above, no further red was found:
  - `scripts/test.mjs` finds test files on its own;
  - `.github/workflows/ci.yml` names no test files;
  - the desk unit tests use stub pi or `-ne`;
  - `verifier-pipe.test.mjs:157` matches the Claude Code row by regex;
  - `hook-producers.test.mjs` imports only the verifier.
- Caveat for the build brief: line numbers are at 2dbc817. Once feat/regroup lands:
  - `templates-render.test.mjs` shifts by +2 after `:186` and by +49 after about `:473` (so `:551` becomes about `:600`);
  - root `README.md:166` becomes `:167`;
  - `requirements-tree.test.mjs` says 1,151.
