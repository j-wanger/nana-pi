# Review — gate-stop-names-config (in pi, a nana config file that does not parse gets a gate stop naming the file, the place and the repair), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-011 · Keep policy changes safe and recoverable

Review `git diff 9552afb1..HEAD` on `feat/gate-stop-names-config` (main was `9552afb1` when this brief was written; `git
merge-base HEAD main` is `9552afb1`). The plan of record is `docs/reviews/gate-stop-names-config-2026-10-20/must-meet.md`:
five must-meet checks, rows R-2360 to R-2364. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one
build (255846f0). The seat's record is `seat-verify-7b3a1202.md`. CI runs on draft pull request #144 at 255846f0.
CI run 39496247352 at 255846f0 reads 0 failing on all three legs: macOS 192 PASS, 0 FAIL, 2 SKIP of 194 files (8,005 checks pass, 35 skip); Ubuntu 191 PASS, 0 FAIL, 3 SKIP of 194 files (7,944 checks pass, 55 skip); Windows 176 PASS, 0 FAIL, 18 SKIP of 194 files (6,933 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-255846f0.log in this folder. The land runs the locked suite on the reviewed tip. The record also holds the macOS wrong-code pairs
(`seat-mutate.mjs`; 14 of 14 red, 0 survived) and the independent check (`independent-check-7b3a1202.md`: HOLDS over
ten probes on 255846f0, no MUST, two declared known bugs). The final reviewer's brief is `review-brief.md`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
7b3a1202, before the seat's notes commit):

```
tree movement 9552afb..7b3a120: 5 rows in 1 features
FEAT-011 · Keep policy changes safe and recoverable
  R-2360 new (implemented)
  R-2361 new (implemented)
  R-2362 new (implemented)
  R-2363 new (implemented)
  R-2364 new (implemented)
```

The code under review: `loadConfig` in `packages/nana-pack/lib/config.ts`, whose `gate.stopReason` the nana-gate
extension returns as its block reason for every gated tool. When the user or a trusted project's nana-pack.json does not
parse and no valid policy for it is loaded in this process, the stop now comes from the new module-local
`gateParseStopReason`: `<scope> nana-pack.json does not parse: <file>[ at line L, column C]. <repair>`, built from the
shared `configFailureDetail` in `lib/json-text.mjs`. Every other stop keeps `gateStopReason` and today's text.

Judge whether the lane fails open: a stop branch that now sets no reason or allows a gated call, a parse failure that
loads defaults instead of stopping, a mid-session break that drops the last valid policy, a project stop lost when both
files are broken, or a must-meet check that passes with the change removed. Judge whether it leaves a harm the review
standard lists, such as file text or a raw control character shown in the stop, or a test writing outside the temp
folders it owns. Judge whether anything main does today stopped working: the valid-JSON leaf stop, the unreadable and
over-cap stops, the user-wins order, untrusted projects ignored, the objective's config line, doctor's config row, and
all three CI legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: pi's
`config_invalid` warning and its journal line still quote up to 120 characters of the parser message, which can hold
file text; an unreadable file, a file over the size cap and a non-object top level keep the "gate block is malformed"
text; some parser errors report no place, so the stop names no line or column; a mid-session parse failure keeps the
last valid policy and shows no stop (unchanged); the pairs and the independent check ran on macOS only.

Threat model: honest variation in our tools' output and the OS is in scope (hand-edit mistakes such as a single
backslash in a pasted Windows path, a trailing comma, an empty file, an unquoted word or a file cut off mid-write; a
byte-order mark and UTF-16; home and agent-folder paths with odd characters; the macOS, Linux and Windows layouts);
deliberate forgery is out: whatever a forged config holds, the stop still blocks. The gate is advisory by load path.
Lane class: install, hook or gate — the pi gate's stop reason, built in `packages/nana-pack/lib/config.ts` and returned
by the nana-gate extension as its block reason.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
