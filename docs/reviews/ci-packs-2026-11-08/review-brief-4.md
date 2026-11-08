Feature: FEAT-031 · Run checks reliably and without contaminating work
Card: fix

# Review brief 4: ci-packs — confirmation round on the M8 fix

Round 3 sent back one MUST: M8 in `packages/nana-pack/tests/test-packs-ci.test.mjs` read a local `main` that pull-request checkouts lack. Review only `git diff 0f7ff87f..HEAD`. It holds the fix commit d8eb7694, its evidence under `docs/reviews/ci-packs/pr-checkout/`, a known-bug line for round 3's SHOULD, and a seat merge of main that brings in only the one-line OBJECTIVE.md priority change and its review brief.

Question: does M8 now work in a remote-refs-only detached checkout and in a normal one, with its assertions and R-3857 marker unchanged? This tip's PR CI is the proof for the first. Threat model: honest checkout shape variation; forgery out.
