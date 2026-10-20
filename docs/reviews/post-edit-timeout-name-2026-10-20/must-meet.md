# post-edit-timeout-name — must-meet

Feature: FEAT-030 · Get trustworthy feedback after edits
Lane class: hook. The build changes the pi extension `nana-post-edit.ts`: one import and one expression. Simple lane, so a Claude Sonnet subagent builds it.
Threat model: honest variation in our tools' output, platforms and configs is in scope. Deliberate forgery, such as a hand-edited copy of the pack or a forged config module, is out.

## Feature
A post-edit check whose command sets no `timeoutMs` still gets a deadline. That deadline is the pack's named default `POST_EDIT_DEFAULT_TIMEOUT_MS`, sealed at 30000 ms. Retuning that one name changes the deadline with no other code change.

Why it earns a lane: today nothing notices if the default disappears. Probe: with `c.timeoutMs ?? 0` (no deadline, so a hung checker hangs the turn), all six test files that import the extension stay at 0 FAIL. This lane also closes the HANDOFF residual "the 30-second default time limit is still a literal in the extension".

## Design
- New `packages/nana-pack/lib/post-edit-config.mjs`: the six-tag header and one export, `POST_EDIT_DEFAULT_TIMEOUT_MS = 30_000`. Its provenance comment sits beside it: `chosen:` the pack's first release (2026-09-01) gave each check 30 seconds; not measured; a command's own timeoutMs overrides it; 0 arms no deadline (R-1702); pinned by R-2151.
- `extensions/nana-post-edit.ts`: import the name beside the other lib imports. `c.timeoutMs ?? 30_000` (about line 336) becomes `c.timeoutMs ?? POST_EDIT_DEFAULT_TIMEOUT_MS`. Nothing else changes.
- This follows the pack's `lib/<feature>-config.mjs` pattern (rulings-config, writing-config, roster-notice-config). The module goes in `lib/`, because pi loads every file in `extensions/`.
- No existing row states the default. I searched REQUIREMENTS.md, the pack README and the post-edit tests, so both rows are new.

## Must-meet tests (new file `packages/nana-pack/tests/post-edit-default-timeout.test.mjs`)
| Row | Requirement | Test (file::title) | Red today |
|---|---|---|---|
| R-2150 | WHERE a post-edit command sets no timeoutMs, the pack shall arm that check's deadline at the POST_EDIT_DEFAULT_TIMEOUT_MS value its post-edit configuration module defines. | `post-edit-default-timeout.test.mjs::a post-edit command with no timeoutMs arms its deadline at the pack's named default, retuned in a copy` | FAIL `{"retuned":false,"recorded":[30000]}` |
| R-2151 | The pack's post-edit configuration module shall define POST_EDIT_DEFAULT_TIMEOUT_MS as 30000 milliseconds. | `post-edit-default-timeout.test.mjs::seal: POST_EDIT_DEFAULT_TIMEOUT_MS is 30000` | FAIL `undefined` (the module is absent; the import is guarded) |

How R-2150 works:
- It copies `extensions/nana-post-edit.ts` and the whole `lib/` into a tmpDir.
- It rewrites the copied export with `/(export const POST_EDIT_DEFAULT_TIMEOUT_MS\s*=\s*)[^;]+;/` to 4321, a `chosen` value that only has to differ from the sealed one.
- It imports the copy through `pathToFileURL`, under an isolated HOME and USERPROFILE with PI_CODING_AGENT_DIR deleted.
- It fires `tool_result` for one passing command, `node -e "process.exit(0)"`, with no timeoutMs, and records every `setTimeout` delay during that call only.
- It passes when the rewrite happened, the only recorded delay is 4321, and the chip reads `✓ 1 check`.
- R-2151 is the only place the literal 30000 appears.
Why the copy is needed: a check against the imported name would pass W1 (the literal kept), which is the defect this lane removes.

## Evidence (probes in a temp export of main 445f4d5b; the repo was untouched)
- Today's code: both checks FAIL, exit 1.
- With the build: both PASS (canonical runner: 2 pass, 0.6 s). Every blast-radius file exits 0: post-edit-status 32 PASS, post-edit-hardening 22, post-edit-utf8 4, display-surfaces 181, config-handlers-malformed 98, post-edit-file-queue 5. The last one loads the extension through pi's bundled jiti, which proves pi's real loader resolves the new lib import.
- The trace exits 0 with ears 0 rows off form. A renamed title makes the trace name the mismatch.
- `requirements-tree --write` exits 0, and `code-map --write` then `--check` reports 0 problems.
- Wrong code, each probed:
  - W1 `c.timeoutMs ?? 30_000`, import kept: R-2150 red, recorded [30000].
  - W2 `c.timeoutMs`: R-2150 red, recorded [].
  - W3 `c.timeoutMs ?? 0`: R-2150 red, recorded []. No existing check catches it.
  - W4 config set to `20_000`: R-2151 red, 20000.
  - W5 `POST_EDIT_DEFAULT_TIMEOUT_MS ?? c.timeoutMs`: post-edit-status red on R-1702 and three R-095 checks.
  - W6 `POST_EDIT_DEFAULT_TIMEOUT_MS / 1000`: R-2150 red, recorded [].
  - W7 `c.timeoutMs || POST_EDIT_DEFAULT_TIMEOUT_MS`: R-2150 passes, but the existing R-1702 check goes red, so the existing rows cover it.

## Cross-platform
- No skip. The copy uses `fs.cpSync` and the import uses `pathToFileURL`, which handles Windows drive paths and short names.
- The checker command already runs under cmd.exe in post-edit-status, which is not on the Windows skip list. CI runs Node 22 on all three legs.
- The copied extension cannot resolve pi's file queue, so it runs unserialized on every leg. That adds no timer.
- The R-1702 control proves on Windows CI that a normal run arms exactly one timer.

## Known limits (residuals)
- Five values stay inside the extension, out of the config module and unsealed: KILL_GRACE_MS 2000, MAX_OUTPUT 1 MiB, FAILURE_CAP 2000, CMD_CAP 400, and the inline `promptText(lockError, 300)`. Each move needs its own row and seal.
- The pack README does not state the 30 s default. This lane leaves it.
- R-2150 proves the name is read only through a copied tree. If the extension later imports from outside `lib/`, the copy fails loudly, never falsely.
- `timeoutMs: null` takes the default through `??`, but no check covers it.

## Seat steps (hook class)
- Wrong-code pairs W1 to W7 run through the shared mutation runner in docs/reviews/post-edit-timeout-name-&lt;date&gt;/seat-mutate.mjs. Its table spells no pi launch.
- Run one independent check.
- The roster's land reviewer is astra, so no seat-land.md.
- Run requirements-moved before the final review and the land.
- Run install-check before nana-land. Its pi session item loads the installed pack's extensions end to end.
- Remove the HANDOFF residual in the reviewed change.