VERDICT: DONE

Commit: `b85396ecb5b63c5d4f48bb57976359b7e280cd4a`  
Branch: `feat/credential-gate-variants`. Not pushed. Worktree clean.

- **Rows:** R-3685 and R-3686 implemented; R-3667 seal updated.
- **Code:** merged four helper patterns into two wide patterns. The join replaces preserved-word whitespace with sealed U+0001.
- **Existing tests:** only M7 changed, pinning the new list and placeholder. M4 remains unchanged.
- **Wrong code:** base produced 48 M1 failures; M2 passed. Wide patterns with plain join produced eight M1 and four M2 failures. Both exited 1.
- **Final-tip checks:** all 20 test-file commands and six required checks exited 0.
- **Exports/departures:** no private-helper exports. The placeholder import necessarily extends beyond the join lines.

Files, commands, failing cases, known-bug changes, and evidence: [technical report](docs/reviews/credential-gate-variants-2026-11-02/build-1-report.md).

Not run: full suite, CI, seat mutation ladder, or macOS install check. These remain assigned to CI or the seat.

Writing-check findings concern the required verdict format and technical path. Installed rulings remain stale.
