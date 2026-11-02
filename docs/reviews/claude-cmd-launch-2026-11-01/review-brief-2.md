Feature: FEAT-040 · Make and keep memory

Lane claude-cmd-launch. Class: ordinary. Threat model: honest variation in our tools' output is in scope (npm shims in either layout, native `claude.exe` first on PATH, spaces in paths, the `Path` key, arguments with quotes, percent signs, exclamation marks and backslashes); deliberate forgery, such as a planted shim or package, is out.

Confirmation round 2. Review only `git diff d3db564e HEAD` on `feat/claude-cmd-launch`. Round 1 (kept as `r1-reviewer-88fa6e49.md`) sent back one MUST: `createRunner` in `scripts/memory-shape-runners.mjs` defaulted its spawn to `spawnSync`, so every real caller bypassed the Windows resolver. `build-brief-3.md` records the fix build (7a7c2a11). The laptop then re-recorded `real-npm-claude-win32.txt` through `createRunner({ runner: "claude" })` with no spawn passed, before (main) and after (62c40ab8). R-3474 stays `untested`, because the trace accepts only a test citation; that is intended.

Question: does the round 1 MUST hold fixed, so memory making's real callers reach the resolver on Windows while an injected spawn and non-Windows behaviour stay unchanged? Did the fix cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
