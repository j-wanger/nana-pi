Feature: FEAT-029 · Navigate code and investigate impact

Lane map-spawn-edges. Class: ordinary. Confirmation round 2: review only the change since 97a93ebd, the tip round 1 sent back.

Threat model as in round 1: honest variation in our tools' output is in scope; deliberate forgery is out.

Round 1's MUST: the reader marked a node launch inline when an inline flag appeared anywhere in its arguments (so `review-standard.test.mjs:101`, a temp copy of `bin/pi-review.mjs` launched with the child's own `-- -p review`, was dropped silently), and it judged inline code held in a variable or template string as "no repo code". Build 3 (0b4fae9c) counts inline flags only in node's option position, lists opaque inline code as unresolved, and recognises launches in a ternary's first branch (your SHOULD 2), with fixture cases and wrong-code pairs for each. `--impact packages/nana-pack/bin/pi-review.mjs` now names `review-standard.test.mjs` on the always-run list. Always-run moved from 165 to 169 of 240. CI run 40996692403 passed on all three systems.

Your SHOULDs 3 to 5 are recorded as FEAT-029 known-bug lines, with the plan's six residual lines; one session-note paragraph changed; the lane's keep added your round 1 text.

Question: is MUST 1 fixed without a new silent drop, and does the change cause a harm the review standard lists?
