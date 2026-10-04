# Seat verification after astra r3 (the cap), EARS batch 0 — 2026-10-04

astra r3 was BLOCK 8/10 on one item: Python's `re.IGNORECASE` folds U+0130, U+0131, U+017F and U+212A into `[A-Za-z]`. astra said that after the flag fix, mechanical verification is enough and no further round is needed. The fix commit is `041e4e8`.

| Check | Result |
|---|---|
| `conftest.py:80` | `re.IGNORECASE \| re.ASCII` |
| `node docs/reviews/ears-form-2026-10-04/boundary-sweep.mjs`, run by the seat | 1,114,112 codepoints swept, **Differences: 0**. The TS side imports the rail; the Python side imports the real `conftest.SHALL_RE`. |
| Worker mutation (remove `re.ASCII`) | the new parity fixtures turn red (`shallİ` expected 1, got 0) |
| Rendered suites (worker) | TS 52/52, Python 58/58 |
