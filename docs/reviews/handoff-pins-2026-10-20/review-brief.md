# Review — handoff-pins (tests pin eight untested promises of the pi seat's compaction handoff), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Review `git diff 385c633f..HEAD` on `feat/handoff-pins` (`git merge-base HEAD main` is `385c633f`; main has since moved
to `445f4d5b` with the ci-suite-timeout and knowledge-index-pins lands, which this lane has not merged). The plan of
record is `docs/reviews/handoff-pins-2026-10-20/must-meet.md` with the adversary's `plan-attack.md`: eight existing
rows, R-244, R-830, R-138, R-807, R-189, R-248, R-880 and R-245, and no new row (R-2100 to R-2109 stay unused). The
builder's wrong-code record is `builder-mutations.md`. The seat's record `seat-verify-a792e7b6.md` holds CI, with the
Windows log `ci-windows-a792e7b6.log` beside it.

Tree movement (`requirements-moved --base main`): 8 rows in 1 feature, none added. FEAT-002: R-138, R-189, R-244,
R-245, R-248, R-807, R-830 and R-880, each untested -> implemented.

Judge whether each of the eight new checks fails when its row's promise breaks, on macOS, Linux and Windows, and
whether the product-report fixture fix keeps R-1024's check honest without weakening it.

Threat model: honest variation in our tools' output and the OS in scope (macOS, Linux and Windows on Node 22; a marker
typed in another case or with a stray space; an absolute agent folder; a `handoff.path` in upper case or reached
through a folder link or junction); deliberate forgery out, such as a link swapped between the check and the open.
The symlink refusal is advisory by design. Lane class: ordinary — five handoff test files, one product-report fixture
fix, the rows and the map; no extension, install, hook, gate or land-tool code.

Check: (1) each of the eight must-meet checks matches its row and is not vacuous (each title's assertions fail under
the wrong versions `must-meet.md` names); (2) R-807's loop covers unset and every listed non-`off` value for both
write and pickup; (3) the R-189 check compares the injected text with the body's first 8000 UTF-16 units after the
Source and Provenance lines, and tests the default store, not a leftover custom path; (4) the product-report change
touches only the fixture's own ledger copy (FEAT-002's rows set to implemented, then one set to untested, as the
planned-own-row block beside it does for FEAT-039), changes no check or marker, and leaves R-1024's check able to fail; (5) no test writes outside the temp folders it owns, and every link, junction and changed
environment variable is restored in a finally; (6) the eight rows' text is unchanged and each cites only its new
check; (7) nothing else changed (no extension, lib or script code); (8) HANDOFF and the session entry are true;
(9) any MUST.
