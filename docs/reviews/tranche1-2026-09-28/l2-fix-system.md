You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Never end your turn while a command you started is still running.

# Worker brief — L2 fix round (Opus 5.5), after sol r1 BLOCK (3 HIGH, 2 MED, 1 LOW)

Worktree `~/nana-pi-wt/l2`, branch `lane/l2-gate` (HEAD `8e822b6`). Read `~/nana-pi/docs/reviews/tranche1-2026-09-28/l2-sol-r1.md` whole, and your `l2-worker-r1.md`.

## Seat rulings first — read before touching code

**RULING A — do NOT chase the shell-text arms race (sol HIGH #2).** sol showed policy-file self-protection is bypassable by ordinary shell syntax: `cd ~/.pi/agent && printf x > nana-pack.json`, escaped/globbed targets, variable indirection, same-command symlink creation, `cd | xargs tee`. **That is a limit of inspecting command text, not a patchable bug.** Every pattern added invites the next form. Do not add more scanner patterns for it. Instead:
- **Narrow the claim to what is TRUE** in the pack README Gate bullets, `AGENTS.md`, and the extension header: the gate catches policy-file writes through the `edit`/`write` tools (all path forms, resolved — L1's `gate-policy-paths`) and through *literal* redirect/copy targets in a command; it does NOT catch shell-computed paths (relative-after-`cd`, variables, globs, symlinks created in the same command, script files, interpreter string-building). List those forms explicitly as a named residual — do not hide them.
- **State the structural mitigation precisely**, because it is the real defense and it already works: a write to a policy file never loosens the gate in the session that wrote it (loosening waits for `session_start`; invariant (b)). So this is not self-escalation — it is a cross-session escalation that needs the agent to be run again in a session that adopts the widened file.
- **Name what actually closes it**: the OS sandbox / container layer, per `AGENTS.md`'s standing rule that an extension gate is advisory-by-load-path and unattended enforcement lives at the container layer. No claim of a shell security boundary.

**RULING B — the floor gaps ARE fixable; fix them (sol HIGH #3).** Unlike A, these are bounded normalization defects in a closed pattern set, not an arms race:
- Path-equivalent targets of the recursive-remove floor: `rm -rf ~/.`, `/.`, `$HOME/.`, `~//`, `/./`, trailing-dot and trailing-slash forms, `${HOME}`.
- Wrapper detection returning non-floor before seeing the dangerous verb: `sudo mkfs.ext4 /dev/x`, `sudo dd if=x of=/dev/sda` (and `doas`, `env`, `command`, `nice`, `time`).
- Pipe-to-interpreter floored only when the interpreter's arguments are all flags: `curl u | sh -s arg`, `curl u | python3 /dev/stdin` must floor too.
- `diskutil quiet eraseDisk …` (option between verb and subcommand).
Add each as a corpus row under an allow pattern that would otherwise exempt it.

**RULING C — keep the project-scope `.claude/**` protection (sol MED #4 says revert; overruled).** A project `.claude/settings.json` carries hooks that execute code, and Jake's own repos have them; leaving project-scope writes ungated would be a real hole the same review just demonstrated matters. It stays, and it is **declared** as a ratified expansion in the README and to the land reviewer, not smuggled.

**RULING D — the appetite.** sol judges the full contract genuinely needs ~800–900 LOC even after subtraction, so the ceiling was wrong, not your judgment. The size is accepted retroactively. The process failure stands: the rule was to STOP and report when the ceiling proved insufficient, and that did not happen. Do not grow the lane further — this round should be net-small.

## Fix list
1. **Floor canonicalization + wrappers + pipe-to-interpreter** per RULING B, with corpus rows for each, each proved under an allow pattern that would otherwise exempt it.
2. **Honest documentation** per RULING A: README Gate bullets, `AGENTS.md` gate paragraph, `nana-gate.ts` header. Include sol's confirmed bypass list verbatim as the residual, the in-session mitigation, and the sandbox statement.
3. **Bound the regex work (sol LOW #6).** Catastrophic valid regexes can hang tool gating (>5 s measured). Cap what a single `tool_call` will do: a maximum number of compiled patterns considered (e.g. 200 per list, excess dropped with one `config_invalid` diagnostic) AND a maximum subject length passed to regex matching (e.g. 64 KB; a longer command is treated as unsegmentable and gets no exception). Pin both with tests, including a catastrophic-regex case that must complete well under a second.
4. **Do NOT touch** `apps/desk/public/app.js` — the seat is fixing the misleading "allow (skip gate)" label itself.

## NOT
No new scanner patterns for shell-computed policy-file paths (RULING A). No new modules. No `config.ts` logic. No handoff/objective/post-edit. No desk code. Do not weaken any existing assertion. This round must not add more than ~150 LOC of gate code.

## doneWhen
`npm test` exits 0; every new floor row BLOCKs under a matching allow pattern; the catastrophic-regex case completes under 1 s; the seat's two probe scripts still show every dangerous row BLOCK and the benign rows ALLOW.

## Rules
Foreground commands only; never end your turn with a command still running. Kill only your PIDs. Commit on the branch, no push. `--max-budget-usd 15`.

## Report (≤30 lines)
Commits · each floor gap with its corpus row and the allow pattern it defeats · the documentation wording you landed for RULING A (quote the residual list) · the two bounds and their measured timings · `npm test` summary · `git diff --stat` for THIS round only · residuals · the one claim most likely wrong · `VERDICT: DONE`.
