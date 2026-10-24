I found no MUST finding, so the verdict is LAND.

**Checks I ran**
- I read the full code diff against main: `nana-land.mjs`, the new keeper `land-ci-records.mjs`, the reader's new result field and host-qualified download, the store's folder option, the per-file limit added to the run record, and the three new tunables.
- I ran four test files alone, and every check passed: `land-ci-records` (all seven, including the seal), `land` (66 PASS), `ci-records` and `suite-records`.
- Since 73aa7538, which passed CI on every leg, the only changes are to HANDOFF, known-bug files, session notes and briefs.
- CI on the tip 71393fac is still running. The seat lands only once that run is green.

**The main question: is it met?**
- **Read once, after the merge:** the keeper runs only when the CI read passed. It runs after the containment check and the release-status read, and outside the review-ledger lock (`nana-land.mjs:208`).
- **Same gh setup as the CI read:** every keeper call goes through the land's gh environment. A download names `github.com/<owner>/<repo>`, so a stray `GH_HOST` no longer breaks it (`ci-records.mjs:143`).
- **Kept once:** the store name comes from the artifact's creation time, the tip, and run, leg and attempt. The same artifact always maps to the same name, so a second keep overwrites it.
  - The store is `nana/ci-runs`, separate from the local suite-record store.
  - Pruning sorts names, which start with the timestamp, so it keeps the newest 4,000 by creation time.
- **Judged against each record's own limit:** `slowFiles` skips any record without a positive `fileTimeoutMs`, and the runner now writes that value into each record.
- **Failures never refuse a merged land:** each record is stored under its own guard. Read, store and budget failures come out as one `CI records` note.
  - The keeper also catches its own throw.
  - `nana-land` separately guards the call and a malformed result, so a merged land never prints `refused:`.
- **Budget:** a call starts only while at least 1 ms of the 60-second budget remains. Its limit is `Math.min(30 s, floor(remaining))`, which is always a whole number of at least 1.
  - The default gh runner returns an error result for a limit that isn't a positive integer, so a bad limit never means "no limit".

**SHOULD and NOTE findings (not blocking)**
- NOTE: on a Windows EBUSY during the prune, `storeSuiteRecord` throws after the new record was already written. The note then says "not kept" for a record that was kept. That is a wrong count in an advisory note; no data is lost. The known-bug list has the related rename-over-open-file line but not this one.
- NOTE: a leftover temporary file with the same name makes the `wx` write fail. Each later land then prints one "not kept" note for that artifact. That needs an interrupted write of the very same artifact, so it is rare.
- NOTE: in a partial budget stop, records already read are still kept, and the note names the budget. That matches R-2755.

VERDICT: LAND
