# win-claude-skills — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds up under probing. I checked it on a temporary clone of main 32d6aa8b with a temporary home and forced win32, and nothing was written to the repository, worktrees or the real home. Its setup library is identical to the current main, 27fb9d3c. The main/candidate pairs below show "main X, candidate Y".

Probes:
- Fresh install. Main prints "skipped (win32)" for each of the four and doctor prints "·" for each. The candidate copies all five with the marker, and doctor marks all five ✓.
- Owner folder at spec and py-test. Install, --dry-run and doctor all exit 0 on main. On the candidate all three exit 1 with the move fix, and the folder stays byte-identical.
- Captured legacy spec. Main leaves it in place. The candidate moves it to the dated backup and mirrors the pack's spec, and doctor marks it ✓.
- File at requirements and py-test, link to the pack at spec. On main, doctor reads "copy is stale … re-run" for the file and "·" for the link. The candidate reads ✗ with the regular-file detail and the symlink-or-junction detail.
- Stale copy, backup and owner-added file across all five skills behave as the R-938, R-388 and R-359 rows say on the candidate.
- On macOS, only four existing checks go red under the candidate: one in skills-and-standards and three in retired-artifacts. They become five once the note list changes and the R-1081 pin goes red.
- I ran 18 more test files that run doctor on both trees. Only their timings differed.
- Wrong code M5 turns R-1902's case red (install exits 1). Wrong code M9 turns R-1761, R-1762 and R-1763 red only with the extended stale-copies fixtures. With the old fixtures the skip survives, so the fixture extension is required.
- pi reads no Claude skills folder, so copies on Windows create no duplicate skills in pi.
- The Windows CI log shows Node's lstat reports a junction as a symbolic link. The check "win32 dir link: the link itself is left exactly as it was" passes there. The plan's second "inferred" claim is therefore confirmed.

Amendments:
1. waitFor. install-pins landed while I was planning; main is now 27fb9d3c. Build from it. There is no wait, hard or soft.
2. Rows. R-669 also cites "win32 install leaves the unrecognized skill owner directory unchanged", which the R-1901 block replaces. The plan's rows-changed list missed this, so R-669 must drop that cite or the trace check fails.
3. Brief, Done. It told the builder to run the full suite. Builders run single files only, so the full suite, install check, mutation runner and CI legs are the seat's job.
4. Brief, step 6. It rewrote the alternate-home win32 branch. That check stays true: I probed the same install under forced win32 and it exits 0, retires only in the selected home and leaves the default flag. "Edit only tests made false" means it is left alone. The brief now names the exact Windows-only checks that flip.
5. Brief, step 7. The install.test.mjs win32 branch becomes an R-351 check without the R-665 marker, because R-665 now excludes win32.
6. Known limits and seat notes:
   - An owner's junction to the pack's own skill folder is refused. This matches R-352, although a junction would follow a pull better than a copy.
   - Windows uninstall is unsupported, so the copies stay.
   - The first session after pulling names the four skills as missing until install runs.
   - R-1903 closes the Windows plain-file half of the "Doctor's skill advice" residual in HANDOFF.

I found nothing that writes outside the lane worktree. The class is right: the lane changes install, doctor and the stale-copies checker that the adoption hook runs.

File conflicts:
- readme-windows-checklist, now building, touches different hunks of the setup README, install-check-config.mjs and install-check.test.mjs. It also touches the shared REQUIREMENTS.md, code map and tree. Whichever lands second merges main and regenerates the map and tree.
- win-hook-settings-repair may touch doctor.mjs or bin/stale-copies.mjs in different functions. I infer this; I have not read its plan.

Files the build touches:
- packages/nana-setup/lib/steps.mjs
- packages/nana-setup/lib/doctor.mjs
- packages/nana-setup/bin/stale-copies.mjs
- packages/nana-setup/lib/install-check-config.mjs
- packages/nana-setup/tests/skills-and-standards.test.mjs
- packages/nana-setup/tests/retired-artifacts.test.mjs
- packages/nana-setup/tests/install.test.mjs
- packages/nana-setup/tests/stale-copies.test.mjs
- packages/nana-setup/tests/state-manifest.test.mjs
- packages/nana-setup/tests/install-check.test.mjs
- packages/nana-setup/README.md
- REQUIREMENTS.md
- docs/code-map.md
- docs/requirements-tree.md

Most likely wrong: the list of 13 checks that run only on Windows and flip. I built it by reading every win32 branch in the 26 files that name the four skills and in the tests that run doctor, but never ran it on Windows. A missed branch would show up as a red check on the lane's Windows CI leg, not as a product defect.
