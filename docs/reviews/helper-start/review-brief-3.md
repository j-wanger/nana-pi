Feature: FEAT-006 · Launch builders with execution limits

# Review brief 3: helper-start (confirmation)

Review round 2 sent back 4f103106 on one MUST (AGENTS.md lost two phrases R-659's test needs) plus one SHOULD and one NOTE. Review only `git diff 4f103106 460a69d7` (three commits):
- `a4500225`: AGENTS.md keeps both pinned phrases; `node packages/nana-pack/tests/readme-check.test.mjs` passes.
- `c670da79`: the pack README and the lane evidence describe flat session files.
- `460a69d7`: the pack README states the missing-file known-bug fallback.

CI on 4f103106 failed only on that readme-check test (macOS and Linux suites; the seat read the job logs: 4,847 pass, 1 fail).

Question: does each commit close its finding without a new problem?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
