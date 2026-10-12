# Change declaration — the pi seat installs on Windows

*Lane `pi-cmd-launch` · branch `feat/pi-cmd-launch` · worktree `~/nana-pi-wt/pi-cmd-launch`, based on
`main` at `0110601` (Windows in CI) · 2026-10-11. Features: SUB-013 "Connect hooks and packages
without duplication" (R-323, R-392; new rows below), FEAT-015 "Diagnose the active environment" (R-952),
and the post-edit feature holding R-105. Order: why → plan → sol plan review (item
`pi-cmd-launch-plan`; r1 SEND-BACK 4/10 — version 2 replaced the npm-root design; r2 SEND-BACK 6/10 and
r3 SEND-BACK 7/10 and r4 SEND-BACK 8/10 (over the cap) answered here) →
build → a CI run with the Windows leg → seat verification → sol build review → astra land review →
Jake accepts.*

## 1. Why

Jake uses both seats on his Windows work machine (2026-10-11). The first hosted Windows CI run
(triage: `docs/reviews/windows-ci-2026-10-11/windows-triage.md`, lane 1) found that `nana-setup
install` never registers nana-pack or nana-knowledge with pi on Windows: `stepPiRegister` runs a bare
`spawnSync("pi", …)` with no shell (`packages/nana-setup/lib/steps.mjs:984`, `:988`). Node's child_process
documentation says `.bat` and `.cmd` files "are not executable on their own without a terminal", so it
cannot launch the `pi.cmd` shim npm and pnpm install, and install reports "pi
is not on PATH" while pi works in the terminal — the pi seat runs without nana. Doctor skips its pi
check on Windows (`lib/doctor.mjs:308`). And post-edit reports a missing tool on Windows as a failed
check, not "could not run" (`extensions/nana-post-edit.ts:155`): cmd.exe does not exit 9009 for an
unknown command. R-105's own test fails on the Windows leg.

**Version 1 was wrong (sol plan r1).** It located pi through `npm root -g`, which misses pnpm, Volta
and Scoop installs and can pick a different pi than the one on PATH; it left a found-but-broken pi as
SKIPPED; and it matched cmd.exe's English "is not recognized" text, which is localised and spoofable.

**Observable outcome.**
1. On Windows, install and doctor run the first supported external pi on PATH: `pi.com`, `pi.exe`,
   `pi.bat` or `pi.cmd`, taking PATH's folders in order and, in each, PATHEXT's extensions in order
   (npm, pnpm, nvm-windows, Volta and Scoop all put one there). This is NOT always the command a
   terminal would pick (sol plan r2): cmd.exe searches the working folder first, and PowerShell can
   pick `pi.ps1`, an alias or a function first — both are declared limits (§3). A `.cmd` or `.bat`
   shim runs through cmd.exe with each argument double-quoted, so a folder with a space passes
   intact; an `.exe` or `.com` runs directly with an argument array. On macOS and Linux the lookup is
   unchanged.
2. pi not on PATH stays SKIPPED with the install hint (the Claude Code seat alone is a valid setup).
   A pi that is found but cannot start, or whose `--version` exits non-zero, is a PROBLEM and install
   exits non-zero — on every platform.
3. When pi is a `.cmd` or `.bat` shim, a path or argument cmd.exe cannot carry safely (a double
   quote, `%`, `!`, a line break or NUL, or a trailing backslash) is refused with a PROBLEM instead of
   being run. An `.exe` or `.com` pi gets no such refusal (sol plan r2): its arguments never pass
   through cmd.exe.
4. Doctor reports pi's version on Windows, with the same output rules as on macOS.
5. On Windows, a post-edit command that exits 1 and whose first word is a SIMPLE literal name that
   names nothing cmd.exe could run — no internal command, no file in the working folder or on PATH —
   is reported as "could not run", in any Windows language. Anything else stays a failed check: an
   ordinary exit 1 from a tool that exists, and every first word cmd.exe would rewrite before running
   it (`%ComSpec%`, `@node`, `^ruff`, a quoted path). The rule only ever moves a failed check to
   "could not run"; it never makes anything pass.
