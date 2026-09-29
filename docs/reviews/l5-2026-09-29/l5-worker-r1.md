The lane is built and committed on `lane/l5-directory-adoption`, and the full test suite passes. One gap stops it from reaching the seat yet: the new hook gets linked but is never added to `settings.json` (first residual below).

**Commit:** `e9742ee` (off `eca3de4`), not pushed.

**`env -u NANA_HANDOFF npm test`:** exit 0 · `81 files: 80 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 4885 pass, 0 fail, 6 skip · 241.4s`. The skipped file is `apps/bench/test/study-tasks.test.mjs`, which this lane doesn't touch. No test removed or changed. New files: `adoption-producer` 28 checks, `adoption-reader` 20, `project-dismiss` 14 (`npm test -- adoption project-dismiss`).

**The journal line as emitted** (from `tests/adoption-producer.test.mjs`):
`{"ts":"2026-09-29T10:20:03.291Z","event":"directory_unadopted","cwd":"/private/var/folders/…/adoption-producer-9MeoKz/bare","has":{"handoff":false,"objective":false,"agents":true,"sessions":true}}`

**Reader output on a seeded journal** (`node tests/adoption-reader.test.mjs`): 7 open repos, plus one adopted after its line, one dismissed, one deleted, one older than 7 days and one duplicate.
```
[nana:adoption]
## Unadopted repositories (nana)
Sessions ran in these git repositories, which have no OBJECTIVE.md, no handoff and no dismissal:
- …/r0 — has: AGENTS.md, docs/sessions/ · last session 2026-09-29
- …/r1 … r2 … r4 … r5 — has: nothing
…and 2 more
For each: adopt it with `nana-setup project <dir>` and set its objective with Jake, or dismiss it once with `nana-setup project <dir> --not-a-project`.
```
An empty or absent journal gives empty stdout and exit 0, from both the bin and the hook.

**Proof that nothing reaches the prompt:**
- The test loads the `eca3de4` version of `nana-handoff.ts` (via `git show`) next to the new one. On three scenarios (an unadopted repo root, a subdirectory of it, and a subdirectory of a repo with a stored handoff) the two prompts are byte-identical.
- Exact goldens also hold: an unadopted root gives exactly `BASE`, and the ancestor block is exact.
- The producer never adds to `lines[]`.
- Mutation probes: each broken variant was caught by at least one failing test. The five were: dropping `!custom`, dropping the 24h dedup, reporting the cwd instead of the root, reporting on `read.kind === "error"`, and checking the cwd instead of the root.

**Trace:** verified. The line numbers are within a few of the brief's (for example, the `handoff_missing` journal line is at `:339`).

**Residuals:**
1. **The hook never runs yet.** Adding it to `HOOKS` only creates the symlink. The `settings.json` SessionStart entry comes from `desiredHooks()` in `packages/nana-setup/lib/settings.mjs`, which is outside the allowlist. Doctor will also show the hook ✓ while it never fires. It needs one ~6-line entry beside "SessionStart objective".
2. **Allowlist deviation:** the shared predicate is `lib/adoption.mjs`, not `lib/adoption.ts`, so the bin imports no `.ts` and has no Node floor. It holds a copy of the store key, and a test asserts it equals `storePathFor`.
3. **Journal location mismatch:** a project-scope `journal.path` would send producer lines where the reader doesn't look. The reader only reads the user-scope `journal.path` or pi's default agent directory.
4. **Objective filename:** "adopted" checks the literal `OBJECTIVE.md`, not `objective.projectFile`.
5. **Untested catch branch:** the reader's catch branch (named marker) isn't exercised. The no-node marker in the hook is tested.

**Scope check:** nothing outside the allowlist apart from residual 2. Non-test code is 10 files, about 264 lines — at the file ceiling.

`git diff --stat eca3de4`:
```
 docs/directory-adoption-design-2026-09-28.md       |   2 +
 packages/nana-pack/README.md                       |  11 +
 packages/nana-pack/bin/nana-adoption.mjs           |  52 +
 packages/nana-pack/extensions/nana-handoff.ts      |  25 +-
 packages/nana-pack/lib/adoption.mjs                | 110 +
 packages/nana-pack/tests/adoption-producer.test.mjs| 198 +
 packages/nana-pack/tests/adoption-reader.test.mjs  | 121 +
 packages/nana-setup/README.md                      |   9 +-
 packages/nana-setup/bin/nana-setup.mjs             |  12 +-
 packages/nana-setup/claude/hooks/nana-adoption.sh  |  21 +
 packages/nana-setup/lib/project.mjs                |  26 +-
 packages/nana-setup/lib/steps.mjs                  |   2 +-
 packages/nana-setup/tests/project-dismiss.test.mjs |  59 +
 13 files changed, 640 insertions(+), 6 deletions(-)
```
(Per-file counts are approximate; the total line is exact.)

**Claim most likely wrong:** "the seat will see this." It won't until the `settings.mjs` entry lands (residual 1). A second risk: pi and the Claude hook may resolve different agent directories if `PI_CODING_AGENT_DIR` differs between the two environments, and then they use different journals.

VERDICT: DONE
