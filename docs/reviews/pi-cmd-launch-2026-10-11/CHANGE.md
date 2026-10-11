# Change declaration — the pi seat installs on Windows

*Lane `pi-cmd-launch` · branch `feat/pi-cmd-launch` · worktree `~/nana-pi-wt/pi-cmd-launch`, based on
`main` at `0110601` (Windows in CI) · 2026-10-11. Features: SUB-013 "Connect hooks and packages
without duplication" (R-323, R-392; new rows below), FEAT-015 "Diagnose the active environment" (R-952),
and the post-edit feature holding R-105. Order: why → plan → sol plan review (item
`pi-cmd-launch-plan`; r1 SEND-BACK 4/10 answered here — version 2 replaces the npm-root design) →
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
1. On Windows, install and doctor run the same `pi` the terminal runs: the first `pi` file on PATH,
   trying PATHEXT's extensions in order (npm, pnpm, nvm-windows, Volta and Scoop all put one there).
   A `.cmd` or `.bat` shim runs through cmd.exe with each argument double-quoted, so a folder with a
   space passes intact; an `.exe` or `.com` runs directly. On macOS and Linux the lookup is unchanged.
2. pi not on PATH stays SKIPPED with the install hint (the Claude Code seat alone is a valid setup).
   A pi that is found but cannot start, or whose `--version` exits non-zero, is a PROBLEM and install
   exits non-zero — on every platform.
3. An argument cmd.exe cannot carry safely (a double quote, `%`, `!`, a line break or NUL, or a
   trailing backslash) is refused with a PROBLEM instead of being run.
4. Doctor reports pi's version on Windows, with the same output rules as on macOS.
5. On Windows, a post-edit command that exits 1 and whose first word names nothing cmd.exe could run
   — no internal command, no file in the working folder or on PATH — is reported as "could not run",
   in any Windows language. An ordinary exit 1 from a tool that exists stays a failed check.
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
| R-1033 | added (SUB-013) | WHERE the platform is win32, the installer and doctor shall locate pi as the first existing non-directory `pi<ext>` found by taking the directories of PATH in order and, within each, the extensions of PATHEXT in order, without searching the working directory. |
| R-1034 | added (SUB-013) | WHERE the platform is win32, the installer and doctor shall run a located pi ending in `.cmd` or `.bat` as the ComSpec interpreter with the arguments `/d /v:off /s /c` and one quoted command line in which the pi path and every argument are each wrapped in double quotes, and a located pi ending in `.exe` or `.com` directly. |
| R-1035 | added (SUB-013) | IF the platform is win32 and the located pi's path or any argument contains a double quote, `%`, `!`, a carriage return, a line feed or NUL, or an argument ends in a backslash, THEN the installer shall report the pi packages step as a problem without running pi. |
| R-1036 | added (SUB-013) | IF pi is found but its `--version` probe cannot start or exits non-zero, THEN the installer shall report the pi packages step as a problem, so that install exits non-zero. |
| R-952 | reworded and split (FEAT-015) | Doctor shall report the version line printed by pi's `--version`, running pi as R-1033 and R-1034 describe on win32. ("WHERE the platform is not win32" dropped; the install-hint clause moves to R-1037.) |
| R-1037 | added (FEAT-015, split from R-952) | Doctor's missing-pi detail shall use the exported install hint that install's missing-pi detail also uses. |
| R-1038 | added (post-edit feature, beside R-105) | IF the platform is win32 and a post-edit command exits with status 1 and the first word of the command names no cmd.exe internal command and no existing file — as written or with a PATHEXT extension — in the working folder or a PATH directory, THEN post-edit shall classify the check as error. |
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
  - `cmdCouldNotRun(command, { env, cwd, exists })` — the R-1038 predicate: reads the first word
    as cmd.exe does (a leading double-quoted string, or text up to whitespace or one of `&|<>()`);
    true only when that word is not an internal command and `findOnPath(word, { searchCwd: true })`,
    or the path itself when it holds a separator, finds nothing.
