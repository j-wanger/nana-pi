### MUST

1. **Default placement is still not fully derived from the input.** Check 9 requires sections without a valid old capability parent to sit under *a* generated capability, but does not derive which generated capability. A realistic regression could split basketball-geek’s sections across several generated capabilities, or split trading-zone’s sections 5–11 across multiple capabilities. The mapping-derived heading checks and tree checker would pass, producing a materially wrong tree. The proof must derive each default section’s exact expected parent and node sequence from the input.

2. **The new placement check incorrectly governs explicit regroup mappings.** Check 9 and R-1163 require replaced headings to retain their input-derived hierarchy even with `--mapping`. A realistic approved regroup that moves an existing feature beneath another capability would therefore be refused, breaking the lane’s stated later-regroup use and conflicting with R-1166. Input-derived hierarchy should apply only to the default mapping; mapping mode should independently verify the mapping’s declared placement plus reserved-node constraints.

### SHOULD

1. **The mutation inventory remains inconsistent.** The table now contains 57 pairs, while the declaration still says 49. T6 describes 18 tampered outputs but still calls them fifteen. The named mutations are present, so this is bookkeeping rather than a material gap.

The blank-line and unterminated-row MUSTs from round 1 are closed.

VERDICT: SEND-BACK
