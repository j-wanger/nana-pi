# Review brief — EARS split batch B (reviewer: gpt-6-astra, ONE round, bc-method shape)

Worktree `~/nana-pi-wt/ears-b`, branch `feat/ears-b`, base `main` `afc026a`, commits `b5c6c73` and `42e46e0`. The method is `bc-method-ruling.md` (read it): split rows start untested; a row is implemented only with one recorded red mutation per named condition or outcome, each record's `pins` quoting the words it covers. The mapping is `batch-b.json`, grouped by package. B covers §14–26: 47 origins, 100 clauses (83 implemented, 17 untested), 93 pins records, and 10 merges. Off form 100 → 53. Your A3 reviews show the failure classes.
1. Run the verifier with `--base main` and `refusal-test.mjs`. Both must be green and change nothing. Confirm the new `pins` check refuses a pins text that is not in its sentence.
2. FORM, the only MUSTs: read every origin against its clauses. Report a lost, hidden or merged promise and a dropped condition. Check the 10 MERGES first. In A1, A2 and A3 every merge but one was rejected, because a mutation could break one promise and keep the other. Try that for each merge.
3. READ: for every implemented row, do its records' `pins` together cover EVERY condition and outcome its sentence names? List each gap as: row, the uncovered words. Gaps are NOTEs.
4. REPLAY one record in five, in file order, starting at index 2. Report red or green.
5. Report the gap rate: implemented rows with a gap, out of implemented rows. A3's was 27/46.
Verdict: `VERDICT: LAND` with no form MUST, otherwise `VERDICT: BLOCK`. Give a score out of 10 and tables.
