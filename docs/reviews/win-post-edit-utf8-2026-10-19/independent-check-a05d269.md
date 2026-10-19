# Independent check — win-post-edit-utf8 at a05d269 (2026-10-19)

VERDICT: HOLDS

Setup: I worked in a private clone (lane a05d269, base f8d2014) under $TMPDIR with a temporary HOME. Versions: macOS, Node 22.22.2, Python 3.14.6. I deleted the clone afterwards. I made no edits to the worktree. Its two untracked files are the seat's mutation-runner files, not mine.

Must-meet tests
- `node packages/nana-pack/tests/post-edit-utf8.test.mjs` on the lane tip prints 4 PASS (R-1740 to R-1743), exit 0. HOLDS.
- The same test file run against the base extension f8d2014: R-1740 FAIL showing `� \\u2014 \\u03bb`, R-1741 FAIL showing `child said: � \\u2014 \\u03bb`, R-1742 and R-1743 PASS, exit 2. The test is red on base as the plan says. HOLDS.

Probes (base vs lane, driving the real `tool_result` handler with user-scope config under a temp HOME)
1. Existing post-edit test files, base then lane:
   - hardening: 22 PASS / 1 SKIP on both
   - status: 32 PASS / 1 SKIP on both
   - file-queue: 5 PASS on both
   No regression. (The plan's 21 and 30 are counts from older main f9cd9fd.) HOLDS.
2. The usual macOS user, `LANG=en_US.UTF-8`, a Python checker that prints its environment:
   - base: `PYTHONUTF8=None utf8_mode=0 stdout=utf-8 ⏎ ï — λ`
   - lane: `PYTHONUTF8='1' utf8_mode=1 stdout=utf-8 ⏎ ï — λ`
   - pi's own env is `{}` before and after the check.
   No visible change, and pi's environment is not touched. HOLDS.
3. The owner sets `PYTHONUTF8=0` under `LC_ALL=en_US.ISO8859-1`:
   - lane: `PYTHONUTF8='0' utf8_mode=0 stdout=iso8859-1 ⏎ � \u2014 \u03bb`
   The owner's value wins, as the known limits say. HOLDS.
4. The owner sets `PYTHONIOENCODING=latin-1` with PYTHONUTF8 unset, Latin-1 locale:
   - lane: `PYTHONUTF8='1' PYTHONIOENCODING='latin-1' utf8_mode=1 stdout=iso8859-1 ⏎ � \u2014 \u03bb`
   The explicit I/O encoding keeps precedence, as the README states. HOLDS.
5. C locale with everything else unset (`env -i ... LC_ALL=C`):
   - base: `utf8_mode=1 stdout=utf-8 ⏎ ï — λ`
   - lane: identical apart from `PYTHONUTF8='1'`
   No change. HOLDS.
6. The win32 code path, forced (`process.platform` set to win32, `comspec=/bin/sh`, Latin-1 locale):
   - base: `PYTHONUTF8=None utf8_mode=0 ... NANA_PI_FILE='/a.txt' ⏎ � \u2014 \u03bb`
   - lane: `PYTHONUTF8='1' utf8_mode=1 stdout=utf-8 NANA_PI_FILE='/a.txt' ⏎ ï — λ`
   The file path variable still reaches the check, and the fix applies on that path. HOLDS. Real cmd.exe was not run here; the Windows result is inferred.
7. A non-ASCII edited path through `{file}` (`café—λ.txt`), Latin-1 locale, a Python checker that prints the name:
   - base: `checked Traceback ... print("checked", os` (UnicodeEncodeError)
   - lane: `checked café—λ.txt True`
   This improves on base. HOLDS.
8. A non-Python (node) checker printing `ï — λ` under the Latin-1 locale:
   - base and lane: `ï — λ`
   Unchanged. HOLDS.
9. A Python check that opens a Latin-1 file with no encoding named.
   - Under `LC_ALL=en_US.ISO8859-1`: base `read ok: 5`, lane `Traceback ...`
   - Under `LANG=en_US.UTF-8`: base and lane both `Traceback ...`
   The lane errors loudly; it does not corrupt data silently. The trade also applies on POSIX, not only on Windows. See Finding 1.
10. A wrong version of the fix: the switch replaced by `PYTHONIOENCODING=utf-8`. R-1740 PASS, R-1741 FAIL, R-1742 PASS, R-1743 FAIL. The tests catch it. HOLDS.
11. `npm run map:check` gives `0 problem(s)`. `npm run readme:check` gives `708 claims checked; 0 problem(s)`. After the test runs, no `postedit-utf8-*` or `nana-home-*` folders are left in $TMPDIR. Nothing is written outside the temp folder. HOLDS.

Findings
1. Known bug (not MUST), documentation scope. The README, in `packages/nana-pack/README.md` (the post-edit section), and the plan's known limits state the file-open trade for Windows only. Probe 9 shows the same trade on macOS or Linux under a non-UTF-8 locale such as Latin-1. There, a Python check that opens a non-UTF-8 file without naming an encoding passed on base and now raises UnicodeDecodeError under post-edit. Such hosts are rare, and the failure is loud, not data loss. Suggested residual: say "on Windows, or a POSIX host with a non-UTF-8 locale".

No MUST findings. The change is limited to a copy of the environment: pi's own environment is unchanged, NANA_PI_FILE still reaches the check on win32, and the owner's PYTHONUTF8, PYTHONIOENCODING, LANG and LC_* values pass through unchanged. Nothing in the gate or land tools changed, and nothing main does today stopped working in any probe. Not verified by me: a real Windows cmd.exe run (the win32 path was forced on macOS), and Linux, where R-1740 and R-1741 are expected to SKIP.
