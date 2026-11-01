Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Threat model as in `review-brief.md`: honest variation in our tools' output is in scope; deliberate forgery is out.

Confirmation round 2. Review only `git diff 2bda8638..HEAD` on `feat/making-session-end`; round 1 reviewed 2bda8638, and both texts are kept in this folder (`r1-*.md`). The final reviewer said LAND; the land reviewer sent it back for one MUST and two SHOULDs.

The seat's disposition:
- MUST (npm `claude.cmd` on Windows never makes memory): ruled a known bug, not this lane's change. It is the making trigger's plan residual A6, accepted at that land, in the shared model runner `scripts/memory-shape-runners.mjs`, which this lane does not change. Build 3 tried the fix through the shared `winCommand` launcher and stopped: that launcher refuses the JSON-schema argument's double quotes, and widening its cmd.exe quoting is a security-relevant change for its own lane. The native `claude.exe` that Claude Code's Windows installer provides starts through `spawnSync("claude")` today; the owner's Windows machine runs it. The FEAT-040 line now names the quoting cause.
- SHOULD (missing tracking ref fails status): fixed in builds 3 and 4 (`build-brief-3.md`, `build-brief-4.md`); R-3356 widened.
- SHOULD (a disabled repository still starts the detached run): kept as the plan chose (A4); recorded as a FEAT-040 known bug.

Seat record: build 4's touched tests pass (3 files, 97 checks); the mutation runner reads 24 of 24 red; the local install check fails only on the known `pi post-edit` write-error; CI on the tip is the suite.

Question: does the change since 2bda8638 fix the status SHOULD without breaking status, doctor or make, and does it cause a harm the review standard lists? For the land reviewer: does the seat's disposition of the MUST stand under the review standard?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
