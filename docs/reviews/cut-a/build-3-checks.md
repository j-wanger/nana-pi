# Cut A build 3: deleted-path checks

Compared deleted paths in `git diff --diff-filter=D main...HEAD`, plus the
removed frontier baseline, against `packages/*/tests`, `apps/*/test` and
`scripts` with `git grep -l -F`. Also searched tool basenames to catch
paths assembled from directory and filename components. JSON paths were
searched in full, not by generic config basename.

Each test below ran alone with `node scripts/test.mjs <path>` and exited 0:

- `packages/nana-pack/tests/brief-check.test.mjs`
- `packages/nana-pack/tests/ci-records.test.mjs`
- `packages/nana-pack/tests/config-display-text.test.mjs`
- `packages/nana-pack/tests/gate-corpus.test.mjs`
- `packages/nana-pack/tests/gate-policy-paths.test.mjs`
- `packages/nana-pack/tests/gate-self-protection.test.mjs`
- `packages/nana-pack/tests/gate-survives-mutation.test.mjs`
- `packages/nana-pack/tests/land-ci-records.test.mjs`
- `packages/nana-pack/tests/nana-roster.test.mjs`
- `packages/nana-pack/tests/test-packs-ci.test.mjs`
- `packages/nana-pack/tests/win-shards.test.mjs`
- `packages/nana-pack/tests/worker-lane.test.mjs`
- `packages/nana-setup/tests/project-odd-seeds.test.mjs`
- `packages/nana-setup/tests/project.test.mjs`
- `packages/nana-setup/tests/setup-tail.test.mjs`

The project test first exited 1 under the runner: its temporary HOME lost
npm's configured global prefix, so npm named a Node installation without pi.
It exited 0 directly, and exited 0 through the runner with
`npm_config_prefix="$HOME/.local"`. No installation or test change was needed.
The code-search JSON fixture was the only non-test hit; it is frozen search
input, not an executable reader. No script hit remained.

Raw command output stays under `$TMPDIR`; it is not committed.
