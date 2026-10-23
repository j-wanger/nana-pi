# FEAT-008 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Land rule: the helper checks that every recorded verdict is LAND, not who reviewed; the round records are a plain file; a narrow review counts for everything up to its revision; a direct commit to main bypasses it (the working pattern forbids that). Every revision reviewed before the land rule needs a fresh review.
- Lane cleanup (deliverable-fields land): when the lane branch's pushed copy lags its tip, cleanup removes the worktree, then git refuses to delete the branch as not fully merged. A rerun then refuses for lack of a worktree. The seat pushed the branch and deleted it with `git branch -d`.
- Land record (audit re-check, 2026-10-22): a land writes no ledger line of its own; only the locked suite's land record in the clone shows it.
- Land reads CI (land-reads-ci): the run conclusion decides, so a continue-on-error job can fail and the land still passes. Today only the Linux suite leg does this (R-1531).
- Land reads CI (land-reads-ci): only GitHub Actions runs on github.com are read. Commit statuses, other apps' check runs and Enterprise hosts are not.
- Land reads CI (land-reads-ci): the strict origin pattern skips CI, with its note, for an ssh host alias, an upper-case host or a URL with credentials.
- Land reads CI (land-reads-ci): a lane that deletes every workflow is not held by CI, and the note says so. A lane that adds the first workflow is held by its own run.
- Land reads CI (land-reads-ci): a pull-request run tests the tip merged with origin main as of its trigger; nana-land does not check that base.
- Land reads CI (land-reads-ci): CI is read once, before the suite, so a new attempt started during the suite is not seen.
- Land reads CI (land-reads-ci): a workflow that never ran on the tip, through path filters or push-only triggers, is not required.
- Land reads CI (land-reads-ci): the latest attempt wins, so a real failure that passes on a re-run lands.
- Land reads CI (land-reads-ci): only the newest 100 runs of one tip are read.
- Land reads CI (land-reads-ci): the push run on main comes after the land; a flake there holds the template release until someone re-runs it (R-597).
- Land reads CI (land-reads-ci): dynamic workflows, such as a code-scanning default setup, run on pull-request heads and would be judged.
- Land reads CI (land-reads-ci): a fork-based origin holds no pull-request runs, so the land refuses as "no CI run".
- Land reads CI (land-reads-ci): removing `origin` locally skips the read, with the note.
- Land reads CI (land-reads-ci): the fake-gh command case runs only off Windows; the Windows leg runs the real spawn only through the no-gh case.
- Land reads CI (land-reads-ci): doctor does not report gh or its sign-in, so a seat learns of a missing gh at its first land.
- Land reads CI (land-reads-ci): each land waits for its tip's CI, about 21 minutes after the last push. A cancelled run must be re-run first. Consecutive lands sit about one CI run apart, because each later lane merges main. During a GitHub outage nothing lands.
- Land reads CI (land-reads-ci, independent check): a workflow whose jobs are all skipped by `if:` ends `completed/skipped`, so its repository would refuse every land, and a re-run does not help. No workflow here has one.
- Land reads CI (land-reads-ci, independent check): an `action_required` run gets the catch-all "fix the workflow result, then run it again", where it needs the run approved. "CI response is not a workflow-run list" names no remedy.
- Land reads CI (land-reads-ci, independent check): the time-out check also calls a kill at the output limit "timed out". A run whose name is null fails the whole list.
