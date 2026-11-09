Feature: FEAT-013 · Install and connect harness runtimes
Card: fix

# Review brief 4: child-context (confirmation round)

Round 3 accepted tip 09841cc2fb263ee52264a82ccb50b157fa8fd112, but its CI failed: main's memory-sort land makes `pi-worker` refuse lane briefs without a valid `Serves:` line, and four child-context cases wrote fixture briefs without one.

Review only `git diff 09841cc2 HEAD`: commit 97007b29 adds a Serves line to the fixture brief in `packages/nana-pack/tests/child-context.test.mjs` and a check record in `docs/plan/child-context/serves-fixture-checks.md`.

Check: the cases assert the same behaviour as before; the refusal is unchanged; the committed record carries no harm the standard lists.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
