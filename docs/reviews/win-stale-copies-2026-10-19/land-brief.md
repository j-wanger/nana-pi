# Review — win-stale-copies (each session start names nana's stale installed copies), 2026-10-19 (Fable, the land reviewer)

Review `git diff a1d07f6..HEAD` on `feat/win-stale-copies` (`git merge-base HEAD main` is `a1d07f6`, the main the lane
last merged, in e99866d; main was `8482c2e` when this brief was written). The plan of record is
`docs/reviews/win-stale-copies-2026-10-19/must-meet.md`: R-1600 to R-1605, as amended by `plan-attack.md`, and R-1606
from `build-brief-2.md`. `build-brief-1.md`, `build-brief-1b.md` and `build-brief-2.md` are the three builds; build 2
answered CI run 39298597308, where the hook spoke in a home nana-setup never installed. The seat's record is
`seat-verify-e99866d.md`: CI run 39304726763 (0 failing of 158 files on macOS, Ubuntu and Windows; the Windows log
`ci-windows-run-2.log` beside it), the wrong-code pairs (`seat-mutate.mjs`, outputs beside it: 15 of 15 red on
defdeda, 17 of 18 on e99866d, M18 a benign survivor) and the independent check (`independent-check-e99866d.md`, HOLDS,
run on defdeda before build 2). The tree movement is in `review-brief.md`: FEAT-015 gains R-1600 to R-1606, all
implemented.

The code under review: `packages/nana-setup/lib/stale-copies.mjs`, `lib/stale-copies-config.mjs` and
`bin/stale-copies.mjs` (new), the `stale-copies` launcher in `lib/hook-producer.mjs`, its call in
`claude/hooks/nana-adoption.mjs`, the `linkOk` move out of `lib/doctor.mjs`, and the stale section in
`packages/nana-pack/extensions/nana-rulings.ts`, which now imports two nana-setup modules. Judge whether the lane fails
open or leaves a harm the review standard lists: a broken install or hook, data lost or corrupted, or a test writing
outside the lane worktree or the temp folder. Judge also whether anything main does today stopped working: the
adoption hook's output and exit on every install and on a home nana-setup never touched, the rulings block in every pi
session, and doctor's rows.

Threat model: honest variation in our tools' output and the OS is in scope (POSIX links versus Windows copies, a rule
or skill shipped after the last install, a byte-equal file on POSIX, `NANA_SETUP_PLATFORM`, a home where nana-setup
never ran); deliberate forgery is out. Lane class: install and hook.

Check: (1) the checks for R-1600, R-1602, R-1603 and R-1604 fail on the code before the lane, and those for R-1601,
R-1605 and R-1606, which guard silence and pass on main by design, each fail under the wrong code they name; (2) no fail-open: a failed checker, an
unreadable settings file or an unreadable copy never costs the adoption output, the hook's exit 0 or the rulings block,
and the silent cases are the ones the rows name; (3) no regression on macOS or Windows in the adoption hook, doctor or
the rulings extension; (4) HANDOFF and the session entry are true; (5) any MUST.
