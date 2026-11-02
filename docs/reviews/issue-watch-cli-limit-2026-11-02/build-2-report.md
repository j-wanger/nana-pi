VERDICT: DONE

Commit: `1d7be7621b0ce81973e7a68c4e81c10350f2167a`  
Branch: `feat/issue-watch-cli-limit`

- **Files:** `REQUIREMENTS.md`, `issue-watch.test.mjs`, `issue-watch-timing.mjs`, and review evidence files.
- **Rows:** R-3704 now measures elapsed time after restart. R-3705 seals the new grace value.
- **Grace:** 3000 ms. Restart spawns nothing; three seconds generously allows output flush and teardown.
- **Mutation pairs:** build 1’s timeout owner failed the elapsed bound; corrected owner passed. Missing grace export failed the seal; added export passed. Exits: 1→0 each.

**Ten recorded Windows times, seconds:**  
10.911, 10.843, 10.846, 10.976, 10.863, 10.838, 10.811, 10.878, 10.822, 10.851.

Each run passed all 29 checks. Guard sum remains **277000 ms**, leaving **23000 ms**, below 30 seconds spare.

**Last-tip checks, all exit 0:**
- Issue-watch ×10; frontier-summary; test-runner.
- `npm run map:check`; `npm run readme:check`.
- Requirements trace; requirements tree `--check`; known-bugs; identity scan after staging.

Last-tip issue-watch spread: **11.175–11.423 seconds**.

Evidence: `docs/reviews/issue-watch-cli-limit-2026-11-02/{timing.txt,wrong-code.txt,build-2-checks.txt}`.

Departures: none. No helper exports or known bugs touched.

Not done: push, CI inspection, or full suite; `AGENTS.md` delegates the suite to CI. Supplied untracked brief remains untouched.

Writing check ran; required verdict format and technical paths retain its reported exceptions.
