**MUST 1 — FIXED.** `packages/nana-pack/lib/config.ts:405–456` implements the complete requested contract: trusted-project malformed gate → last-good or project-file STOP; missing/untrusted/auto-trusted files do not stop; valid overrides retain replacement semantics; user STOP wins. `nana-gate.ts` checks STOP before exceptions for all four gated classes.

The new `config-project-gate-fallback.test.mjs` genuinely writes recorded trust through installed pi’s `ProjectTrustStore.set()`. Each `run()` launches a fresh Node process, imports real pi, primes trust, and drives the real gate handler. The deliberate mid-run corruption case shares a process. This is real-store integration, not an end-to-end `/trust` UI test.

Worker evidence shows all three widening shapes failing before and **26/26 passing after**. I read the evidence/source; I did not rerun. The **61 files / 2651 checks / exit 0** suite result remains seat evidence.

**MUST 2 — FIXED in the merge candidate.** Setup output/README, desk README and branch `AGENTS.md` distinguish recorded `/trust` from one-run approval; pack README explains external owner repair and process lifetime. The main checkout’s `AGENTS.md` remains unchanged pending merge; `l1-r5.patch` includes its update.

**Assertion change — legitimate, not weakening.** The replaced assertions required the defective behavior. New assertions require project STOP for malformed gate leaves, preserve non-gate isolation, and retain trailing-comma user-notify checks.

**NEW defects:** no new behavioral blocker found. Minor documentation drift: `GateConfig.stopReason` still describes user-only failure; `AGENTS.md:143` says malformed project gates always stop, omitting last-good retention.

SCORE: 9/10
MUST:
CARRY:
- L2 live-loosening, compound exceptions, shell/PowerShell command writes and session snapshots: high destructive-action cost; combined acceptance remains incomplete. Preserve STOP-before-exception and traversal regressions; update Config/desk UI contracts with L2.
- Process-wide sequential-session state and concurrent same-cwd SDK isolation: potential permission impact; lifetime now documented, transitions still need tests.
- Windows execution, symlink/alternate-agent-directory protection and implicit trust provenance: high-impact advisory-boundary limitations; no sandbox claim.
- Custom protected-path corruption/restart coverage is now closed. Headless repair is tested across restart, not STOP→repair→resume within one process; composed tool-write→trust-store→fresh-policy coverage remains absent. Keep real-pi cases running where installed.
- Best-effort journal failures: possible lost diagnostics. Substring lookalikes: unwanted prompts.
- L3 `staleAfterDays` still needs additive interface/default/schema/normalization coverage; preserve nana-trust filtering of `handoff.path`.
- Correct the two documentation nits above.
VERDICT: LAND
