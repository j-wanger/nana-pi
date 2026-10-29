The lane works for the seat: no MUST finding stands. The cold launch, the refusal paths and the outside reader's behaviour after the helper move all check out. I found three test gaps, all SHOULD-level, for the known-bug file.

## What I checked

- **Tests and checks:** the four touched test files pass (visual-reader, first-look, outside-reader, seat-rule). The map check reports 0 problems over 479 modules. The readme check reports 0 problems over 843 claims.
- **Cold launch isolation** (`scripts/visual-reader.mjs:251-260`):
  - **Flags:** the arguments match the plan's verified command exactly. They use the `=` form for `--tools` and `--allowedTools`, which avoids the planner's trap where a list flag eats the instruction. All five flags exist in the installed Claude Code 2.1.310 `--help`.
  - **Working folder:** the child runs in a fresh `mkdtemp` folder under the OS temp folder. It holds only `prompt.md` and the renamed `image-N` files, and the `finally` removes it.
  - **Env:** the child gets `NANA_ROLE=reviewer`, `NANA_HANDOFF=off` and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. These are layered over `process.env`, which is the same as the pi-worker precedent.
  - **Stdin and attempts:** stdin is ignored, so the instruction is the last argument. Retries is 0, so it makes one attempt.
  - **What reaches the child:** manifest file names pass through `safeName`, so a manifest cannot pull files from outside the `--from` folder.
- **Refusal paths:** these come in order and none reaches the watchdog:
  - an `--out` inside the repo (exit 2);
  - the roster note (exit 0, before the manifest is read);
  - a missing or invalid manifest or spec (exit 2).
  - After launch, a failed, empty or ceiling run deletes any stale `reader.md` and keeps `prompt.md`.
  - first-look's url-mode refusals all return before the browser launches.
- **Outside reader after the move:**
  - The old inline check refused an `--out` equal to the root, and so does the new `outsideRepo`, because an empty relative path matches none of `..`, `../` or absolute. Every other path gets the same result as before.
  - `splitNumbered` uses the same regex and slicing as before; it adds only a `String()` coercion.
  - The outside-reader test file is unchanged and passes.
  - Moving `VIEWPORT_HEIGHT` into first-look's config and re-exporting it keeps the same value and import surface.
- **Product and desk modes:** they behave as before. The one difference is that a flag value starting with `--` is now refused, which is harmless.

## Findings

1. **SHOULD — the per-item check in the R-3145 test is empty** (`packages/nana-pack/tests/visual-reader.test.mjs:19` and its use about line 76).
   - Both `splitCount` and the line filter use doubled backslashes (`\\s`, `\\d`) inside regex literals. They therefore look for a literal backslash and always count 0.
   - The assertion "each item follows on its own lines" always compares 0 to 0.
   - If the code stopped printing items, the test would still pass.
   - This is the unescape pattern the builder-check memory warns about. The first-line assertions still pin the verdict accounting, so this is not a MUST.
2. **SHOULD — R-3143 leaves two promised clauses untested.**
   - The row says the test pins the usage line, but no case checks the usage output.
   - The case of `--reference` given together with `--before` has no test.
   - The code handles both correctly (`scripts/first-look.mjs:136`).
3. **NOTE — the R-3145 demo fixture is made up.** The plan names the adversary's recorded hive answer as the fifth fixture. The test uses a two-line all-FAIL answer instead. The seat's acceptance run on hive build 1 covers the real shape.
4. **NOTE — the child's output mixes in its error stream.** The watchdog writes the child's error output into the same file as its answer. A Claude Code warning could therefore land in `reader.md` and add a stray line. This is the same as the existing precedent.
5. **NOTE — the copied hive background.** It is already recorded as a known-bug line, and I agree with that.

VERDICT: LAND
