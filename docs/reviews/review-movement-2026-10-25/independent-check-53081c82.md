MATERIAL: none

# review-movement independent check (lane tip 53081c82)

Checker: independent, did not build. Nothing edited, committed or pushed in the lane worktree or ~/nana-pi.
Scratch: <scratch>/rm-indep/
Machine: macOS (Darwin 25.2.0), node v22.22.2, git on PATH, pi 1.0.2 installed (read for --append-system-prompt handling only; never run).

## Setup

- Fakes: `rm-indep/bin/claude` and `rm-indep/bin/pi` are sh shims to one Node body `bin/fake.cjs`. It records argv, cwd, NANA_ROLE, NANA_REVIEW_ROOT, the full stdin (claude), and for each `--append-system-prompt` value copies the file it names (or writes the text) before exit, then prints `VERDICT: LAND`. Later runs added `FAKE_STATUS` (git status --porcelain --ignored -uall in the child's cwd plus a tmpdir listing) and `FAKE_EXIT`.
- Homes: `rm-indep/h1`..`h8`, each with `.pi/agent/nana-pack.json` = `{"roster":{"scout":null,"builder":{...luna},"largerBuilder":{"runtime":"claude-code","model":"sonnet"},"reviewer":{"runtime":"claude-code","model":"opus"},"land":null}}`. Every launcher run had `HOME` and `PI_CODING_AGENT_DIR` set to one of them; all rounds landed in the scratch ledgers (e.g. `h1/.pi/agent/review-ledger.rounds.jsonl`).
- Comparator: `rm-indep/cmp.mjs` imports MOVEMENT_HEADING/LEAD and STANDARD_HEADING from the worktree, checks heading counts, order, the `heading\n\nlead\n\n` prefix, and compares the body string with the expected file trimmed of trailing newlines.
- Launchers: `node ~/nana-pi-wt/review-movement/packages/nana-pack/bin/claude-review.mjs` and `.../pi-review.mjs`, always launched with cwd `rm-indep/` (outside the reviewed repo), brief at `rm-indep/brief.md` (outside the tree, so pi-review saw a clean tree).

## 1. 81 KB case

```
git clone -q --no-hardlinks ~/nana-pi rm-indep/clone
git -C clone checkout -b feat/review-movement 53081c82 ; git -C clone branch -f main c0a78493
node .../scripts/requirements-moved.mjs --root rm-indep/clone --base main > rm-indep/expected-81k.txt   # exit 0
claude-review --item rm-indep-c1 --tree rm-indep/clone --brief rm-indep/brief.md --out rm-indep/c1-out.md
pi-review --item rm-indep-p1 --tree rm-indep/clone --out rm-indep/p1-out.md -- -p review
```

- Expected report file: 81,340 bytes (body 81,339 after trimming the final newline). First line `tree movement c0a7849..53081c8: 2047 rows in 39 features, 8 capability change(s), 80 artifact change(s), 105 read change(s), 21 artifact reader/park change(s)`. (Plan measured 81,097 at main d3f7f7f3; the lane's own rows add 243 bytes.)
- claude-review: exit 0, round 1 recorded (verdict LAND, model opus). Stdin 83,152 bytes. One `## Tree movement`, one standard heading; prompt starts with brief + blank line, section starts right after it, standard heading follows the section's trailing blank line. Prefix present. Body 81,339 bytes: **byte-equal**.
- pi-review: exit 0, round 1 recorded (revision 53081c82, snapshot null). Child argv: `-p review`, append 1 = immutable-checkout sentence (text), append 2 = review standard (text, 1,356 chars), append 3 = `<tmp>` (file), then `--name`. File copy 81,417 bytes; no movement heading in appends 1-2. Body 81,339 bytes: **byte-equal**.

## 2. No local main (clone2, main renamed to trunk; origin/main still present as a remote ref)

- Script direct: exit 1, stderr first line `could not find a merge base for 'main' and HEAD: fatal: Not a valid object name main` (the bare run then prints a 4-line MODULE_TYPELESS_PACKAGE_JSON warning; the helper's `--no-warnings` suppresses it).
- claude-review (h3, item rm-indep-c2): exit 0, round 1 recorded. Exactly one movement heading, between brief and standard. Body is one line, 113 bytes: `tree movement: not computed: could not find a merge base for 'main' and HEAD: fatal: Not a valid object name main`.
- pi-review (h3, item rm-indep-p2): exit 0, round 1 recorded. Three appends, third is a file; file holds heading, lead and the same single 113-byte line, no newline in the body.

## 3. Ledger-free repository (rm-indep/fresh: two commits, untracked REQUIREMENTS.md copied from the lane's first 40 lines; `git status` shows `?? REQUIREMENTS.md`)

- claude-review (item rm-indep-c3): exit 0; zero movement headings; prompt begins exactly `brief\n\n## <STANDARD_HEADING>\n\n`, i.e. today's form.
- pi-review (item rm-indep-p3): exit 0; exactly two appends (sentence, standard); no copy contains the heading.

## 4. pi-review leaves nothing in the checkout and cleans its temp folder

- During the child run (run p4, `FAKE_STATUS=1`): `git status --porcelain --ignored -uall` in the immutable checkout printed nothing (no untracked or ignored file). The OS tmpdir held `nana-movement-8MW9wT` beside the run's `nana-review-61075-*`.
- After exit: tmpdir `nana-*` listing identical to before the run (diff empty); `git worktree list` shows only the clone. Recorded round has `snapshot: null`, so `complete` saw the clean revision.
- Cleanup also holds on a failed review (`FAKE_EXIT=1 --retries 0`: exit 1, FAILED line, 0 `nana-movement-*` left), on the timeout runs below, and on every success run (0 left at each check).
- The tmpdir holds older `nana-review-<pid>-*` folders from other sessions; none came from these runs.

## 5. Timing of the movement step (81 KB case)

Helper alone (`rm-indep/time.mjs`, 5 calls each, seconds):

| tree | section chars | seconds |
|---|---|---|
| clone (source tree) | 81,160 | 0.283 0.256 0.260 0.257 0.260 |
| detached worktree of clone (pi-review's shape) | 81,160 | 0.279 0.261 0.262 0.269 0.255 |
| clone2 (not computed) | 191 | 0.105 0.104 0.107 0.110 0.106 |
| fresh (no ledger, returns null) | - | 0.016 0.015 0.015 0.014 0.051 |

Launch-to-child seconds, lane launcher vs main's pre-change launcher (~/nana-pi at d3f7f7f3), same clone, alternating, 3 runs:

- claude-review: lane 2.62 (cold), 1.64, 1.64; main 1.52, 1.40, 1.38. Added about 0.24 s.
- pi-review: lane 6.87, 6.68, 6.91; main 6.70, 6.43, 6.70. Added about 0.2 s (inside pi-review's 6-7 s snapshot copy).

Both match the plan's "about 0.3 s before admission".

## 6. Other seat-missable cases

- Path with spaces + symlinked launcher: a clone of ~/nana-pi at 53081c82 in `rm-indep/pack copy/nana pi`, launched through symlinks `rm-indep/linkbin/{claude-review,pi-review}` (the `~/.local/bin/pi-review` form), against `rm-indep/tree space/my clone` (main = c0a78493). Both exit 0, one section each, body byte-equal to the 81 KB expected file (the spaced pack's own script produced an identical file). MOVEMENT_SCRIPT_URL resolves through the symlink and the `%20` path.
- Symlinked checkout folder: `--tree rm-indep/link-clone` (symlink to clone), worktree launchers. Both exit 0, byte-equal, order correct.
- Prompt order: claude-review is brief, movement, standard heading, standard, sentence (checked by index in every computed case). pi-review appends sentence, standard, movement file in that order (argv in every case).
- pi 1.0.2's `resolvePromptInput` (dist/core/resource-loader.js:100) reads an append value as a file when `existsSync` is true, else uses it as text, so the file path is read as content.
- Failure injection, none refused or crashed:
  - Pack copy with `scripts/` moved away: both exit 0, round recorded, body `tree movement: not computed: node:internal/modules/cjs/loader:1386` (the known limit: a location, not a cause).
  - Slow git on PATH (`merge-base` sleeps 40 s): claude-review exit 0 in 34 s, pi-review exit 0 in 39 s, body `tree movement: not computed: ETIMEDOUT`.
  - Malformed committed ledgers (binary bytes, duplicate rows and headings, bare Made/Read/Parked lines): script exits 0 with `tree movement: none` (known limit).
  - Code read: the helper wraps both process calls in try, computes the reason without a throwing path, and builds the script path inside the try; claude-review calls it after brief and standard checks and before review-ledger; pi-review calls it after the snapshot check and before admission, and its file-write fallback cannot throw.

## Findings

- NOTE 1 (not in the known limits): `--tree` pointing at a subfolder of the repository makes the launchers disagree. The helper checks `HEAD:./REQUIREMENTS.md` relative to the given tree. claude-review `--tree rm-indep/clone/packages` sent no movement heading (exit 0). pi-review with the same `--tree` sent the full movement, because its checkout is always the repository root. Neither says why. Seats launch from worktree roots, so this is unlikely in nana-pi.
- NOTE 2: on the 30 s timeout, `spawnSync` kills only the node script; its git grandchild keeps running as an orphan (the slow-git `sleep 40` outlived the launcher). A truly hung git would linger after the review. Harmless to the review itself.
- NOTE 3: a bare manual run of the script (the hand step the rule used to name) prints a 4-line MODULE_TYPELESS_PACKAGE_JSON warning on stderr from a template .ts import; stdout stays clean. The helper's `--no-warnings` is what keeps it out of the not-computed reason. That confirms the tunable's purpose; nothing to change.
- Confirmed known limits, no new harm: location-line reason for a missing script; `none` for a malformed ledger; base is the local `main` only (origin/main does not rescue a missing local main).
