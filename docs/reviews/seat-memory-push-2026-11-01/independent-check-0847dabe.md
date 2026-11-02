PASS — seat-memory-push independent check (tip 0847dabe). No MUST findings.

Setup: `git archive` of 0847dabe and of origin/main into scratch (`smpb-indep/tip`, `smpb-indep/main`), each made a throwaway git repo so the profile guard's checkout check works. Every probe used the repo's `memoryFixture` (scratch HOME, scratch PI_CODING_AGENT_DIR, synthetic profile clone, local-only git) with synthetic canary records. No real profile, memory store or ~/.claude was read. No model calls. Probe scripts and raw output are in `smpb-indep/probe/` (probe.mjs/probe1.txt, deadline.mjs/deadline.txt, fuzz.mjs).

## Probe results

1. Speed, silence, deadline.
   - A normal push run takes 136-152 ms; main's hook takes 36-40 ms. Every run exits 0 with empty stderr.
   - Bad stdin (NUL bytes, empty, a JSON array, `cwd` set to a number): exit 0, push still delivered, stderr empty.
   - A git shim that sleeps 12 s (node): hook ends in 1,048 ms. Output equals main byte for byte. Load reason `deadline`.
   - A shell shim whose sleeping grandchild holds the pipe: 1,049 ms, equals main, `deadline`.
   - A shim that sleeps 1.5 s per call then runs real git: 1,050 ms, equals main, `deadline`.
   - A shim that sleeps 0.9 s per call: 1,907 ms, push delivered, `ready`.
   - A shim that ignores SIGTERM: 8,060 ms. Output still equals main, but it runs past the 5 s hook timeout. See SHOULD 1.
   - The lane test B4 passes in scratch: exactly one worktree probe call, plus one rev-list call.
2. Budget and byte identity.
   - Push output with an index of 5, 88 and 300 entries: 5,893, 8,931 and 8,989 characters. All are at most 9,000. Header `push 15 of 33 records, 3933 of 4000`.
   - These cases equal main's output byte for byte, for each of the three index sizes: `NANA_ROLE=worker`, `NANA_ROLE=reviewer`, `NANA_ROLE=""`, `CI=1`, `CI=true`, `memoryPush:false`. That is 18 of 18.
   - These cases also equal main: no agent config, damaged `nana-pack.json`, a pointer to a missing folder, a garbage pointer, a missing marker, a linked worktree, a missing git binary, and a malformed `NANA_PROFILE_GIT_COMMAND`. That is 8 of 8.
   - A cwd outside git falls back to the index with no push. Load reason `repository`.
   - With no index, tip and main both print 0 bytes.
   - A pure fuzz of `makeMemoryBundle` with `seatMemoryLayout` ran 6,000 cases: 0 to 400 records, claims up to 5,000 characters with emoji, newlines and tabs, 0 to 300 index entries, and index paths up to 4,500 characters.
     - Largest output: 8,998. Outputs over 9,000: 0.
     - Bundles over 4,000 record-line characters: 0. Split surrogates: 0. Multi-line records: 0.
     - In the 2 cases that hit the bundle-does-not-fit fallback, output equals `renderMemoryIndex` with no push.
3. Leaks.
   - Across every run, record text appeared 0 times on stderr. It also appeared 0 times in the context-load log.
   - Files under the scratch HOME's `.claude` holding record text: 0. Files in the fixture repo holding record text: 0. Repo `git status --porcelain` was empty.
   - Every builder or reviewer role value and CI printed no record text.
   - The Claude builder and reviewer launchers pass `--setting-sources project,local`, so user hooks do not load in those children. pi-worker also sets `NANA_ROLE=worker`.
   - `identity-scan` findings: 0.
4. Damaged input.
   - A broken profile JSON with an 88-style 300-entry index gives 8,986 characters, ends with the fixed store-error note, has empty stderr and no record text.
   - With a 5-entry index, the output equals main's bytes plus the note exactly.
   - A profile file holding `[]` or a partial object: reason `store-error`, silent.
   - A broken project file: push still `ready`, and `unparseable: 1` is logged.
5. Moved helpers and `profileGit`.
   - Results in scratch:

     | Test file | Result |
     |---|---|
     | memory-run | 8/8 |
     | memory-run-recovery | 7/7 |
     | memory-run-seals | 16/16 |
     | memory-making | 24/24 |
     | memory-session-end | 5/5 |
     | memory-replay | 20/20 |
     | profile-store | 14/14 |
     | profile-sync | 2/2 |
     | shared-memory-budget, R-2340 to R-2346 | 7/7 |
     | shared-memory-hook | 43/43 |
     | shared-memory-input | 3/3 |
     | context-anatomy | 11/11 |
     | shared-memory-push | 5/5 |
     | memory-bundle | 7/7 |

   - `profile-store-guards` has 1 failure, the "verified private" case. It fails the same way on main's scratch copy, because the scratch repo has no `origin`. It is not a lane regression.
   - `profileGit` gets an optional third argument, capped at `PROFILE_GIT_TIMEOUT_MS` (15,000). Existing callers pass two arguments and are unchanged: doctor, nana-profile, nana-memory, memory-run and profile-sync.
   - `resolveMemoryRepository` keeps the same `gitText` errors and the same root selection.
6. `node scripts/identity-scan.mjs --root .` on the scratch tip: `findings=0`, exit 0. Main's copy also exits 0.

## MUST findings

None.

## SHOULD findings

1. The deadline is not a hard bound if git ignores SIGTERM. `spawnSync` sends SIGTERM at the per-call timeout and then waits for the child to exit. A git that ignores or delays SIGTERM kept the hook alive 8,060 ms, past the 5 s SessionStart timeout. Claude Code would then kill the hook, and the seat would lose the index for that session. Output is written only at the end. Real git honours SIGTERM, and Windows timeouts use TerminateProcess, so this is likely outside honest variation. Main's hook makes no git calls, so the exposure is new. Fix: pass `killSignal: 'SIGKILL'` on the push's git calls.
2. A git that takes over 1 s per call always loses the push, even with about 3 s of the deadline left. This is the sealed 1,000 ms per-call choice, which R-3421 pins. Note it if Windows stalls show up in the load log as `deadline`.
3. The hook now statically imports `nana-pack/lib/memory-render.mjs`. Before, every pack import was dynamic and inside try/catch. If the pack folder were absent beside nana-setup, the hook would crash before printing the index. Installs run from the checkout, so this is a residual, not a defect.
