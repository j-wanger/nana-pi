**R2 disposition**
- HIGH — `…/<tail>` was unresolvable: **FIXED** by full resolvable candidates and no truncation (`nana-handoff.ts:76-89,179-194`).
- HIGH — long/NAME_MAX paths were cut: **FIXED/RULED**; paths remain whole even above 300 chars (`:179-194`).
- MED — literal `~` or leading `@` could target a decoy: **FIXED** (`:78,85`).
- L5 missing/error conflation: **FIXED** with discriminated `HandoffRead` and distinct journals (`:95-104,244-247`).

**NEW**
- HIGH — the “always resolves” invariant remains false. Pi normalizes Unicode spaces, while `resolvablePath` emits them unchanged (`:76-89`); `stalePointer` rewrites tab/CR/LF to spaces (`:180`). Temp-HOME probes through installed `resolveToCwd` failed for NBSP, tab, CR, and LF paths. These can resolve to an ASCII-space decoy, not merely fail.
- Coverage explicitly models Unicode-space normalization (`handoff-staleness.test.mjs:12-35`) but tests none of those path names (`:215-279`).
- Exact-cwd, symlinked-cwd, normal-space, literal-`~`, leading-`@`, and relative-custom cases resolve correctly in probes. Relative custom paths resolve to what Node actually opened—process-cwd-relative—not necessarily what users may expect from session cwd.
- Dropping the authority tail before writer does **not** lose writer provenance; the block heading still says agent-written. It does lose explicit precedence wording, but no stale content is injected, so this is a low residual.
- `handoff_missing` once per fresh unadopted session is acceptable signal volume; L5 should deduplicate rather than suppress collection.

**CARRY for astra**
1. **P0 / high cost:** reject or explicitly mark read-tool-unaddressable Unicode-space/control paths; never claim “one read away,” and add decoy probes.
2. **P1 / high cost:** L5 must treat only `kind:"missing"`/`handoff_missing` as an adoption candidate—never errors, symlink refusals, malformed/empty files, cwd mismatch, or absence of pickup.
3. **P2 / medium cost:** specify relative `handoff.path` semantics (process cwd versus session cwd) and pin them.
4. **P3 / low cost:** L5 dedupe/retention for repeated missing signals; clarify the authority-tail degradation.

Target staleness suite passed under temp HOME; the special-character probe exposes the blocker.

VERDICT: BLOCK
