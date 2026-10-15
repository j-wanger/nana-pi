## Findings

1. **MUST — The grouping-file worktree boundary remains bypassable.**  
   `scripts/requirements-lift.mjs:827-830` skips a path when `git diff HEAD` is clean or the other worktree’s HEAD does not track it. A realistic older branch can therefore contain an untracked grouping file at the same path.

   Reproduced:
   - Main added and committed `map.json`.
   - A second worktree branched from the commit before `map.json`.
   - That worktree held an untracked `map.json` with owner edits.
   - Main’s `--mapping map.json --write` exited 0 and wrote the stale committed grouping.

   This leaves round 1’s grouping-file MUST open. The command can apply output someone acts on while another worktree contains newer owner grouping edits.

The byte-exact verification, share refusal, staged-removal handling, cross-prefix refusal, and missing-revision handling are closed. The focused lift suite passes 53/53.

VERDICT: SEND-BACK
