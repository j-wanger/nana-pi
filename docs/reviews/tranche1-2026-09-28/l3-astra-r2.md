## L3 round 2 — LAND
Paths below are relative to `~/nana-pi-wt/l3/packages/nana-pack/`.
Source/test review; no independent execution. The merged-tree 68-file/3,178-check pass is seat-provided evidence.

- **MUST 1 — FIXED.** `extensions/nana-handoff.ts:148–157,316–336,425–431`: configured and parent-resolved legacy shapes are excluded before pickup and compaction write. `handoff-trust.test.mjs` covers user, elsewhere-user and trusted-project configurations, absent injected text, refusals and byte preservation.
- **MUST 2 — FIXED.** `extensions/nana-handoff.ts:107–139`: ENOENT is checked for dangling entries/parents before becoming `missing`. Store tests pin both error classifications without `handoff_missing`, and preserve working directory-symlink support.

### Merge resolution
- **Keeping both additions is correct.** `lib/config.ts:135–144,201,257` preserves the positive-number validator and L2’s cap/fatality distinction.
- Invalid `handoff.staleAfterDays` produces a **handoff** diagnostic, excluded by the gate-only predicate; it falls back to default/user value without poisoning gate validity.
- Allow-list overflow alone remains nonfatal; deny/protected-list overflow and other gate errors remain fatal. No semantic merge regression found.

### New defects / residual disposition
- No new blocking defect found. Shape/symlink checks remain advisory and TOCTOU-sensitive; differently named hard links evade shape detection. This is not inode-level exclusion.
- Case-insensitive refusal also rejects distinct `.PI/HANDOFF.md` files on Linux: conservative over-exclusion, accepted.
- `:288` intentionally skips resumed-session pickup. Resume→compact still refuses the write, but supplies only the journal/UI warning—not a new prompt line. Documentation must not promise that line universally.
- New configured-path refusal text has no length budget; long paths can exceed the tests’ claimed 300-character bound. Carry as diagnostic-budget debt.
- README correction is accurate: short escaped pointers retain age/writer; budget pressure trims/drops writer, then age. This does not relax provenance requirements for inlined summaries.

SCORE: 9/10
MUST: []
CARRY:
- **High—L5:** `missing` is not “unadopted.” Apply root/worktree, dismissal and OBJECTIVE filters; deduplicate; distinguish custom/default paths and canonicalize raw journal cwd.
- L5 must not infer adoption from absent pickup/journals, errors, refusals, empty/malformed entries or cwd mismatch. Journaling is optional/best-effort; ancestor messaging can also follow read errors.
- **Medium:** advisory checks/hard-link aliasing; unauthenticated store/provenance; Windows replacement/dangling-link coverage; interrupted-write cleanup, NAME_MAX and full read-resolver integration. Escaped locators are not directly usable read-tool paths.
- **Low:** fresh-only refusal wording, conservative Linux case matching and configured-refusal length. Migration wording and pointer-metadata clarification are resolved.
VERDICT: LAND
