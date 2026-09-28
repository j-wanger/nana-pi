# Worker brief — L2 fix round 4 (Opus 5.5), after sol r2 BLOCK. This is the LAST fix round before the astra land ruling.

Worktree `~/nana-pi-wt/l2`, branch `lane/l2-gate` (HEAD `a24f2bd`). Read `l2-sol-r2.md` whole.

## SEAT RULING E — subtract the load-time regex probe. My previous ruling was wrong.
I ruled the per-call watchdog out and load-time probing in. sol has now shown the **probe itself hangs**: `(?=a{27})(a+)+$` made a config load take 872 ms, `(b+)+$` was retained with a single 25-char test at 435 ms, and raising the probe length toward 40 can hang outright. So the probe neither bounds the cost nor reliably detects the hazard — it just moves it and adds complexity. Three designs have now failed on the same self-inflicted threat. Stop defending it.
- **Remove the probe entirely** from `config.ts` (and its per-process cache and its tests).
- **Keep** the 200-pattern count cap and the 64 KB subject cap. Those are cheap and sound.
- **Document the residual plainly** in the README Gate bullets: a catastrophic or polynomial regex in your OWN `nana-pack.json` can make your own gate slow or hang; nothing in the pack can fix a pattern you asked it to run; the count and subject caps bound everything else. That is the honest statement and it replaces the current paragraph about detected shapes.

## SEAT RULING F — a dropped DENY pattern must never fail open (sol r2)
Dropping an unusable `allowPatterns` entry is conservative and fine. Dropping an `extraPatterns` or `protectedPaths` entry silently removes protection the owner asked for — that is a widening, which L1's invariant 6 forbids.
- If any `extraPatterns` / `protectedPaths` entry cannot be compiled or exceeds the count cap, the gate **STOPs** with the existing conservative-stop reason naming the file and the entry, exactly like a malformed gate block. `allowPatterns` excess stays a drop with a `config_invalid` diagnostic.
- Fix the cap-ordering dishonesty sol found: a 201-entry list retained entry 201 after an earlier drop. The cap must be a hard prefix of the list as written, and the diagnostic must say which entries were not considered.

## SEAT RULING G — narrow the policy-write claim; it is currently too generous (sol r2 PARTIAL)
I published "a policy write never loosens the gate in the session that made it — a cross-session escalation". sol is right that this is too broad: `nana-pack.json` also carries `postEdit.commands`, and non-gate blocks apply **live**, so a bypassed write can get code execution in the **same** session through a post-edit command.
- Correct the README / `AGENTS.md` / header wording to say exactly: **gate loosening** waits for `session_start`; **other blocks in the same file, including `postEdit.commands`, apply live**, so a write that evades the gate's text scan can run code in the same session through post-edit. Name it as a residual the OS sandbox closes.
- Do NOT session-baseline post-edit in this lane; that is a separate contract. State it as the open option for astra.

## Also fix
1. **stdin floor, both directions** (`gate-shell.ts:249-253`): benign `echo x | python3 --version` must ALLOW; destructive stdin code via `python3 -W ignore` (an option whose value looks like a script path) must FLOOR. Add both as corpus rows.
2. **Declare `parallel` and `watch`** in the unsegmentable list in the README, or remove them from `gate-shell.ts:45`. They currently disable all exceptions without being declared.
3. **Desk label, in THIS worktree** (`apps/desk/public/app.js:2120`): the seat applied it on main by mistake; apply the same change here — `field("allow (exempt matching segment; not the floor)", allow)`.

## NOT
No new scanner patterns for shell-computed policy paths (ruling A stands). No new modules. No growth of the corpus beyond the rows named above. This round must be **net-negative** in gate LOC.

## doneWhen
`npm test` exits 0; `config.ts` has no probe and no probe cache; a catastrophic pattern in `extraPatterns` produces a STOP, not a silent drop; both seat probe scripts still show every dangerous row BLOCK and the benign rows ALLOW.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. `--max-budget-usd 12`.

## Report (≤25 lines)
Commit · what you removed and the LOC delta · the STOP-on-deny-drop behavior with its test · the corrected claim wording (quote it) · the two stdin rows · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
