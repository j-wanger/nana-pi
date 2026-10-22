# claude-review-launcher: independent check (2026-10-22)

Checked tip: 158659d5 (`feat/claude-review-launcher`, cloned into scratch). Read-only on the repo and worktree; both stayed clean.
Scratch: `$TMPDIR/rl-check.gokfpK` (kept as evidence). HOME and USERPROFILE pointed at a temp folder for every run.
The roster came from the lane's own `nana-roster set reviewer claude-code opus`, which printed `reviewer: claude-code opus`.
Launcher: `L=lane/packages/nana-pack/bin/claude-review.mjs`. Scratch tree: a git repo with two commits, brief untracked under `docs/`.
Fake `claude` (node) logs argv, cwd, env and stdin, then prints a review.

## Cases

| Case | Command (short) | Exit | Key output |
|---|---|---|---|
| a | `node $L --item demo --tree . --brief docs/brief-a.md --out out/a.md` (cwd = tree) | 0 | argv exactly `["-p","--model","opus","--allowedTools","Read,Grep,Glob,Bash","--disallowedTools","Edit,Write,NotebookEdit"]`. cwd = tree; env has NANA_ROLE=reviewer and NANA_HANDOFF=off. stdin = brief bytes, `\n\n## Review standard\n\n`, the standard once (count 1), then the reviewer sentence with item, tree, read-only and plain-verdict clauses. Ledger round 1, verdict LAND, model `opus`, provider null. |
| a2 | same, fake prints `[VERDICT: LAND]` | 1 | `verdict unread ... 2 of 3 rounds remain`; out file kept byte-exact; round verdict null. `**VERDICT: LAND**` is read as LAND by the existing parser. |
| b | 307,258-byte brief with `"`, `'`, `%`, `%PATH%`, `!`, `^&<>\|`, `$HOME`, backticks, UTF-8, LF and CRLF; brief path and out path hold spaces | 0 | stdin prefix byte-equal to the brief file (Buffer.equals true). argv unchanged. Round recorded. |
| b2 | same brief, fake that never reads stdin | 0 | No EPIPE and no hang (0.8 s). Round recorded. |
| c | PATH = node plus /usr/bin:/bin, no claude | 1 | `review-ledger: cannot start claude: ENOENT`. Out file holds that line. No round; reservations folder empty. 0.27 s. |
| d | roster reviewer = `openai-codex gpt-5.6-sol default` | 1 | `roster.reviewer is not a Claude Code entry (got openai-codex gpt-5.6-sol default); use pi-review ..., or run nana-roster set reviewer claude-code <model>`. No claude started, no out file, no ledger files. With no roster file (defaults): same refusal, exit 1. |
| e | malformed JSON in nana-pack.json; also a roster missing slots; also `"roster": 5` | 1 each | `roster refused: <file>: invalid JSON (...)` / `roster is missing scout, builder, land` / `roster must be an object ... (got number)`. No claude started. `set` rejects off-list models (`opus x`, `claude-opus-5-5`, `--dangerously-skip-permissions`). |
| f | rounds 2 and 3 on new commits, then round 4 | 0, 0, 1 | Round 4 refused: `revision would be round 4, over the cap of 3 ... --over-cap`. No claude started, no out file. |
| f2 | round 4 with `--over-cap "confirmation round on the final tip ..."` | 0 | `admitted as round 4/3 — OVER CAP, override recorded`. Round row carries the reason in `overCap`. |
| f3 | round 5 with no `--over-cap`, 300 KB brief | 1 | Same cap refusal; stderr carries no EPIPE and no stack. |
| f4 | `--role land` | 0 | Round row `"role":"land"`. |
| g | cwd = an outside folder holding a decoy `docs/brief-a.md`; `--tree <abs>` and `--tree ../tree` | 0, 0 | Child cwd = tree both times. stdin holds the tree's brief, not the decoy. A brief that exists only under cwd is refused: `brief <tree>/docs/only-here.md is missing`, exit 1. Missing `--tree`: `--tree is required` plus usage, exit 1. |
| h | REAL claude 2.1.299 (`~/.local/bin/claude`) under the temp HOME, one-line brief asking for `VERDICT: LAND` on a one-word edit | 1 | Claude cannot authenticate there. The keychain did not carry over. Out = `Not logged in · Please run /login`. `no verdict (exit 1; 34 chars) — reservation returned, no round consumed`. 2.0 s, no hang. Claude accepted the argv: a bogus flag gives `unknown option` instead. No real review ran. |

Lane tests in the clone (temp HOME): claude-review, nana-roster, nana-roster-set and review-standard all pass. R-2564 skips on macOS ("Windows leg only").

## Material problems

None found in the threat model. The model comes from the reviewer slot. Every refusal comes before admission and starts no claude. No case hung, printed a stack, consumed a round wrongly or changed a prompt byte.

## Non-blocking findings (known-bug candidates for FEAT-007)

1. The reviewer sentence uses `String.replace` with the item and tree as replacement strings, so `$` patterns expand. A tree at `.../tr$$ee` is named `.../tr$ee` in the sentence. An item `x$&y` becomes `x{item}y`. The child cwd and the ledger stay correct. Fix: `replace('{item}', () => item)`. Real slugs and worktree paths rarely hold `$`.
2. The known-limits line "a killed launcher leaves a dead-pid reservation" does not hold for a kill of the launcher pid alone. After SIGTERM the launcher exited 143. review-ledger and claude kept running and recorded round 1 after 4 s. A process-group kill (Ctrl-C) would match the documented line. The launcher forwards no signal.
3. A relative `--out` is recorded in the audit log as given (`out-g1.md`), relative to the launcher's cwd. pi-review resolves it to an absolute path first. This follows D4, but review-timeline shows a cwd-relative path.
4. Already on main, not this lane: `nana-roster set` refuses with ENOENT when `~/.pi/agent` does not exist yet. A fresh temp HOME needed `mkdir -p .pi/agent` first.

Not covered here: R-2564 and the Windows `.cmd` path (CI's Windows leg only), and a real authenticated Opus round. The temp HOME cannot log in, so the brief kept that run off the real HOME.

VERDICT: PASS: no material problem; the real claude ran but could not log in under the temp HOME, so it recorded no round and returned the reservation.
