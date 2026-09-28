There is also a new runtime-contract mismatch: the hook now invokes a `.ts`-importing CLI without a strip-types flag, whose header requires Node ≥22.18, while `packages/nana-setup/README.md` still promises Node ≥22. Doctor also reports invalid `projectFile` values such as `../OBJECTIVE.md` as successful renames, though the producer rejects them. These affect the lane’s declared compatibility, unlike the inherited post-edit/handoff surfaces.

## T2a land ruling

Read the corpus in order, then the patch, implementation, tests and consumer declarations. Read-only: I did not rerun tests; **70 files / 3498 checks / exit 0** and the notification probe are seat-verified evidence.

**A — Substantially satisfied, with limits.**
- `lib/objective.ts` is the single resolver/renderer; CLI and pi are adapters. The golden comparison now removes **only** the hook tag, with independent expected-output assertions.
- Unconditional walk-up, umbrella fallback, user-relative `objective.path`, rename-only `projectFile`, both program lines, precedence and no duplicate umbrella are implemented.
- Only marker-bearing physical lines survive; independent 1500-unit content caps, 320-unit displayed paths and a 12000-unit block bound are enforced. UTF-8 boundary handling and both surrogate layers have targeted tests.
- No-lines governance wording is corrected. The old umbrella-priority-omission assertion was properly replaced, not merely relaxed.
- **Universal parity and “never stalls” remain overclaims:** tests drive registered handlers, not complete host rendering; synchronous filesystem operations have no deadline, and config reads remain unbounded. Missing Node also produces hook-only fallback output. Journaling remains pi-only.

**B — Enumeration is incomplete; inherited surfaces are carries, not T2a blockers.**
- The four discovered channels are addressed in the inspected objective/config paths.
- `extensions/nana-post-edit.ts:496–503` exposes the raw filename in **both** a notification and model-visible tool-result text.
- `nana-handoff.ts:97` delegates its separate `displayPath()` to an unsanitized locator renderer. Its escaping rules are not the objective sanitizer’s rules.
- Pi’s final rendering of block reasons remains unverified.
- Commission a separate cross-cutting sanitization lane covering prompts, tool results, notifications, status and error paths. Do not blindly replace handoff locators with truncated display paths: their addressability contract differs.

**C — Compatibility and harm.**
- Fresh/no-config **pi** sessions newly treat repo objectives as governing; Claude already walked upward. This increases semantic prompt-injection exposure, despite structural narrowing.
- Claude’s fallback now follows user configuration/default `~/.pi/agent/nana-objective.md`, rather than hardcoding `~/nana-agent-loop/OBJECTIVE.md`.
- Basename-only `projectFile` breaks previously accepted path-valued settings. That tightening is reasonable but must be diagnosed accurately.
- The inspected `~/nana-agent-loop/OBJECTIVE.md` Rules rewrite matches the intended hierarchy and retains Jake’s authority over new product lanes. It does not imply code verifies approval.
- Rules/prose formerly injected by pi are intentionally no longer included.

**D — Consumer declarations are incomplete.**
- Pack README and the objective interface comment in `config.ts` describe the principal changes.
- Root `AGENTS.md` and `templates/_shared/working-under-nana-pi.md` omit the objective contract. The shared objective seed omits the displayed umbrella priority and precedence.
- `doctor.mjs:95–98` labels `../OBJECTIVE.md` a successful rename, although the producer rejects it.
- The hook now needs automatic TypeScript stripping; its CLI specifies Node ≥22.18, while setup README still promises Node ≥22.

**E — Seat conduct.**
- Correcting “zero attacker bytes” to “no attacker-controlled structure” was justified and explicit—not evidence that semantic injection is solved.
- Finding the fresh-machine regression before review was valuable. The original brief’s simultaneous walk-up and opt-in language contributed ambiguity; the correction follows Jake’s hierarchy.
- Implementation after the sol cap is legitimate; it is not another sol approval. Final fallback/host-rendering claims remain unverified.
- No basis to declare trust-vs-label settled. Record Jake’s pending decision and the exposure explicitly; do not substitute astra’s preferred trust policy.
- The advisory size ceiling was crossed after r1 without the required checkpoint appearing in these reports.

**F — Parallel landing.**
- Protect `lib/config.ts` normalization, user-only objective merge, sanitized diagnostics and `loadUserObjective()` during integration; whole-file conflict resolution could silently revert them.
- The supplied T2b r4 patch and inspected T2b config do **not** substantiate the claimed config overlap. README/HANDOFF overlap is visible. Verify actual landing heads and rerun the combined suite.

SCORE: 7/10

MUST:
- Complete consumer declarations in `AGENTS.md`, `templates/_shared/`, and runtime documentation; reconcile the Node ≥22 versus ≥22.18 support promise.
- Make doctor distinguish valid renames from rejected path-valued settings; add a regression test.
- Reconcile `HANDOFF.md`: the clean patch deletes both the live flaky-test entry and policy entry. Preserve the former; replace the latter’s false “Implemented” claim with the pending trust/label decision.

CARRY:
- **HIGH cost of error:** semantic steering from untrusted “governing” prose; explicit Jake-owned risk decision, not structural-safety closure.
- **HIGH:** inherited post-edit/handoff injection surfaces; dedicated cross-cutting audit with end-to-end sink tests.
- **MEDIUM:** unbounded config I/O, filesystem races/stalls, actual-host rendering and Windows parity; avoid universal guarantees.
- **LOW:** CLI catch remains unexercised; hook failure prints an owner-controlled raw installation path.

Upstream-contract declaration: T2a changes default governance, accepted configuration, injected content, fallback location, runtime requirements and shared diagnostic rendering. These changes are **not yet fully declared or accurately diagnosed at consumer surfaces**.

VERDICT: BLOCK
