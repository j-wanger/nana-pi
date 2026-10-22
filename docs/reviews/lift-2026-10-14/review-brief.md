# Review — the lift, 2026-10-15 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff d9cf0bc..HEAD` on `feat/lift` (main `d9cf0bc`). The owner's ruling, 2026-10-14: "Lift is the tool that
enables better regroup, but this is a core feature for nana, understanding existing repo and turn into feature trees,
then development really becomes feature oriented". The lift applies a grouping to a project's requirements ledger and
proves every row and line survives; the regroup lane will apply an agent-proposed, owner-approved grouping through it.
Threat model (CHANGE.md §1): honest variation in our tools' output and our users' files in scope — CRLF, BOM, UTF-16
and ANSI bytes, padded or headless tables, owner tables and sections, repeated labels, uncommitted edits in any
worktree, a project in a subfolder, a tree-form ledger, Bash or PowerShell; deliberate forgery out. Lane class: gate
(it rewrites another project's contract file). The review standard pi-review appends governs the bar and the verdict.

Records in `docs/reviews/lift-2026-10-14/`: the plan `CHANGE.md` (three research reads, two fact-checks, two seat
revisions; sol plan r1 and r2 SEND-BACK, r3 LAND), six build briefs for Claude Sonnet 5 and the seat's checks between
them (`seat-verify-202a660.md`, `-0dc5d1d.md`, `-9eadde0.md`, `-f6b34d4.md`). Builds 3–5 answered independent checks
that found the proof trusting the grouping for its line regions; build 4 replaced that with a count of every non-blank
input line derived from the input alone. The last independent check (`seat-verify-f6b34d4.md`) fuzzed about 2,400
default lifts and regroups with no line or row lost, duplicated, changed or invented, and the four real-ledger copies
came out byte-identical; build 6 then closed its three small items. Nineteen secondary checks have no test of their own
and were judged covered by pinned checks (`seat-verify-9eadde0.md`). The seat's acceptance passes 136/136 at the tip
(read `acceptance-output.txt`); the title check prints 0 missing; the seat's mutation runner caught 73 of 73 code breaks
at `54fd34f` (`seat-mutate-output.txt`; do not run it). Draft PR #11's CI run 38811137656 at `54fd34f`: macOS suite 144
files, 0 failed; both install-check jobs green; on the non-blocking Windows leg `requirements-lift.test.mjs` passes
49/49 and the leg fails the same files as main. Also `HANDOFF.md` and the session entry, which record the nine-hour
builder stall and the probe rule that followed.

Check: (1) `--write` and `--verify` can never exit 0 when an input line or row is lost, duplicated, changed or invented,
for a default lift or a supplied grouping, flat or tree-form input; (2) `--write` writes only proved bytes, only when
the ledger and grouping match HEAD in every worktree; (3) the default grouping's placement is derived from the input
alone and the reserved engineering nodes hold only G rows; (4) refusals name every problem and never crash; (5) rows
R-1162–R-1169 are each pinned by their cited tests; (6) the requirements skill tells both seats the dry run, the
owner's yes and the write, and promises nothing the tool lacks; (7) HANDOFF and the session entry are true; (8) any
MUST under the standard.
