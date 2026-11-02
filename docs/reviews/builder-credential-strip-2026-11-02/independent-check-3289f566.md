PASS — builder-credential-strip independent check. No MUST findings.

1. **Scope:** Compared tip `3289f566fc09703a283c8132b2fe26b046b75f73` with main `5bb488728ba22d496406a7c79aa489e09dadd6eb`. Used scratch archives, isolated homes/configs, and only fake credentials. The worktree stayed unchanged. This serves the builder-context priority.

2. **Launcher children:** Tested pi-worker non-lane, pi-worker pi lane, pi-worker Claude lane, pi-review, claude-review, and direct review-ledger. Each inherited helpers through global, parameter, and counted configuration.
   - **Tip:** 0/18 children obtained `PROBE-SECRET-123`.
   - **Main:** 18/18 obtained it.
   - All launchers succeeded; every parent positive control obtained the fake secret.
   - Claude stubs exercised spawn and effective settings environments, including simulated conflicting project settings.

3. **Child restoration attempts:**
   
   | Route | Tip reads secret | Main reads secret |
   |---|---:|---:|
   | Own `git -c credential.helper=...` | 18/18 | 18/18 |
   | Repo-local helper config | 0/18 | 18/18 |
   | Replacement `GIT_CONFIG_PARAMETERS` | 18/18 | 18/18 |
   | Simulated higher-precedence Claude settings | 18/18 | 18/18 |
   
   Successful tip overrides match the plan’s declared residuals.

4. **Gate floor:** Tested 27 credential forms and 10 near-misses across both shell handlers and all three roles, with allow-all exceptions.
   - **Tip:** blocked 108/108 worker/reviewer credential cases.
   - Allowed all 40 worker/reviewer near-misses and all 74 unset-role cases.
   - **Main:** blocked 0/222 cases.
   - Near-misses included `git credentials-list`, `git credential-cache exit`, quoted documentation, and `curl https://api.github.com.evil.example`.

5. **Seat push:** Both versions pushed successfully to scratch bare remotes, exit 0. Both retained fake-helper access. Local pushes do not test HTTPS authentication.

**MUST findings:** None.

**SHOULD findings:** None new. Environment overrides remain documented residuals. Real Claude settings precedence, native Windows execution, and complete lands remain unverified here.

Evidence: `$TMPDIR/credential-independent.E2kpqu/` contains harnesses, launcher logs, and result JSON files.

Writing check ran; retained the required PASS verdict and technical identifiers for reproducibility.
