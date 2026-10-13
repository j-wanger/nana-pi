Score: 9/10

### SHOULD

1. **The native-path clause lacks a deterministic test.**  
   **Evidence:** `docs/reviews/roster-2026-10-13/CHANGE.md:47,104` requires native Windows real-path resolution. The proposed evidence at `CHANGE.md:191-193` merely assumes `os.tmpdir()` uses an 8.3 path; it does not explicitly create differing short/long or case forms. An ordinary Windows checkout using alternate path forms could still be refused despite the suite passing.  
   **Smallest fix:** Make the Windows test launch from an explicitly alternate short, long, or differently-cased path and assert lane admission. This is a test-evidence gap, not a build blocker under the materiality rule.

### NOTE

- Round-one MUST 1 is closed. `CHANGE.md:47,89-104,181-198` routes both launchers through `findPi` and `winCommand`, moves multiline prompts into files, tracks descendant CPU, and adds forced and native Windows tests.
- Round-one MUST 2 is closed. `CHANGE.md:46,73-80` requires every lane launch to print the resolved builder and source before starting pi, with direct tests and mutation pairs.
- The land rule remains intact. `shared-text.proposed.md:2` places the seat review in the reviewed change before the final independent slice review. The existing exact-tip and LAND requirements still apply.
- Missing rosters use the sealed Mac default. Malformed rosters refuse before spawn. Valid alternate providers are used visibly rather than silently.
- Both seats receive the default through the shared region, with `nana-soul` carrying the Claude copy. The documented `node "$HOME/…"` commands work without Windows PATH links.
- Each added or reworded requirement has one `shall`. Section 5 names coverage for every row, subject only to the native-path SHOULD above.
- No material defect should block the build.

VERDICT: LAND
