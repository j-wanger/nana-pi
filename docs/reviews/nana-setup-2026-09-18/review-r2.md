## R1 verification

1. **HIGH — duplicate pi registration:** **FIXED** — `lib/steps.mjs:336-345` expands `~`, resolves relative paths, realpaths both sides, and compares `gitCommonDir`. The concrete main-checkout entry is recognized from this linked worktree.

2. **HIGH — non-atomic/concurrent settings overwrite:** **PARTIAL** — `lib/steps.mjs:92-111` prevents truncation/ENOSPC corruption and detects edits before its re-read. However, the compare and rename are not atomic together. With a large settings file, an editor writing after line 99 but while line 109 writes the temp file is silently overwritten by line 111. The original concurrent-edit failure therefore remains, in a narrower window. **HIGH.**

3. **HIGH — Windows copy destroys existing rule:** **FIXED** — `lib/fsops.mjs:43-63` backs up regular targets and unlinks symlinks without writing through them.

4. **MEDIUM — `{"hooks":"disabled"}` causes partial install:** **FIXED** — shape validation occurs at `lib/steps.mjs:82`, before filesystem steps begin at `lib/steps.mjs:383-387`.

5. **MEDIUM — generated commands fail with spaces:** **FIXED** — `shq` safely quotes paths at `lib/settings.mjs:14`; generated bash/node commands use it at `lib/settings.mjs:37,73`.

6. **MEDIUM — long-path fallback selects sibling project:** **FIXED** — `claude/hooks/nana-shared-memory.sh:21-43,71-75` reproduces the hash and constructs the exact directory rather than globbing. The A/B shared-prefix input creates A’s directory without touching B.

7. **MEDIUM — substring hook matching:** **FIXED for the stated input** — `echo nana-objective.sh.disabled` fails both interpreter and script-boundary checks at `lib/settings.mjs:25-31`.

## New regressions

- **MEDIUM — hook matching still accepts commands that merely mention an invocation.** `lib/settings.mjs:28-31` tests the interpreter and script independently, without parsing their execution relationship. Concrete input:
  ```json
  {"hooks":{"SessionStart":[{"hooks":[{"command":"echo bash /tmp/nana-objective.sh"}]}]}}
  ```
  This is considered installed, so install omits the real hook and doctor reports healthy.

- **MEDIUM — unrelated remote URLs are accepted as nana-pi registration.** `lib/steps.mjs:338` matches only the path fragment. Concrete input `https://evil.example/archive/j-wanger/nana-pi` returns true, suppressing `pi install` and making doctor report registration present.

VERDICT: BLOCK
