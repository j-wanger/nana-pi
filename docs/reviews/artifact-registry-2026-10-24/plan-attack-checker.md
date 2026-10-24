MUST
1. The two-link binding is weaker than R-2743, which the brief said must not happen. Today a claim must name the store's own writer (deliverables.mjs:231 `codePaths.includes(local.writer)`). The plan's R-2783 asks only that the claim share one writer with the entry. R-2743 then asks only that the entry include the table's writer. Concrete case: R-2547 lists both test-locked.mjs and test.mjs (REQUIREMENTS.md:2023), so A-033 will carry both. Then `Made by: R-616 · suite: scripts/test.mjs · A-033` passes both links and takes the suite-records age. The same line with `· suite-runs` gets a note today. This weakening starts in L1, because L1's lookup checks the entry's run and writer, not the claim's. Fix: in R-2783, the claim's code paths must include every writer of the entry. An entry at an age-table location must carry exactly the table's writer. L1 maps an entry to an old map name only when its location is that store's own file.
2. The `CI record` class has no location shape ("upload or workflow-run name"). So `CI record: docs/new.md` passes R-2781, and passes R-2782 as long as its writer is tracked. That defeats the brief's rule that an untracked repo path still fails. Fix: give it the shape `ci: <tracked .github/workflows/*.yml path>#<name with no "/">`. Narrow `git ref` to `refs/heads/…` or `refs/tags/…`.

SHOULD
3. §3 says old-style path third parts stay legal for other projects, but R-2788's three states have no way to show one. The R-2542 test expects R-5000's `· REQUIREMENTS.md` to show no "no artifact named" (product-report.test.mjs:1210,1243). The R-2544 fixtures use plain paths (productLedger :109-120). Fix: add a fourth state, "artifact <path> · <age>", and keep the R-2544 fixtures unchanged as its pin. The alternative is to retire old-style paths everywhere, with a note.
4. R-2784 does not "block" old-style paths in this repo. It skips parked rows (19 of them) and any second claim. Fix: every Made-by third part in this ledger must be a registry reference or a `built from:` list. Red: a parked R-509 that keeps its path passes.
5. A stale location passes silently in every class that is not `tracked`, and honest drift is in scope. The likely next change is moving the review tally to pi's active agent dir; today its path is fixed in ledgerPaths, review-round.mjs:102-113. Fix: build the clone-store table keys from the imported constants: DATA_SUBPATH (runtime-map-config.mjs:42), STORE_SUBPATH (suite-records-config.mjs:20) and BUILD_RECORDS_SUBPATH (build-records-config.mjs:11), and pin that in a test. For the home, other-project, ref and CI classes, state the gap as a §7 residual and a known-bug line.
6. Where the table lives: a table that holds both writers and readers cannot sit in product-report.mjs, because the checker would then need it, and product-report.mjs already imports deliverables.mjs (:16), so that is a cycle. Split it: location → {run, writer} in deliverables.mjs, and location → reader in product-report.mjs.
7. A ledger with registry lines but no deliverables prints nothing in `--check` or `--write`. The gate at requirements-tree.mjs:586 and the count-line condition at deliverables.mjs:298 key on deliverable lines only. That breaks R-2538's "in every mode", which the plan cites as covering registry notes. Fix: count `Artifact:`, `Reads:` and `Writes:` lines toward the gate.
8. R-2730's control fixture only proves that a Parked note reaches deliverableReportLines (requirements-deliverables.test.mjs:292-299). If registry checks are not wired into that function, R-2730 passes on a broken registry. Fix: add a malformed `Artifact:` line and a dangling `· A-999` to the control.
9. The frozen-desk claims are `manual: desk frozen` (REQUIREMENTS.md:1886-1898), and MAKER_RUNS, pinned at requirements-deliverables.test.mjs:157, has no run for the long-running desk. Run-equality then forces either false `manual` entries or a red R-2730. Fix: the L1 table gives each entry's run and writers. Desk entries take `manual: desk frozen since 2026-10-10; <path> writes it`, stated as a residual.
10. The plan leaves out several existing tests it breaks:
   - The R-2537 test imports RUNTIME_MAP_ARTIFACT (:26) and pins it (:161). If L2 deletes it, every check in requirements-deliverables.test.mjs fails at import.
   - In "R-2743: a machine-local artifact passes only under its own maker kind and writer path…", the repository clause (:252) passes vacuously after L1's migration.
   - productLedger, with the old names, feeds the tests for R-2544, R-2545, R-2744 and R-2745. These are test rewrites, not text-only changes.
   - The R-2542 test pins `NO_ARTIFACT_NAMED === "no artifact named"` (:1255).
   - R-2538's copied-CLI file list (requirements-tree.test.mjs:410-413) must gain any new import of deliverables.mjs.
   - SKILL.md:127,129 and the pack README:30 name the three machine-local names, so L2 must edit them too.
11. R-2789's red case, "the page differs after a store file is changed", invites a test that writes the real `~/.pi/agent` store, which holds the review tally nana-land reads. Fix: set HOME and USERPROFILE to a temp folder, and also change `.git/nana/product-report.html` in the fixture.
12. Glob rules:
   - The new glob matcher copies apps/bench/lib/checkers.mjs:89 `globMatch`. Per the 2026-10-22 ruling, name it as the precedent.
   - Pin posix behaviour: `*` stays within one segment, and `**` is defined or banned.
   - Ban a wildcard first segment, so `*` or `**/x` cannot match the whole tree.
   - Ban folders and globs as registry writers. Today trackedAtHead accepts folders (brief-precedent.mjs:65-69).

NOTE
13. Claims with several IDs (R-1008, R-301) do not fit the single `artifact` string (deliverables.mjs:104, product-report.mjs:689). In L1 the page shows one age, so "page code stays as it is" is not quite true.
14. A reused A-ID is only a note. The CLI still exits 0 (requirements-tree.mjs:625), and only R-2730 catches it, in this repo. The plan should say which entry a duplicate ID resolves to.
15. R-2730's runner also lists untracked files git does not ignore (:287-291). So R-2782's "at HEAD" passes locally on an uncommitted file, and only CI catches it.
16. R-2783's red cases should include `built from: A-003`. Today that third part goes to the path check and gets a note (deliverables.mjs:228-231).
17. Citations are slightly off: the runtime-map case is at :87 and :112, and `tree()` is at :45.
18. On CI the home stores are never read, so CI and the owner's machine get the same notes. That claim holds against the code.

Must-meet tests to add or change
- R-2783: `suite: scripts/test.mjs · A-033`, where A-033's writers are test-locked.mjs and test.mjs, gets one note naming A-033.
- R-2743: each age-table key equals `<git common dir>/` plus the imported subpath constant. An entry at a table location with an extra writer gets one note.
- R-2781: `CI record: docs/new.md` gets one note, and `git ref: docs/x` gets one note.
- R-2784: a parked row whose Made-by line keeps a plain path third part gets one note.
- R-2538: a ledger with only a malformed `Artifact:` line prints that note in `--root`, `--write` and `--check`, and exits 0.
- R-2730: the control ledger yields exactly two registry notes, the malformed line and the `A-999` reference, through deliverableReportLines.
- R-2544: an unregistered path third part in another project still shows its git age.
- R-2789: with HOME and USERPROFILE at a temp folder, changing a store there and the land page leaves the report byte-identical.
- Glob: `docs/reviews/*/x.txt` does not match `docs/reviews/a/b/x.txt`, and a `*`, `**/x` or `\` location gets one note.
- R-2785: an `Artifact:` line under a capability with no `Kind:` renders no `Artifacts:` line.