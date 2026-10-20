# win-pi-launch-orphan: build brief 2 — flip R-2300 and R-2303

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/win-pi-launch-orphan`, branch `feat/win-pi-launch-orphan`. Rules: the builder preamble, but run single test files only — the seat runs the full suite at land, and other lanes hold the machine's suite lock. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits.

The lane's CI Windows leg (run on c0856720) passed both Windows-only checks:
- `PASS R-2300: on Windows, a kill of install alone ends the npm pi launch it waits on within the parent check and the signal grace`
- `PASS R-2303: on Windows, a kill of the pi launch relay alone ends the npm pi it runs and pi's child within the parent check and the signal grace`

**Do, nothing else:**
1. In `packages/nana-setup/tests/pi-launch-limits.test.mjs`, change both markers from `// req-candidate: …` to `// req: R-2300` and `// req: R-2303`, each directly above its `check("<title>",` call with the title's opening quote on the same line as `check(`. Keep each off-Windows branch a real skip (prints SKIP, counts no PASS).
2. In `REQUIREMENTS.md`, set R-2300 and R-2303 to `implemented`, evidence citing each test title plus `; Windows-leg-only`, in the form R-2254 and R-2237 use. Run `npm run req:tree`.
3. In `packages/nana-setup/README.md`, make the Known limits sentence that says R-2300 and R-2303 stay untested true again (they are now implemented on the Windows leg); keep the Idempotence sentence.
4. Run alone: `npm test -- packages/nana-setup/tests/pi-launch-limits.test.mjs`, `node scripts/requirements-trace.mjs` (exit 0), `npm run -s map:check`, `npm run -s readme:check`.
5. Commit with explicit paths.

**Report** (4 lines or fewer, VERDICT first): commit; the two rows' status; each command's exit code.
