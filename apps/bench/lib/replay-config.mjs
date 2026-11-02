/**
 * @module apps/bench/lib/replay-config.mjs
 * @purpose Declare replay operational defaults and diagnostic rules with provenance, never study values.
 * @inputs none
 * @outputs Harness defaults, diagnostic precedence, masks and sandbox system paths.
 * @effects none
 * @errors none
 */
// Chosen 2026-11-02: poll once per second to yield promptly without scanning ledgers per event.
export const BUSY_POLL_MS = 1000;
// Chosen 2026-11-02: ten silent minutes permits long tool calls; three hours bounds a replay.
export const STALL_MS = 10 * 60 * 1000;
export const CEILING_MS = 3 * 60 * 60 * 1000;
// Chosen 2026-11-02: bound free git/grader steps separately from a builder's ceiling.
export const CHECK_MS = 5 * 60 * 1000;
export const GIT_MS = 30000;
// Chosen 2026-11-02: deny-by-default Seatbelt permits OS runtime files, not /Users or /private/tmp.
export const SYSTEM_READ_PATHS = ["/System", "/usr", "/bin", "/sbin", "/Library/Apple", "/private/var/db/dyld", "/private/etc", "/dev"];
export const SYSTEM_WRITE_PATHS = ["/dev/null", "/dev/tty", "/dev/random", "/dev/urandom"];
// Node diagnostics/codes; order is fixed precedence (plan A9/O4, 2026-11-02).
export const DIAGNOSTICS = [
 ["syntax", /\bSyntaxError\b|\bTS1\d{3}\b/u],
 ["module-load", /ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND|Cannot find module|does not provide an export named/u],
 ["assertion", /AssertionError|^FAIL\b/mu],
 ["test-crash", /test (?:process )?crashed|uncaught exception/iu],
 ["test-timeout", /test (?:timed out|timeout)/iu],
 ["lock", /suite\.lock|lock (?:held|busy)|folder in use/iu],
 ["permission", /EACCES|EPERM|Permission denied|Operation not permitted/u],
 ["network", /ECONNRESET|ENOTFOUND|ETIMEDOUT|fetch failed/u],
 ["no-remote", /No configured push destination|No such remote|does not appear to be a git repository/u],
];
// pi 1.4.0 dist/core/tools/{edit,read,bash}.js diagnostic strings, checked 2026-11-02.
export const TOOL_ERRORS = [
 ["edit", "edit-mismatch", /Could not find the exact text/u],
 ["edit", "edit-not-unique", /Found \d+ occurrences/u],
 ["read", "read-missing", /ENOENT|no such file/iu],
 ["bash", "bash-timeout", /timed out|timeout/iu],
 ["bash", "bash-nonzero", /exited with code [1-9]\d*|exit (?:code )?[1-9]\d*/iu],
];
// Chosen 2026-11-02: masks are explicit manifest input, not an implicit rewriting of check titles.
export const VOLATILE_MASKS = [];
// Chosen 2026-11-02: audit common public-host routes in addition to the configured remote hosts.
export const REMOTE_HOSTS = ["github.com", "raw.githubusercontent.com", "api.github.com"];
