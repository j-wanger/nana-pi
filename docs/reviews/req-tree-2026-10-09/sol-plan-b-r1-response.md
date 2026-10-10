# Seat response to sol increment-B plan review r1 (LAND-WITH-FIXES, 7.5/10)

All findings accepted and applied before the build (no second plan round; sol sees the result in
the build review).

| Finding | Change |
|---|---|
| MUST 1 — R-945 stale in the record | `placement-review.md`: a **Final** line under the critic's R-949/R-948/R-945 resolution and a note that the critic's "R-948 and R-945" became R-948 only; `placement-review.json`: a top-level `erratum`. The raw agent words are kept. |
| MUST 2 — R-291 gave status and shares to every heading | R-291 now: common fields for every heading; "for every feature also its status and shared requirements"; the index. |
| MUST 3 — `seat-verify-b.sh` absent | Written, frozen, named in the allowlist as seat-owned. |
| MUST 4 — "four remain" | Five. |
| SHOULD 1 — revalidation triggers | Governance text: a share is re-read when its row changes or moves home, or either feature changes purpose or status, splits, merges or retires; a frozen status is resolved in the change after its ruling. |
| SHOULD 2 — R-293 grammar fixtures | `frozen ()`, `retired ()`, whitespace-only reason rejected; the four legal forms accepted (in `seat-verify-b.sh` and §5). |
| SHOULD 3 — inherited allowlist too wide | Exact increment-B allowlist; no `package.json`, no README. |
| SHOULD 4 — R-292 evidence clauses | "exists, once, not retired, homed elsewhere". |
