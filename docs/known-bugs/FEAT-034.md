# FEAT-034 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*
- Bench study evidence (bench-study-scratch, plan): until this lane, a suite test deleted the shipped tool-profiles study's code-bugfix evidence in any checkout that ran it. On this machine that folder is gone, and 12 recorded results still point into it (the seat infers the suite deleted it).
- Bench study evidence (bench-study-scratch, plan): a test that again removes a shipped study's evidence would still pass where that folder is absent. That is CI, and this machine today.
- Bench study evidence (bench-study-scratch, plan): someone running the bench or the catch-ledger script on a shipped study during the suite can change its listing. The listing check then fails.
