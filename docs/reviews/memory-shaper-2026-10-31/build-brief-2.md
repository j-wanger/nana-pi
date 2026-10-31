Feature: FEAT-040 · Make and keep memory

Lane memory-shaper. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on this branch's tip.

The seat ran the plan's synthetic canary call with the real Claude runner (fixture `packages/nana-pack/tests/fixtures/memory-shaping/session.jsonl` in a temp repo and root). Result: calls 1, calls with unknown usage 1, unclassified 2. Cause, reproduced by hand: `replySchema` returns a schema whose root is `type: "array"`, and the installed Claude CLI refuses it: `--json-schema must be a JSON object`. Every Claude call fails, so the real run cannot classify anything.

Fix: make the reply schema's root an object (for example `{ type: "object", required: ["units"], properties: { units: <the array schema> } }`), and have the shaper read the array from that property for both runners; keep the pi runner's reply parsing consistent with the same shape and say how. Add one test that pins the property the CLI requires (the schema passed to a runner has `type: "object"` at its root) under an existing row in R-3251 to R-3257, and a wrong-code pair. Update the prompt-hash seal (R-3268) only if the prompt text changes; say whether it did.

Do not call a model in tests. The seat repeats the canary after the build.

## Done when

Green: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip.

## Precedent

- `packages/nana-pack/lib/memory-shaping.mjs`: `replySchema` and `validated`.
- `scripts/memory-shape-runners.mjs`: both runners.
- `apps/bench/lib/catch-judge.mjs`: `callJudge`, whose schemas are object-rooted.
