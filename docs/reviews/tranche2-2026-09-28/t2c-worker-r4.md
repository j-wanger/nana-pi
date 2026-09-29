The label's second line now depends on why the label fired. When the trust store is unusable it names the file and the reason, and tells the owner to repair or remove it first rather than relying on `/trust`. `npm test` exits 0.

**Commit** `2fc8e07` on `lane/t2c-provenance-label`, not pushed.

**Reproduction first:** I put a malformed `trust.json` in a temporary HOME and ran pi's real `ProjectTrustStore` against it:
- `getEntry` threw `Failed to read trust store …/trust.json: Expected ',' or '}' after property value in JSON at position 77`. `/trust` calls it before showing its selector (`interactive-mode.js:4300`).
- `get` and `set` threw the same error, and the file was left unchanged.
- This is now a golden check: "pi's /trust path throws (getEntry) and cannot repair it (setMany)" PASS.

**The two versions of line 2:**
- **No affirmative record, store usable** (unchanged): `To clear this label: start pi in <folder> itself (not a subfolder), run /trust there, then restart the session.`
- **Store unusable:** `To clear this label: the trust store <store> is unusable (<reason>), so /trust alone will not reliably clear this label (it errors on a malformed store) — repair or remove that file first (removing it forgets every saved trust decision), then start pi in <folder> itself (not a subfolder), run /trust there, and restart the session.`
- I checked it end to end: a malformed store renders the second version with the real `…/.pi/agent/trust.json` path and `(malformed)`.

**Each unusable-store case and the reason it shows.** Every case below passes "names the store, the reason and the repair; never /trust alone":
- malformed JSON, an array, a bad value → `malformed`
- a directory, a FIFO → `not a regular file`
- over 1 MiB → `too large`
- mode 000 → `unreadable`
- owned by another user → `owned by another user` (checked through `produceObjective` with a faked uid)

To show the new checks can fail, I temporarily forced the old unconditional text: 15 checks failed, 8 of them the new "never /trust alone" checks. Restored afterwards.

**How it's built:** a new `trustRecord(dir)` returns whether the owner vouched, the store path, and the reason. A missing store still counts as "nothing recorded", not unusable. The decision itself is unchanged; `ownerVouched` just wraps it.

**Wording changes:**
- `working-under-nana-pi.md:33` and `templates/_shared/OBJECTIVE.md:8` now say the label appears "whenever no usable affirmative trust record can be confirmed". They send the reader to the label's own second line instead of repeating a recipe.
- The `nana-setup` seed text (`project.mjs:309`) now reads: "labelled UNTRUSTED DATA while no usable affirmative trust record is confirmed for this folder; the label says how to clear it".
- I also updated `AGENTS.md` and the nana-pack README to describe both remedies, because they made the same unconditional `/trust` promise.

**Tests:** `npm test` exits 0: 71 files, 70 PASS, 0 FAIL, 1 SKIP; 3976 checks pass. The golden test alone has 592 passing checks.

**Still open:**
- `nana-setup trust <dir>` is deferred, as sol ruled.
- Two cases are grouped under other reasons: `~/.pi/agent` being a file (not just a missing store) shows as `unreadable`, and a store that is valid JSON but the wrong shape shows as `malformed`.

**The claim most likely to be wrong:** that "repair or remove that file first" always works for the owned-by-another-user and too-large cases. Removing a foreign-owned store may need more rights than the owner has, and I did not test what pi does with a store over 1 MiB after it rewrites it.

VERDICT: DONE
