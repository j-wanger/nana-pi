Feature: FEAT-006 · Launch builders with execution limits

# Review brief 2: helper-start (confirmation)

Review round 1 sent back build 1 with two MUSTs and three SHOULDs. Review only the change since that round: `git diff 95138872 f42b9204` (five commits), plus the merge of main `03c26f7a`, which should add nothing beyond main's own content (`git diff --name-only main HEAD` equals `git diff --name-only main...HEAD`; the seat checked it).

What each commit answers:
- M1 `8c0e1dec`: regenerated the requirement outline; `node scripts/requirements-tree.mjs --check` exits 0.
- M2 `087112e8`: each pi attempt's explicit session file is now flat in the lane's session folder under a unique pi-style name, so the bench's anatomy reader and the build-usage reader both work unchanged. The builder ran the bench `segment` command on a temp folder with one old and one new file: both found and matched.
- S1 `34e237cb`: the read pointer appears only when the known-bug file exists; otherwise "No known bugs…".
- S2 `9178c265`: R-3212 and R-3213 restored for direct digest and Claude Code delivery.
- S3 `f42b9204`: AGENTS.md and the shared template state that launcher-role children get no objective block.

Questions: does each answer close its finding without a new problem, and does the flat session name stay unique across attempts and machines?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
