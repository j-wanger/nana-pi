# Lane product-report — build round 10: five suite gaps the seat's mutation run found (2026-10-11)

Round 9 is verified. The seat's mutation runner (`seat-mutate.py`, this folder) turns 16 of 21 code
mutations red; five leave `product-report.test.mjs` green. Tests only — no code change. Each new test
carries its row's `// req:` marker:

- [ ] **R-1024:** a store rating a feature `solid` while one of its OWN stamped rows is `planned` is
  refused (today only `untested`/`violated` are tested; dropping `planned` from the check passes).
- [ ] **R-1021:** a row that moves home and is shared back into its old feature (same text, same
  status, mark own → shared) makes that feature out of date and names the row as changed (ignoring
  the mark passes today).
- [ ] **R-1018:** the rendered Decisions view shows each ask's FULL body text (blanking the body
  passes today).
- [ ] **R-1019 (route guard):** rendering with hash `#constructor`, `#__proto__` and
  `#hasOwnProperty` shows the Decisions view and does not throw (looking views up without the
  own-property check passes today).
- [ ] **R-1029:** `--packets` on a non-empty directory exits non-zero and leaves the directory's files
  unchanged (dropping the refusal passes today).

Wrong code first: apply each mutation from `seat-mutate.py` by hand, see the new test fail, restore.
Then run `python3 docs/reviews/product-report-2026-10-11/seat-mutate.py > docs/reviews/product-report-2026-10-11/seat-mutate-output.txt 2>&1`
— it must end `mutations: 21/21 red` and `worktree clean` (do not edit it). Then
`npm run test:locked` (summary line), the seat script and title check into their output files,
commit with explicit paths (include `seat-mutate.py` as is). Report ≤ 10 lines, first line
`VERDICT: …`, the last two lines of each output file verbatim.
