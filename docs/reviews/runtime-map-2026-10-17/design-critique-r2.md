# Design critique, round 2: runtime-map, CHANGE.md seat revision 2

*Adversarial plan review of `CHANGE.md` (seat revision 2) in this folder. Cites are at `2dbc817`. "Read" means read at `2dbc817` and not run.
"Ran" means run on this Mac (Node v22.22.2, git 2.50.1) in a scratch copy made with `git -C <repo> archive 2dbc817 | tar -x -C c2/src`, or in a
scratch probe under `c2/`. INFERRED means neither. The owner is "the owner"; this file holds no name and no word-for-word quote. Stakes: medium
and reversible. The lane edits the land-gate runner behind a knob that does nothing while unset, and the data it writes gates nothing.*

**Verdict: LAND. No MUST stands.** Round 1's one MUST (five blocking asks) is closed: no blocking ask remains. The design is the simplest one
that holds on both platforms: a per-file `NODE_V8_COVERAGE` set by the runner, a record per folder, a completion record, one read after the
suite, a tracked-file filter, and data kept out of the map check. The eight SHOULDs below are cheap. Four close test gaps: a pair that
cannot red its check, a check that can hang for 10 minutes, a flag pinned for one value only, and a promised note with no row. Two fix
honest inputs: a folder nested in another repository, and an empty or relative knob. One fixes a sealed sentence the plan's own evidence
contradicts, and one fixes a premise in the owner call D3.

## Scope against the owner's answers

- **Answer 1.** The data holds, per test file, the repository files it ran, its spawned children's files included, and its seconds. There is
  no per-function data. The file is kept on the measuring machine, and `map:check` never reads it (R-1296, I7). Inside the ask.
- **Where the file lives.** The plan puts it in `.git/nana/`. The research offered exactly this place as option A2, "local, at <git common
  dir>/nana/runtime-map.json" (Read: `research.md:220`, `:539-541`). So the answer picks A2 over a committed file. The literal words "outside
  the repo" could still be read as "outside `.git` too" (NOTE N8).
- **Answers 2 and 3.** The header places the lane third, under the new cap (`CHANGE.md:3-5`).
- **Nothing beyond the ask** except cheap support for honesty: labels, content hashes, the clean flag, platform and Node fields, and the
  closing line. Two of these were sized for data that crosses machines, which answer 1 rules out (NOTE N1).

## MUST

None. Each item below has a realistic input, but its consequence is a test-evidence gap, a rare edge, or wording. None loses data, bypasses a
boundary, breaks an install, or regresses behaviour main has today, as long as the builder follows §3.4's prose.

## SHOULD

**S1. M15 as written cannot red pair 34, can hang 10 minutes under pair 35, and leaves a process running.**
- **Pair 34** removes the folder at once, before the suite exits (`CHANGE.md:396`). After a forwarded stop, the folder is then gone, just as
  with right code. M15 reds only if something writes into the folder after the signal. The real late writer is a test file cut off from its
  runner, which re-creates its coverage folder when it ends (residual 8). The plan does not say the fake suite does this.
- **Pair 35** waits with no bound (`:397`). M15's wait case uses a fake suite that ignores SIGTERM (`:326-327`). So M15 waits until the
  per-file limit kills it. That is 5 minutes in the suite (Read: `scripts/test.mjs:57`) and 10 minutes in the shared mutation runner
  (Read: `../parallel-seat/CHANGE.md:229`).
- **The wait case's fake suite** ignores SIGTERM and outlives `measure`, which returns into the test process. Nothing in M15 ends it.

*Fix:* In M15, the fake suite writes one file into its knob folder when it gets the signal, then exits. M15 races `measure` against its own
short timer and fails on the timer. M15 sends SIGKILL to the ignoring suite at the end.

