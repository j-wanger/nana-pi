# win-install-shape — the install tests assert Windows' declared install shape (W6a of the Windows fixes, 2026-10-17)

**The feature.** On Windows, `nana-setup install` writes copies instead of links, wires the Claude Code hooks in exec
form from the checkout, skips the spec and py-* skills (R-665 and R-666 decide that), and does not offer uninstall (the
owner's 2026-10-17 call: declared unsupported for now). CI's blocking install check already passes on Windows, but five
install test files fail or crash there because they assert the POSIX shape (`docs/reviews/windows-fixes-2026-10-17/rows.json`):
`install.test.mjs` (20 of 42 failing), `skills-and-standards.test.mjs`, `retired-artifacts.test.mjs`,
`state-manifest.test.mjs` and `uninstall.test.mjs`. After this lane each asserts the Windows shape on Windows, and
uninstall's POSIX cases skip there with the reason.

**Lane class: ordinary** — the changes stay in tests; install code does not change. If a Windows failure shows install
writing something wrong (not just differently), the builder stops and reports it; that becomes an install-class lane.
Threat model: honest variation in Windows paths, links and copies in scope; deliberate forgery out.

## Must-meet (evidence; no new row)

- **IS1.** On the Windows CI leg, `install`, `skills-and-standards`, `retired-artifacts`, `state-manifest` and
  `uninstall` (all under `packages/nana-setup/tests/`) each pass with their macOS count minus declared win32 skips, each
  skip printing its reason; on Windows `install.test.mjs` asserts byte-equal copies for the rules and the requirements
  mirror, exec-form hook entries, and the skipped spec, py-* and PATH entries.

## Known limits

Uninstall on Windows (declared unsupported; port later). The spec and py-* skills are not installed on Windows by
design.
