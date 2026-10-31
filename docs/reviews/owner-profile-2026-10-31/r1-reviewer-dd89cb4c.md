I found no MUST, so the verdict is LAND. I re-ran both profile test files and the seat-guide test in the worktree, and all checks pass. I did not re-run the locked full suite; the seat's record says it passed at 68c22e69, and CI passed on all three systems.

**The checks the brief asked for**

- **Owner text stays out of the public repo.**
  - The tool refuses a profile folder inside the nana-pi checkout or its worktrees, and a push target equal to nana-pi's own.
  - Pushes go only to the address saved at setup, never to whatever `origin` points at later.
  - Error output uses fixed sentences only: git's own error text is read to sort the failure and never printed. An unexpected exception prints the generic git-failed sentence.
  - Every test uses synthetic records with local remotes, so CI logs carry no owner text.
- **The remote check fails closed.** Setup is refused when the push address is not one of the three GitHub forms, when `gh` is missing or fails, when its answer can't be read, or when the repo is not private. The only way past it is the explicit `--unverified-remote` flag, which is saved in the config and announced on every sync.
- **Two clones converge without conflict.** Every save and event is a new file named by time plus 96 random bits, so two machines never write the same path. Sync fetches, rebases, aborts a stopped rebase and retries once. `* -text` turns off line-ending conversion. The convergence test ends with identical bytes in both clones, one of which has `core.autocrlf=true`.
- **The seat cannot climb the trust ladder alone.**
  - Medium trust needs three distinct sessions with distinct quotes.
  - High trust needs a confirmation whose words differ from every stored quote.
  - The tool cannot tell whether new words really came from the owner. The plan accepts this, and it is recorded as a known bug about misattributed quotes.
  - Faking a session ID by hand counts as forgery, which the threat model excludes.
- **The rulings change replaces only the cap sentence.** The 10-16 ruling keeps its other two sentences, and one new 10-31 ruling adds the four-building, two-planning cap. The seat guide, R-1140 and its test change to match.
- **Roster refactor.** The new shared config writer keeps the old behaviour. The old roster-set arguments still fall back to their defaults, and it now refuses a dangling symlink.

**SHOULD**
1. **A concurrent save can be refused instead of waiting.** Save and sync hold the clone lock across fetch, rebase and push. Each git step may take up to 15 seconds, but a second writer waits only 5 seconds. With real GitHub latency, a second save that starts during another's sync can get "profile refused: locked". Nothing is lost silently, because the seat sees the refusal, but the save does not happen. The concurrency test passes only because its remote is a local folder.
2. **Builders and reviewers can still print the profile.** `show` and `sync` skip the role check. Nothing calls `show` automatically today, but a reviewer that ran it would put owner claims in its output, and review output gets committed under docs/reviews. Refusing `show` when `NANA_ROLE` is set would close this before delivery work starts.

**NOTE**
3. Privacy is checked only at setup. A repo made public later is not re-checked. This could be recorded as a residual.
4. The new 10-31 ruling sits above the 10-28 ruling, so the rulings file is out of date order.
5. Without a session variable, the session key falls back to the local date while the record's date is UTC. The session key and the record's date can disagree near midnight. Whether Claude Code sets `CLAUDE_SESSION_ID` in Bash is still unverified, as the config comment says.
6. The "locked" reason in the reason list is never used.

The seven must-meet tests are present and pass. Each would fail with the feature removed, because they check real files, commits and refusal sentences against a local remote.

VERDICT: LAND
