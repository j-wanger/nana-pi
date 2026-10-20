# post-edit-values-named — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan is sound: all six checks are red today on behaviour, each wrong version turns only its own check red, the class is right and the files do not conflict. I probed it in a temp clone of 07f8f6f9 with a temp HOME and touched no repo. Four amendments:
1. Base moved. post-edit-timeout-name has LANDED, so main is 07f8f6f9 (fast-forward) and its worktree and branch are gone. The build branches from main and waits on nothing. The plan's "branch from the 07f8f6f9 tip, land after post-edit-timeout-name" no longer applies.
2. A probe disproves the feature claim for the kill grace. Its promise is "retuning … changes the check's behaviour with no other code change". With the config grace set to 6000 (extension built), post-edit-hardening goes red on four checks, a, b, c and f, because their settle bounds are a literal `ms < 6000`. Amendment: hardening imports POST_EDIT_KILL_GRACE_MS, and those four checks use `SETTLE_BOUND_MS = POST_EDIT_KILL_GRACE_MS + 4000`. That bound is still 6000 at today's grace. Re-probed: grace 6000 gives 22 PASS, and grace 2000 gives 22 PASS. The standard requires this too: every other assertion imports the name.
3. R-2211's row says "UTF-16 code units", but the planned output was pure ASCII, so the test could not tell units from code points or bytes. Amendment: the overflow output starts with one emoji. Probe: a cut counted in code points (`Array.from(out).slice(0, cap)`) now turns R-2211 red and nothing else. With ASCII it would pass.
4. Brief detail: write one user config once, with one command per case matched by the case file's name. This replaces rewriting the config between runs, and it is what I probed.
What I confirmed:
- Base: 6/6 FAIL. Build: 6/6 PASS in 0.5 s.
- Wg, Wo, Wo2, Wf, Wf2, Wc, Wc2, Wl, Wl2 and Ws1–Ws4 each give exactly 1 FAIL, on the named check.
- Wfc (failure cap set to 1999) turns display-surfaces' R-087 check red (180/1), so R-087 does seal the failure cap.
- Blast radius all exit 0: default-timeout 2, status 32, hardening 22, display-surfaces 181, file-queue 5, utf8 4, config-handlers-malformed 99.
- Trace exits 0 with 0 rows off form. The tree check exits 0. The map reports 345 modules and 0 problems. The README check reports 720 claims and 0 problems.
- Two in-flight lanes edit the pack README: mutation-runner-takeover-race near line 458 and realpath-strict-fallback near line 105. This lane edits line 783, so the hunks merge cleanly. No in-flight or slate lane touches the post-edit source, the hardening test or display-surfaces.
- I left no probe processes running and removed the temp folder.
Most likely to be wrong: R-2210's exact timer list [300, grace] on the Windows leg, where taskkill does the kill. I reason that no global setTimeout is armed there, but only Windows CI can prove it. Next is the surrogate carry, which rests on the planner's probe and which I did not re-run.
