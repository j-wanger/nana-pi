# gate-rm-workdir: a plain rm inside the working directory runs unasked

**Feature.** In pi's bash tool, a command that is exactly one plain `rm` with only recursive, force or verbose flags and literal relative targets strictly inside the session working directory runs with no approval prompt and no headless block; every other rm form keeps today's verdict (Owner's ruling, 2026-10-10).

**Class: gate** (pi extension `extensions/nana-gate.ts` plus new `lib/gate-rm-inside.ts`). Ladder: roster reviewer, land reviewer (seat-land.md when the roster prints `land: seat`), seat wrong-code pairs, one independent check, Windows CI on the fix commit.
**Threat model.** In scope: honest variation in commands, paths, platforms and config (letter case, links and junctions, dot folders, Git Bash, a session started in home, in `~/.pi/agent` or in a relocated agent folder). Out: deliberate forgery; a race with another process.

## Today (gate code is the same at 0f2e0ca and main 355520d; probed in temp clones)
- `rm -r`, `-rf`, `-R`, `--recursive`, `--force` ask for every target, inside or outside (`rm recursive/forced`); `rm -rf ~` and `/` are floor.
- Plain `rm x`, `rm -f x` and `rm *.log` pass anywhere, including `rm -f ../x` and `rm -f /etc/hosts`.
- Literally named policy files are floor (`agentdir/auth.json`, `agentdir/extensions/x`); a folder holding them (`agentdir`, `agentdir/extensions`, `agentdir/sessions`) is not, and asks only through the rm check.
- PowerShell `Remove-Item -Recurse|-Force`, `ri -r -fo` and `rm -r` ask; plain `Remove-Item x` passes.

## History constraint
t1-gate (2026-10-07) subtracted a relaxation that skipped the rm scan by command word (`echo`, `printf`, `grep`, git read and message forms); sol showed text reaching an executor (`printf 'rm -rf ~\n' | xargs`, git alias bodies, attached `--eval=`). This design skips no scan. Every check runs as today; one non-floor rm danger is cleared, and only when the whole raw command is one `rm` built from an allow-listed character set, so no quote, expansion, separator or second command exists in accepted text.

## Design (planner prototype 268ea17 with the adversary's step 6; every probe below ran on it)
- New `lib/gate-rm-inside.ts` exports `rmInsideCwd(command, cwd, home = os.homedir()): boolean`; any throw returns false. Every path is spelled by `realPath` from `lib/real-path.mjs` (the on-disk spelling: case, 8.3 names; a missing tail kept), never a local copy. Containment uses one `inside(child, parent)` helper on `path.relative` that tests `..` plus a separator, never `startsWith("..")`. In order:
  1. cwd non-empty; raw text matches `^rm([ \t]+[A-Za-z0-9._@/-]+)+$` (no trim);
  2. flags match `^(-[rRfv]+|--recursive|--force|--verbose)$`; every other word is a target; at least one; none starts with `-` or `/`;
  3. the cwd's realPath is not a filesystem root, not home or an ancestor of home, and has no dot-named part;
  4. per target, drop empty and `.` parts; none left is false; a part starting with `.` (so `..`, `.git`, `.GIT`, `.pi`) is false;
  5. lstat each existing part from cwd down: a link (junction too) is false, ENOENT ends the walk, any other error is false;
  6. the target's realPath and the realPath of the active pi agent folder (`piAgentDir()` from gate-paths) are not the same folder, and neither lies inside the other;
  7. lstat `<target>/.git` must give ENOENT or ENOTDIR.
- `nana-gate.ts`: `commandHit(command, gate, cwd, tool)`; right after the floor loop, `if (tool === "bash" && segmentable && det.length === 1 && rmInsideCwd(command, cwd)) dangers.set(det[0], null);`. The policy floor runs before it; allow, extra, protected, cross-segment and verifier-pipe checks run after it unchanged; `segmentable` keeps R-047 (over 64 KB, no exemption). The caller passes `event.toolName`.
- Pack README: one gate bullet naming the exempt form, what still asks, and the limits below.

## Must-meet (all in `packages/nana-pack/tests/gate-rm-inside.test.mjs`; real registered handler, temp HOME and cwd)
| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-1490 | WHEN pi's bash tool sends a command that is exactly `rm`, flags drawn only from `-r`, `-R`, `-f` and `-v` (alone or combined) or `--recursive`, `--force` and `--verbose`, and one or more relative targets made of ASCII letters, digits, `.`, `_`, `@`, `-` and `/` that each lie strictly inside the session working directory, the gate shall let it run with no approval prompt and no headless block. | `plain rm -r or -rf of literal paths inside the working directory runs unasked` | Yes, probed: 8 of 8 forms BLOCK headless and open 8 dialogs. |
| R-1491 | IF a target of such an rm is an absolute path or names the session working directory itself or a path outside it, THEN the gate shall keep today's verdict, a prompt when interactive and a block when headless. | `rm of an absolute path, the working directory itself or a path outside it still asks` | Green today; red under (b), (i). |
| R-1492 | IF a part of a target begins with a dot, or the target directly holds a `.git` entry, or the target and the active pi agent folder are the same folder or one lies inside the other, THEN the gate shall keep today's verdict. | `rm of a dot-named path, a folder holding .git or anything overlapping the pi agent folder still asks` | Green today; red under (h), (j), (l), (m), (n); the planner's one-way step 6 let 8 probed agent cases through. |
| R-1493 | IF an existing part of a target, the target included, is a symbolic link or a junction, THEN the gate shall keep today's verdict. | `rm through a symbolic link or junction still asks` | Green today; red under (a). |
| R-1494 | IF the call comes from the powershell tool, or the command holds anything beyond that form (a glob, variable, substitution, quote, backslash, `~`, `--`, another flag, a prefix such as `sudo`, `command`, `/bin/rm` or `VAR=value`, a second command, or leading or trailing whitespace), THEN the gate shall keep today's verdict. | `rm with globs, variables, quotes, escapes, --, prefixes, a second command or the powershell tool still asks` | Green today; red under (c), (d), (f). |
| R-1495 | IF the session working directory is the home folder, an ancestor of it, a filesystem root, or a path with a dot-named part, THEN the gate shall keep today's verdict for every recursive or forced rm. | `rm in a home, home-ancestor, root or dot-named working directory still asks` | Green today; red under (g), (k). |
| R-1496 | WHILE a command has the exempt form, the gate shall still stop it on a configured `extraPatterns` or `protectedPaths` match and on a policy file it names. | `configured deny and protected patterns and named policy files still stop an exempt-shaped rm` | Green today; red under (e). |

Wrong code (a)-(n) is listed in the build brief. Guard rows cannot be red today: today asks for every recursive or forced rm. The adversary ran (g), (j), (k), (l), (m), (n) on the amended module and saw the named check go red.

## Test shapes
- Fixtures: `build/`, `sub/deep/`, `nested/.git/`, `.pi/extensions/`, `node_modules/@types/`; `linkout` to an outside temp folder, `linkin` to `build` (dir symlink; junction on win32). No `.git` at the cwd top: it would hide wrong code (i).
- R-1490: `rm -r build`, `rm -rf build`, `rm -fr ./build sub/deep`, `rm -Rf build/`, `rm --recursive --force build`, `rm -rfv node_modules/@types`, `rm -rf not-there/yet`, `rm --force build`; ALLOW headless, and ALLOW interactive with zero dialogs.
- R-1491: `../x`, `/tmp/x`, the cwd's own absolute `build` (forward slashes), `.`, `./`, `sub/..`, `build/../..`, `build ../x`.
- R-1492: `.git`, `.GIT`, `.git/objects`, `.pi`, `.claude`, `sub/.git`, `nested`, `node_modules/.cache`. PI_CODING_AGENT_DIR=`<cwd>/agentdir` holding `extensions/` and `sessions/s/`: `agentdir`, `agentdir/extensions`, `agentdir/sessions`; `AgentDir` and `AGENTDIR/extensions` only when `<cwd>/AGENTDIR` exists (a case-folding filesystem; on a case-sensitive one that spelling is a different, missing folder, so the case cannot exist); cwd = `<cwd>/agentdir` with `rm -rf extensions`, `rm -rf sessions`, `rm -rf x`. PI_CODING_AGENT_DIR=`<cwd>/parent/agentdir2` gives `parent`. Restore the variable after each case.
- R-1493: `linkout`, `linkout/`, `linkout/x`, `linkin`, `linkin/sub`.
- R-1494: `*`, `build/*`, `build?`, `[ab]`, `{a,b}`, `$X`, `${X}/y`, `$(pwd)/x`, a backtick, `"build"`, `'build'`, `b\uild`, `~/x`, `-- build`, `-x`, `build; ls`, `build && ls`, `cd .. && rm -rf x`, a newline then `rm -rf ../x`, `sudo`, `/bin/rm`, `command rm`, `X=1 rm`, a leading or trailing space, `-rfi`, `C:x`, a non-ASCII letter; powershell tool: `rm -r build`, `rm -rf build`, `Remove-Item -Recurse -Force build`, `ri -r -fo build`.
- R-1495: cwd = HOME, its parent, the cwd's filesystem root, `HOME/.pi/agent`, `HOME/.pi`, `<cwd>/.pi`; commands `rm -rf x`, `rm -rf extensions`, `rm -rf agent`.
- R-1496: `extraPatterns ["^rm "]` with `rm -rf build`; `protectedPaths ["secrets"]` with `rm -rf secrets`; PI_CODING_AGENT_DIR=`<cwd>/agentdir` with `rm -rf agentdir/auth.json` (floor).

## Existing tests the change makes false (retarget to `../`; titles and counts unchanged, probed)
gate-corpus: 6 corpus entries and 5 checks; gate-survives-mutation: 11 commands, 7 allow entries, 1 journal check; display-surfaces: 1 line. Counts after: 227, 38, 181 PASS, as on main (re-probed on the amended module merged with main 355520d).

## Platforms
macOS probed. Linux runs the same code; the test's HOME and cwd are sibling temp folders. Windows: links are junctions; Node's lstat reports a junction as a link (libuv, inferred); 8.3 names hold `~` and fail the character set; `path.win32.relative` already folds case, so wrong code (n) shows only on macOS. Windows CI confirms.

## Known limits
1. Plain `rm` and `rm -f` keep passing anywhere, as today. The owner's confirmed words were "we really shouldn't be deleting anything outside without user permission/confirming". Making those forms ask is a separate lane: it would block headless builders' temp cleanup. The seat puts this on one Open-for-Owner HANDOFF line in this lane's reviewed change.
2. Absolute paths ask even inside the cwd; dot-named targets (`.venv`, `node_modules/.cache`) and compounds (`rm -rf build && npm test`) ask.
3. The exemption assumes the command runs as typed in the session cwd. pi adds `shellCommandPrefix` after the gate and an extension `spawnHook` may move the cwd (pi 1.0.2 `dist/core/tools/bash.js`, which runs `bash -c` per call); a prefix that changes directory, `BASH_ENV` or an exported `rm` function voids it.
4. Only named files are floor, and the `.git` check looks one level down. A target holding a floored file or a `.git` deeper inside (an extension source linked from the agent folder, a nested project's `.claude`, `vendor/lib/.git`), a mount point or inner links goes unchecked (POSIX `rm -r` does not follow inner links; Git Bash on inner junctions inferred the same).
5. A bare repository as the cwd (`repo.git`, no dot-named part) is not recognised: `rm -rf objects refs` runs unasked there (probed).
6. PowerShell keeps asking for every form. A race that swaps a part for a link after the check is out of the threat model.
