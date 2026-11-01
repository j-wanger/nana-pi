# FEAT-041 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*

- Context shaping (context-anatomy, plan residual): a hard kill of claude-review leaves its settings file in the temp folder.
- Context shaping (context-anatomy, plan residual): a `%`, `!` or `"` in the temp path blocks the Windows `.cmd` launch, as for the Claude Code builder.
- Context shaping (context-anatomy, plan residual): concurrent load-log writers are not pinned by a test; a torn line is possible.
- Context shaping (context-anatomy, plan residual): the roster names the reviewer by alias, so a per-model effort entry keyed by the full model id is not matched and the top-level level applies.
- Context shaping (context-anatomy, plan residual): a review whose movement names no feature with a known-bug file and whose brief has no Feature line gets no known-bug section.
- Context shaping (context-anatomy, seat measurement): the account email stays in the Claude reviewer's context; it comes from login, not settings.
- Context shaping (context-anatomy, seat measurement): a per-model effort level that is not a string blocks the fallback to the top-level level.
- Context shaping (context-anatomy, seat measurement): carried environment names match case-insensitively while the sealed environment overrides by exact name.
- Context shaping (context-anatomy build 2): a known-bug file's header is always delivered whole, so a large header can exceed a feature's share of the cap.
- Context shaping (context-anatomy, final review): the Claude Code builder launched by pi-worker still gets no `--effort`; the reviewer now does.
- Context shaping (context-anatomy, final review): when brief-matched known-bug lines alone exceed the cap, some precedent-matched lines fold behind the read-the-whole-file line.
- Context shaping (context-anatomy, final review): the ancestor-exclusion glob escapes `]` as `[]]`, unverified across glob engines.
- Context shaping (context-anatomy, final review): when the home folder is itself a git repo, the load log is skipped on every launch with one stderr line.
- Context shaping (context-anatomy, independent check): claude-review builds ancestor excludes from a symlinked `--tree`'s link path, not its real path, so real ancestors load as on main.
- Context shaping (context-anatomy, independent check): indented continuation lines and sub-headings in an over-cap known-bug file are dropped and not counted in the fold.
- Context shaping (context-anatomy, independent check): on a Claude-only machine with no `~/.pi` the hook creates `~/.pi/agent` for its log.
- Review ledger (context-anatomy, independent check): a hung `claude -p` reviewer has no stall timeout in review-ledger, so a review can hang until killed.
