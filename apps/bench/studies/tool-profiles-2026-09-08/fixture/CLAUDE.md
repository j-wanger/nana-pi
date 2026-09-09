# nana-pi

Pi-platform adoption repo. Read `research/pi-landscape-2026-09-01.md` before touching anything —
it carries the verified capability map (extension events, compaction, sessions, providers,
win32) and the ratified adoption sequence. Do not re-research what it already answers; append
dated addenda when facts drift (pi releases fast).

## Ground rules

- Target the `@earendil-works` scope only; `@mariozechner/*` is deprecated upstream.
- Extensions in `packages/` must stay cross-platform (darwin + native win32) and degrade
  gracefully when a capability is missing (no notifier, no formatter) — never crash the agent;
  remember `tool_call` handler errors BLOCK the tool (fail-safe upstream design).
- An extension gate is advisory-by-load-path: never claim it is un-bypassable. Unattended
  enforcement stays at the container/sandbox layer.
- Verify against the locally installed pi version (`pi --version`, docs under
  `$(npm root -g)/@earendil-works/pi-coding-agent/docs/`) before citing API details.
