VERDICT: DONE

**Commit:** `67fa33b5` — `first-look: write compact accessibility diffs`

- **Files:** `REQUIREMENTS.md`; `packages/nana-pack/tests/first-look.test.mjs`; `scripts/first-look-config.mjs`; `scripts/first-look.mjs`.
- **Rows:** R-3040 remains implemented with evidence `packages/nana-pack/tests/first-look.test.mjs::R-3040: builds both checkouts, captures both widths and writes compact diffs only for changed views`.
- **Test title:** `R-3040: builds both checkouts, captures both widths and writes compact diffs only for changed views`. Updated the existing R-3040 test; no other existing tests changed.
- **Mutation proof:** Replaced the diff with whole-tree output; R-3040 failed. Restored unified diffs; the test passed.
- **Commands:** Focused test passed (exit 0); whole-tree mutation test failed as expected (exit 1); map, README, requirements trace, tree, known-bugs and identity checks passed (exit 0).
- **Precedent departures:** None.
- **Not done:** Nothing.

**Locked suite:** `npm run test:locked` — exit 0; 233 files, 231 passed, 2 skipped; **8,670 checks passed, 0 failed**.

**Real run:** In a scratch clone of the tip, changed “Needs you” to “Needs your call.” The accessibility diff was **462 bytes and 16 lines**; it showed one changed view and 45 unchanged views:

```diff
## overview
--- overview (before)
+++ overview (after)
@@ -16,8 +16,8 @@
     - link "Requirements":
       - /url: "#requirements"
   - heading "Overview" [level=2]
-  - heading "Needs you" [level=3]:
-    - link "Needs you":
+  - heading "Needs your call" [level=3]:
+    - link "Needs your call":
       - /url: "#decisions"
   - list:
     - listitem: "Asks: 27 · blocking (must decide): 0 · optional: 25 · parked: 2"

1 views changed; 45 views unchanged
```

The writing check flagged the required verdict format and required file paths; I retained them to match the brief’s report shape.
