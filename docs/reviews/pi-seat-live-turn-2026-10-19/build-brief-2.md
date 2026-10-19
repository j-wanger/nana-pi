# Brief 2: pi-seat-live-turn

Feature: FEAT-015 · Diagnose the active environment. Same worktree and branch (tip 0a88cbea). Class: ordinary.

## Finding (the seat's real install check on macOS, on 0a88cbea)
`node packages/nana-setup/bin/install-check.mjs` prints `FAIL pi turn — exit: exit status 1`, every other item PASS. The record file is written (system prompt, the knowledge message and the gate-blocked bash result are all there), but pi exits 1.
Cause, reproduced by hand in the retained home: `install-check.mjs` builds `[...PI_TURN.args, SAMPLE_INPUTS.prompt, token]`, so the prompt and the run token reach pi as TWO positional arguments. pi treats the second as another message, the fixture provider has no third response queued, and pi prints `No more faux responses queued` on stderr and exits 1. With the prompt and token joined into one argument (`-p "<prompt> <token>"`, as the plan's Design says), the same command exits 0 and prints `install-check turn complete`.

## Change
1. Pass the prompt and the token as ONE argument: `${SAMPLE_INPUTS.prompt} ${token}`. Keep win32 through `winCommand` as now (check that a space inside one argument survives `winCommand` on win32 — the existing win32 launch tests show how).
2. R-1790's check must pin this: the turn's argument list ends with exactly one prompt argument that holds both the prompt and the token. Show it red on 0a88cbea.
3. When the turn exits non-zero, the FAIL line's detail names the last stderr line (bounded, one line), so the next failure says why. Pin it in the judge's check (R-1791's table or the row whose text covers the detail; do not widen a row's text).
4. No other change.

## Done
- `node packages/nana-setup/tests/install-check.test.mjs` green; `node packages/nana-setup/bin/install-check.mjs` on this Mac prints `PASS pi turn` (paste the line). `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` green. Do NOT run the full suite; do NOT push; do not edit HANDOFF.md or docs/sessions/.

## Report (≤8 lines)
VERDICT; commit; the fix; red-before evidence for the changed checks; the real install check's pi turn line.
