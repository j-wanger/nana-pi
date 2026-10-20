# gate-rm-bare-repo — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds. The plan's tests let four wrong versions pass, so each test gets one or more cases. The rows stay in R-2240 to R-2243, and only R-2242's text changes.

Probes ran in a temp copy of main 6f0098a8 with a temp HOME. The gate files there are byte-identical to c7f582ad.
- Red today: on main's module, R-2240 and R-2241 FAIL with every case ALLOW headless and 0 dialogs. R-2242 and R-2243 are guard pins and PASS.
- Prototype fix (the plan's design): all 11 checks PASS. gate-corpus, gate-survives-mutation, gate-status and config-gate-fallback each showed 0 FAIL.

Wrong versions that passed every plan check (probed). Each now fails an amended case:
- W13, `.git` tested after the shape at each level. Now red on R-2242's new case, a git work tree whose top also holds HEAD, objects and refs. This also makes R-2241's "up to and including" no wider than its test.
- W14, the walk capped at two levels. Now red on R-2241's new case, cwd `proj.git/refs/heads` with `rm -rf topic`.
- W15, the step-5 shape test on the first part only. Now red on R-2240's new case, `repos/mirror.git/objects`.
- W16, the walk testing HEAD alone. Now red on R-2243, which now uses every look-alike as the cwd as well as the target. That also matches its row, which already said "a target or the session working directory".

W17, a `.git` stop only when `.git` is a folder, was already red on the plan's R-2242. W3/W4 and W7/W8 also died on the plan's tests. W8 and W7 were probed red; W3 and W4 were not probed here.

The brief adds `-c commit.gpgsign=false`, as the other pack tests that spawn git do. The test already points HOME and USERPROFILE at a temp folder, so git reads no global config.

Lane class is right: install, hook or gate, because the gate policy changes in the nana-gate extension's lib. A simpler design does not exist. Spawning git is heavier and can be missing. A target-only check leaves `vault/objects` and the cwd cases open.

Conflicts:
- Main moved to 6f0098a8 when notify-lifecycle-pins landed, so the builder should branch from 6f0098a8 or newer.
- REQUIREMENTS.md: in-flight hunks sit near lines 187, 832, 858, 1135, 1312, 1831 and 1932. This lane inserts near line 702, after R-1496 and before R-195.
- Pack README: the in-flight hunks sit near lines 105, 458 and 782. This lane edits the exemption paragraph near lines 621 to 642.
- realpath-strict-fallback changes only the behavior of realPath with mustExist, and the gate calls it without that flag.
- The generated docs are regenerated on merge.
- This slate: pack-config-utf16 may add FEAT-011 rows two lines below this lane's insertion. That would at worst be a trivial textual conflict. This is inferred: its plan is unseen and its worktree does not exist yet.
- waitFor is none.

Probe hygiene: one probe command copied a file into an existing /tmp/x folder by mistake. I byte-compared it and removed only that file. The temp copy is deleted, no gate-rm-inside temp roots remain, and no probe process is running.

Claim most likely wrong: that every row passes unchanged on the Windows CI leg with no skip. Three parts are inferred:
- Git for Windows makes the same lstat shape: HEAD a file, objects and refs folders, a `.git` file in the worktree, and a hidden `.git` folder that lstat still sees for the `both` case.
- The walk up from the runner's short-name temp path meets no EPERM.
- tmpDir's exit hook removes git's read-only object files, and it ignores errors anyway.
