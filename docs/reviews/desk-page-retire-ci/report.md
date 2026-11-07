# Desk retirement CI repair

## Scope and closures

- R-3156: name all 26 fixed-base edges removed by desk retirement, including the pack agent-directory parity test's former parser edge. The existing history test is unchanged except for its named loss list.
- App-listener cleanup: await both host shutdowns before removing fixture directories. Windows uses taskkill with tree termination and awaits its completion plus host stdio closure. POSIX uses the host's existing graceful shutdown, which stops its app children.
- Use explicit retrying removal through the desk tmp-dir helper. Exit cleanup uses the same function. No skip-list changes.

## Requirements and tests

Existing contracts remain unchanged; no requirement diff, new rows, new tests or sealed tunables were needed for this fix. R-3156 already requires named reasons for removed edges. R-948 continues to pin distinct ephemeral listener ports.

Existing test edits: the R-3156 loss list; the app-listener harness's two teardown sites and imports. No assertions were weakened or deleted.

Wrong-code evidence: the original R-3156 test failed with the first missing desk edge (map-before.log, exit 1). After naming the desk-local edges, it failed on the pack agent-directory parity edge; adding that reason made it pass. No new test requires a mutation pair. The Windows EBUSY failure is supplied by the brief; this macOS host cannot reproduce or verify native Windows cleanup.

## Precedent

The fix brief permits omitting a Precedent section. The loss reasons follow the existing R-3156 map entries. Retry removal follows packages/nana-pack/tests/profile-fixture.mjs, importing the same test-runner retry constants instead of adding values. The existing apps/desk/test/tmp-dir.mjs had no retrying explicit cleanup API, so this change adds removeTmpDir there and reuses it from the exit handler and listener test. No helper was copied or moved.

## Commands and results

- `node packages/nana-pack/tests/code-map-launch.test.mjs`: before exit 1; after exit 0, 12 checks.
- `node apps/desk/test/app-listener.test.mjs`: exit 0, 76 checks.
- `node scripts/test.mjs apps/desk`: exit 0; 10 files: 10 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 184 pass, 0 fail, 2 skip.
- `node scripts/code-map.mjs --write`: exit 0.
- `node scripts/code-map.mjs --check`: exit 0.
- `node scripts/readme-check.mjs`: exit 0.

Full suite deferred to CI under AGENTS.md. Browser tooling was unavailable, so the desk run declared two browser skips. Native Windows execution and pushing remain for the seat. No GitHub access, issues, session archives, HANDOFF edits or known-bug-file edits occurred.
