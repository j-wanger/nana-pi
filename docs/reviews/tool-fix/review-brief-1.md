Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 1: tool-fix

Review `git diff main...HEAD` on feat/tool-fix (ten commits, 09c84608 to 53478430; 24 files, +167 / -60).

Owner (2026-11-09): "go with your recommendations on the prior choices" — a red main leg re-runs once at the same commit, a green re-run keeps lands open, flakes are recorded per file and fixed in source; and "fix root causes mechanically in tools, not memory". The card's items, each from a measured gap:
1. Main CI wait: the rerun count comes from GitHub's `run_attempt`, so a restarted wait never reruns twice; a rerun-green leg prints `green after rerun`; a red leg with no named file records `job: <name>`; the main wait's log reads tolerate a failed read; a mergeability UNKNOWN no longer abandons a capacity rerun. Rows R-3994, R-3995, R-3999, R-4000.
2. A Claude Code roster entry may carry `effort`; `claude-review` uses it before the settings lookup (which today misses `opus` and falls back to xhigh); `nana-roster set` accepts it; the roster notice prints it. R-3210, R-1122, R-1123, R-4001. The seat will set this machine's reviewer to `xhigh` after the land, keeping today's behaviour.
3. The review standard's first-line copy must be a plain line with no Markdown. R-1107.
4. The R-917 temp-source check names offending files and accepts either import quote.
5. A profile git refusal keeps the sealed first line and prints git's detail after it, with the home folder as `~` and URL credentials removed (privacy safety line; pinned by one test). R-4002.
6. Stale text after the generated-files lane: ledger preamble, R-291's maker line, two test titles, G-004/G-009/G-010.
7. `/.codex/` ignored (the Codex desktop app's Claude import writes `.codex/hooks.json` into checkouts).
8. R-4006 and the README scope the stop claim off Windows; the base-add case's assertions are labelled.

Builder's validation: 60 related test files pass alone (1,424 checks); a replay of main run 42718705179 prints `green after rerun` and the flake; a restart at attempt 2 makes 0 reruns; a planted single-quoted import passes and a planted `mkdtempSync(` fails naming the file; a forced profile failure prints `~` and no credentials. Seat re-ran on 53478430: `profile-store-guards`, `ci-wait`, `main-ci`, `nana-roster-set`, `roster-notice` and `test-runner` pass alone; `check:lane` passes.

Questions:
- Can the attempt-based rerun count rerun a run the wait did not start, or skip a rerun it owes?
- Can the profile detail still print a home path or a credential: a Windows short or long home spelling, a `git@` remote, a token in a query string?
- Does the roster `effort` field change any reviewer's effort today when the field is absent?
- Does ignoring `/.codex/` hide anything the dirty-tree refusal should still catch?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
