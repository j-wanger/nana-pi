**Commit:** `1fac281` on `lane/t2a-objective`, not pushed. `npm test` exits 0: 69 files, 68 pass, 0 fail, 1 skip; 3323 checks pass. Golden corpus 141 pass, injection 68 pass.

**Fresh-machine case** (temp HOME, no `nana-pack.json`, cwd `<proj>/sub`), hook output:
- Before: `OBJECTIVE UNAVAILABLE: file not found (…/.pi/agent/nana-objective.md). Tell the user before spending.`
- After: `governing: …/OBJECTIVE.md` then `**Objective:** ship the widget.` / `**Current priority:** widget v1.`, then `program objective: unavailable (file not found: …/nana-objective.md)` and the precedence sentence.
- Fix: the walk up for `OBJECTIVE.md` always runs now, with no configuration. `projectFile` only renames the file; `null`, `false` or absent all mean `OBJECTIVE.md`. The config reader accepts `false` without flagging it as invalid. Every r1 guard is unchanged.
- New corpus cases 10, 11 and 19–23 each compare hook and pi byte for byte. On r1's `objective.ts`, 8 of them fail, including every one named "FRESH MACHINE" that has a product file. The two "no product" cases were not part of the regression.

**(n)(p)(q):** all three rewritten, none deleted.
- (n) now checks that no `program objective:` or `Precedence:` line appears, and that the umbrella is the governing file.
- (p) now checks that no `program objective:` line appears, and that the printed `(ignored <link>: reached through a symlink — the program file governs)` line is there.
- (q) now checks for `program objective: unavailable (file not found: <path>)` and that no `program current priority:` line appears.
- `git grep "Umbrella (nana)"` returns nothing anywhere in the repo, including `HANDOFF.md`.

**`CLAUDE_PROJECT_DIR` unset (case 23):** the hook runs in `<product>/sub` with the variable removed, and the walk up still finds the product through the `$PWD` fallback. A control run from outside the product gets the UNAVAILABLE marker, so the result isn't leaking in from elsewhere.

**Residuals:**
- Test (j) put an `OBJECTIVE.md` in the cwd to prove a relative `objective.path` can't point at repo text. Under the restored default that file now governs, as intended. I renamed it to `UMBRELLA-REL.md` so (j) still tests the relative-path rule. The consequence: any repo's `OBJECTIVE.md` now becomes governing system-prompt text with no owner opt-in. That is the ruling, but the r1 README treated it as a security boundary.
- My own r1 corpus case 11 (added in T2a r1) passed without testing anything: the "absent" case wasn't really absent because a default argument filled in `OBJECTIVE.md`. I fixed that; the absent case now fails on r1's code.
- Beyond the brief I also changed the doctor message, the README section and the extension header comment. The doctor used to say "only the user-scope objective is used", which is now false.

**Claim most likely wrong:** case 23 proves the `$PWD` fallback when bash starts without a `PWD` variable and works it out from its real cwd. If Claude Code passes a stale `PWD`, bash uses it, and the walk would start from that directory. I haven't tested that.

VERDICT: DONE
