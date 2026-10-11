# Lane product-report — build round 9: renumber three rows (2026-10-11)

Round 8 is verified (acceptance 0 mismatches, title check 0 gaps). It added three rows — right to do,
new behaviour starts as a row — but numbered them R-1031, R-1032 and R-1033. Those IDs are taken:
`main` already holds R-1031 and R-1032 (the Windows CI lane, merged after this branch was cut), and
R-1033–R-1039 are reserved by the `pi-cmd-launch` lane. IDs are never reused.

- [ ] Renumber: R-1031 → **R-1040** (detail title once), R-1032 → **R-1041** (list items),
  R-1033 → **R-1042** (scroll to top). Change the rows, every `// req:` marker that names them, and
  their Evidence; regenerate the outline (`npm run req:tree`). No other change. Any further new row in
  this lane takes the next ID from R-1043.

Then `npm run map:check`, `npm run readme:check`, `npm run test:locked` (summary line), the seat
script into `seat-verify-report-output.txt` (0 mismatches) and the title check into its output file
(0 gaps); commit with explicit paths. Report ≤ 8 lines, first line `VERDICT: …`.
