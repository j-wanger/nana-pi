# claude-cmd-launch — plan (revision 2)

Feature: FEAT-040 · Make and keep memory

Lane class (`node scripts/lane-class.mjs --root . --files scripts/memory-shape-runners.mjs,packages/nana-pack/lib/claude-launch.mjs,packages/nana-pack/lib/claude-launch-config.mjs,packages/nana-pack/tests/claude-launch.test.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-040.md,code-map.config.json,docs/code-map.md`): `ordinary`. Editing `packages/nana-pack/lib/win-command.mjs` would make it `hook`, so this lane only imports from that file.

Revision 2 takes all three MUSTs in `plan-attack.md` and SHOULDs 4 to 9; the details are under each section.

## Purpose

The owner approved this as "fix separately" (relayed by the seat, 2026-11-01). It fixes FEAT-040's known bug "Memory making (making-trigger, plan residual A6)".

The bug: on Windows with only an npm-installed Claude Code (`%APPDATA%\npm\claude.cmd`, no `claude.exe` anywhere on PATH), `claudeRunner` in `scripts/memory-shape-runners.mjs` calls `spawnSync("claude", …)`. Node never resolves `.cmd` files, so every call fails with `ENOENT` (reproduced on the reference laptop, `probe-npm-claude.txt`), and every making run leaves its units pending. The shared `winCommand` cannot carry the call: it refuses arguments holding a double quote or a line break, and the runner passes a JSON schema and a multi-line system prompt.

