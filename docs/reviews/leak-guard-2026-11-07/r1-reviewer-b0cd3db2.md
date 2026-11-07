**Review of leak-guard (14eb4c34..59d08cd5): one MUST stands. On macOS the gate misses the default temp-path spelling.**

The lane's test file passes locally (10 of 10), and the worktree stayed clean. I checked the gaps below with throwaway repos in the OS temp folder, running the lane's own CLI.

## MUST

**1. On macOS, the gate misses temp paths in the spelling builders and seats actually commit.** (`packages/nana-pack/lib/leak-scan.mjs:24`, `:38`)

- **Cause:** off Windows, the default temp root is only `realpathSync.native(tmpdir())`, which is `/private/var/folders/<a>/<b>/T`. Only Windows matches both the given and the real spelling. Node's `os.tmpdir()`, `$TMPDIR`, and every `mkdtemp(os.tmpdir()…)` path use `/var/folders/<a>/<b>/T`. The match is a plain substring, so the longer `/private` form never matches the shorter text.
- **Input:** a lane commit whose `a.log` holds `${os.tmpdir()}/leak-guard-x/log`.
- **Result:** `leak scan summary: 0 hits, 0 skipped`, exit 0, so `&& git push` publishes it. The same text in the `/private/var/folders` spelling exits 1.
- **The input is real:** 48 tracked files at HEAD carry this machine's temp root in the short spelling. Most are builder full-suite logs and seat mutation outputs (for example `docs/reviews/builder-anatomy-2026-11-01/full-suite.txt`). A probe running the gate's own checks found that 38 of them hold no home path, no `/private` spelling and no identity word. The gate would have passed all 38.
- **Why it is a MUST:** this blocks the main use the brief names (no absolute temp path reaches the remote) on macOS, the seat's platform. The spelling difference is honest variation in our tools' output, which the threat model covers. Plan A2 added the literal check precisely to catch "Mac `/var/folders` temp paths".
- **Fix:**
  - In `machineCount`, combine the given and real spellings on every platform, not just win32.
  - Default `tmp` to `tmpdir()` everywhere.
  - Add an M4 case pairing `/var/folders/x/T` with `/private/var/folders/x/T`, and widen R-3751's "on Windows" wording.
  - The longest-first alternation already counts each occurrence once.

## SHOULD

- **A leak fixed by a later commit still gets pushed.** (`leak-scan.mjs:50-58`) The scan reads only the tip version of each file, so an earlier commit's leaking version is never checked. If commit 1 adds a log with a temp path and commit 2 cleans it or deletes it, the gate exits 0 and the push still sends commit 1's version. I reproduced this. The seat bullet says to "fix the commit", which avoids the problem. But a seat that adds a fixup commit and re-runs the gate gets a false all-clear, and rewriting an older commit is awkward without an interactive rebase. pi-worker's build-end scan has the same gap within one build. Scanning each commit's changes in the range (`git rev-list base..tip`, then a per-commit diff) would close it.
- **The plan's known-bug lines were not written.** Plan line 48 lists them: the tokenizer gaps, file-URL and JSON-escaped paths, a stale seat rule copy until the next `nana-setup install`, and no enforcing hook. The README states them, but `docs/known-bugs/FEAT-041.md` was not updated.

## NOTE

- **Hit lines print the file's repo path** (`leak-scan.mjs:74`). A file whose name contains an identity word echoes that word on stdout and stderr. The output stays local, and any file that pastes it would itself be flagged.
- **`--base main` compares main with the tip directly, not from where the lane branched.** If main has moved on, files that main changed are scanned at the lane's older version, which can flag already-public content.
- **Changed allowlisted files are flagged.** These files are frozen or byte-pinned, so this is rare.
- **On Linux the temp root is `/tmp`.** Any committed mention of `/tmp/…` would be flagged; 362 tracked files mention it today. There is no recorded Linux seat.
- **The gate is cut off only by a backtick, comma or parenthesis directly after the bare home or temp root.** That case is missed (only a separator, quote, whitespace or end of text closes a match), but a home path still has the identity-word check behind it.
- **A submodule entry in the range makes the scan exit 2.** It fails loudly, not silently.
- **Windows PowerShell 5.1 does not support `&&`.**

## The brief's checks

- **No echo:** the counts-only lines and the record are clean, and M5 checks the CLI output, pi-worker's stderr and the record. The one exception is the repo path in the NOTE above.
- **Committed content only, and no allowlist bleed:** the scan reads tip blobs only and never the worktree. It never consults the allowlist, so M2 holds.
- **Never silent:** a config, ref or git failure makes the CLI exit 2. pi-worker records `{unavailable}` and prints one line. pi-worker writes a leaks field only in lane mode, and the leaks lines are printed only when that build-end record was written.
- **4 MiB cap:** the size is checked with `cat-file -s` before any content is requested. The blob read's buffer is also capped, and M6's preload confirms nothing is read past the cap.
- **R-3748 to R-3756:** each matches its tagged test. The one gap is R-3751, which says "on Windows" and so writes down the macOS gap above.
- **Lane history:** scanning each lane commit against its parent found 0 hits. No lane-changed file holds the short temp spelling.

VERDICT: SEND-BACK
