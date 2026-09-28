## L3 land ruling — BLOCK

Read the corpus in order, clean patch, implementation, six tests, and architecture contract. Verified installed pi **0.87.1** APIs/resolver in source. No files changed or tests rerun; the 2,784-check result is seat-provided evidence.

Paths below are relative to `~/nana-pi-wt/l3/packages/nana-pack/`.

### A. Contract satisfaction
- **(a) FAIL.** `handoff-trust.test.mjs` pins ordinary trusted/untrusted legacy pickup, but not custom-path aliasing. At `extensions/nana-handoff.ts:266–281`, an owner-configured absolute `handoff.path = <repo>/.pi/handoff.md` is read and bypasses the cwd check. Fresh repo text is injected immediately after the warning claiming it was not. Compaction also overwrites that file (`:359–378`). No declared exception permits this.
- **(b) Mostly satisfied.** `handoff-store.test.mjs` pins canonical keys, recorded cwd, sibling/worktree separation and failed-write preservation; `handoff-artifact.test.mjs` pins custom writes; `handoff-symlink.test.mjs` pins custom refusals. L1 config tests cover trust filtering. Crash durability and Windows replacement remain unverified.
- **(c) Satisfied for injected summaries, with declared degradations.** `handoff-staleness.test.mjs` pins label, writer, timestamp and precedence. `handoff-store.test.mjs` pins unavailable-writer journaling. Accept omitted age/writer on escaped **pointers**, not as permission to omit provenance from inlined summaries.
- **(d) Satisfied under the seat amendments.** Staleness tests pin threshold/reset, complete long locators, literal `~`, leading `@`, process-relative custom paths, and five escaped-path decoys. The escaped cases are explicitly **not** read-tool locators.
- **(e) Satisfied within extension scope.** `handoff-writer-role.test.mjs` pins byte preservation, suppressed pickup and journals, plus the real launcher with a stub child. This does not prevent a reviewer from writing through other tools.
- **(f) Satisfied.** `handoff-store.test.mjs` pins resume/fork/reload suppression and `/new` pickup.
- **(g), amended: satisfied on tested paths.** Store tests pin ancestor pointer without text, silence without an ancestor, and worktree separation. L5 adoption classification is not yet correct in every failure case.

### B. Context-injection blast radius
| Surface | Covered | Limits |
|---|---|---|
| Handoff injection | Trusted/untrusted legacy defaults; exact root/nested/worktree separation; stale-text suppression; reviewer marker; resume/fork/reload; custom symlink refusal | Custom legacy bypass above; shared custom files intentionally bypass project separation; user-store contents/provenance are not authenticated |
| Persistence/reachability | POSIX failed writes preserve prior bytes; complete ordinary stale locators; explicit escaped locators | SIGKILL/power loss untested; temporary-file litter possible; Windows unverified; escaped paths need exact filesystem access, not decoded input blindly passed to pi `read` |

Default-store symlink acceptance is the approved subtraction, not a defect itself. Custom refusal remains advisory/TOCTOU-sensitive.
The committed “concurrent” test uses synchronous handlers under `Promise.all`, so it does not exercise simultaneous writes; sol’s separate multi-process probe is the concurrency evidence.

### C. Harm and migration
The-hive and basketball-geek intentionally lose automatic repo-summary injection. The warning adequately identifies the surviving source, but “handoff lives in the user-scope store” can suggest migration. Prefer “left unchanged here; not migrated; future summaries use …”.
Dropping age/writer from the exceptional pointer is acceptable: no summary is inlined, the block identifies its class, and provenance remains in the artifact. Record this as a pointer-specific contract exception.
One `handoff_missing` per eligible fresh session is acceptable collection volume; L5 should deduplicate reporting.

### D. L5 seam — insufficient as currently implemented
`extensions/nana-handoff.ts:101–105` maps **every ENOENT** to `missing`. A dangling default-store entry, or dangling `handoffs/` symlink, produces ENOENT despite being a **broken store**. `:277` then emits `handoff_missing`. This is a source-traced counterexample, absent from the tests.
Classifying dangling links as errors does **not** require restoring default-store symlink refusal.
L5 must not equate missing with unadopted: apply repository-root/worktree detection, dismissal marker and `OBJECTIVE.md`; a nested miss does not prove a root miss.
Nor may it infer adoption from absent pickup/journals, empty/malformed files, cwd mismatch, refusals, or errors. Custom-path misses are not necessarily default-store misses; journal cwd is raw, and journaling is optional/best-effort.

### E. Seat conduct
AGENTS expansion, config matrix addition, default-symlink subtraction and fresh `Source:` escaping were declared. The approved assertion removals have valid reasons.
Earlier “DONE” claims exceeded verification: r2 admitted unresolvable ellipsis paths; r3 omitted known character cases. R4 materially improves verification, but resolver-helper tests are not complete read-tool integration.
The r1 custom-legacy exception was disclosed as a residual but never reconciled with Jake’s binding “never injected” rule. It cannot silently amend that rule.

### F. L2 coupling
L2’s `tests/gate-self-protection.test.mjs:56–76` explicitly allows handoff-store edits/writes and shell redirection. L3’s config change is one additive leaf with schema/default/matrix coverage.
No semantic conflict found; preserve both lanes’ README/AGENTS sections and rerun acceptance on the merged tree.

**SCORE: 7/10**

**MUST**
1. Enforce the legacy-file exclusion even through custom configuration; pin user-scope and nana-trusted project cases, absence of injected text, and preservation of existing repo bytes.
2. Distinguish genuine absence from dangling-entry/parent-link failures; pin both broken-store cases as errors with **no `handoff_missing`**, while retaining legitimate symlink support.

**CARRY — priced by cost of error**
- **High:** L5 root/adoption filters and deduplication; false adoption reports misdirect seat action.
- **Medium:** Windows replacement, interrupted-write cleanup, NAME_MAX custom writes, and full read-resolver integration.
- **Low:** migration wording and explicit documentation of pointer-only provenance omissions.

**Upstream-contract declaration:** This replaces nana’s repo-local continuity contract, not pi’s API. Accept the declared storage, staleness, role, symlink and amended-(g) changes, including exceptional pointer metadata omission. Do **not** accept custom legacy injection or broken-store-as-missing as undeclared amendments.

**VERDICT: BLOCK**
