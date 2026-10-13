# Research — how a launcher finds pi's Node entry (roster lane, Windows launch switch)

*Copied into this folder from the seat's scratch folder on 2026-10-13. The scratch evidence and fetched sources it names stayed there.*

*2026-10-13 · for the roster plan reviser · inputs read: `packages/nana-pack/lib/win-command.mjs` and `-config.mjs`,
`packages/nana-pack/bin/pi-watchdog.mjs`, `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md`, `apps/desk/pi-session.mjs`,
`packages/nana-setup/tests/pi-registration.test.mjs:309-345`, the roster `CHANGE.md` and `sol-plan-r1.md`, cross-spawn 7.0.6
(bundled in the global pi 1.0.2), npm 10.9.7's `cmd-shim` 7.0.0, `bin-links` 5.0.0 and `read-cmd-shim`, pnpm 11.3.0's bundled
`@zkochan/cmd-shim` 9.0.3, pi 1.0.2's `config.js` and `package-manager-cli.js`, `https://pi.dev/install.ps1` and `install.sh`
(fetched today), Volta `crates/volta-core/src/shim.rs` and `volta-layout/src/v4.rs` (main), Scoop `bucket/nodejs-lts.json`
(master), Node v22.x `doc/api/child_process.md`. Scratch evidence sits beside this file (listed at the end).*

## 1. Recommendation (one rule)

**win32 only.** On win32 the launcher takes `findPi` (R-1033, unchanged) and branches on what it returns:

