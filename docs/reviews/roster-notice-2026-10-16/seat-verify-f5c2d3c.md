# Seat checks after build 3 (2026-10-17, at f5c2d3c)

- The round-1 MUST (case-variant home path) is fixed in the shared tilde helper, case-insensitive on darwin and win32.
- The seat's acceptance: 298 of 298. Title check: 0 missing.
- The seat's mutation runner, split five ways: 71 of 71 red (`seat-mutate-output-f5c2d3c.txt`).
- Full suite at 633d41b had one failing file, a comment in the seat's own runner that the agent-dir scan matched; fixed
  in 2862505. The land helper runs the full suite on the final tip.
