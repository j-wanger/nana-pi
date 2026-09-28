# Worker brief — T2a fix round (Opus 5.5). Seat-found regression, proven before review.

Worktree `~/nana-pi-wt/t2a`, branch `lane/t2a-objective` (HEAD `73f5079`). Your r1 report is `t2a-worker-r1.md`.

## DEFECT 1 — the unified producer regressed the default resolution (seat-proven)
You unified onto pi's semantics, which require the `objective.projectFile` opt-in. The bash hook never needed it: its documented behaviour (and Jake's 2026-09-18 decentralization ruling) is **the nearest `OBJECTIVE.md` walking up from the session cwd wins, umbrella fallback** — unconditionally. Invariant 3 of your brief said to keep that.

Seat probe on this branch, temp HOME with **no `nana-pack.json`** (a fresh machine, or any machine that never opted in), cwd `<proj>/sub` where `<proj>/OBJECTIVE.md` exists:
```
[nana:objective]
OBJECTIVE UNAVAILABLE: file not found (…/.pi/agent/nana-objective.md). Tell the user before spending.
```
The product's own objective is ignored. With `{"objective":{"projectFile":"OBJECTIVE.md"}}` present it resolves correctly. So the ruling now depends on an opt-in, and `nana-setup project` in a blank folder — the exact flow this program ships — reports UNAVAILABLE.

**Required:** walk-up resolution of `OBJECTIVE.md` is the DEFAULT in both runtimes with no configuration at all. `objective.projectFile` remains a user-scope opt-in only for a **different filename** (and `false`/absent means the default name, not "disabled"). `objective.path` remains the umbrella override. Keep every other guard you added (regular-file check, 256 KiB read cap, 12000-char output cap, symlink refusal, never throws).

**Tests:** add to the golden corpus, for BOTH runtimes: no `nana-pack.json` at all + product repo → the product's lines govern; no config + no OBJECTIVE.md anywhere up the tree → umbrella fallback if it exists, else the marker; `projectFile` naming a different filename → that name wins; `projectFile` absent → `OBJECTIVE.md` still found. The fresh-machine case is the one that just broke — make it explicit and name it so in the test title.

## DEFECT 2 — three now-vacuous checks (you declared these; close them)
`objective-injection.test.mjs` checks (n), (p), (q) still search for `Umbrella (nana):`, a string the producer no longer emits, so they pass while testing nothing. Rewrite each against the label it should now assert (`program objective:` / `program current priority:` / the named-unavailable line), or delete it with a one-line reason if the golden corpus genuinely covers it. A test that cannot fail is worse than no test.

## Also
- Your most-doubted claim is worth closing cheaply: if `CLAUDE_PROJECT_DIR` is unset the hook falls back to `$PWD`. Add one corpus case with it unset and assert the walk-up still resolves from the process cwd.
- `HANDOFF.md` in nana-pi still says `Umbrella (nana)`. One-line correction, in this repo only.

## NOT
No new mechanisms. No L5 work. No further changes to `~/nana-agent-loop` (your OBJECTIVE.md Rules edit stands, uncommitted — the seat will commit it).

## doneWhen
`npm test` exits 0; the fresh-machine case passes in both runtimes; no check in `objective-injection.test.mjs` searches for a string the producer cannot emit.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. `--max-budget-usd 12`.

## Report (≤20 lines)
Commit · the fresh-machine case before/after (paste both) · what you did with each of (n)(p)(q) · the unset-`CLAUDE_PROJECT_DIR` case · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
