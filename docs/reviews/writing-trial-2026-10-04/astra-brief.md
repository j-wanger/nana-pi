# Review brief — controlled-writing trial (reviewer: gpt-6-astra)

Roles: Sonnet built it; you review; Fable rules on landing (`/Users/jwang/nana-pi/docs/reviews/pi-1.0-2026-10-04/ROLES.md`).
Worktree `~/nana-pi-wt/writing`, branch `feat/writing-trial`, base `main` `5ef596a`. Review `git diff main..HEAD` in full.
The contract is `docs/reviews/writing-trial-2026-10-04/design-ruling.md` (Fable). The build brief sits beside it. One known deviation: the installer rows were renumbered to R-373 to R-376, because the pi 1.0 lane took R-360 to R-372. A second known deviation: the rule text no longer names the banned word, and two passive sentences became active, so that the rule passes its own checker (R-376).

## What it claims
1. One rule file, `packages/nana-setup/claude/rules/nana-writing.md`, that Claude Code loads as a rule and pi loads as `<agent dir>/AGENTS.md` (a symlink that nana-setup creates; a copy on win32). The rule tells agents to write Jake-facing text with the verdict first, short active sentences and no coinages.
2. A zero-dependency checker (`packages/nana-pack/bin/nana-writing.mjs` with `lib/writing-check.mjs` and `lib/writing-config.mjs`). It reports long sentences, passive voice, banned words and, with `--report`, a missing verdict and identifier spans. It always exits 0 during the trial.
3. Rows R-742 to R-750, R-373 to R-376 and an amended R-301 are `implemented`.

## Attack these, with executed evidence
- **Checker correctness on real text.** Run it on `HANDOFF.md`, on `docs/reviews/pi-1.0-2026-10-04/land-ruling.md`, and on a few seat-style reports. Look for false positives and negatives in sentence splitting: abbreviations ("e.g.", "i.e.", "vs."), version numbers ("1.0.2"), file paths with dots, code spans and fenced code, Markdown bullets and tables, headings, URLs, and numbered lists. A checker that floods false findings makes the trial's measure meaningless.
- **Passive-voice regex.** Precision and recall on a small labelled set that you write: at least 10 passives and 10 active sentences that contain "is" or "was".
- **pi side.** Confirm against the installed pi 1.0.2 (`$(npm root -g)/@earendil-works/pi-coding-agent`) that `<agent dir>/AGENTS.md` loads for every session, through a symlink, regardless of project trust. Confirm what a project AGENTS.md does to it (adds to it or replaces it). Name the consequence for `pi-review` and `pi-worker` sessions: they will read this rule too. Is that acceptable for review output that must keep exact paths?
- **Installer.** Install exits 1 when a foreign `AGENTS.md` exists. Is that right, or does it block a user's whole install for a style rule? Check the dry run, a dangling symlink, a symlink into another repo, and the win32 copy path. Confirm that doctor never rewrites a file.
- **Sealed tunables.** Each threshold and list sits in config with provenance, and exactly one test pins each sealed value.
- **Rows.** Each row is EARS with one `shall`, and each cited test pins its clause. Rule on R-376's evidence cell.
- **Trial measure.** Does the code or README let the seat compute the ruling's measure (the over-cap share and the verdict-first share) and its stop condition, or is that still manual?

Verdict format: ranked findings (MUST / SHOULD / NOTE), each with file:line, evidence and the smallest fix; then `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
