# win-setup-tools — doctor, restore, trust and the install check's own tests run on Windows (W6b of the Windows fixes, 2026-10-18)

**The feature.** `nana-setup doctor`, `restore` and `trust`, and the install-check tool, run on Windows, but four test
files fail or crash there for test reasons (`docs/reviews/windows-fixes-2026-10-17/rows.json`): a launchd desk block
that is macOS-only (`doctor-detail.test.mjs:78`), raw paths handed to `import()` (`restore.test.mjs:36,38`,
`trust.test.mjs:25`), a relative path across drives (`trust.test.mjs:82`), a tar invocation that may not accept a drive
path (`restore.test.mjs:111-112,146`), and `/`-joined expectations (`install-check.test.mjs:77-78`). After this lane the
four files run to their end on Windows.

**Lane class: ordinary** — the changes stay in tests. If restore's tar layer fails on Windows because the product's
backup command is POSIX-only, the builder reports it rather than changing the product; the doctor's `getuid` call
(`lib/doctor.mjs:650`) stays a known bug. Threat model as the other Windows lanes.

## Must-meet (evidence; no new row)

- **ST1.** On the Windows CI leg, `doctor-detail`, `restore`, `trust` and `install-check` (all under
  `packages/nana-setup/tests/`) each pass with their macOS count minus declared win32 skips, each skip printing its reason.

## Known limits

The launchd desk service is macOS-only. Restore's tar half may be POSIX-only on Windows if the archive tool cannot take
a drive path.
