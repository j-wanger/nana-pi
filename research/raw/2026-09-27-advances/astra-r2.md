## Round 2 findings

References below are to `~/nana-pi/research/agentic-advances-and-nana-review-2026-09-27.md`. Read-only review; no probes or suites rerun.

### R1 MUST-FIX disposition

| # | Status | V2 evidence |
|---|---|---|
| 1 | **FIXED** | L7 distinguishes bypassing the check from exceeding the cap; L8 frames priority authority as unresolved and limits reflog scope; L10 corrects pickup counts. Consequential caveats restored at L9, L11, L64–67. |
| 2 | **FIXED** | L79 replaces the blanket review waiver with bounded implementation followed by required adversarial review; L28 explicitly preserves independent review. |
| 3 | **PARTIAL** | L35–36 repair gate exceptions and handoff retention/writer ownership; L44–46 repair review accounting and session identity; L53 and L61 bound WIP/retrieval experiments. **Malformed-config policy remains internally unsafe: see HIGH below.** |
| 4 | **FIXED** | L13 and L63 identify `/goal` as transcript-only, not a budget or deterministic acceptance; L63/L78/L88 preserve Jake’s receipt-gate deferral. |
| 5 | **FIXED** | L30–71 put concrete correctness work before authority/accounting, then queue experiments and instruments. Objective precedence and retrieval baseline are explicit dependencies. Minor sequencing clarification below. |
| 6 | **FIXED** | L84–90 provide explicit policy choices; L55/L78 prohibit interrupting authorized work; L70 preserves active-run and closure obligations regardless of age. |

### NEW HIGH — Default fallback does not preserve effective permission policy

**L34 and L98:** “malformed block keeps the default policy” contradicts “malformed config never widens what is allowed.”

- `packages/nana-pack/lib/config.ts:53` defaults `extraPatterns` and `protectedPaths` to empty arrays.
- Raw `opus-review.md:196–197` already supplies the counterexample: malformed JSON drops a custom restriction and allows `terraform destroy`.
- Falling back to defaults **with a warning** still loses that restriction. The proposed correction preserves the underlying fail-open.

**Required:** distinguish missing configuration from invalid permission configuration. Specify preservation of validated restrictions, or a conservative permission stop with explicit repair/approval when no trustworthy policy is available. Test custom denies/protected paths before and after corruption, including a fresh process. Advisory objective/notification failures need not share that blocking policy.

### Jake’s seven rulings

**All seven are answerable in one line; none belongs wholly to the seat.** L92 correctly retains queue presentation, test details and ordinary sequencing as seat decisions. Ruling 5 authorizes only a bounded trial—not production receipt gating.

### Tranches and landing contract

**Tranche order: adequate. Blast-radius contract: nearly adequate, but not landable until the permission fallback contradiction is resolved.**

The table covers the important adversarial cases and separates unrelated contracts. Two nonblocking clarifications would prevent implementation ambiguity:

- Make item 4’s canonical test path precede **items 1–3 landing too**, not merely “every later land” (L37).
- Apply the independent-review requirement by **surface**, not ⚠ typography: lifecycle items 7, 15, 17, 19–22 are unmarked. Explicitly map item 8’s shutdown/CANNOT wiring to the coverage currently attached to item 5.

## SCORE: 8/10

## MUST-FIX
1. Replace default-only malformed-permission fallback with a contract that cannot silently discard configured restrictions; add corruption/restart acceptance cases.

## SHOULD
- Make canonical tests a prerequisite for every implementation land.
- Align hazard markers and acceptance-table item mappings with the surface-based review invariant.

## VERDICT: BLOCK
