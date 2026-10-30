# Build 6: blocked on the fixture count

## Verdict

BLOCKED. Revision 3's must-meet 1 cannot hold against the frozen fixture and the tracked audit.

- The tracked audit has 23 component IDs.
- The fixture has five component IDs.
- Four IDs occur in both: `workshop`, `library`, `key-cabinet`, `land-gate`.
- The fixture-only ID is `review-hall`.
- Therefore the same complete city plan must produce **19** `not in audit` lines and one `no place yet` line, not 18 and one.

The contradictory count also appears in A2 and A12. There is no legitimate implementation that places all 23 tracked components exactly once, leaves the frozen fixture unchanged, and reports only 18 missing IDs. Suppressing one missing ID would violate the drift rule.

## Open question

May must-meet 1, A2 and A12 say 19 instead of 18? The other fixture expectations can stay unchanged. This is a request to correct the plan, not a proposal to drop or alias a component.

## Reproduction

From the lane root:

```js
import { readFileSync } from 'node:fs';
const audit = JSON.parse(readFileSync('docs/components/nana-pi.json')).components;
const fixture = JSON.parse(readFileSync('docs/components/fixture.json')).components;
const a = new Set(audit.map(c => c.id));
const f = new Set(fixture.map(c => c.id));
console.log(a.size, f.size, [...a].filter(id => f.has(id)).length);
console.log([...a].filter(id => !f.has(id)).length);
console.log([...f].filter(id => !a.has(id)));
```

Result (exit 0):

```text
23 5 4
19
[ 'review-hall' ]
```

## Work and verification

The builder began requirement-first work and ran the proposed city, resident and tunable checks red against the old implementation. All three commands exited 1. The city drift check subsequently exposed the count contradiction (`19 !== 18`). The unfinished requirement, test and implementation edits were rolled back. No product code, requirement row or test change remains.

No mutation pair is claimed: the early wrong-code runs were development checks, not completed mutation proof. No Precedent departure ships. No known-bug fix ships. The builder did not edit the plan, HANDOFF, known-bug files or archives.

The unchanged implementation's locked suite ran in the foreground with the machine lock:

```text
npm run test:locked — exit 0
241 files: 239 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8747 pass, 0 fail, 44 skip · 592.0s
```

Full output: `build-6-blocked-suite.txt` in this folder.

## Not done

The city replacement, requirement implementation/retirement, screenshots, per-line visual verdicts, near-miss renders, extended gesture check, push and finished CI run remain undone. There are no screenshot folders or visual passes to claim. The owner shape gate has not run. Build 5 remains the product implementation.
