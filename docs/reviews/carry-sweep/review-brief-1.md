Feature: FEAT-031 · Run checks reliably and without contaminating work
Card: fix

# Review brief 1: carry-sweep

Review the whole lane: `git diff main...HEAD` on branch feat/carry-sweep. Docs only: known-bug files.

Reviewers had said LAND on several lanes, so their SHOULD/NOTE findings were kept in the seat's private notes rather than added afterwards. This lane checks each against main 57e5c926, records the still-true ones as one line in `docs/known-bugs/<FEAT>.md`, drops stale ones, and removes known-bug lines describing the retired land-side clean-merge path (land-merged-tests, 57e5c926, retired it).

Questions:
- Is each added line true at this tip and filed under a plausible feature?
- Was any removed known-bug line still true (a real open defect deleted)?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
