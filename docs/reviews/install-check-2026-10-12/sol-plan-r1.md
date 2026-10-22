## MUST

1. **Bind each XFAIL to its expected failure, and expire the list.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:98,143-149,312-320`  
   **Evidence:** R-1070 converts any failure of a listed item into XFAIL. A new failure can therefore hide behind the same item label. Nothing mechanically prevents the Windows list surviving past October 24.  
   **Smallest fix:** Seal an expected failure code or predicate with each entry. Treat a different failure as FAIL. Add an expiry that makes every remaining XFAIL fail on October 24.

2. **Seal the expected dispatch form per hook and platform.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:102-103,116-128,229-232`  
   **Evidence:** The shape check validates `args` only when present. A Windows hook incorrectly left in shell form can pass if Git Bash happens to execute it. The mutation test checks the simulator, not whether installation selected the required form.  
   **Smallest fix:** Add `exec` or `shell` to every sealed hook-table row per platform. Make R-1074 fail when the installed entry uses another form.

3. **Do not weaken the adoption check if the RPC probe fails.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:56,107,221-227,451`  
   **Evidence:** The fallback retires R-1079 and allows adoption output that merely lacks `ADOPTION UNAVAILABLE`. Empty output would then pass, contrary to the stated output guarantee. It would also leave real pi package loading unproved.  
   **Smallest fix:** Run probe (f) before approving the final declaration. If it fails, reopen the plan with another production-path trigger that creates the journal record. Do not replace the output assertion with a silence-tolerant check.

4. **Test that every subprocess receives the isolated environment.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:99,193-213,481-487`  
   **Evidence:** R-1071 covers every process, including fixture `git init` and any Git Bash discovery. The proposed test names only install, pi, hooks, and doctor. A missed fixture spawn could read the real home without failing the test.  
   **Smallest fix:** Record every spawn and assert the same sanitized environment on all of them, including Git, shell discovery, install, pi, hooks, and doctor.

5. **Give each requirement row exactly one “shall.”**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:100,105,107`  
   **Evidence:** R-1072, R-1077, and R-1079 each contain two normative “shall” clauses.  
   **Smallest fix:** Keep one “shall” per row and rewrite the second clause declaratively, or split the requirement before assigning final IDs.

6. **Resolve the contradictory Windows acceptance status.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:391,566-569`  
   **Evidence:** Section 3 makes the owner's Windows run part of “done.” The verification section says whether that run is required remains open.  
   **Smallest fix:** Delete the stale open statement and consistently mark the machine run as required.

## SHOULD

1. **Make the known-red tests cover failure fingerprints and expiry.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:492,502-507,544-552`  
   Add cases where a listed item fails for the wrong reason and where the list survives its deadline.

2. **Keep the scope statement explicit about pi coverage.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:363-364,418-428`  
   Registration and one model-free session do not exercise pi’s prompt-time objective, knowledge, gate, or post-edit behavior. This is a material residual, not proof that every pi hook works.

3. **Record the actual Git Bash and pi paths in CI output.**  
   **File:** `docs/reviews/install-check-2026-10-12/CHANGE.md:234-244,275-309`  
   This makes failures caused by runner image changes distinguishable from hook failures with minimal extra output.

## NOTE

- The proposed job can run on both hosted platforms. Node 22 is installed explicitly, GitHub’s Windows Bash shell is Git Bash, and Windows pi launches are routed through `cmd.exe`.
- The release dependency is genuinely blocking. The existing Windows suite remains non-blocking, while `needs: [suite, install-check]` holds release on either install-check leg.
- The temporary-home design isolates nana, pi, Claude Code, temporary files, and npm cache as claimed. Windows machine configuration remains an honestly declared residual because APPDATA and LOCALAPPDATA are not redirected.
- The matcher validation catches wrong event grouping, missing startup matching, missing PowerShell coverage, and malformed exact or regex matchers.
- The output checks catch silent objective, shared-memory, verifier, and knowledge hooks. Adoption becomes equally strong only after MUST 3.
- Real Claude Code dispatch, cross-drive Windows layouts, hostile paths, Linux, and pi prompt behavior are appropriately identified as residuals rather than new requirements.

**Score: 82/100.** The platform and CI design is sound. The remaining blockers are narrow contract holes in the fail-open list, dispatch-form assertion, adoption fallback, and requirement wording.

VERDICT: LAND-WITH-FIXES