Goal (the seat's words): start an npm-installed Claude Code safely, with the exact same arguments, stdin, env, timeout and windowsHide, and still prefer a native `claude.exe`.

**The choice: (a), resolve the npm shim to its package's native executable and start that directly.**
- The current package (`@anthropic-ai/claude-code@2.1.316`) declares `bin: { claude: "bin/claude.exe" }`. Its `install.cjs` copies the platform binary from the optional dependency over a placeholder at that path, and npm's `claude.cmd` only runs `"%dp0%\node_modules\@anthropic-ai\claude-code\bin\claude.exe" %*`.
- On the reference laptop, a real `claude -p` through that `bin/claude.exe` returned exit 0 with the structured reply. That call carried the runner's quoted JSON schema and a multi-line quoted system prompt (`probe-npm-claude.txt`).
- (b) is not enough: the CLI has `--system-prompt-file`, but `--json-schema` has no file or stdin form.
- (c), widening winCommand's quoting, is rejected: (a) makes it unnecessary, it is the security-relevant cmd.exe boundary, and editing it makes the lane `hook`.
- A JavaScript-bin branch, for older packages, is dropped: no release with a JS bin is shown to accept the runner's flags. A non-`.exe` bin is refused by name.

## Assumptions

- A1: npm's two layouts hold, as in `piLaunch`: global (`<prefix>\claude.cmd` with `<prefix>\node_modules\@anthropic-ai\claude-code`) and local (`node_modules\.bin\claude.cmd`, package one level up). pnpm, Yarn classic, Volta 2 and other shims are not npm layouts and are refused by name.
- A2: an install made with scripts disabled leaves `bin/claude.exe` as the package's placeholder, a small text script. The adversary pulled it from the npm cache, and on Windows `spawnSync` fails it at once with error `UNKNOWN`: no stdout, no hang, no prompt. So the runner returns `ok: false` and the units stay pending, the same fail-safe as today. M2 pins this with a text-file fixture, and a known-bug line records that such installs make no memory.
- A3: off win32, behaviour is unchanged: `spawn("claude", args, options)`.

## Open choices

- O1: module and export names. Default: `packages/nana-pack/lib/claude-launch.mjs` exporting `resolveClaudeLaunch`, plus `claude-launch-config.mjs` for the package name, bin name and refusal texts. `pi-worker.mjs` already has a local `claudeLaunch`, so that name is not reused.

## Questions for the owner

None.

## Threat model

In scope: honest variation in our tools and machines. That covers:
- npm's global and local shim layouts;
- spaces and `& ( )` in the prefix path;
- the `Path` key spelling;
- a native `claude.exe` and a stale npm shim both on PATH, in either order;
- an install made with scripts disabled.

Arguments go by exact argv with no shell, so quotes, line breaks, trailing backslashes, `%` and `!` reach Claude unchanged.

Out of scope: forgery, such as a crafted `package.json` or a planted executable on PATH (today's code would run that too).

Residuals:
- None for the builder and reviewer launchers. `pi-worker`'s Claude builder and `claude-review` pass no quoted, line-break, `%` or `!` arguments (`pi-worker.mjs:185,205-215`, `claude-review.mjs:115-117`), and `docs/known-bugs/FEAT-006.md:5` already records that an npm claude starts there.
- `apps/bench/lib/catch-judge.mjs`'s own default spawn, used when no spawn is injected, is unchanged; the bench runs on the seat Mac.

## Precedent

- `packages/nana-pack/bin/pi-watchdog.mjs` — `piLaunch` (lines 52-93) resolves an npm `pi.cmd` to its package entry. It handles both layouts, checks the package name, keeps the bin inside the package, and requires the entry to be a file. The new resolver follows it step for step, with a native `.exe` bin started directly instead of through Node.
- `packages/nana-pack/bin/worker-config.mjs` — `NPM_DIRS`, the shared npm folder names, reused.
- `packages/nana-pack/lib/win-command.mjs` — `findOnPath`, the PATH-order, PATHEXT lookup that reads `Path` case-insensitively; imported, unchanged.
- `packages/nana-pack/bin/review-launch.mjs` — the generic route (`findOnPath` plus `winCommand` through cmd.exe) that this lane deliberately does not take for Claude.
- `packages/nana-setup/lib/npm-root.mjs` — `shell: true` for `npm.cmd`, the pattern rejected here: a shell would re-parse quotes.
- `scripts/memory-shape-runners.mjs` — `claudeRunner` and its `options()`, which stay byte-identical; only the default spawn changes.
- `apps/bench/lib/catch-judge.mjs` — `callJudge` builds the exact argument list that must reach Claude unchanged.
- `packages/nana-pack/tests/memory-shaping.test.mjs` — the existing `claudeRunner` tests (lines 186-188, 211) inject `spawn`. Like `outcome-meter.test.mjs:147-149` and `memory-replay.test.mjs:244-245`, they keep receiving `("claude", args, options)` unchanged.
- `npm run map:impact -- scripts/memory-shape-runners.mjs` — direct callers `scripts/memory-shape.mjs`, `scripts/memory-run.mjs`, `scripts/memory-replay.mjs`, `scripts/outcome-meter.mjs` and `apps/bench/anatomy.mjs`. All of them pass no spawn, or forward an injected one, so none changes.

## Outside precedent

- npm `cmd-shim` (ISC), which generates `claude.cmd`: **borrow** its layout facts only. We read `package.json`, not the shim's text.
- `cross-spawn` (MIT), the common Node fix for `.cmd` lookup: **skip**. It goes through cmd.exe with its own escaping, the layer this lane avoids.

## Must-meet

Rows R-3470 to R-3474 go in the FEAT-040 table first, tagged `// req: R-nnnn` on their checks. The FEAT-040 A6 known-bug line is removed; one line records scripts-disabled installs (A2).

- **M1 · R-3470** — WHERE the platform is win32, the Claude resolver shall start a native `claude.exe` or `claude.com` found anywhere on PATH, in PATH order, exactly as `spawnSync("claude")` does today. Only when none exists shall it take the first `claude.cmd` or `claude.bat` npm shim and resolve it through its package's `bin.claude` to the package's own `.exe`, started directly with no cmd.exe. Proves: today's native machines are untouched and npm-only machines work. Pins, in `claude-launch.test.mjs`, with injected `exists`, `isFile`, `readText` and `env`:
  - native `.exe` only → `{ command: <exe>, args }`;
  - npm shim **earlier** on PATH than a native `.exe` → the native `.exe`;
  - global shim with no native → `{ command: <prefix>\node_modules\@anthropic-ai\claude-code\bin\claude.exe, args }`;
  - local `.bin` layout → the same form;
  - the variable spelled `Path` still finds the shim.
- **M2 · R-3471** — IF no `claude` is on PATH, or the shim's package is missing, has another name, declares no `claude` bin, points the bin outside the package, names a missing entry or a non-`.exe` entry, THEN the resolver shall return a named refusal. Unsupported layouts are named in the text: pnpm, Yarn classic, Volta 2. The default runner spawn then returns `{ ok: false }` without spawning. Pins:
  - one check per refusal reason, asserting its exact text;
  - a runner check that a refusing resolution yields `ok: false` with zero spawn calls;
  - a win32-only check that a text-file `bin/claude.exe` (the scripts-disabled placeholder shape) makes the runner return `ok: false` promptly, with no output parsed.
- **M3 · R-3472** — `claudeRunner`'s default spawn shall resolve Claude only when no spawn is injected. An injected spawn shall keep receiving `("claude", args, options)`. The resolved spawn shall receive exactly `callJudge`'s arguments plus `--effort <effort>`, and exactly today's options: input, encoding, stdio, maxBuffer, timeout, cwd, `windowsHide: true` and env. Only the command may differ. Pins:
  - the existing `memory-shaping`, `outcome-meter` and `memory-replay` runner tests pass unchanged;
  - with an injected resolver and an injected low-level spawn on the default path, the recorded args and options deep-equal the off-win32 call's.
- **M4 · R-3473** — WHERE the platform is win32, a direct `.exe` start through the resolved path shall deliver every argument byte-exact. That includes JSON with double quotes, a line break, a trailing backslash, `\"`, `""`, an empty argument, `%` and `!`. Proves: no shell re-parses argv. Pins: a win32-only check that drives the default spawn path with a resolver returning `process.execPath`, and an echo script as the first argument. The echoed argv equals the input. No node.exe copy is made. It skips elsewhere with a declared reason.
- **M5 · R-3474** — On the reference Windows laptop, with only an npm-installed Claude Code (`npm i -g --prefix <temp>`, no `claude.exe` on PATH), `claudeRunner` shall complete one real call with `ok: true`. Row status `untested`, with evidence. Pins: the evidence file `real-npm-claude-win32.txt` in the lane folder records:
  - the package version;
  - the resolved command shape;
  - `ok: true` and the usage fields;
  - one real call whose system prompt asks the model to echo a string holding `"`, `\`, `%` and `!`, with the echo matching;
  - `ENOENT` for the same setup before the fix.

  This is local evidence, not a suite test: the suite never installs a 335 MB package or spends.

Expected changes (a forecast, not a limit):
- `scripts/memory-shape-runners.mjs`: its default spawn wraps the resolver on win32;
- the new `claude-launch.mjs`, `claude-launch-config.mjs` and `claude-launch.test.mjs`;
- `REQUIREMENTS.md`, `code-map.config.json` if the new lib needs registering, `docs/code-map.md`, and `docs/known-bugs/FEAT-040.md`.
