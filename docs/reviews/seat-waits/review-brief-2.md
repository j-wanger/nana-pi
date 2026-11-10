Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 2: seat-waits (confirmation round)

Review only `git diff 9b04f14a..93241f02` on feat/seat-waits. Review 1 recorded LAND on 9b04f14a.

CI run 42743996052 on 9b04f14a then failed one check on all three legs: `packages/nana-pack/tests/test-runner.test.mjs`, "the source check detects direct mkdtemp calls while ignoring only generated leak fixtures" (R-917). That check requires the exact double-quoted line `import { tmpDir } from "./tmp-dir.mjs";` in any test that calls `tmpDir(`; the lane's `ci-wait.test.mjs` used single quotes.

Build 2 changed that one import line to double quotes. Seat re-ran on 93241f02: test-runner 53/53 pass, ci-wait 10/10 pass, requirements trace exit 0.

Question: does the change fix the CI failure without any other effect?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
