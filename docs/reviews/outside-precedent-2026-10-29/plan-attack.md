# outside-precedent · plan attack (adversary, 2026-10-29)

Counts: MUST 0 · SHOULD 3 · NOTE 3.

## SHOULD

S1. The new sentence clashes with an existing one. `planner.md` keeps "Put public references under **Outside precedent**." A spec, paper or paid product is not "one open-source project". The R-2954 row claims that sentence, but no check pins it. Proposed exact sentence, replacing it:
"Under **Outside precedent**, name one open-source project for the lane's main part, with its licence and one of `adopt`, `borrow` or `skip` and a reason; put any other public reference after it. When none applies, write `none:` with where you looked."
Pin it under R-3030. Update R-2954's row text to match.

S2. The "any" must go from the order sentence too. Today it reads "Then write the **Feature** line, **Threat model**, **Precedent**, any **Outside precedent**, and **Must-meet** tests." Must-meet 1 should pin the version without "any". R-2951 checks only the order, so it stays green either way.

S3. The plan's own entry fails the O1 default. It says "searched for … conventions" but not where. Prior art does exist. The Rust RFC template has a "Prior art" section (MIT/Apache-2.0). MADR has "Considered Options" (MIT). Proposed entry: "- Rust RFC template, MIT/Apache-2.0, `borrow`: its Prior art section asks the same question; we take the idea, not the text."

## NOTE

N1. A builder needs no new brief check. `brief-precedent.mjs` `readBrief` reads only the first `Precedent` section. An `Outside precedent` heading does not match it. The R-2954 sample already shows a `##` Outside section parses cleanly. The plan is the brief, so a builder sees `adopt`/`borrow` and the licence without extra wiring. Do not touch `pi-worker`.

N2. "One project" is fine as a floor (A1). A planner may want two candidates when the top one is `skip` for licence reasons. The wording "one … put any other public reference after it" allows that without padding.

N3. Nothing checks plans, only the prompt text. That fits an ordinary lane. A plan checker would belong in a later lane, once the owner sees whether planners comply. Licence "unknown" is honest variation; accept it as the licence value rather than inventing one. R-3030 is free.
