Feature: FEAT-006 · Launch builders with execution limits

# Review brief 3: waking (confirmation of the main merge)

Confirmation round. Round 2 said LAND at `ab56a713`, but the review ledger recorded it against a dirty snapshot (an untracked `.codex/hooks.json` that no lane commit wrote), so `nana-land` cannot verify it. The worktree is now clean. Since `ab56a713` the only change is `fab26f66`, a merge of current main (the landed agents-trim lane) with no conflicts. Review only `git diff ab56a713..HEAD`.

Question: does the merge change anything this lane's hooks, rulings or tests depend on?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