**S2. R-1285's clean flag is pinned only for a clean tree.**
F1 is fully committed, so M11 sees `clean: true` (`:309-310`, `:322`). Pair 29 only drops the field (`:391`). I5 reads the flag from fixture
data, so it pins the printing, not the computing. A natural slip passes every check: testing `git status`'s exit code (always 0) instead of
its output. Then every measurement says "(clean)".
*Fix:* Add a dirty case. Edit one tracked F1 file, run `measure` once more with the injected fake suite, and assert `clean: false`. The fake
suite writes a completion record for 0 files, so the data is written. Add a pair: "the clean flag ignores a tracked edit" reds M11. 56 pairs.

**S3. R-1295 drops the no-git cause that §3.4 promises, and no check reaches the impact command's git call.**
§3.4 lists "no git" among the note's causes (`:185`). R-1295 lists only missing data, unreadable data and another schema (`:86`). Every I
check sets the override (`:293`), so the CLI's `git rev-parse` never runs under a check. A plain `git archive` copy has no git; this plan's
own evidence uses such copies. Today `--impact` needs no git and returns 0 there (Read: `templates/typescript/template/scripts/code-map.mjs:850-864`).
If a builder lets the git failure throw, impact exits 1 after its static output, and nothing reds.
Ran (`c2/probe2/out.txt`): `GIT_DIR=/nonexistent git rev-parse --git-common-dir` exits 128. That gives a one-line way to test it.
*Fix:* Add "or no git common directory" to R-1295. Add an I6 case that unsets the override and sets `GIT_DIR` to a missing path. Add a
pair: "the data path throws when git fails" reds I6.

**S4. The not-counted sentence overstates the gap, and it is sealed and printed on every impact call.**
The plan says children "stopped by a signal" write no coverage (`:36`, `:222`, `:491`). Its evidence stopped a child that has no signal
handler (Read: `forms/killed.mjs`, `forms/a.mjs`). Ran (`c2/probe2/out.txt`): a child that catches SIGTERM and calls `process.exit` writes
coverage; a child with no handler writes none. The desk server catches SIGINT and SIGTERM and exits (Read: `apps/desk/server.mjs:2443-2448`).
Desk tests stop it with a plain `kill()` (Read: `apps/desk/test/app-listener.test.mjs:386`), and probe 3 credits it (Read: `probe-3.json`,
`apps/desk/server.mjs procs=1`). 25 test files call `.kill(` (Ran: grep over the six test roots).
*Fix:* Say "children killed by a signal they do not catch" in `NOT_COUNTED`, R-1294, the threat model, residual 1 and the README sentence.
V1 seals the new text.

**S5. R-1277 accepts a plain folder that sits inside another git repository.**
In such a folder, `git rev-parse --show-toplevel` succeeds and names the outer repository (Ran: `c2/probe2/out.txt`). The measure command
would then hash the outer repository's tracked list and drop every coverage entry. It would then write empty data into the outer
repository's `.git/nana/` (INFERRED from §3.2 and §3.3). Example: a `git archive` copy unpacked under a home folder that is itself a dotfiles
repository.
*Fix:* Refuse when the real path of the toplevel differs from the real path of the measure command's root. That is one comparison, one M3
case and one pair.

**S6. D3's recommendation rests on a premise this lane removes.**
Option (a) says measuring on demand costs nothing "until a reader exists" (`:460-463`). But the impact command reads the data from this
lane's land. The standards tell every builder to run it before touching a mapped module. Acceptance step 1 seeds the data on the lane tip,
which main equals after the land, and the data then ages with each land.
*Fix:* Restate (a): the acceptance run seeds the data, and the seat measures again on demand when the closing line's changed count makes
the lines unhelpful. Name who runs it. The recommendation can stay (a), and D3 stays optional.

**S7. Acceptance step 4 has no rule for a label that differs.**
"Every label must match" (`:434`). A flaky file can differ between any two runs, with or without coverage. The plan does not say whether a
mismatch blocks the land, earns a re-run, or becomes a residual.
*Fix:* Re-run a mismatched file once, both ways. If it differs only under coverage, record it by name as a residual; the data already shows
its label. Only a mismatch that repeats blocks the land.

