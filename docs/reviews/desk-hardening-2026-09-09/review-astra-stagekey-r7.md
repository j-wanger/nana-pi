Static verification only; no execution tool was available.

### A. Deadline recheck — PASS
`apps/desk/server.mjs:718–790`: dispatch and answer acceptance use the same absolute deadline; `>=` rejects the boundary. A late response cannot reach recording or seeding. Its eventual correlated response only settles the abandoned RPC.

### B. Tests — PASS
`apps/desk/test/stage-key-persistence.test.mjs:540–570`: switching back to `fileZ` makes wrong inheritance observable. `recordOf(idSlow) === null` catches even recording without inheritance. The acknowledgement follows the stub’s response write; the subsequent `get_state` round trip provides an ordering barrier before inspection. New writes remain inside `TD`.

The boundary test is timing-dependent, not an exact-clock proof or reliable pre-fix discriminator; that limitation is honestly documented. The elapsed-time discriminator remains.

### C. Documentation — FINDING
**BLOCK — `apps/desk/README.md:378–379`.** The new explanation says “a brand-new fork's copied blocks do not verify,” but copied blocks signed with the live child’s key **do** verify (`server.mjs:260–270`). This reintroduces the missing inherited-only qualification.

**Minimal fix:** say “copied blocks signed only by inherited keys do not verify until those keys are recorded; copied blocks signed by the live child’s key still verify.”

The requested live-plus-recorded wording, prune qualifications, and app-only queued-plus-running cap otherwise landed.

### D. Regressions — PASS
No round-7 runtime regression found. The documentation regression is listed under C.

VERDICT: BLOCK
