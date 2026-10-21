# FEAT-038 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Bench on Windows (bench-win): nobody has run the real judge there. An npm install of Claude Code is a script shim the bench cannot start without a shell. The bench then reports the judge unavailable (inferred). Only the missing-judge check and the two command-line checks start a process the platform's own way.
- Bench on Windows (bench-win): nothing checks the bench agent folder's access rights there; its folder-mode check only skips. On a Windows machine without symlink rights, the bench copies the credential, and its symlink check fails by design. CI runners hold those rights.
- Bench judge folder (bench-win): on macOS and Linux the real judge now starts in the user's temp folder, not the fixed one. Nobody re-ran the recorded study labels. The move should not change them, since no project instructions sit above either folder (inferred).
