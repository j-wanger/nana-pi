### MUST

1. **MM2 survives removal of truthful labels and timings.**  
   `packages/nana-pack/tests/runtime-map.test.mjs:102-107` uses only passing fixtures and checks only that seconds are numbers. I changed every runner record to `{ label: "PASS", seconds: 0 }`; all eight runtime-map checks still passed. Real measurements could hide failed tests and produce unusable ordering.

2. **MM9 does not exercise `map:impact` from the main checkout.**  
   `packages/nana-pack/tests/runtime-map.test.mjs:391-396` calls `dataPath` and `loadRuntime` directly. I changed the impact CLI’s default reader to a wrong path; all eight runtime-map checks still passed. A real measurement could succeed while the primary impact command reports no data.

3. **Deleting a tracked file makes impact crash instead of reporting stale data.**  
   `packages/nana-pack/lib/runtime-map.mjs:81` hashes every currently tracked path without handling missing working-tree files. With valid runtime data and tracked `README.md` deleted, `map:impact` exited 1 with `ENOENT`. Deleting a tracked file is a realistic development change, and developers receive no impact list or stale warning.

The focused unmodified tests passed: 47 checks across both runtime-map test files.

VERDICT: SEND-BACK
