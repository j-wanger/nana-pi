# Independent check — objective-path-shapes at 07dc79b3 (2026-10-20)

VERDICT: HOLDS

I worked in a private clone at 07dc79b3 under $TMPDIR (now deleted), with a temp home for every probe. Base is a second clone at 72abe19a. Node 22.22.2 on macOS, with pi 1.0.2 installed.

Must-meet and nearby test files, run one file at a time on the lane:
- objective-path-shapes: 5 PASS, 0 FAIL, 1 SKIP (R-2285 runs only on win32), ALL PASS.
- objective-golden 1280/0, objective-injection 69/0, fresh-machine 9/0, install 109/0, doctor-detail 72/0.
- `node scripts/code-map.mjs --check` reports 0 problems. `node scripts/readme-check.mjs` checks 725 claims with 0 problems.
- requirements-moved against 72abe19a lists R-2280 to R-2282 as new and implemented.

P1 `nana-setup doctor --home H` with `{"objective":{"path":5}}`
- base: exit 1 after 9 lines, `TypeError: p.startsWith is not a function at objectiveTarget (steps.mjs:651:8)`.
- lane: exit 1 after 53 lines. `✗ pi objective.path  5 is invalid (expected a path string or null) — the producer ignores it and uses H/.pi/agent/nana-objective.md; set obj…`. Last line: `fix by hand as each ✗ line says: pi objective.path, pi pi-subagents`. Verdict: fixed.

P2 `nana-setup install --dry-run --home H` with path `{"a":1}`
- base: exit 1, `TypeError: p.startsWith`.
- lane: exit 0, `+ pi nana-objective.md created would create`. The pi folder still holds only nana-pack.json, so the dry run wrote nothing. Verdict: OK.

P3 real `install --home H` with path `false`, then doctor with false and with null
- install exit 0, `+ pi nana-objective.md created`. nana-pack.json sha is 9dbbcf186642 before and after.
- doctor(false): exit 1, `✗ pi objective.path false is invalid …`, `✓ pi objective file`.
- doctor(null): no objective.path row, and the fix line names only `pi pi-subagents`. Verdict: OK. The change from silent to ✗ for false is declared in the plan.

P4 producer `objectivePath` against doctor/install `objectiveTarget` on macOS, 23 values, base vs lane. Values: undefined, null, "", "~", "~/", "~/notes/goal.md", "~\\notes\\goal.md", "goal.md", "./x.md", "../x.md", "sub/dir/g.md", "/abs/g.md", "C:/x/g.md", "C:\\x\\g.md", " ", "~user/g.md", 5, false, true, 0, {}, [], ["a"].
- lane: the two agree on every value. "~" printed DISAGREE, but only because the temp home path held a doubled slash in one of the two strings. Both name the same folder.
- Every string value except "" gives the same result as base.
- Base: "" gives `…/.pi/agent` to the producer and `…/nana-objective.md` to doctor. 5, true, 0, {}, [] and ["a"] make the producer throw TypeError; 5, true, {}, [] and ["a"] also make doctor throw. Verdict: no regression, and the drift is closed.

P5 `resolveObjectivePath` forced to win32 against main's rule run under path.win32, 15 Windows values
- Changed: `""` now gives `C:\Users\Jane\.pi\agent\nana-objective.md` (main gave the agent dir). `"~\\notes\\goal.md"` now gives `C:\Users\Jane\notes\goal.md` (main gave `…\agent\~\notes\goal.md`). `"~\\"` now gives `C:\Users\Jane`.
- Same as main: `C:\repo\OBJECTIVE.md`, `C:/repo/OBJECTIVE.md`, `\\srv\share\g.md`, `\repo\g.md`, `D:rel.md`, `notes\goal.md`, `~/…`, null, "~".
- The new rule matches the `~\` rule in `piNormalizePath` in agent-dir.mjs. Verdict: only the intended changes.

P6 Claude Code hook `claude/hooks/nana-objective.mjs` run end to end, base vs lane
- path `{}`: both print `governing: H/.pi/agent/nana-objective.md`.
- path `""`: base prints `OBJECTIVE UNAVAILABLE: unreadable (H/.pi/agent)`; lane prints `governing: H/.pi/agent/nana-objective.md` with the objective line.
- path `"~/notes/goal.md"`: both print `governing: H/notes/goal.md`. Exit is 0 on all six runs. Verdict: OK.

P7 pi's own jiti 2.7.0 loads `extensions/nana-objective.ts`, `lib/objective.ts` and `lib/config.ts` with path `true`
- `ext default: function | o.path: null | objectivePath: H/.pi/agent/nana-objective.md`, then `governing: …/nana-objective.md | **Objective …** jiti goal`.
- The new .mjs import loads in the pi extension runtime. Verdict: OK.

P8 doctor with no `--home`, `PI_CODING_AGENT_DIR=H/alt` and path `[1,2,3]`
- doctor: exit 1, `✗ pi objective.path [1,2,3] is invalid … uses H/alt/nana-objective.md`, `✓ pi objective file H/alt/nana-objective.md`.
- producer: `governing: H/alt/nana-objective.md`. Verdict: doctor names the file the producer reads.

P9 doctor on unusual shapes
- A 300-character object: the shown value is capped at 120 characters.
- `{"e":"\u001b[31mRED"}`: the escape is printed as the text `\u001b` (od confirms), with 0 raw ESC bytes.
- `-0.0`: printed as `0 is invalid`.
- `{"objective":5}`, `[]` and `"str"`: no row and no throw.
- `null`: `✗ pi nana-pack.json missing or unparseable`.
- Every run exits 1 with 52 or 53 lines. Verdict: no crash.

P10 real `install --home H` with path `true` and a hand-written default objective file
- `· pi nana-objective.md unchanged already present, left untouched`.
- sha before `1e868816a9 4177d69849`, after `1e868816a9 4177d69849`. Verdict: no data lost.

Writes outside the temp folders:
- Under `--home`, install skips `pi packages` ("not registered (--home override in play)") and skips launchctl.
- The only writes to the temp HOME were npm logs from `npm root --global`.
- The R-2282 test runs install the same way install.test.mjs does on main. It adds no new write outside the temp folders.
- The worktree is still at 07dc79b3. Its only untracked file, docs/reviews/objective-path-shapes-2026-10-20/seat-mutate.mjs, was already there and is not mine. <home>/nana-pi is clean.

Findings: none at MUST.

Observations, not findings:
- R-2285 (`~\` on win32 in the producer and doctor) is still unrun until the Windows CI leg. P5 checks the resolver half on a Mac.
- When the `objective` block itself is not an object, for example `{"objective":5}`, doctor shows no row. This is unchanged from main and outside this lane's sentence.