**S8. An empty or relative knob scatters coverage through the working tree.**
R-1270 starts on "set" (`:61`). The runner joins the knob with the run position and runs each file from its package folder (Read:
`scripts/test.mjs:365`). Ran (`c2/probe3/out.txt`): a relative `NODE_V8_COVERAGE` lands under each child's working folder, and
`path.join("", "0001")` is `0001`. So `NANA_COVERAGE_DIR=` (empty) or `NANA_COVERAGE_DIR=cov` puts coverage files in each package folder
as untracked files, while the records land under the runner's folder. The measure command always passes an absolute folder, so only a
hand-set knob hits this. The knob line (R-1273) exists for that same hand-set case.
*Fix:* An empty knob counts as unset (R-1274, one more C5 case). The runner resolves the knob to an absolute path once (R-1270; C4 asserts
the printed folder is absolute). Two pairs.

## NOTE

- **N1. Answer 1 makes the data single-machine.** Two parts were sized for data that crosses machines. The CRLF fold (R-1276, M2's CRLF case,
  pair 14) helps little now. Measure and impact read the same checkout with the same git config. So line endings change only when an editor
  rewrites a file, and then a stale mark is harmless. The runner's own snapshot hashes raw bytes (Read: `scripts/test.mjs:309-310`). The
  `platform` field never varies within one machine's file. Both are cheap; cutting them is optional.
- **N2. R-1292's "or the data records none" cannot happen with honest data.** Every executed file is tracked, and every tracked file is
  hashed before the run (`:120-121`, `:146`). Only hand-made data reaches the clause, and the threat model puts that out. I3's case is then a
  forgery case. Keep or cut.
- **N3. Let the mapper default to `path` itself, and derive `windows` from it.** `path` is `path.win32` on Windows, so no platform branch
  exists to get wrong; M6 still injects `path.win32`. As planned, a measure that picks the wrong path API fails no macOS check, and the
  Windows leg is non-blocking (`:438`).
- **N4. `git rev-parse --path-format=absolute --git-common-dir`** prints an absolute path from any folder (Ran: git 2.50.1 here). It removes
  the resolve step and pair 12. It needs git 2.31 or later on every CI image (INFERRED that they have it).
- **N5. The shim can import the reader inside its `--impact` branch.** Then `--check`, `--write` and `req:rows`, which imports the shim, never
  load the new module. R-1296 holds either way; this narrows what a broken reader can stop.
- **N6. The data write comes 12 to 16 minutes into the run.** If the git folder cannot be written (permissions, a sandbox), the whole run is
  lost (INFERRED). Creating the data folder before the suite starts fails fast for one `mkdirSync`.
- **N7. A signal during the read, after the suite has exited, has no rule.** Say whether the measure command finishes the write or abandons
  it. Either way the rename is atomic and the folder goes.
- **N8. "Outside the repository."** The file sits inside `.git/`. That matches option A2, which the owner was offered. One clause naming this
  reading in §3.3 stops a later reviewer flagging the literal conflict.
- **N9. Bookkeeping.** The sibling plan now uses R-1230 to R-1268, inside R-1230 to R-1269 (Read: `../parallel-seat/CHANGE.md:5`, `:68`).
  So S1's "must end below R-1270" already holds, and §2's cites of its `:5` and `:60` are out of date. The generator's `main` sits at
  `:850-864`, not `:851-862`.
- **N10. Acceptance step 4's plain run** is step 5's `npm run test:locked` when the tip has not changed. Saying so saves one 12- to 16-minute
  run.
- **N11. The default `start`** (spawn `suiteCommand`) runs only in acceptance step 1, because every check injects `start`. Say so in §5.3,
  so a reader does not count that wiring as pinned.

## Verified, no change needed

- **URL forms for loaders the suite uses.** Ran (`c2/probe/out.txt`): CommonJS, a `vm.runInThisContext` script with a filename, and a `.ts`
  file loaded through pi's bundled jiti (2.7.0) all appear as `file://` URLs with a top-level count of 1. So the tracked-file filter covers the
  suite's jiti path (Read: `packages/nana-pack/tests/post-edit-status.test.mjs:290-300`).
