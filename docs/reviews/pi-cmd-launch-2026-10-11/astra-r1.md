## Land review — 8/10

Reviewed `0110601..c58d7c8`, separating this lane from the already-reviewed changes merged from `c505601`. One test-safety issue blocks landing. Rare product cases below are residuals, not reasons to reopen the design.

### MUST

**1. Stop the Windows integration test before it can fall through to an installed pi.**  
`packages/nana-setup/tests/pi-registration.test.mjs:324–329`

The fixture-install and selected-shim checks only increment `fails`; neither stops execution. The test then calls real `stepPiRegister` with the inherited PATH and `isRealHome: true`.

If `npm_execpath` is absent, npm installation fails, or PATHEXT excludes the fixture’s `.cmd`, lookup can select an actual pi farther along PATH. The test can consequently run a real `pi install`. The temporary agent directory limits the damage but does not satisfy the brief’s explicit prohibition.

**Smallest fix:** make fixture installation and exact `findPi` selection mandatory preconditions before calling registration. Add a recording-spawn guard that refuses any invocation not targeting the fixture. Test failed setup and a later PATH pi without launching that pi.

### SHOULD

**2. Make the broken-pi claim accurately describe POSIX ENOENT.**  
`packages/nana-setup/lib/steps.mjs:996`  
`REQUIREMENTS.md:727`  
`docs/sessions/2026-10.md:9`

I reproduced an existing, executable `pi` script whose shebang names a missing interpreter. Registration reports `skipped`, saying pi is absent. POSIX reports ENOENT for this case too.

The plan explicitly retained POSIX ENOENT-as-missing behavior, so this is a rare residual rather than a new blocking requirement. However, “found but broken … on every platform” overstates the implementation. R-1036 also omitted the plan’s “pi is found” qualifier.

**Smallest fix:** restore that qualifier, cite the existing POSIX tests, and document the missing-interpreter exception beside the all-platform claim. A later fix can distinguish absent pi from an unusable executable.

**3. Complete the conservative “as written” PATH lookup.**  
`packages/nana-pack/lib/win-command.mjs:35–37,70–75`

`cmdCouldNotRun` checks the unsuffixed word in cwd, but PATH lookup omits it when the word has no extension. With an existing `C:\bin\tool`, PATH `C:\bin`, and PATHEXT `.CMD`, `cmdCouldNotRun("tool x")` returns `true`.

That differs from CHANGE §3’s explicit “as written or with a PATHEXT extension” predicate. It only changes one failure classification into another; it cannot produce a pass.

**Smallest fix:** check the unsuffixed candidate in PATH directories for this predicate and add a regression case.

### NOTE

**4. Native Windows doctor acceptance remains incomplete.**  
`docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:52`  
`docs/reviews/pi-cmd-launch-2026-10-11/builder-report-3.md:14`

The plan requires `doctor-runtime` to pass on Windows. The builder explicitly records its failure. The final brief correctly names the three different files that passed.

The session’s “all three lane files” wording is ambiguous against that original acceptance list.

**Smallest fix:** name the three passing files in the session entry and retain native doctor testing as unfinished evidence. Injected Windows doctor tests pass locally; that is not native Windows acceptance.

### Requirements and documentation

All nine requested rows contain exactly one `shall`.

- **R-1033:** cited tests cover PATH/PATHEXT ordering, case, cwd exclusion, filtering and absence. The directory test injects `false`; it does not exercise actual filesystem directory rejection.
- **R-1034:** exact quoting is pinned at helper level; installer and doctor tests establish use of the launcher.
- **R-1035:** citations cover refused path characters, trailing-backslash arguments, installer refusal and doctor severity. The seat acceptance additionally checks argument characters.
- **R-1036:** cited tests cover Windows spawn failure and nonzero status. Existing POSIX tests should also appear in its evidence.
- **R-1039:** helper and installer tests cover direct execution and exemption from shim refusal.
- **R-952/R-1037:** tests cover valid stdout, invalid probe results, ignored stderr and the shared hint.
- **R-105/R-1038:** tests cover missing executables, conservative word handling, internal commands and ordinary failed checks.

The READMEs appropriately declare supported Windows entry points, shim refusal and conservative post-edit classification. HANDOFF carries the principal Windows limits. The POSIX exception and native doctor evidence need the qualifications above.

### Verification

Independently ran:

- Seat acceptance: **87/87**
- Command-helper tests: **40 passed**
- Doctor-runtime tests: **20 passed**
- Post-edit-status tests: **30 passed**
- Test-title preservation: **0 gaps**
- Code-map check: **0 problems**
- README check: **639 claims, 0 problems**

These runs were on macOS. I did not rerun the full suite or native Windows integration. I did not run `seat-mutate.py`, invoke real `pi install`, or modify the checkout.

VERDICT: SEND-BACK
