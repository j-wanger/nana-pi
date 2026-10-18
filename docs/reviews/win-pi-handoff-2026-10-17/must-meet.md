# win-pi-handoff — the pi seat's handoff, display and post-edit are proven on Windows (W5b of the Windows fixes, 2026-10-17)

**The feature.** The pi seat's handoff store and artifact, the staleness pointer, the display surfaces, the post-edit
queue and the frontier checker run on Windows, but their tests fail there for test reasons
(`docs/reviews/windows-fixes-2026-10-17/rows.json`): substring matches on raw JSON that holds escaped backslashes
(`handoff-store.test.mjs:193`, `handoff-trust.test.mjs:108,115`), `/`-joined expectations (`frontier.test.mjs:44`,
`handoff-staleness.test.mjs:87,111,139,159`, `post-edit-file-queue.test.mjs:67`), 8.3 short temp paths compared with long
ones (`handoff-artifact.test.mjs:60`, `handoff-staleness.test.mjs`), and file names NTFS forbids
(`display-surfaces.test.mjs:161,219,273,291`). Two crash early. After this lane the seven files run to their end on
Windows.

**Lane class: ordinary** — the changes stay in tests; the suite runner (`scripts/test.mjs`) is not touched, so 8.3
paths are resolved inside the tests that compare them. If a check hidden behind a crash fails on Windows because of
product code, the builder stops and reports. Threat model as the other Windows lanes.

## Must-meet (evidence; no new row)

- **HD1.** On the Windows CI leg, `handoff-artifact`, `handoff-staleness`, `handoff-store`, `handoff-trust`,
  `display-surfaces`, `post-edit-file-queue` and `frontier` (all under `packages/nana-pack/tests/`) each pass with their
  macOS count minus declared win32 skips, each skip printing its reason; `display-surfaces` keeps at least one
  Windows-legal hostile name per probe.

## Known limits

Names with LF, ESC or other characters NTFS refuses are POSIX-only cases.
