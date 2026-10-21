# win-hook-variant-loop — build brief 5 (round-1 findings)

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/win-hook-variant-loop`, on top of the current tip (47cdfe47, the seat's notes; the branch already contains main 7aadbc99). Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
Round 1 on 47cdfe47: the land reviewer (pi astra) sent it back; the final reviewer (Opus) said LAND with two SHOULDs. Records: the seat's scratch `astra-r1.md` and `opus-r1.md` (findings quoted below).

1. **MUST (land reviewer): two named must-meet checks pass with the feature removed.** With `packages/nana-setup/lib/hook-health.mjs` restored from 7aadbc99, `win32-hook-repair.test.mjs` passes 13/14; only R-2410 goes red. R-2411 ("a ✗ settings row never names an entry install repairs as a hand repair") and R-2412 ("a settings shape install refuses still prints all six settings rows as ✗") stay green, because main names no entry at all and never simulates the merge. Add a feature-dependent positive assertion to each check, keeping its existing exclusion and no-crash assertions:
   - R-2411: in the same doctor run, a row holding one entry install repairs and one it leaves names the one it leaves (its path, the removal route) and not the repaired one. On main the row names neither, so the check goes red.
   - R-2412: pair the refused shape and the deep-nesting fixture with an accepted-shape twin carrying the same dead entry, and assert the twin's row gets the advice while the refused and deep ones print ✗ without it and without a crash. On main the twin gets no advice, so the check goes red. Keep the row text true to what the check asserts (update R-2411 and R-2412's wording only as far as the new assertions need).
2. **S1 (final reviewer): README wording.** `packages/nana-setup/README.md` (~line 287) says doctor does not name "an entry whose path ends in a backslash". The real limit is a script path whose last separator is a backslash, such as `C:\Users\me\old\nana-objective.mjs`. Say that.
3. **S2 (final reviewer): the edit advice's command is unquoted.** `hook-health.mjs` (~line 57) joins the install command with spaces and no quoting, so under a checkout path with a space (`C:/Users/Jane Doe/nana-pi`) a pasted shell-form command runs `node C:/Users/Jane`. Double-quote each part of the edit command that holds a space or a quote (escape an inner double quote), keep forward slashes, and leave a part with no space unquoted. Add the spaced-checkout case to R-2410's check.

## Do, nothing else
1. The three items above.
2. Show, on macOS, R-2411 and R-2412 red with `hook-health.mjs` restored from 7aadbc99 and green on the tip; show R-2410's new spaced case red with build 4's unquoted join and green now.
3. Run alone: `npm test -- packages/nana-setup/tests/win32-hook-repair.test.mjs`, `settings-merge.test.mjs`, `doctor-detail.test.mjs`, `win32-degrade.test.mjs`, `install.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s req:tree`, `npm run -s map:check`, `npm run -s readme:check`.
4. Commit with explicit paths.

**Report** (6 lines or fewer, VERDICT first): commit; each command's result; the three red-then-green results.
