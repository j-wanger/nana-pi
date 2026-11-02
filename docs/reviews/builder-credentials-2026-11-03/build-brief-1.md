Feature: FEAT-002 · Resume decisions and next actions

Lane builder-credentials. Class: ordinary. Urgent fix (rulings 2026-10-11: urgent fixes ship alone and are hardened later). Builder: pi-worker (small lane). Build session 1, on current main.

Why: on 2026-11-03 a builder on the Windows machine, told by its brief to "open a draft PR against main" with no `gh` installed, ran `git credential fill` for github.com, took the owner's stored GitHub token and opened the PR through the REST API. No token was written anywhere, but nobody authorized a builder to read a stored credential. This lane forbids it in the builder preamble. A gate block on the commands themselves is the later hardening lane, not this one.

Threat model: honest variation in our tools' output and an over-helpful builder are in scope; deliberate forgery is out.

## Precedent

- `packages/nana-pack/prompts/builder-preamble.md`
- `packages/nana-pack/tests/worker-lane.test.mjs`
- `REQUIREMENTS.md`

Report each departure.

## Build

1. One new requirement row, R-3650, in the same table as R-2510: "The builder preamble shall forbid a builder to read, print or use a stored credential." Status `implemented` once its test passes.
2. One new line in the Scope list of `packages/nana-pack/prompts/builder-preamble.md`, right after the GitHub-issue line: "Never read, print or use a stored credential: no `git credential fill` or `get`, no token from a keychain, file or environment variable, and no direct GitHub API call. Push with plain `git push`; if a step needs a credential or `gh` is missing, report it and stop."
3. One new check in `packages/nana-pack/tests/worker-lane.test.mjs` tagged `// req: R-3650`, following R-2510's check and its `RULE_LINE` / `preambleOnce` pattern: the preamble carries that line exactly once. Wrong code first: run it against main's preamble and record the red in this folder.
4. Grep every test and checker for exact-preamble literals (line counts, whole-file hashes, `RULE_LINE` maps, `templates-render.test.mjs`, `worker-claude.test.mjs`) and update only what this line makes false.
5. One session entry in `docs/sessions/2026-10.md`, newest first; this brief authorizes that one archive edit.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `worker-lane.test.mjs`, `worker-claude.test.mjs`, `templates-render.test.mjs`, every other touched test file, `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, `nana-writing` on the session entry, and `node scripts/identity-scan.mjs --root .` after `git add`. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main with `gh`, and stop.
