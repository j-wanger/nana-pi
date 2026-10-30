# Independent check: selective-ci at a3ce7b7c

Checker: Claude Code (Opus), 2026-10-30. Worktree `~/nana-pi-wt/selective-ci`, tip a3ce7b7c, clean before and after.
Threat model: honest variation in GitHub/gh output and environment; forgery out.
No `--post` against the real repository. Every write below went to a fake gh (stub on PATH, or an injected
`runGh` that proxies real read-only gh calls and intercepts `issue create`, `issue list` and `api user`).
Scratch: `$TMPDIR/claude-501/.../scratchpad/ic.dWOi` (HOME, USERPROFILE, PI_CODING_AGENT_DIR, TMPDIR, GH_CONFIG_DIR there).

## What I ran and what it gave

| # | Case | How | Result |
|---|------|-----|--------|
| 1 | Real run, read-only | `node packages/nana-pack/bin/nana-main-ci.mjs` in the worktree | Run 41002620531 at d797a9f1 red; names `windows-latest: component-audit.test.mjs`, `windows-latest: post-edit-status.test.mjs`, job `suite (windows-latest)`; prints the `--post` command; exit 0; 8 s. Matches `gh run list` (newest main push run = 41002620531, failure) and the jobs API (only `suite (windows-latest)` failed; 6 green, release skipped). |
| 2 | One red job among green | Same real run | Reported red, only the windows leg named. Pass. |
| 3 | Posts once | Proxy over real data, fake create; and stub gh on PATH through the real bin with the real identity scanner | One `issue create --label next`, title `main CI: <first failing file>`, body starts `Seat:`. Pass. |
| 4 | Same-title open issue | Proxy with a matching open title; stub second run after the first post | `same-title open issue; skipped`, no create, exit 0. Pass. |
| 5 | Scan refuses | Injected scan exit 1 | `identity scan refused the issue`, exit 1, no create. Pass. |
| 6 | Wrong gh account | Stub `api user` login not the owner | `posting requires the repository owner's local gh account`, exit 1, no create. Pass. |
| 7 | Push on main only | Injected higher-id failed runs: `pull_request`, branch `feat/x`, other workflow path | All ignored; older green push run reported green. Pass. |
| 8 | Newer run in progress | Injected in-progress run above a green finished run | `run … unfinished (in_progress)`, then the finished run green, exit 0. Pass. |
| 9 | No finished run | All runs queued | One unfinished line per run (100 lines), then `no finished main push run`, exit 1. Sensible; verbose. |
| 10 | Cancelled run is newest finished | Real cancelled run 39505855961 (jobs cancelled, no artifacts) | Red; `no record (cancelled)` per leg; `--post` would open `main CI: suite`. See known bugs. |
| 11 | Run SHA not in the local clone | Injected git that cannot resolve the SHA, real green run 40981506862 | Prints `run 40981506862 57167e92 red` with no reason, exit 1, no post. See known bugs. |
| 12 | gh missing | `env -i PATH=<node,git only>` | `Main CI: cannot start gh: spawnSync gh ENOENT`, exit 1. Pass. |
| 13 | gh unauthenticated | Empty `GH_CONFIG_DIR`, no token | `Main CI: gh failed (exit 4): To get started with GitHub CLI, please run:  gh auth login`, exit 1. Pass. |
| 14 | Launcher role | `NANA_ROLE=worker … --post` | `posting refused under launcher role`, exit 1. Pass. Bad argument exits 2 with usage. |
| 15 | Frontier line | `nana-frontier-summary.mjs --cwd <worktree>` with scratch HOME, default, `--max 300` and `--max 40` | `Main CI check: node "$HOME/nana-pi/…/nana-main-ci.mjs" --cwd "<root>"` beside the issue-watch line in the full and omitted blocks; absent under `NANA_ROLE=worker`; nothing for a repo without HANDOFF/ci.yml. Pass. |
| 16 | Lane class | `node scripts/lane-class.mjs --root . --files …` | `ci.yml`, `scripts/test.mjs`, `test-runner-config.mjs` each print `gate: … — CI verdict nana-land reads`; a README prints `ordinary`. Pass. |
| 17 | Row tests | `main-ci.test.mjs`, `frontier-summary.test.mjs`, `lane-class.test.mjs` | R-3183, R-3184 (+ seal), R-3185 PASS. |

Also confirmed read-only: the real repo has a `next` label, and `gh issue list --search "<title> in:title"` finds open titles that contain colons.

## Known-bug candidates (not material)

- Cancelled run (case 10): a cancelled newest finished run reads as red on every leg and `--post` opens `main CI: suite`. 14 of the last 100 main push runs were cancelled. A time-out cancel is a real problem worth an issue; a superseded or hand cancel is not, and the issue does not say "cancelled". Suggest naming the cancellation in the title or not posting for `conclusion: cancelled`.
- Silent red (case 11): when `readCiRecords` returns early (SHA not fetched locally, origin unreadable, run listing failed), its reason goes to the suppressed `writeLine` and the early return carries no `problems`, so the user sees `red` with no cause, even for a green run. It does not post. Suggest passing the record reader's lines through, or returning its reason.
- Unverified: dedup search with a slash-heavy file-path title (`packages/…/x.test.mjs in:title`). No such issue exists to test against; an exact-match miss would post a duplicate once per run.
- Unreadable records turn into `<leg>: suite` failures and can be posted, against the code's own comment that missing inputs are no permission to claim a failure. Seen with a bad-schema stub; low odds in practice.

MATERIAL: none
