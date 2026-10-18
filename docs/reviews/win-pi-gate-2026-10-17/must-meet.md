# win-pi-gate — the pi seat's gate and agent-folder handling are proven on Windows (W5a of the Windows fixes, 2026-10-17)

**The feature.** The pi seat's command gate (`nana-gate`), its policy paths, the lane write guard and the agent-folder
resolution run on Windows, but their tests stop early there for test reasons (`docs/reviews/windows-fixes-2026-10-17/rows.json`):
a moved `HOME` without `USERPROFILE` (`gate-corpus.test.mjs:248,260`), a file URL and a `file://` string used as paths
(`gate-policy-paths.test.mjs:195,202`), a `/tmp` alias Windows does not have (`lane-write-guard.test.mjs:17`), a live
working folder Windows will not delete (`agent-dir-hostile.test.mjs:120`), and the frozen desk's pi resolver called at
import (`agent-dir-parity.test.mjs:37,131`). Three of the five crash before their first check. After this lane the five
files run to their end on Windows.

**Lane class: ordinary** — the changes stay in tests. The gate's own `/tmp` extra lane root on win32
(`extensions/nana-gate.ts:197`) is a gate-class known bug and stays out of this lane. If a check hidden behind a crash
fails on Windows because of gate or library code, the builder stops and reports. Threat model: honest variation in
Windows paths, home folders and process behaviour in scope; deliberate forgery out.

## Must-meet (evidence; no new row)

- **GA1.** On the Windows CI leg, `gate-corpus`, `gate-policy-paths`, `agent-dir-hostile`, `agent-dir-parity` and
  `lane-write-guard` (all under `packages/nana-pack/tests/`) each pass with their macOS count minus declared win32 skips,
  each skip printing its reason; `agent-dir-parity`'s pack and nana-setup legs run on Windows and only its desk leg skips.

## Known limits

The desk's pi resolver on Windows (frozen); the gate's `/tmp` lane root on win32; deleting a live working folder is
POSIX-only.
