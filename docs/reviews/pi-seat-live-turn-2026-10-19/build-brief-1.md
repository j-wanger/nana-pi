# Build brief · pi-seat-live-turn (builder: pi gpt-5.6-sol via pi-worker)

Feature: FEAT-015 · Diagnose the active environment
Worktree ~/nana-pi-wt/pi-seat-live-turn on feat/pi-seat-live-turn. Branch from main AFTER win-path-commands lands.
Rows R-1790 to R-1796 only. Read must-meet.md in this folder first.

## Change
1. REQUIREMENTS.md: add R-1790 to R-1796 to FEAT-015's own table after R-1096, worded as in must-meet.md. Each row is `planned` until its test passes. Leave R-1079 unchanged.
2. Tests first, in packages/nana-setup/tests/install-check.test.mjs: the seven must-meet titles plus the one pin test. Each `// req:` line sits directly above its `check("title", ...` line. Edit an existing test only where this change makes it false, and list each edit:
   - recordingRun answers the turn call by writing a passing record into the home. Detect the call by the provider name in the joined command, because win32 goes through cmd.exe.
   - The R-1072 "writes only" test allows the record file as pi-owned.
   - In the R-1079 test "pi launch: on win32 ...", the `/--mode/` filter also matches the turn's `--model`, so its count of 3 breaks. Keep it counting its own three calls.
3. install-check-config.mjs: add PI_TURN, SPAWN_TIMEOUT_MS.turn and PI_SESSION, each with provenance. Take the values and dates from must-meet.md's probes. Choose a provider name that no real provider uses.
4. New lib/install-check-turn.mjs, per the design:
   - the six-tag header and a default export;
   - imports from ROOT `@earendil-works/pi-ai` only (never a subpath), plus ./install-check-config.mjs;
   - the record shape `{system, userMessages[], toolResults[{toolName,isError,text}]}`.
5. install-check.mjs:
   - Add the turn after `pi session`, through piRun.
   - Add the exported pure turn judge.
   - Give the session spawn its output cap and add the exported session-event reader.
   - Add the stale-line test to `hook adoption`.
   - Give every FAIL one reason line (R-1070).
   - Give the note file name `install-check.md` one sealed name. The judge and the existing hook check both read it.
6. packages/nana-setup/README.md, Install check section:
   - Name the scripted turn and its local test model: no network, no real model.
   - Name the new session and adoption failures.
   - Replace "invoke pi prompt-time hooks" with what the turn covers and what it does not: the PowerShell tool and the UI confirm path.
   - Add no owner name and no machine path.
7. Run `npm run map` and `npm run req:tree`. Then `npm run map:check` and `npm run readme:check` must be green.

## Wrong code to try (each must turn a new test red)
- The turn's environment adds NANA_ROLE=worker; an argument is dropped or typed inline; on win32 the turn spawns without winCommand → R-1790.
- The knowledge marker is looked for in the system prompt; the rulings are judged by the `<nana-rulings>` tag; the exit status is ignored → R-1791.
- isError is ignored; toolName is ignored; any tool text is accepted → R-1792.
- The stderr scan is skipped; only STALE_PREFIX is checked in the prompt → R-1793.
- The unavailable match is case-sensitive or covers notify only; a bare JSON.parse runs on a truncated last line; the session cap is not passed → R-1794.
- The adoption check tests only STALE_PREFIX → R-1795.
- The fixture's folder is added to the root package.json `pi.extensions` → R-1796.
Line readers get CRLF, trailing-space and no-final-newline cases: RPC lines, stderr and adoption output.

## Run
Run single test files only: `node packages/nana-setup/tests/install-check.test.mjs`. Do not push. The seat runs `npm run test:locked` and the macOS install check. The seat also opens the draft PR and reads both CI install-check legs for PASS pi turn and PASS pi session.

## Done
- All seven must-meet tests and the pin pass, and the whole install-check.test.mjs file is green.
- map:check and readme:check exit 0.
- Each wrong-code pair above was seen red.
- HANDOFF.md and docs/sessions are untouched.

## Report (10 lines or fewer)
VERDICT line; commits; rows flipped; per test its title and the wrong code seen red; existing-test edits; the single-file test command and its exit code; map:check and readme:check exit codes; what was not done.
