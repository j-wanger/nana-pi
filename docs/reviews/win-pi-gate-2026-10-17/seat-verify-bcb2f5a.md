# Seat checks — win-pi-gate builds 1 to 3, tip bcb2f5a (2026-10-17)

- Full suite on the Mac on bcb2f5a: `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7457 pass, 0 fail, 14 skip · 773.1s`, exit 0.
- CI on draft pull request #19. Run 1 (39085116653): four of five target files pass; agent-dir-parity dies on EBUSY at its final cleanup.
  Run 2: the same after a retry. Run 3 (`ci-windows-run-3.log`): every target file passes on Windows — agent-dir-hostile 18 (+1),
  agent-dir-parity 31 (+4), gate-corpus 227, gate-policy-paths 93, lane-write-guard 9; macOS and both install checks green; Windows failing
  49 of 150 files. The Linux leg fails only lane-write-guard's symlink-escape check, as main does.
- No wrong-code pairs and no independent check: an ordinary lane (tests only; no gate code changed).
