No finding blocks the land. Every launch path in the brief gets the credential strip, and the strip held in my probes against git on this Mac. Two SHOULDs and some NOTEs follow.

## What I checked

- **Every launch path is stripped.**
  - pi-worker: plain mode (`pi-worker.mjs:93`), lane pi builder (`:228`), and the Claude builder's environment and flag settings (`:166-172`, `:218`).
  - pi-review: the watchdog's child environment (`pi-review.mjs:245`).
  - claude-review: both the review-ledger spawn and the reviewer's flag settings (`claude-review.mjs:104,130`).
  - A direct `review-ledger run` (`review-ledger.mjs:169`).
  - Nested launches (claude-review → review-ledger → claude) add the resets twice. That is harmless: the flag settings and the spawn environment still agree.
- **A child's own git config can't put the helper back.** The resets are command-scope config, which git reads after every config file. I ran two probes on this Mac (Apple Git 2.50.1), in a temp folder:
  - With a fixture helper set per URL (`credential.https://github.com.helper`) in both global and repo config, the parent got the fixture password. The stripped child got no password, and the helper never ran.
  - Against the real system config, which sets `osxkeychain`, I used `GIT_TRACE` and a host with no stored credential, so no real token could be read. Unstripped, git ran `git-credential-osxkeychain get`. Stripped, no helper ran.
  - An empty `GIT_ASKPASS` also stops git from falling back to `core.askPass` or `SSH_ASKPASS`.
- **A child's own Claude settings can't put the helper back either.** The Claude builder and reviewer get the controls through flag settings, which outrank project and local settings. Every name the strip relies on is in both the spawn environment and the flag settings, so the recorded gaps (worktree `.claude/settings.json` env, desktop-host launches) don't reopen this.
- **The gate floor applies only to builders and reviewers.** It runs only when `NANA_ROLE` is `worker` or `reviewer`, and before `allowPatterns`. With no role set, the existing policy decides, and seat pair S6 pins that the seat is never blocked. Quoted mentions are not refused: inside quotes the words count as one, and the patterns only match a command at the start.
- **The seat's pushes and the land still work.** Only child environments change. `nana-land` and the seat's own shell are untouched, and no tool reads the old "push's exit code" report shape.
- **The ruling and preamble wording match.** The preamble, the 2026-11-02 ruling, the AGENTS working pattern and the shared template agree. The marker copy is equal to its source (M6 and R-3437).
- **Tests and harms.** The touched tests (credential-strip, credential-gate, worker-lane, rulings) passed on macOS: 4 files, 98 checks. Afterwards the worktree was clean and `~/.local/bin` was unchanged. origin/main is contained in the tip. No harm the review standard lists.

## Findings

**SHOULD 1: the root README still tells builders to push.** `README.md:318` (the Tests section) says: "Builders run touched tests, push their last commit and stop without waiting for CI. The seat waits for the pushed tip's CI."
- That contradicts the new ruling, AGENTS.md and the preamble. M5's scan doesn't cover `README.md`, and the README check did not catch it.
- The consequence is a stale contract for anyone reading the README. A builder still obeys the preamble, so this is wording, not a blocker.
- Fix it in the reviewed change, or record it as a known bug.

**SHOULD 2: the gate floor misses common helper forms.** It does not refuse:
- `git credential-osxkeychain get` (only the hyphenated binary name is matched);
- `git credential-manager-core get` (the older GCM name);
- `git credential-store get` and `git credential-wincred get`;
- `gh auth status --show-token`, which prints the token.

A realistic case: a Mac builder whose `git credential fill` now comes back empty pipes `protocol=https host=github.com` into `git credential-osxkeychain get`. The gate allows it, and the stored token is returned. This falls under the residual already recorded in `docs/known-bugs/FEAT-006.md:5`, so it isn't a MUST. Widening the git pattern to any `credential-<name> get` and adding `gh auth status … -t/--show-token` would close the readable-refusal gap cheaply.

## NOTEs

- **"Script or not" holds only for git's dispatch.** The strip covers git's own lookup from a script, which is the incident's path. A script that runs a helper or credential store directly still gets the token. That is the residual recorded in `consult.md`, `plan.md`, the README and FEAT-006 line 5.
- **An older ruling still reaches pi builders.** The 2026-10-11 line, "Pushing another branch or opening a draft PR needs no approval", sits beside "Builders do not push" in what the rulings extension injects. The newer, specific ruling governs, but naming the seat in the older line would remove the mixed signal.
- **A bad `GIT_CONFIG_COUNT` crashes pi-worker with a stack trace.** `credentialStripEnv` throws at the top of `pi-worker.mjs:93` instead of giving a named refusal. git itself would refuse the same environment.
- **Some model launches are not stripped.** `scripts/outside-reader.mjs`, `scripts/visual-reader.mjs` and a bare `pi-watchdog` run start model children without the strip. They are outside the brief's launch list.
- **Known bugs touched.** FEAT-006 lines 5–9 are new and accurate. The Claude Code builder lines on worktree settings env, desktop-host launches and managed policy stay true, and the strip doesn't depend on any of them.

VERDICT: LAND
