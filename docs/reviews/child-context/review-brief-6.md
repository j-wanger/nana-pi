Feature: FEAT-013 · Install and connect harness runtimes
Card: fix

# Review brief 6: child-context (confirmation round)

Round 5 accepted tip 497651f06123a8e7ec3937f26ed9747abbedbdfc. Its CI failed only the lane Windows job (run 42567320787): `M5 ... pi-review nana-objective: actual=1646 expected=1631`.

Review only `git diff 497651f0 HEAD`: commit cd17030e makes `packages/nana-pack/bin/pi-review.mjs` measure reviewer sections from the runtime cwd spelling the child actually receives (on Windows a path can have two spellings of different length), adds one test line, and updates one requirement row and code-map lines.

Check: the log now reports what the child receives; the requirement row change is accurate and no wider than the test; no other behaviour changed.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
