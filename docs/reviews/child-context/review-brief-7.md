Feature: FEAT-013 · Install and connect harness runtimes
Card: fix

# Review brief 7: child-context (confirmation round)

Round 6 accepted tip 973a542211bf50a8325324562acc1d629efea894. Its CI failed two ways (run 42571760369): test-packs-ci M8 "main deletion restored" (a main-side test bug, fixed on main by m8-merge-base, 55963b07), and on Windows context-anatomy R-3729, which build 6's pi-review change broke.

Review only `git diff 973a5422 HEAD`:
- e155b14a: pi-review logs the runtime checkout path without canonicalizing it; R-3729 and child-context M5 assert alternate path spellings; `fake-pi.mjs` gains cwd-preservation emulation. The builder reproduced the original failure on macOS with a real symlink before fixing it.
- 59d0ea3c: seat merge of main (brings the M8 fix and test-retire). Its only conflict was the generated `docs/code-map.md`, taken from main and rebuilt with `npm run map`.

Check: the log reports the path the child actually runs in; the tests prove it with two spellings; the merge drops nothing from main and keeps the lane's change.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
