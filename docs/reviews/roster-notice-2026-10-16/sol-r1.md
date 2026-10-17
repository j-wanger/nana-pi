### MUST

- **Case-variant home paths leak the absolute home path.** `packages/nana-setup/lib/paths.mjs:101-107` compares paths case-sensitively. On case-insensitive macOS or Windows, an honest `PI_CODING_AGENT_DIR` such as `/Users/<user>/...` or `c:\users\<user>\...` still lies under the home folder but is not rewritten to `~`. Both notices then expose the absolute home path, including in Claude context, violating the stated privacy boundary and R-1204.

The locked suite passed: 145 files passed, 0 failed, 2 skipped.

VERDICT: SEND-BACK