- **README census.** Ran (`c2/rc`): with the three new modules and the `map:measure` script added, `node scripts/readme-check.mjs --check`
  reports exactly two problems, `map:measure` and `runtime-measure.mjs`, the two names §3.6 adds. Pack `lib/` modules need no README line.
- **Pair recount.** Ran (a parser over §5.3): 55 pairs, numbered 1 to 55 with no gap; every per-check list at `:420-422` matches the table;
  all 29 checks have at least one pair.
- **No other runner copy, no output parser.** Read: only `test-runner.test.mjs` copies or spawns the real runner (`:31`, `:51`, `:72`,
  `:389`). No code parses `--impact` output; only skill text names it.
- **Node version.** Read: CI runs Node 22 on every leg (`.github/workflows/ci.yml:34`, `:62`, `:87`), so `fileURLToPath`'s `windows` option
  exists everywhere. Ran: `fileURLToPath("file:///C:/a/b.mjs", {windows: true})` gives `C:\a\b.mjs` on darwin.
- **Pre-run hashing cost.** Ran: 1,963 tracked files, 23.3 MB at `2dbc817`. Hashing them all is cheap.
- **Cites spot-checked** (Read): `scripts/test.mjs:57`, `:62`, `:108-114`, `:161-162`, `:279`, `:292`, `:352-357`, `:362`, `:369`, `:382`,
  `:413-415`; `scripts/test-locked.mjs:112`, `:132-133`, `:139-163`, `:156`; `scripts/code-map.mjs:7`, `:49-51`; the generator's renderer
  promise at `:682-686` and its compare at `:815`.

## Subtraction test: changes since round 1

| Part | Verdict |
|---|---|
| Completion record (new) | Earned: no output parsing, and stdio is inherited |
| Read once after the suite (was per line) | Earned: three failure paths gone; the summary line measures the disk total |
| Signal forwarding with a bounded wait (new) | Earned: without it, a stop leaves about 1 GB of coverage and a suite that holds the lock |
| Knob line (new) | Earned, and it argues for S8 |
| Not-counted clause (new) | Earned; its wording needs S4 |
| CRLF fold, `platform` field | Optional cut under answer 1 (N1) |
| R-1292's "records none" clause | Not earned for honest data (N2) |
| `npm_execpath` refusal | Earned, narrowly: it turns a `MODULE_NOT_FOUND` into a named cause |
| Everything else | As round 1: earned |

## Row audit

One `shall` per row holds. Each row has a check and a pair. The gaps are named above: R-1270 and R-1274 (S8), R-1277 (S5), R-1280 (N3),
R-1285's clean clause (S2), R-1289's pairs (S1), R-1292's last clause (N2), R-1294's sealed text (S4), R-1295's missing cause (S3).
R-1282 opens with WHERE, which EARS keeps for optional features; IF ... THEN fits a condition on input.

## Evidence I ran

- `c2/src`: `git -C ~/nana-pi archive 2dbc817 | tar -x`. `c2/rc`: that copy with the plan's three modules and script added, then
  `node scripts/readme-check.mjs --check`.
- `c2/probe/` (`out.txt`): one ESM entry that loads a `.cjs`, a vm script and a jiti-loaded `.ts` under `NODE_V8_COVERAGE`.
- `c2/probe2/` (`out.txt`): a child stopped by SIGTERM with and without a handler; `git rev-parse` in a plain folder inside another
  repository; `GIT_DIR` set to a missing path.
- `c2/probe3/` (`out.txt`): a relative `NODE_V8_COVERAGE` from two working folders; `path.join("", "0001")`.
- A parser over §5.3's table and per-check lists; greps for runner copies, `--impact` consumers, `.kill(` calls and signal handlers;
  `git ls-tree` size and count at `2dbc817`.
- Not run: the full suite, any measurement, anything on Windows.

**The claim here most likely wrong:** S5's consequence, that the measure command would write empty data into the outer repository's git
folder. It is INFERRED from §3.2 and §3.3; nobody has built the measure command. The git behaviour under it was Ran.

VERDICT: LAND
