**Commit:** `a33c77a` on `lane/t2c-provenance-label`, not pushed. The tree is clean.

**The two probe cases:** both were unlabelled before and both are labelled now. The test log shows `PASS T2c .pi/settings.json, no trust.json: LABELLED` and `PASS T2c .pi/settings.json + trust.json records false: LABELLED`.

**The predicate as it now reads:** `ownerVouched(dir)` (renamed from `ownerDecidedTrust`) returns true only when the nearest recorded entry in `~/.pi/agent/trust.json` for the folder or an ancestor is `true`. A recorded `false` returns false, and so does no entry at all. Anything wrong with the store also returns false: unreadable, malformed, wrong shape or value, not a regular file, a FIFO, over 1 MiB, or owned by another user. The non-blocking open is still there. The label is set by `!!g && repoSupplied && !ownerVouched(dirname(governing))`, so the umbrella is still never labelled.

**What I deleted:** `piWouldAsk()`, the `TRUST_REQUIRING` list, the `.agents/skills` walk, and the `ownerDecidedTrust` wrapper that joined them with an OR. `grep` for `piWouldAsk|TRUST_REQUIRING|hasTrustRequiring|.agents` in `lib/objective.ts` and the hooks finds nothing. I also changed the label wording from "never decided trust" to "has not recorded trust", because the old wording was false for a recorded decline.

**README consequence sentence:** "more folders are labelled than under 'trust was decided'. Any repo trusted only in-session, without `/trust` saving the decision, carries the label until the owner runs `/trust`. That is intended: the label means 'I could not confirm you vouched', and it names the one action that clears it."

**Retargeted pi comparison:** the check is now `ownerVouched(dir) === (new ProjectTrustStore(getAgentDir()).get(dir) === true)`. The test says outright that nana's label is deliberately stricter than pi's trust and does not follow pi's resource list or `isProjectTrusted()`. The comparison actually ran against the installed pi, with no SKIP, and agreed on both true and false (folder, parent, `null` falling through to a parent, BOM, symlinked store).

**Corpus changes:** every `.pi/*` resource, an ancestor `.agents/skills`, and in-session-only trust (`isProjectTrusted()` true, nothing recorded) are all labelled now. A resource plus a recorded `true` is not labelled. All fail-closed cases are still labelled.

**`npm test`:** exit 0. 71 files: 70 PASS, 0 FAIL, 1 SKIP; checks 3908 pass, 0 fail, 6 skip. `objective-golden` passed 524 checks.

**Residuals:**
- The label text changed, so the exact wording that shows in a session is new.
- The pi comparison still skips on a machine without pi installed.
- The size cap and FIFO cases still have no pi comparison.

**Most likely wrong:** that nothing else relied on the old label wording or on the name `ownerDecidedTrust`. I only searched `packages/` for them; the desk, the HANDOFF notes and other lanes were not checked.

VERDICT: DONE