6. The Windows CI leg shows `pi-registration`, `doctor-runtime` and `post-edit-status` passing.

**Prior art (read, not recalled).** `cross-spawn` 7.0.6, installed with pi
(`<npm root -g>/@earendil-works/pi-coding-agent/node_modules/cross-spawn/lib`), solves both halves:
`parse.js` runs a non-`.exe`/`.com` file through `comspec` with `/d /s /c` and
`windowsVerbatimArguments`; `enoent.js` treats "exit status 1 and the command does not resolve on
PATH with PATHEXT" as not-found on Windows (its issue #16). This plan uses the same two rules, with a
smaller argument rule: refuse instead of escaping.

## 2. Requirement delta

| ID | Change | Text (draft) |
|---|---|---|
| R-1033 | added (SUB-013) | WHERE the platform is win32, the installer and doctor shall locate pi as the first existing non-directory `pi<ext>` found by taking the directories of PATH in order and, within each, the extensions of PATHEXT in order that are, compared without regard to case, `.com`, `.exe`, `.bat` or `.cmd`, without searching the working directory. |
| R-1034 | added (SUB-013) | WHERE the platform is win32, unless R-1035 refuses it, the installer and doctor shall run a located pi ending (in any case) in `.cmd` or `.bat` as the ComSpec interpreter with the arguments `/d /v:off /s /c` and one quoted command line in which the pi path and every argument are each wrapped in double quotes. |
| R-1039 | added (SUB-013) | WHERE the platform is win32, the installer and doctor shall run a located pi ending (in any case) in `.exe` or `.com` directly with its arguments as an argument array, applying no R-1035 refusal. |
| R-1035 | added (SUB-013) | IF the platform is win32 and the located pi ends (in any case) in `.cmd` or `.bat` and its path or any argument contains a double quote, `%`, `!`, a carriage return, a line feed or NUL, or an argument ends in a backslash, THEN the installer shall report the pi packages step as a problem, and doctor shall report pi as FAIL on the real home and as NOTE under a `--home` override, naming the refused character, without running pi. |
| R-1036 | added (SUB-013) | IF pi is found but its `--version` probe cannot start or exits non-zero, THEN the installer shall report the pi packages step as a problem, so that install exits non-zero. |
| R-952 | reworded and split (FEAT-015) | Doctor shall report pi as OK only when `pi --version` — run as R-1033, R-1034 and R-1039 describe on win32 — exits 0 and the first line of its standard output starts with a dotted version (`v` optional, then three dot-separated numbers), whatever it writes to standard error. ("WHERE the platform is not win32" dropped; the install-hint clause moves to R-1037.) |
| R-1037 | added (FEAT-015, split from R-952) | Doctor's missing-pi detail shall use the exported install hint that install's missing-pi detail also uses. |
| R-1038 | added (post-edit feature, beside R-105) | IF the platform is win32 and a post-edit command exits with status 1 and its first word — the text after any leading spaces and tabs, up to the next space or tab — is non-empty, consists only of ASCII letters, digits, `_`, `-`, `.`, `\`, `/` and `:`, neither equals nor starts with a name in the configured internal-command set followed by `/`, `\`, `.` or `:` (compared without regard to case), and names no existing non-directory file — as written or with a PATHEXT extension — at that path when it holds a separator, or in the working folder or a PATH directory when it does not, THEN post-edit shall classify the check as error. |
| R-105 | unchanged | A missing executable shall be classified error, never passed. Its test must pass on the Windows leg. |

R-323 and R-392 keep their text and tests; the registration tests gain the injected win32 cases.

## 3. Design

- **One helper module** `packages/nana-pack/lib/win-command.mjs` (six-tag header, named exports, no
  real resource reached without injection), imported by `nana-setup` (which already imports from
  `nana-pack/lib`) and by the post-edit extension:
  - `findOnPath(name, { env, cwd, searchCwd, exists })` — `env` is read case-insensitively (`Path`
    or `PATH`, `PATHEXT`); PATH split on `;`, empty entries skipped, surrounding quotes removed;
    PATHEXT split on `;`, defaulting to the configured value when unset; `searchCwd` puts the working
    folder first (cmd.exe's order, used by post-edit only); a name that already ends in a PATHEXT
    extension is also tried as written; `exists(p)` is "lstat succeeds and is not a directory" by
    default (an app-execution alias is a reparse point, so plain `stat` is not used).
  - `winCommand(file, args, { comspec })` — `.exe`/`.com`: run directly; `.cmd`/`.bat`:
    `[comspec ?? "cmd.exe", ["/d", "/v:off", "/s", "/c", "\"" + quoted line + "\""], { windowsVerbatimArguments: true }]`;
    any other extension, or a refused character (R-1035), returns a refusal naming the reason.
    Switches as Microsoft's `cmd` reference defines them: `/d` disables AutoRun commands, `/s` with
    `/c` strips only the first and last quote, `/v:off` disables delayed expansion so `!` handling
    never depends on the machine's defaults.
  - `cmdCouldNotRun(command, { env, cwd, exists })` — the R-1038 predicate, deliberately
    conservative (sol plan r2, r3): it does NOT try to parse as cmd.exe does. It skips leading spaces
    and tabs and takes the text up to the next space or tab; an empty word returns false; a word
    holding any character outside ASCII letters, digits, `_ - . \ / :` (so `%`, `!`, `^`, `@`,
    quotes, `&`, `,`, `;`, `=`, parentheses) returns false; a word that equals an internal-command
    name, or starts with one followed by `/`, `\`, `.` or `:` (cmd.exe's attached syntax: `dir/Z`,
    `cd\path`, `cd..`, `echo.text`), returns false — all compared without regard to case. Otherwise it
    returns true only when
    and nothing exists as written or with a PATHEXT extension: at the path relative to the working
    folder when the word holds `\`, `/` or `:`, else in the working folder then each PATH folder.
- **Configuration** `packages/nana-pack/lib/win-command-config.mjs`: the default PATHEXT
  (`.COM;.EXE;.BAT;.CMD`, chosen: the four extensions Windows sets by default; used only when PATHEXT is unset), the
  four supported pi extensions, and the internal-command set, each with its provenance. No inline
  vocabulary at the point of use. The internal-command set is sealed here (source: ss64.com
  "CMD internal commands", `ss64.com/nt/syntax-internal.html`, retrieved 2026-10-11; 45 names with
  aliases): `assoc break call cd chdir cls color copy date del dir dpath echo endlocal erase exit for
  ftype goto if keys md mkdir mklink move path pause popd prompt pushd rd rem ren rename rmdir set
  setlocal shift start time title type ver verify vol`. One test pins this exact list, naming R-1038.
- **`stepPiRegister`** (`packages/nana-setup/lib/steps.mjs`) gains an injectable
  `{ platform, env, spawn, exists, manifestRoot }` (defaults: the real ones; `manifestRoot` is
  already `packageCoverage`'s second parameter). win32: `findOnPath("pi")`; none →
  SKIPPED with the hint; found → `--version` through `winCommand`, then `pi install <dir>` the same
  way with `PI_CODING_AGENT_DIR` overriding the inherited environment. POSIX: unchanged lookup, but
  a probe error other than ENOENT, or a non-zero `--version`, is a PROBLEM (R-1036).
- **Extensions are compared without regard to case** everywhere (`pi.CMD`, `PI.EXE`; PATHEXT is
  normally upper case).
- **Doctor** (`lib/doctor.mjs:308`): the same helpers on win32 instead of "skipped (win32)"; a
  refusal (R-1035) is reported like any other not-OK result — FAIL on the real home, NOTE otherwise,
  the existing rule — with the refused character named; the
  existing version rule is kept and now stated in R-952 — exit 0 and the first stdout line starts
  with a dotted version; stderr is ignored; non-zero, empty, malformed, stderr-only and
  spawn-failure results are not OK.
- **Post-edit** (`extensions/nana-post-edit.ts`): `classify` gains the platform and the command; on
  win32, exit status 1 with `cmdCouldNotRun(command)` → `error`. The command still runs through
  Node's `shell: true` exactly as today; nothing is looked up before it runs, so a failing command
  led by an internal command missing from the set is at worst misreported, never passed.

**Declared limits and residuals.** PowerShell can run `pi.ps1`, an alias or a function before
`pi.cmd`; nana runs the external `.cmd` sibling, which starts the same `cli.js` for npm and pnpm
shims, and does not see aliases or functions. cmd.exe searches the working folder first; nana does not
search it for pi (PowerShell does not either, and a planted `pi.cmd` in a project would otherwise
run). PATHEXT entries other than the four supported extensions are skipped. A missing tool later in a
compound command (`npm run lint && ruff check`), or behind any non-simple first word, is a failed
check, not "could not run" — never passed. A failing command led by an internal command missing from
the sealed set is misreported as "could not run" — never passed. A `.cmd`/`.bat` pi whose path or
package folder holds `%`, `!` or a double quote cannot be registered automatically; the PROBLEM names
the character and the manual `pi install` command.

## 4. Scope

**In.** `packages/nana-pack/lib/win-command.mjs` and `win-command-config.mjs` (new);
`packages/nana-setup/lib/steps.mjs` (`stepPiRegister`); `packages/nana-setup/lib/doctor.mjs` (the pi
check); `packages/nana-pack/extensions/nana-post-edit.ts` (`classify` and its call); tests:
a new `packages/nana-pack/tests/win-command.test.mjs` (pure, runs on every leg), additions to
`packages/nana-setup/tests/pi-registration.test.mjs`, `doctor-runtime.test.mjs` and
`packages/nana-pack/tests/post-edit-status.test.mjs`; `REQUIREMENTS.md`; the code map; the setup and
pack READMEs where they say the pi check is skipped on Windows or describe post-edit's statuses;
`HANDOFF.md` and the session entry (seat, before the final review).

**NOT.** The Claude Code seat's hooks on Windows (next lane); the desk's own pi resolver (frozen);
other Windows failures in the triage (test portability, CRLF, AGENTS refresh); the package-coverage
rules themselves (R-323, R-392 unchanged); escaping instead of refusing.

## 5. Verification

- **Pure cases on every leg** (`win-command.test.mjs`, forced win32 with an injected env and
  `exists`): `Path` vs `PATH` key; quoted and empty PATH entries; PATHEXT order inside one folder
  (`pi.cmd` and `pi.exe` together); an earlier folder beats a later extension; the working folder is
  never searched for pi but is searched first for post-edit; a folder named `pi.cmd` is skipped; a
  name that already has an extension; a PATHEXT holding `.JS` and `.PS1` (skipped); `winCommand` for
  `.cmd` (the exact ComSpec argument list for a path with a space), `.exe` (direct, with a `%` and a
  `!` in its path and arguments: NOT refused) and `.ps1` (refused); for `.cmd`, each refused
  character and a trailing backslash; `cmdCouldNotRun` → true for `missing-tool x`, `.\missing-tool`
  and `C:\nowhere\tool.exe`; → false for a name found in the working folder, one found on PATH,
  `.\check` when `check.cmd` exists, `ECHO` and `type missing.txt` (internal commands, any case),
  `dir/Z`, `cd\nowhere`, `cd..`, `echo.text` (attached syntax), a blank command;
  → true for `   missing-tool` (leading spaces skipped); `pi.CMD` and `PI.EXE` found and launched
  the `.cmd` and the direct way respectively;
  `%ComSpec% /c exit 1`, `@node -e "process.exit(1)"`, `^ruff check`, `"C:\nowhere\tool.exe"`,
  `ruff,check` and `missing-tool&&x`. A separate test pins the sealed internal-command set exactly,
  naming R-1038.
- **Injected registration and doctor cases on every leg** (forced win32, a recording spawn): found
  `.cmd` → the recorded call is ComSpec with the quoted line and `PI_CODING_AGENT_DIR` set; not found
  → SKIPPED with the hint; spawn error and non-zero `--version` → PROBLEM and `installExitCode` 1;
  a refused character with a `.cmd` pi → PROBLEM and no spawn; the same character with an `.exe` pi →
  spawned with the argument array; doctor with a refused `.cmd` pi, once on the real home (FAIL,
  doctor exits non-zero) and once under a `--home` override (NOTE) — each names the character and
  spawns nothing; version, version on stdout plus text on stderr (OK),
  non-zero, empty, malformed, stderr-only, spawn failure, not found.
- **Real cmd.exe on the Windows leg only** (skipped and counted elsewhere). Registration through a
  REAL npm-generated shim (sol plan r2): a local fake pi package (no network) whose bin prints
  `9.9.9` for `--version` and otherwise writes `JSON.stringify(process.argv.slice(2))` to a log, is
  installed with `npm install -g --prefix "<temp folder with a space>"`, so npm writes its own
  `pi.cmd` that forwards `%*`;  a fixture manifest root sits under a folder
  named with a space and the accepted metacharacters `&`, `(`, `)`, `^` and `;`; the prefix is
  PREPENDED to the inherited PATH (sol plan r3: npm's shim falls back to `node` on PATH); the test
  first asserts that `findOnPath("pi")` returns the temporary prefix's `pi.cmd`, then runs real
  `stepPiRegister` with that `manifestRoot` → the log holds EXACTLY `["install", "<that folder>\…\nana-pack"]`
  as Node saw it. Post-edit: the existing R-105 test passes; `node -e "process.exit(1)"` is a failed
  check; `type nana-missing-file.txt` (an internal command exiting 1) and `dir/Z` (an invalid
  attached switch) are failed checks. Each name in
  the sealed set is pinned on the Windows leg by two locale-independent probes: `where.exe` run with
  PATH set to `%SystemRoot%\System32;%SystemRoot%` finds no file of that name, and
  `cmd /d /c "<name> /?"` writes help text to stdout and nothing to stderr; a control name that does
  not exist must give the opposite (empty stdout, non-empty stderr). **Seat amendment after the first
  Windows run (2026-10-11, CI run 38166757684):** the earlier probe — `where` on the inherited PATH and
  "`/?` exits 0" — failed for every name: on the hosted runner Git's `date.exe`, `dir.exe` and
  `echo.exe` sit on PATH (cmd.exe still runs its internal command first), and no internal command's
  `/?` exited 0. The names were right; the probe was wrong. A name that fails the new probe is removed
  from the set in a later round with the run as evidence.
- **Mutation pairs** (break the code, never an assertion): bare `pi` spawn on win32 → the injected
  registration case fails; drop PATHEXT → the `.cmd` lookup case fails; search the working folder for
  pi → its case fails; drop the quoting → the space case fails; drop a refused character → its case
  fails; apply the refusal to `.exe` → the `.exe` case fails; leave found-but-failing as SKIPPED → the
  PROBLEM case fails; drop `cmdCouldNotRun` → the missing-name case fails on every leg; treat internal
  commands as missing → the `ECHO` case fails; let `%`, `@` or `^` words through → their cases fail;
  drop PATHEXT for separator paths → the `.\check` case fails; drop the attached-syntax rule → the
  `dir/Z` case fails; compare extensions with case → the `pi.CMD` case fails; let doctor run a
  refused `.cmd` pi → the doctor refusal case fails.
- `npm run test:locked` (macOS) and a CI run on this branch's draft pull request with the three files
  green on the Windows leg. Pushing the branch needs Jake's approval.
