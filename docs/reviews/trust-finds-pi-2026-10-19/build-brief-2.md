# Brief 2: trust-finds-pi

Feature: FEAT-009 · the trust command. Same worktree and branch (tip 46b90ba0). Class: ordinary.

## Finding (the seat's notes, inferred from reading the test, not probed)
`packages/nana-setup/tests/trust.test.mjs` `freshTrustEnv` asks `npm root -g` (through `spawnNpmRoot`) where the trust module lives under the test's fresh prefix, and R-1801's check then writes `module.exports = {};` at that path. Nothing checks that the path is inside the test's temp root. Where npm ignores `npm_config_prefix` (a node manager's npm, a broken npm), the test would overwrite the machine's real `trust-manager.js`. If `npm root -g` prints nothing, the path is relative and the stub lands under the test's working folder. Either is a test writing outside its temp folder.

## Change (test only)
1. In `freshTrustEnv`, after probing: resolve the module path, and accept it only when it is absolute and inside `root` (use `path.relative(root, p)`: not empty, not starting with `..`, not absolute). Return a flag or the reason when it is not.
2. R-1800 and R-1801: when the path is outside `root`, the check FAILS with a detail naming the probed path and npm's status — and R-1801 writes nothing. Do not skip.
3. Keep both checks' titles and `// req:` markers unchanged. No product change, no new row.

## Wrong code to try
- Make `freshTrustEnv` return a path outside root (for example the probed root's parent): both checks fail by name and no file is written outside root (show `ls` before and after).

## Done
- `node packages/nana-setup/tests/trust.test.mjs` exit 0, 13/13 PASS. `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` green. Do NOT run the full suite. Do NOT push. Do not edit HANDOFF.md or docs/sessions/.
- Commit with explicit paths; message first line `trust-finds-pi: the trust checks refuse a module path outside the test's temp root`, then the two trailer lines the seat uses (Co-Authored-By and Claude-Session lines are in the previous commits; copy them).

## Report (≤8 lines)
VERDICT; commit; the guard; the wrong-code try and its result; the four checks' results.
