# FEAT-038 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Bench on Windows (bench-win): nobody has run the real judge there. An npm install of Claude Code is a script shim the bench cannot start without a shell. The bench then reports the judge unavailable (inferred). Only the missing-judge check and the two command-line checks start a process the platform's own way.
- Bench on Windows (bench-win): nothing checks the bench agent folder's access rights there; its folder-mode check only skips. On a Windows machine without symlink rights, the bench copies the credential, and its symlink check fails by design. CI runners hold those rights.
- Bench judge folder (bench-win): on macOS and Linux the real judge now starts in the user's temp folder, not the fixed one. Nobody re-ran the recorded study labels. The move should not change them, since no project instructions sit above either folder (inferred).
- Catch-ledger study (scrub-records, plan): superseded cache records keep their old keys. The re-keyed caches claim the judge saw the scrubbed prompts, and the match prompt's 600-character cut moves; in 4 skipped rows the text cut moves too. The four result files and RESULTS.md stay byte-equal.
- Catch-ledger study (scrub-records, final review): R-2517 cannot see two current label records with swapped keys, because labels are collected by row id; the real re-key has no swap.
