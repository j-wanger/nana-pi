## T2c land ruling

Read the corpus in order, then the patch, implementation, tests, declarations and installed pi trust/locking code. Read-only; no tests rerun. **71 files / 4262 checks / exit 0** is seat-verified evidence. New findings below are static, not executed probes.

### A — Contract substantially implemented, not satisfied
- Affirmative-only, nearest-record semantics, decline precedence, umbrella exemption and unusable-store labelling are implemented. Resources and live auto-trust cannot clear the label.
- One producer preserves extraction, sanitization, unconditional walk-up and precedence. Golden tests compare both adapters without concealing newline differences.
- README honestly records Jake’s label-only decision and residual semantic injection. I do **not** substitute trust-gating.
- Universal parity is unproved: the relative-override test exercises only the predicate; foreign ownership is mocked in-process. Actual-host rendering, Windows, ACLs and read-only volumes remain unverified.

### B — The remediation is still not universally true
**HIGH — Following the remedy can change the active store.**
`lib/objective.ts:439–440`, `lib/gate-paths.ts:65–72`: start in `/repo/src` with `PI_CODING_AGENT_DIR=agent`; the active store is `/repo/src/agent/trust.json`. With `/repo/OBJECTIVE.md` governing, the label says start pi in `/repo`. That process instead writes `/repo/agent/trust.json`. Restarting the original nested session still labels it. Preserve the original **absolute active agent directory** during remediation. T12’s relative test never follows this transition.

**HIGH — Folder writability does not establish pi lock usability.**
`lib/objective.ts:296–378` never examines `trust.json.lock`. A regular file at that path obstructs pi’s `mkdir`-based lock: initially `ELOCKED`, later failed directory removal. An otherwise valid affirmative store still returns `vouched:true`; pi’s `get()` throws. Without an affirmative record, the label promises ordinary `/trust`, which also throws. This repeats the fail-open rationale behind fix 5.

**MEDIUM — A dangling agent-directory symlink is mistaken for absence.**
The `statSync`/ENOENT walk in `writeProblem()` reaches a writable ancestor and emits ordinary `/trust` advice. Pi cannot recursively create the directory through that dangling entry. The obstructing link—not a nonexistent store—needs diagnosis.

- **Read-only store file, writable folder:** clearing on a readable affirmative is correct; pi locks beside the file and need not rewrite it.
- **Read-only volume / ACLs / root:** `accessSync(W_OK|X_OK)` is a preflight, not proof that lock creation succeeds. Root may legitimately bypass mode bits; skipped chmod tests establish nothing there.
- **Staleness:** README acknowledges it, but emitted removal advice does not tell the owner to recheck or back up. Removing a subsequently repaired store loses decisions, including declines.

### C — Harm and default
Labelling `~/aml-desk`, `~/the-hive` and other unconfirmed repos is the correct default under Jake’s ruling. “Could not confirm” appropriately avoids claiming maliciousness or absence of an owner decision.
The DATA wording is understandable independently; its tension with “governing” is the accepted residual, not a new blocker. However, `/trust` also enables project resources—it is not merely dismissing a provenance warning.

### D — Seat conduct
Four specification errors caught downstream indicate inadequate contract derivation, not four unforeseeable edge cases. The seat should have traced `/trust` through directory resolution, lookup, locking and writing before specifying its remedy.
Acknowledging errors, preserving regressions and commissioning implementation after the sol cap were correct. The cap limits review rounds, not necessary repairs; those repairs do not constitute sol approval.
The final patch spans 11 files and exceeds the original appetite; no required checkpoint appears in the supplied reports.

### E — Coupling
Sharing `piAgentDir()` improves gate/objective consistency and fixes tilde protection. T2b is untouched.
Fix 5 also changes default/relative **umbrella resolution**, not just provenance. README/header document this; `AGENTS.md:17` still declares the old default unconditionally.
The landed `config.ts:276` deny-policy defect is correctly a **separate urgent item**: T2c neither introduces nor needs it to implement the label. Filing it was appropriate; leaving it indefinitely is not.

SCORE: 6/10
MUST:
- Preserve active-store identity across the remediation’s cwd change; test the actual restart sequence.
- Handle obstructed lock paths and dangling directory links fail-closed with truthful recovery guidance; add pi-oracle regressions.
- Reconcile declarations with actual guarantees, including `AGENTS.md`’s umbrella default and README’s unconditional clearing language.
CARRY:
- **HIGH cost:** landed agent-dir/config inconsistency can silently discard custom denies; prioritize a separate cross-consumer fix.
- **HIGH, explicitly accepted:** untrusted governing text can steer permitted actions; the label is not containment.
- **MEDIUM:** recheck/back up before removal; explain `/trust`’s broader effects; validate ACL/read-only-volume/root/Windows behavior.
- **MEDIUM:** unlocked reads, concurrent store growth and actual-host parity remain unbounded or unproved. **LOW:** one-command vouch convenience.
Upstream-contract declaration: T2c adds affirmative-record provenance semantics, shares active-directory resolution with the gate, and relocates default/relative umbrella lookup under overrides. Precedence and extraction remain unchanged; declarations and universal remediation claims are not yet accurate.
VERDICT: BLOCK
