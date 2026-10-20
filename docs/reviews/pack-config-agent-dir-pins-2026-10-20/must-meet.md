# pack-config-agent-dir-pins: must-meet (plan + adversary, 2026-10-20)

Feature: FEAT-011 · Keep policy changes safe and recoverable
R-825 lives in FEAT-013 · Install and connect harness runtimes (SUB-011). It sits on the same code path as R-193.

**Feature.** Take a PI_CODING_AGENT_DIR that points at a folder with no nana-pack.json. No pack reader ever opens the stranded default-dir file, and the pack announces that file only when it exists. The pack stays quiet when the active file exists or nothing is stranded. The other extensions keep their own output when an unrelated config block is malformed.

**Class: ordinary.** The lane changes tests and rows only. It changes no lib, extension, bin, install, doctor, gate or land-tool code. Precedent: install-pins, install-cli-pins.

**Threat model.** In scope is honest variation: an absolute, relative or tilde agent dir; darwin, linux and native win32; another spelling of the same folder; every malformed-block shape. Out of scope is deliberate forgery, such as a file planted to fool the read wrapper.

## Design
- This lane pins and does not change code. It adds three new checks. Each check's title sits on the line under its `// req:` marker. R-2110 to R-2119 stay unused.
- R-193 observes the read itself. The check wraps node:fs's read entry points on the CommonJS fs object: openSync, readFileSync, open, readFile, createReadStream, promises.open and promises.readFile. It then calls node:module's `syncBuiltinESMExports`, so every `import * as fs` namespace reaches the wrapper. stat, exists, realpath and readlink stay allowed, because the note and the policy floor use them.
- Inside the wrapper, the check runs every pack reader of nana-pack.json:
  - loadConfig and loadUserObjective
  - adoptionSettings, used by the Claude Code adoption producer and by handoff
  - the roster-notice extension's session_start, whose resolveRoster the nana-roster command shares
  - one gate decision
- Guard against an empty pass: the mismatch note must name the stranded file, and the active file's open must be recorded.
- R-825 has three sub-cases. Each gets its own active dir and session. The check counts the UI notes and the mismatch lines one loadConfig adds to `<that dir>/nana-journal.jsonl`.
- R-781 asserts post-edit and lifecycle under five unrelated malformed blocks. The existing objective check gets an R-781 marker too. Post-edit is not judged under gate = 7, because in pi a stopped gate blocks the edit first.
- R-781's Evidence carries a declared limitation, as R-923's does, so the row reads no wider than its pin.
- Windows spellings: `path.resolve` folds neither letter case nor 8.3 names, but the stranded check still cannot misfire. A present file is never treated as stranded, and an absent one fails `existsSync`. On macOS's case-insensitive disk, `.PI/AGENT` gave no note with the file absent or present. The 8.3 case is inferred by the same argument.

## Must-meet (each green on main 385c633f; "Red on" = wrong code probed in a temp clone)
| Row | Row text (unchanged) | Test file::title | Red on |
|---|---|---|---|
| R-193 | WHERE the active agent dir has no nana-pack.json, the default dir's file shall not be read. | `packages/nana-pack/tests/agent-dir-config.test.mjs::with no active nana-pack.json, the stranded default file is announced but never opened` | W1 (readFileSync and discard), W2 (readBounded and discard), W3 (loadUserObjective fallback): red here; W3 also in objective-golden. W8 (resolveRoster fallback) and W9 (adoptionSettings fallback): red here only; nana-roster, roster-notice, nana-roster-set, adoption-producer, adoption-reader and agent-dir-parity stay green. |
| R-825 | WHEN the active config is present, or no stranded default config exists, no mismatch note or journal line shall be emitted. | `packages/nana-pack/tests/agent-dir-config.test.mjs::no mismatch note or journal line when the active config is present or no default config is stranded` | W4 drops `fs.existsSync(stranded)`: red here only (sub-case i: 1 note, 1 line). W5 notes when the active file is present: red here (ii) and in the three existing (a) checks. |
| R-781 | Every other extension shall keep working when a config is malformed. | `packages/nana-pack/tests/config-handlers-malformed.test.mjs::with an unrelated block malformed, post-edit still feeds back its check's failure and lifecycle still journals the session start` (plus the existing `${label}: objective text or OBJECTIVE UNAVAILABLE marker injected`, newly marked) | W6 (lifecycle journals nothing under a gate stop): red here only; lifecycle-reload and config-gate-fallback stay green. W7 (any problem drops every user block): red here, in config-normalize and in post-edit-status. |

Control: suppressing the mismatch UI note turns R-193 red through its guard.

Every check runs on all three platforms with no skip. The new blocks use plain folders and need no symlink privilege. On win32 the path match is case-insensitive.

## Known limits
- R-193: the wrapper sees only reads through node:fs in the test process. A child process's read is not seen. copyFile and cp are not wrapped; a copy-the-stranded-file migration is still caught, by the guard and R-829. A Node that stops syncing builtin ESM exports turns the check red through the guard. Linux, Windows and Node 24 were not probed.
- R-193 covers the pack's readers only. nana-setup install and doctor belong to FEAT-013 and are not run.
- R-825: the two-spellings case is reasoned, and probed on macOS only.
- R-781: no post-edit-only wrong code was found. W7 is also caught by R-080's checks.
- R-781: notify, handoff, writing and roster-notice output under a malformed config is not asserted. notify would start the desktop notifier, and handoff is handoff-pins' area. R-083 still pins that no handler throws. nana-rulings reads no config.
- Follow-on rows not taken, because they belong to other features (a gate-pins lane fits them): R-057 (inferred marker-only), R-763 (custom-tool fixture), R-242 (trust).