# Build brief — controlled-writing trial (worker: Sonnet)

Roles: Sonnet builds; gpt-6-astra reviews through pi-review; Fable rules on landing (`docs/reviews/pi-1.0-2026-10-04/ROLES.md`).

## Where you work
- Worktree `~/nana-pi-wt/writing`, branch `feat/writing-trial`, cut from main AFTER the pi 1.0 lane merged. Work only there.
- Your spec is `docs/reviews/writing-trial-2026-10-04/design-ruling.md`. Read it in full. It decides; do not re-litigate it. If an item is impossible as written, stop on that item, say why, and continue.
- Read the worktree's `CLAUDE.md` and `packages/nana-pack/skills/requirements/SKILL.md`.

## One correction to the ruling
The ruling names installer rows R-360 to R-363. The pi 1.0 lane has since used R-360 to R-372. Give the four installer rows the NEXT FREE IDs in the installer block on your branch (check `REQUIREMENTS.md`). Record the mapping (ruling ID → actual ID) in your report and at the top of your commit message. The pack rows R-742 to R-750 and the R-301 amendment stand, but confirm each is still free or unchanged on your branch.

## Allowlist
The ruling's allowlist, unchanged. Do not touch `~/.claude` or `~/.pi`. The seat applies them with `nana-setup install` after landing.

## Order and checks
Rows first (each EARS, one `shall`, starting `planned`), then tests with `// req:` markers, then code, then the README and the map (`npm run map`).
Prove each sealed value with the one test that names its row.
Prove the tests by mutation: for each checker rule (length cap, passive pattern, banned word, verdict-first, identifier spans, exit 0), break the rule in a disposable copy, show the named test turns red, then restore. Put the results in your report.
Run the touched test files, the rail, `npm run map:check`, `npm run readme:check`, and `npm test` once, alone. Read real exit codes, never through a pipe.

## Commit
Stage explicit paths only. End the message with:
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017csAddct6odxmmjefavpCV

## Report (under 300 words, in the controlled style)
The commit · the ID mapping · rows with final status and pinning test · the mutation results · totals with exit codes · residuals, one line each · the claim you expect a reviewer to break.
