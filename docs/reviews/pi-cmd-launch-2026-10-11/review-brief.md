# Review — the pi seat installs on Windows, 2026-10-11 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff 0110601..HEAD` on `feat/pi-cmd-launch` (current `main`, `c505601`, is merged in; the
main side of that merge is already reviewed — judge this lane's own changes). Threat model: honest
variation in what a Windows machine has on PATH, in PATHEXT and in folder names is in scope; a hostile
local user who plants files to subvert install is out (Jake, 2026-10-11). Lane class: small (no gate,
ledger or cross-repo format). Records: the plan (`CHANGE.md`; sol plan r1–r5, LAND 10/10 at r5, with
two seat amendments from the first Windows run), three builds (`build-brief-1..3.md`, builder reports),
the Windows CI runs on draft PR #2 (the last builder run: `win-command`, `pi-registration` and
`post-edit-status` PASS on Windows), the seat's acceptance script (`seat-verify-wincmd.mjs`, 87/87),
title check (0 gaps) and mutation runner (`seat-mutate.py`, 18/18 red — do NOT run it: it rewrites
files), and the seat's `HANDOFF.md` lines and session entry, written for the merged state.

Check: (1) `packages/nana-pack/lib/win-command.mjs` (`findOnPath`, `findPi`, `winCommand`,
`cmdCouldNotRun`) against CHANGE §2–§3 and rows R-1033–R-1039, R-952, R-105; (2) `stepPiRegister` in
`packages/nana-setup/lib/steps.mjs`, doctor's pi row in `lib/doctor.mjs`, and post-edit's `classify`
— a found-but-broken pi is a problem on every platform; nothing runs a real `pi install` in tests;
(3) each row has one `shall` and the clause each cited test pins; (4) the READMEs' Windows wording;
(5) the HANDOFF lines and session entry are true; (6) anything that should block the merge. Rare cases
are residuals. Answer with the full review: MUST / SHOULD / NOTE with file:line, evidence and the
smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
