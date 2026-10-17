# Review — roster-notice (the builder lineup at session start), 2026-10-16 (gpt-5.6-sol and gpt-6-astra, in parallel)

Review `git diff c514964..HEAD` on `feat/roster-notice` (main `c514964` is merged in). The owner asked that each session
start show the current builder lineup, and chose a lineup the user can change, with the notice saying how. The lane adds
an optional `largerBuilder` roster slot (pi entry or a Claude Code entry limited to sonnet, opus, haiku and fable; default
none), lane mode's `--lane-size small|larger` with two refusals, `nana-roster --json`, a shared working-pattern rule for
larger lanes, and one notice composed once and shown by a Claude Code SessionStart hook and a pi extension (a widget,
never a notify). Threat model: honest variation in our tools' output and users' files in scope (every roster shape and
refusal, BOM and CRLF, agent folders with spaces or " (", a relative agent folder, a home folder ending in a separator,
every hook source and pi reason, no UI, Windows exec forms, older and newer checkouts); deliberate forgery out. Lane
class: format. The review standard pi-review appends governs the bar and the verdict line.

Records in `docs/reviews/roster-notice-2026-10-16/`: the plan `CHANGE.md` (two critiques and two fact-checks before sol's
plan rounds; LAND on round 2; the owner's answers; seat amendment 1), the seat's acceptance (298 cases, written and
attacked before the build; read `acceptance-output.txt`), the title check, two build briefs, the lane's one independent
check (`seat-verify-59db91d.md`), and the seat's mutation runner, now split five ways: 70 of 70 caught
(`seat-mutate-output-633d41b.txt`; do not run it). CI on draft PR #14: install checks green on macOS and Windows; the
suite legs failed only on a seat-script comment since fixed. Also `HANDOFF.md` and the session entry, which also correct
two regroup notes.

Check: (1) the lineup each notice shows is the lineup each seat runs, in both seats, on macOS and Windows; (2) no honest
input crashes, blocks or hangs a session start or a lane launch, or leaks a provider or the absolute home path; (3) each
row R-1190 to R-1215 and each reworded row is pinned by its cited tests; (4) install, uninstall, doctor and the install
check handle the new hook on both platforms; (5) HANDOFF and the session entry are true; (6) any MUST.