- **Configuration** `packages/nana-pack/lib/win-command-config.mjs`: the default PATHEXT
  (`.COM;.EXE;.BAT;.CMD`, chosen: the four extensions Windows sets by default; used only when PATHEXT is unset) and the list of
  cmd.exe internal command names (chosen; each one pinned on the Windows leg, below), each with its
  provenance. No inline vocabulary at the point of use.
- **`stepPiRegister`** (`packages/nana-setup/lib/steps.mjs`) gains an injectable
  `{ platform, env, spawn, exists }` (defaults: the real ones). win32: `findOnPath("pi")`; none →
  SKIPPED with the hint; found → `--version` through `winCommand`, then `pi install <dir>` the same
  way with `PI_CODING_AGENT_DIR` overriding the inherited environment. POSIX: unchanged lookup, but
  a probe error other than ENOENT, or a non-zero `--version`, is a PROBLEM (R-1036).
- **Doctor** (`lib/doctor.mjs:308`): the same helpers on win32 instead of "skipped (win32)"; the
  existing version rule is kept — the first stdout line must start with a dotted version; non-zero,
  empty, malformed, stderr-only and spawn-failure results are not OK.
- **Post-edit** (`extensions/nana-post-edit.ts`): `classify` gains the platform and the command; on
  win32, exit status 1 with `cmdCouldNotRun(command)` → `error`. The command still runs through
  Node's `shell: true` exactly as today; nothing is looked up before it runs, so a command led by a
  builtin missing from the list still runs and at worst is misreported, never passed.

**Declared residuals.** PowerShell runs `pi.ps1` when it sits beside `pi.cmd`; nana runs the `.cmd`
sibling, which starts the same `cli.js` for npm and pnpm shims. The working folder is not searched for
pi (PowerShell does not search it either, and a planted `pi.cmd` in a project would otherwise run). A
missing tool later in a compound command (`npm run lint && ruff check`) is a failed check, not "could
not run" — never passed. A pi path or package folder with `%`, `!` or a double quote cannot be
registered automatically; the PROBLEM names the character and the manual `pi install` command.

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
  name that already has an extension; `winCommand` for `.cmd` (the exact ComSpec argument list for a
  path with a space), `.exe` (direct) and `.ps1` (refused); each refused character and a trailing
  backslash; `cmdCouldNotRun` for a missing plain name, a name found in the working folder, one found
  on PATH, an internal command (`echo`), a quoted missing path, an existing relative path, and a
  first word ending at `&`.
- **Injected registration and doctor cases on every leg** (forced win32, a recording spawn): found
  `.cmd` → the recorded call is ComSpec with the quoted line and `PI_CODING_AGENT_DIR` set; not found
  → SKIPPED with the hint; spawn error and non-zero `--version` → PROBLEM and `installExitCode` 1;
  a refused character → PROBLEM and no spawn; doctor: version, non-zero, empty, malformed,
  stderr-only, spawn failure, not found.
- **Real cmd.exe on the Windows leg only** (skipped and counted elsewhere): a temp folder with a
  space holding a `pi.cmd` that prints a version for `--version` and writes `%*` to a log for
  `install`; PATH set to it; real `stepPiRegister` → the log holds `install` and the package folder
  intact. Post-edit: the existing R-105 test passes, and `exit 1` led by an existing tool (`node -e
  "process.exit(1)"`) is a failed check. Each configured internal command name runs under
  `cmd /d /c "<name> /?"` with status 0 and is not found by `findOnPath` — that pins the list.
- **Mutation pairs** (break the code, never an assertion): bare `pi` spawn on win32 → the injected
  registration case fails; drop PATHEXT → the `.cmd` lookup case fails; search the working folder for
  pi → its case fails; drop the quoting → the space case fails; drop a refused character → its case
  fails; leave found-but-failing as SKIPPED → the PROBLEM case fails; drop `cmdCouldNotRun` → the
  missing-name case fails on every leg; treat internal commands as missing → the `echo` case fails.
- `npm run test:locked` (macOS) and a CI run on this branch's draft pull request with the three files
  green on the Windows leg. Pushing the branch needs Jake's approval.
