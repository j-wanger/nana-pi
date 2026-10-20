# pi-probe-timeout — plan attack (one adversary)

Verdict: AMEND

AMEND. The relay design holds. I checked the simpler designs first: a detached spawnSync plus a later group kill works on macOS. Probe: the leftover process died. It fails on Windows, because the cmd.exe root is gone before taskkill can walk its tree, and the owner's Ctrl-C would no longer reach pi. Red today is confirmed. Probe: a dry run against a hung --version was still waiting at 4 s, and only killing the fake pi freed it.

Amendments, with evidence:
1. R-2026 must send each of its three signals in a separate run. Probe: a relay with only SIGINT and SIGTERM handlers left both fake-pi processes alive after a group SIGHUP. A SIGINT-only check passes that wrong code.
2. The fake pi now starts its own child node, following the post-edit-hardening fixture, and the sh wrapper ends with `exit $?`. This gives a grandchild on every platform and shell, so wrong code 1 cannot pass when a shell execs node. R-2023 also covers the hung `pi install` case, which its row names, and it fails unless every level recorded a pid.
3. Drop windowsHide on the relay and on pi; taskkill keeps it. Today's launch passes none. Inferred from libuv source, not run: windowsHide with piped stdio sets CREATE_NO_WINDOW, which takes the launch off the owner's console, so Ctrl-C would stop reaching it. The plan's win32 SKIP reason for R-2026 ("Ctrl-C reaches pi directly") would then be false.
4. The relay calls process.exit after it reports, so a pi stuck in uninterruptible sleep cannot hold it. The setup README's own refresh note says spawnSync keeps waiting for such a child. The relay's ETIMEDOUT message names no limit, so wrong code 3 stays red.
5. The plan missed `npm run req:tree`. requirements-tree.test.mjs fails when docs/requirements-tree.md is stale, so that file joins the file list.
6. R-2024's row no longer names a test seam ("WHILE no limit is injected"). It is now a plain "shall" row.
7. The install rows move to FEAT-013 SUB-013 after R-1036, beside the pi launch and version-probe rows. SUB-014 holds the preview and file-preservation rows.
8. R-2022 builds its expected folder from paths.mjs's repoRoot, because setup-checkout-spelling changes that spelling.
9. README gets a test-table row placed after pi-registration. Nothing goes in Known limits, where setup-checkout-spelling appends after line 276.
10. Corrected arithmetic: two package roots give 30 + 2 × 120 = 270 s, still under the install check's 300 s bound.

Conflicts: I checked all three in-flight worktrees against their merge base. No hunk overlaps when the placement rules are followed. The lane class is right: it changes install and doctor.
