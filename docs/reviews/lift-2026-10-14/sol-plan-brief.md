# Plan review — the lift, 2026-10-14 (gpt-5.6-sol; gate lane: up to two rounds)

Review the change declaration `docs/reviews/lift-2026-10-14/CHANGE.md` on `feat/lift` (based on main `d9cf0bc`, the
tree lane landed). Nothing is built yet. Read its final "Seat revision" sections: they fold in two fact-checks.

The owner's ruling, 2026-10-14: "Lift is the tool that enables better regroup, but this is a core feature for nana,
understanding existing repo and turn into feature trees, then development really becomes feature oriented". The queue:
the lift (this lane) applies a grouping to a project's flat requirements ledger and proves every row survives
unchanged; the regroup (a later lane) has an agent propose a feature tree that the owner approves and this tool applies.

Threat model (§1): honest variation in our tools' output and our users' files in scope — CRLF, a BOM, UTF-16 and ANSI
bytes from Windows PowerShell 5.1, padded tables, headless table fragments, repeated section labels, uncommitted edits
in any worktree, a staged-only or untracked ledger, a project in a subfolder, a hand-built partial tree,
`core.autocrlf=true`, Bash or PowerShell; deliberate forgery out. Lane class: gate (it rewrites another project's
contract file). The review standard pi-review appends governs the bar and the verdict line.

Evidence in the folder: `research-code.md`, `research-ledgers.md` (real flat ledgers on this Mac, characterised from
copies), `research-design.md`, `factcheck-repo.md`, `factcheck-external.md` (both against draft 1).

Check: (1) the proof is independent of the writer and would catch a lost, duplicated, changed, reordered or moved row,
a lost prose or blank line, and a default-builder placement bug; (2) `--write` can never write a ledger that differs
from what was proved, or one with uncommitted edits anywhere in the repo's worktrees; (3) the default mapping's rules
are deterministic on the real ledgers described, and every ambiguous shape is refused, named; (4) one mapping format
serves the default and a later agent-proposed regroup, including a ledger that already has a tree; (5) rows
R-1162–R-1169 are each pinned by named tests and every "wrong code first" pair reds what it names; (6) scope is the
smallest that does the job; (7) any MUST under the standard.
