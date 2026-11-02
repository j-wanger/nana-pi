PASS — knowledge-busy independent check. No MUST findings.

1. **Scope:** macOS, Node 22.22.2. Tip `92175160` versus main `ac764bcf`. Both ran from scratch archives with isolated HOME and indexes. Worktree unchanged. This checks shared-toolkit knowledge reliability.

2. **Builds under reader churn:** tip completed **20/20**; main completed **9/20**. Wall times: tip **71–101 ms**; main **69–74 ms**.

3. **Stale-index hooks under churn:** tip delivered **20/20 pull blocks** and **20/20 rebuilds**. Main delivered **10/20 pull blocks** and **15/20 rebuilds**. Rebuilds required `built_at` advancement within 15 seconds.
   - Tip hook time: median **74 ms**, range **72–100 ms**.
   - Main hook time: median **72 ms**, range **70–76 ms**.

4. **EXCLUSIVE locks:** rollback-journal mode ensured locks blocked readers.
   - **3 seconds:** tip hook **300 ms**; main **67 ms**.
   - **10 seconds:** tip hook **194 ms**; main **69 ms**.
   - All exited **0**, with empty stdout and stderr, below the **2500 ms** allowance.

5. **Recovery under held writer lock:** tip refused in **0.66 ms**; main in **0.49 ms**. Both preserved index bytes and inode. Main’s scratch copy received only an equivalent synchronization seam to place contention immediately before recovery’s lock attempt.

6. **Additional checks:** tip passed all **7** build-busy checks, including first-build contention, sources-error contention, timeout defaults, and recovery preservation.

**MUST findings:** None.

**SHOULD findings:** None. Windows execution remains outside this macOS check.

Writing check flagged only the required opening verdict; retained the brief-mandated wording.
