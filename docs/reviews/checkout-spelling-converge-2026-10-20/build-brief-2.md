# Build brief 2 · checkout-spelling-converge

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Same builder, worktree and branch; the tip includes the seat's chain merge (main through post-edit-values-named) and the seat's HANDOFF fix. Threat model unchanged: honest variation (two spellings of one checkout) in scope; a hostile link out.

## Why a second build

Round 1: Opus LAND; the land reviewer (pi astra) SEND-BACK with one MUST, which the seat accepts as a fix:

- **Install rewrites a customized knowledge entry.** `mergeRepoHooks` in `packages/nana-setup/lib/settings.mjs` (the `sameFile` test, about lines 534–553) replaces a healthy POSIX-form knowledge entry whenever its target is the same file through another spelling, without checking the entry's other keys. Realistic input: an earlier install through a linked spelling of the checkout, then the user adds a key to that entry (for example `"async": true`, or a different `timeout`). Main leaves that healthy entry unchanged; this lane rewrites its command. Uninstall already treats exactly such an entry as the user's (R-2204 keeps a same-file respelling with another key changed as a variant), so install and uninstall disagree about who owns it.

## Change

1. `packages/nana-setup/lib/settings.mjs`, `mergeRepoHooks`: rewrite a same-file, other-spelling knowledge entry only when it is a respelling of the installer's entry and nothing else — reuse the existing private `respelledKnowledgeEntry(entry, wanted)` (every key but the command equals the installer's entry, and both commands name the same file under the strict lookup). A same-file entry with any other key changed stays exactly as it is, as on main. Keep one predicate; do not add a second copy of the rule.
2. `REQUIREMENTS.md`, beside R-2202 under FEAT-013: add
   `| R-2205 | WHERE the platform is not win32, WHEN install through the checkout's on-disk spelling finds a knowledge entry that names the same file through another spelling of the checkout but has another key changed, THEN it shall leave that entry unchanged. | untested | — |`
   and flip it to implemented with its test as evidence once the test passes. Run `npm run req:tree` and `npm run map`.
3. `packages/nana-setup/tests/checkout-converge.test.mjs`: one new check for R-2205, beside R-2202's, in the same fixture style (temp home, every available spelling): install through the on-disk spelling, rewrite the knowledge entry's command to the other spelling AND add one key (`"async": true`), install again through the on-disk spelling; the check passes only when that entry's JSON is byte-identical before and after the second install, and no second knowledge entry was added. Put `// req: R-2205` on its own line directly above the `check(` call. Keep the file's existing skip handling (the runner skips it on win32).
4. Change nothing else. Do not edit HANDOFF.md or docs/sessions/.

## Run (single files only; no full suite, no loops of a test file — other lanes land on this machine)

- `node packages/nana-setup/tests/checkout-converge.test.mjs`: R-2205 red before step 1, green after; R-2200 to R-2204 stay green.
- `node --experimental-strip-types packages/nana-setup/tests/settings-merge.test.mjs`, `node packages/nana-setup/tests/uninstall.test.mjs`, `node packages/nana-setup/tests/checkout-spelling.test.mjs`, `node packages/nana-setup/tests/realpath-fallback.test.mjs`: green.
- Wrong code to try, restored after each: step 1 reverted (R-2205 red); the predicate made to ignore every key but the command (R-2205 and R-2204 red); `sameFile` never set (R-2202 red).
- `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`, `node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs`: all exit 0.

## Report (10 lines or fewer)

DONE or BLOCKED, the tip SHA, the files changed, and which check each wrong version turned red.
