## Attack

In-process probes confirmed all four reviewer variants change from **allowed** to **credential-rule refused** under the proposed merge, for both roles and tools. Quoted executable paths, `.exe`, PowerShell `&`, and `--git-dir=x` also work. No credential command executed; repository files remained untouched.

1. **MUST — Quoted global-option values still bypass the proposed rule.**  
   **Evidence:** Real-gate probes with merged patterns allowed:
   - `git -C "C:/work tree" credential-cache get`
   - `git -c "http.extraHeader=X Y" credential-cache get`

   `nana-gate.ts:151-153` rejoins preserved tokens with spaces; the global-option prefix then consumes only `\S+`. These are honest variations within the plan’s threat model, absent from M1 (`plan.md:56`).  
   **Fix:** Preserve argument boundaries when recognizing global options. Add both cases to M1 across roles and tools; revise “No change expected” for the floor.

2. **MUST — Two promised wrong-code pairs lack distinguishing cases.**  
   **Evidence:** `plan.md:60` promises M2 failures for substring `get` and missing trailing boundaries. M2 (`:57`) contains neither a helper `--get` nor `getx`. `git config --get credential.helper` cannot distinguish these mutations because it never matches the helper prefix. The existing allowed list supplies neither case.  
   **Fix:** Add `git credential-cache --get` and `git credential-cache getx`, plus dashed equivalents. Require **M2 itself**, not merely the literal seal, to fail each mutation.

3. **SHOULD — The false-refusal residual understates lost token boundaries.**  
   **Evidence:** The merged real gate refused `git credential-store --file "get secrets" erase`. No argument equals `get`; the joined subject invents that word boundary. A3 (`plan.md:18`) describes only an option value equal to `get`. The requested `exit`, configuration lookup, and `--file=x erase` controls remained allowed.  
   **Fix:** Preserve token boundaries, or explicitly record and test this broader residual rather than asserting “nothing else” in A1.

4. **SHOULD — The subject cap does not bound credential matching.**  
   **Evidence:** `nana-gate.ts:143-154` uses `MAX_SUBJECT` to disable exemptions, but still runs credential regexes against complete segments. Isolated helper-pattern probes completed at 80,025 characters in about 1 ms; I found no catastrophic backtracking in the new helper tail. However, a whole-gate long-input probe timed out at 30 seconds; that does **not** establish the new regex as its cause. Probe artifacts were removed.  
   **Fix:** Document the cap accurately. Add a separately time-bounded performance probe before claiming bounded matching; investigate existing gate costs separately.

5. **SHOULD — M3 duplicates an implementation seal rather than adding behavior.**  
   **Evidence:** `plan.md:58` assigns R-3687 to exact merged patterns, while R-3667 already owns the sealed list (`REQUIREMENTS.md:832`).  
   **Fix:** Keep the literal seal under R-3667; use any new row for observable behavior, or omit the duplicate row. The declared lane class is correct: the classifier printed `hook`.

**Counts: 2 MUST, 3 SHOULD.**