- `.cmd` / `.bat` (npm's shim): the package folder is `<folder of that shim>\node_modules\@earendil-works\pi-coding-agent`
  (npm's Windows global layout). Read its `package.json`; it must be a JSON object whose `name` is that package. Take `bin`
  when it is a string, else `bin.pi`. Resolve it against the package folder; it must stay inside the folder and be a file.
  Start `process.execPath` with `[entry, ...piArgs]`, no shell, no `windowsVerbatimArguments`.
- `.exe` / `.com` (a native pi, e.g. the Bun build from GitHub releases): start it directly with `piArgs`.
- Anything else: refused, named, nothing started (see §6).

This is pi's own rule. pi's managed Windows launcher (`install.ps1` → `<agent dir>\bin\pi-launcher.js`, VERIFIED) does
exactly this once it has the package folder:

```js
const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
const binPath = typeof packageJson.bin === "string" ? packageJson.bin : packageJson.bin?.[commandName];
if (!binPath) { throw new Error(`${packageName} does not declare a ${commandName} bin`); }
const cliPath = path.resolve(packageDir, binPath);
const cliRelative = path.relative(packageDir, cliPath);
if (cliRelative.startsWith("..") || path.isAbsolute(cliRelative) || !fs.statSync(cliPath).isFile()) {
	throw new Error(`Managed Pi executable is invalid: ${cliPath}`); }
const result = spawnSync(process.execPath, [cliPath, ...process.argv.slice(2)], { stdio: "inherit", env: { ...process.env, PI_MANAGED_INSTALL_ROOT: installRoot } });
```

Only the package-folder locator is ours; the bin rule, the containment check and `process.execPath` are copied from pi.

**Prototype result (scratch, not repo code).** `proto-resolve.mjs` ran the rule against npm's real Windows shim files
(generated with npm's own `cmd-shim` 7.0.0 into `win-shape/`) and a fake package: it found the entry, and
`spawnSync(process.execPath, [entry, ...args])` delivered `["--append-system-prompt","line one\nline two\r\nline three","-p",
"a%PATH%b !x! \"q\" ^&|<>","trailing\\"]` byte-identical, with `ppid` = the launcher (macOS run; Windows argv carriage is
INFERRED until the Windows leg runs). With `path.win32` and injected files it resolved `C:\npm\PI.CMD`, and refused an
escaping bin, a missing entry and a Volta-shaped folder, each with a named reason.

## 2. What `findPi` does today (VERIFIED, `lib/win-command.mjs:29-47`)

`findPi({env, cwd, exists})` = `findOnPath("pi", {allowedExtensions: PI_EXTENSIONS})`. It reads `PATH`/`PATHEXT`
case-insensitively, splits PATH on `;`, strips surrounding quotes, skips empties, never searches the cwd, and within each
folder tries PATHEXT's order (default `.COM;.EXE;.BAT;.CMD`) filtered to `.com .exe .bat .cmd`. `exists` = lstat succeeds and
is not a directory. It returns the first absolute `path.win32` path, or `null`. It knows nothing about installers: the
pi-cmd-launch record's claim that "npm, pnpm, nvm-windows, Volta and Scoop all put one there" is true because each writes a
`pi.cmd`, which `winCommand` then runs through `cmd.exe /d /v:off /s /c` — whatever the shim does next. The new rule keeps
`findPi` (the launcher starts the same pi that install and doctor register into) and replaces only what follows it.

## 3. Installers: what is on PATH and how to reach the JS entry

| Installer | On PATH | Path to the entry | Evidence | Rule outcome |
|---|---|---|---|---|
| npm, Windows (Node MSI `%APPDATA%\npm`; `npm i -g --prefix P`; GitHub runner) | `P\pi`, `P\pi.cmd`, `P\pi.ps1` (Jake's photo shows these three) | `P\node_modules\@earendil-works\pi-coding-agent\` + `package.json` `bin.pi` = `dist/bundle/cli.js` | VERIFIED: bin-links `bin-target.js` (`isWindows ? getPrefix(path)`, shim in the prefix, package in `prefix/node_modules`); cmd-shim 7.0.0 template; shims generated here | **supported** |
| nvm-windows | `pi.cmd` in the nvm symlink folder (next to `node.exe`) | same sibling `node_modules` | INFERRED (npm's default prefix = node's folder when no npmrc sets one) | supported |
| Scoop `nodejs` / `nodejs-lts` + `npm i -g` | `~\scoop\apps\nodejs-lts\current\bin\pi.cmd` | same sibling `node_modules` under `bin` | VERIFIED manifest: `post_install` writes `prefix=$persist_dir\bin`; `env_add_path: ["bin", "."]`. No Scoop manifest for pi exists to my knowledge (INFERRED) | supported |
| pnpm 11, Windows | `PNPM_HOME\bin\pi.cmd` (+ `pi`, `pi.ps1`) | `PNPM_HOME\global\v11\<hash>\node_modules\@earendil-works\pi-coding-agent`, a link into the store | POSIX layout VERIFIED by a scratch `pnpm add -g` (bin dir `PNPM_HOME/bin`; sh shim, not a symlink; target `$basedir/../global/v11/<hash>/…/cli.js`); `.cmd` template VERIFIED from the bundled generator: `"%~dp0\<relative target>" %*`; Windows paths INFERRED from the same generator | refused, named |
| Volta | `%LOCALAPPDATA%\Volta\bin\pi.cmd` = `@echo off` / `volta run %~n0 %*` | no path in the shim; `volta which pi` or `tools\image\packages\<pkg>\…` | VERIFIED source (`shim.rs` Windows `SHIM_SCRIPT_CONTENTS`; `shim_file` adds `.cmd`) | refused, named |
| pi.dev managed (`irm https://pi.dev/install.ps1 \| iex`, pi's README default for Windows) | `<agent dir>\bin\pi.cmd` = `@ECHO off` / `node "%~dp0pi-launcher.js" %*` | `<agent dir>\install\current-version` → `install\releases\<v>\node_modules\@earendil-works\pi-coding-agent` + the bin rule; marker `install\managed-install.json` (`kind: pi-managed-install`, `schemaVersion: 1`, `layout: releases-v1`) | VERIFIED `install.ps1:1424-1526`, `1556-1641` | refused, named (carry, §8) |
| Bun binary (GitHub releases) | `pi.exe` | none: it is pi | INFERRED name (`build:binary` → `dist/pi`; pi's `detectInstallMethod` → `bun-binary`, VERIFIED) | started directly |
| npm, macOS/Linux | `<prefix>/bin/pi` → symlink `../lib/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js` | `realpath` of the symlink | VERIFIED scratch `npm install -g --prefix … @1.0.2 --before=2026-10-04T06:57:57Z` | unchanged (`spawn('pi')`) |
| pnpm, macOS/Linux | `$PNPM_HOME/bin/pi`, a sh script ending `exec node "$basedir/../global/v11/<hash>/…/cli.js" "$@"` and a `# cmd-shim-target=<abs>` line | the script's target | VERIFIED scratch install | unchanged |
| pi.dev managed, macOS/Linux | `~/.pi/agent/bin/pi`, a sh launcher ending `exec "$pi_release_bin" "$@"` | `install/releases/<v>/node_modules/.bin/pi` | VERIFIED `install.sh:1146-1190` | unchanged |

**npm's Windows `.cmd` template (cmd-shim 7.0.0, `lib/index.js`, the `#!/usr/bin/env node` branch), as written for pi:**

```bat
@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\node.exe" (
  SET "_prog=%dp0%\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\node_modules\@earendil-works\pi-coding-agent\dist\bundle\cli.js" %*
```

Source lines: `longProg = \`"%dp0%\\${prog}.exe"\``, `target = \`"%dp0%\\${target}"\``, and the final
`` `"%_prog%" ${args} ${target} %*\r\n` ``. The shim runs `node.exe` beside it when one exists, else `node` on PATH, with the
entry as the first argument. The rule reproduces that with `process.execPath`.

## 4. Approaches considered and dropped

- **`shell: true`.** cmd.exe joins arguments without escaping, so the multi-line brief breaks (Jake's seat diagnosis). Node
  v22 docs also deprecate passing `args` with `shell: true` (VERIFIED, `child_process.md:354`).
- **cross-spawn's approach** (VERIFIED `lib/parse.js`, `util/escape.js`): resolve with `which` and PATHEXT, honour a shebang,
  otherwise run `comspec /d /s /c "<escaped line>"` with `windowsVerbatimArguments`, doubling `^` escapes for
  `node_modules\.bin\*.cmd`. Its escaping has no case for CR or LF, and cmd.exe ends a command at a line feed, so it cannot carry
  the brief either. It is the design being replaced, with escaping in place of refusal.
- **Parse the `.cmd` shim.** npm's own parser, `read-cmd-shim`, uses `/"%(?:~dp0|dp0%)\\([^"]+?)"\s+%[*]/` (VERIFIED). It would
  also read pnpm's shim, but not Volta's (`volta run`) or the managed one (`"%~dp0pi-launcher.js"`, no backslash). It ties the
  launcher to two generators' text templates and still needs the `package.json` check. Not worth the coupling for one more
  installer. Recorded as the cheapest pnpm extension if pnpm support is ever wanted.
- **The desk's resolver** (`apps/desk/pi-session.mjs`): walk up from `realpath(pi)`, else enumerate layouts and tie by
  `pi --version`. It exists to import pi, it spawns `npm root -g` and `volta which`, and on Windows `realpath(pi.cmd)` is the
  `.cmd`. It is frozen and in another component. Its `PI_PACKAGE` constant duplicates the one this lane adds; a cross-component
  import is not allowed.
- **`npm root -g`.** Already rejected in pi-cmd-launch plan r1: it can name a different pi than the one on PATH.
- **`PI_PACKAGE_DIR`.** pi reads it as its own asset folder override (VERIFIED `config.js:315-319`, for Nix/Guix). Reusing it as
  a launcher input would overload its meaning. Not used.
- **`node pi-launcher.js` for managed installs.** It keeps argv intact, but the launcher idles in `spawnSync` while its child
  works, so the watched process's CPU stays flat: the tree-CPU workaround would come back.

## 5. win32 only, not every platform

1. **Nothing to fix on POSIX.** npm's `pi` is a symlink to `cli.js`; pnpm's and the managed launcher end in `exec`. `spawn('pi')`
   already makes pi the watched process with argv intact (VERIFIED for npm, pnpm and managed layouts above).
2. **An all-platform rule regresses POSIX installs.** pnpm's `pi` is a script whose package sits under `global/v11/<hash>`, and
   the managed `pi` is a launcher script. Neither has a sibling `node_modules`, so both work today and would be refused.
3. **It rewrites every POSIX launcher test.** `worker-lane`, `immutable-review`, `review-ledger`, `handoff-writer-role`,
   `notify-fallback` and `pi-install` stub `pi` as a `#!/bin/sh` script on PATH. A package resolver finds no package there.
4. **The cost of win32 only** is that the branch never runs on this Mac. The forced-win32 cases (§7) run on every leg with
   `path.win32` and injected files, and K7 (win32 launch on every platform → POSIX titles red) stays.

## 6. Failure behaviour (win32; every case: `[<tag>] pi launch refused: <reason>` on stderr, capture dir removed, `ok:false`, nothing spawned)

| Case | Reason text (draft) |
|---|---|
| `findPi` returns null | `pi is not on PATH` |
| `.cmd`/`.bat` with no readable `package.json` beside it (pnpm, Volta, managed, a hand-written wrapper) | `pi at <shim> is not an npm global install: no @earendil-works/pi-coding-agent package beside it; install pi with npm (pnpm, Volta and the pi.dev installer are not supported by the launchers)` |
| `package.json` is not a JSON object, or its `name` differs | `<package.json> is not the @earendil-works/pi-coding-agent package` |
| No string `bin` and no `bin.pi` | `@earendil-works/pi-coding-agent at <folder> declares no pi bin` |
| `bin` resolves outside the folder | `pi bin <bin> resolves outside <folder>` |
| Entry missing or a directory | `pi entry <entry> is not a file` |

A spawn error after a successful resolution (for example a Node older than pi's 22.19 floor) stays today's
`pi spawn failed: …` path. The package name and bin name are vocabulary: `PI_PACKAGE = "@earendil-works/pi-coding-agent"` and
`PI_BIN_NAME = "pi"` go in `bin/worker-config.mjs` (in scope; `lib/win-command-config.mjs` is NOT), provenance
"contract: pi 1.0.2 `package.json` name and `bin` {"pi": "dist/bundle/cli.js"}, read 2026-10-13".

**Shape.** `piLaunch(piArgs, { platform, env, cwd, exists, readText, execPath })` in `pi-watchdog.mjs`, returning
`{command, args, options: {}}` or `{refused}`. Not win32: `{command: 'pi', args: piArgs}`. All win32 path work uses `path.win32`
so the forced cases behave as Windows on macOS. Defaults: `exists` = findPi's lstat check, used again for the entry;
`readText` = `readFileSync(…, 'utf8')`; `execPath` = `process.execPath`. `captureDir` drops out of the signature.

## 7. What changes in the plan (subtraction)

**Dropped:** the prompt-file move (`system-prompt-<n>.md`, the `@` hint, `captureDir`); `winCommand`, ComSpec and the refused
characters in the watchdog; `treeCpuSeconds` and the `Get-CimInstance` query (the watched pid is pi, so today's
`Get-Process -Id <pid>` CPU poll stays as landed); process's R-1105 reword (the standard goes as text on every platform, so the
row keeps process's wording); residual 12's character refusals; the README's refused characters and its "`-p @<path>` on
Windows" requirement; pairs 41–47. **Kept:** `findPi` (R-1033) as the lookup, native realpath on win32 (`fsReal`,
`pi-worker.mjs:75-86`), the R-1124 builder line, `killGroup`'s `taskkill /T /F`, and everything else in the plan.

**R-1125 draft (split for one `shall` each; IDs from the lane's range):**
- R-1125: WHERE the platform is win32, pi-worker and pi-review shall start a `.cmd` or `.bat` pi that findPi locates as the Node
  executable running them, with the file named by the `pi` bin of the `@earendil-works/pi-coding-agent` package in that shim's
  folder's `node_modules` as the first argument and the pi arguments unchanged after it, and start a located `.exe` or `.com`
  pi directly with those arguments.
- R-1129: IF the platform is win32 and no pi is found, or that package's `package.json` is unreadable, not that package or
  declares no `pi` bin, or the bin resolves outside the package or to no file, THEN pi-worker and pi-review shall end the
  attempt naming the reason on stderr without spawning.
- R-1130: WHERE the platform is win32, pi-worker shall resolve a lane's paths by native real path.

**Tests — forced win32, every leg** (`win32-launch.test.mjs`; four titles, as before):
1. "win32 launch runs the npm pi package's bin entry with the running node and the arguments unchanged". PATH `C:\a;C:\npm`;
   only `C:\npm\pi.cmd` and its package exist. Expect `command === execPath` (injected) and `args[0] ===
   C:\npm\node_modules\@earendil-works\pi-coding-agent\dist\bundle\cli.js`. The rest equals piArgs, with values holding LF,
   CRLF, `%`, `!`, `"` and a trailing `\`. Also `PI.CMD`, a string `bin`, and a `.bat`.
2. "win32 launch starts a pi.exe directly": `PI.EXE` → `command` is that path, args unchanged.
3. "win32 launch refuses with a named reason when pi, its package, its bin or its entry is missing". Cases: no pi; a Volta
   `pi.cmd` with no package; a wrong `name`; invalid JSON; no bin; `bin` `..\..\..\evil.js`; a missing entry.
4. "non-win32 launch is pi by name with the arguments unchanged".

**Tests — Windows leg only** (five titles, as before; printed SKIP elsewhere). Fixture: a fake package named `PI_PACKAGE`,
imported by name, with `bin {pi: "dist/bundle/cli.js"}`. Its entry appends `{execPath, entry: argv[1], argv, ppid}` to a
record, can spin busy, and prints `VERDICT: LAND`. `npm pack` it, then install the tarball with npm's JS CLI, run by
`process.execPath` with `process.env.npm_execpath` (the `pi-registration.test.mjs:319-325` pattern):
`install --global --prefix "<tmp>\nana pi prefix &()" --offline --ignore-scripts <tgz>`. npm writes `pi`, `pi.cmd`, `pi.ps1`
and the package. Prepend the prefix to PATH, and first assert that `findPi` returns `<prefix>\pi.cmd`.
- "Windows: lane pi-worker prints the builder line and starts the npm-installed pi entry with node and the lane argv"
  (`execPath` = the test's node, `entry` = the installed `cli.js`, `ppid` = the pi-worker child's pid: no `cmd.exe` between).
- "Windows: non-lane pi-worker hands pi line breaks, %, !, quotes and a trailing backslash unchanged".
- "Windows: pi-review hands the review standard to pi as text" (the recorded argv holds `prompts/review-standard.md`'s bytes
  after the immutable sentence; R-1105 unchanged).
- "Windows: a busy pi is not stopped as stalled" (`--stall-secs 3 --poll 1`, 12 s spin → exit 0, no STALL).
- "Windows: a pi.cmd with no npm package beside it starts nothing and leaves no capture directory" (a Volta-shaped `pi.cmd`
  first on PATH → exit 1, the named reason, an empty record, no `pi-review-*` dir in the test's TEMP).

**Mutation pairs replacing 40–47** (code edits only): win32 returns `pi` by name → title 1. Locate the package from
`%APPDATA%\npm` or the cwd instead of the shim's folder → title 1. Run the shim through `winCommand` → title 1, plus the
Windows ppid and argv titles. Drop the name check, the containment check or the file check → title 3. Ignore a string `bin` →
title 1. Fall back to `pi` on a refusal → title 3. Start `.exe` through node → title 2. K7 stays as written.

## 8. Residuals and carries this design brings

1. **Carry, top priority: the pi.dev managed install.** It is pi's documented Windows install. Every `pi update` on an npm
   install prints "Run the installer to migrate to a managed installation" (VERIFIED, `package-manager-cli.js:953-961`). After
   that migration the launchers refuse, named. Adding it is a second locator: `<shim folder>\..\install\managed-install.json`
   valid → `install\releases\<current-version>\node_modules\@earendil-works\pi-coding-agent`, plus
   `PI_MANAGED_INSTALL_ROOT=<agent dir>\install` in the child env, as `pi-launcher.js` sets. The bin rule is unchanged. It is
   kept out of this lane because Jake's machine runs npm and the Windows leg cannot install it without the network.
2. **Residual: pnpm, Volta and old Volta.** pnpm and Volta are refused, named, on Windows. Volta before 1.1 wrote `pi.exe`
   copies of `volta-shim.exe`; started directly, the watched process would be the shim, whose CPU stays flat while pi works.
   That version is INFERRED to be from 2022 and not handled.
3. **Residual: which Node.** npm's shim prefers `node.exe` beside the shim, else `node` on PATH. The launcher uses the Node
   running it. These are the same for the Node MSI and nvm-windows layouts when the seat runs `node "$HOME/…"`. A Node below
   pi's 22.19 floor fails at spawn with pi's own message.
4. **Residual: Windows command line length.** `CreateProcess` caps the command line at 32,767 characters (Microsoft docs;
   INFERRED, not fetched). The review standard is 911 bytes; a very large inline brief would fail at spawn. `-p "@<path>"`
   still works and is the README's advice for a large brief, not a requirement.
5. **Note for residual 13 (console window), now VERIFIED from Node docs.** "On Windows, setting `options.detached` to `true`
   … The child process will have its own console window" (`child_process.md:920-923`). With `node.exe` as the child, each
   attempt can open a console window on a desktop seat. `windowsHide: true` on win32 would hide it (its effect here is
   INFERRED); the reviser decides whether that is in scope.
6. **The claim most likely to be wrong:** that Node's spawn on Windows carries LF, CR, `"` and a trailing backslash to
   `node.exe`'s argv byte for byte. libuv quotes only for space, tab or `"`, and the MSVC runtime splits only on space and tab
   (from memory; INFERRED). Jake's seat reported "argv preserved" as a diagnosis, not a test. Windows-leg titles 1–2 decide it.

## Scratch evidence (this folder)

- `prefix/`: real `npm install -g --prefix … @earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z
  --ignore-scripts` (npm 10.9.7, scratch cache). `bin/pi` → `../lib/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js`.
  `package.json` `bin` = `{"pi":"dist/bundle/cli.js"}`. `node <cli.js> --version` → `1.0.2`.
- `win-shape/`: `pi`, `pi.cmd`, `pi.ps1`, written by npm's `cmd-shim` 7.0.0 for a Windows-shaped prefix. `read-cmd-shim`
  reads `node_modules\@earendil-works\pi-coding-agent\dist\bundle\cli.js` back from it.
- `fake-pi/`, `earendil-works-pi-coding-agent-0.0.0-fake.tgz`, `fake-npm/`, `pnpm-home/`: the fake package, its tarball,
  its npm install (POSIX symlink) and its pnpm 11.3.0 global install (sh shim under `bin/`, package under `global/v11/<hash>`).
- `volta-shape/`, `managed-shape/`: `.cmd` shims copied from Volta's and pi's installer templates.
- `proto-resolve.mjs`: the prototype rule and the argv round trip. `install.ps1`, `install.sh`, `volta-shim.rs`,
  `volta-layout-v4.rs`, `scoop-nodejs-lts.json`, `node-child_process.md`: fetched sources.
- Nothing was installed globally. Every install used `--prefix` (or `PNPM_HOME` and `--store-dir`) under this folder.
