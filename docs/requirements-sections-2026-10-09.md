# Requirements section map — 2026-10-09

This map records where the old numbered ledger sections went during the capability-tree move. Counts include rows from each old section; Part G headings note their shared-file provenance.

| Old heading | Package | New homes (row counts) | Note moved? |
|---|---|---|---|
| # Part A. The pi extension pack and the repo test runner | part heading | — | No |
| ## 1. Objective contract | nana-pack | FEAT-001 (21) | No |
| ## 2. Trust and the provenance label | nana-pack | FEAT-009 (19) | No |
| ## 3. Gate | nana-pack | FEAT-009 (9), FEAT-010 (44), FEAT-011 (30), SUB-012 (1) | No |
| ## 4. Post-edit checks and receipts | nana-pack | FEAT-011 (1), FEAT-024 (2), FEAT-030 (41), FEAT-032 (1) | No |
| ## 5. Handoff, compaction and the adoption signal | nana-pack | FEAT-001 (1), FEAT-023 (2), FEAT-030 (1), SUB-001 (13), SUB-002 (17), SUB-003 (9), SUB-004 (14), SUB-008 (1), SUB-016 (24), SUB-020 (1) | No |
| ## 6. Journal and session lifecycle | nana-pack | FEAT-022 (2), FEAT-023 (6) | No |
| ## 7. Notify | nana-pack | FEAT-023 (12) | No |
| ## 8. Display renderer (S1 and S2) | nana-pack | FEAT-012 (21), SUB-003 (1) | No |
| ## 9. Agent-dir resolution (U2) | nana-pack | FEAT-010 (1), FEAT-011 (5), FEAT-021 (1), SUB-007 (1), SUB-011 (6) | No |
| ## 10. pi-review: round cap and stall watchdog | nana-pack | FEAT-008 (7), FEAT-019 (3), SUB-006 (17), SUB-007 (17), SUB-008 (12), SUB-009 (7), SUB-010 (18), SUB-012 (1) | No |
| ## 11. pi-worker | nana-pack | FEAT-006 (12), SUB-012 (1) | No |
| ## 12. Skills contract | nana-pack | FEAT-019 (2), FEAT-028 (6), SUB-012 (2), SUB-018 (2), SUB-019 (6) | No |
| ## 13. The repo test runner (`scripts/test.mjs`) | repo test runner | FEAT-006 (1), FEAT-030 (2), FEAT-031 (32) | No |
| ## 13a. The writing checker (nana-pack) | nana-pack | FEAT-005 (10), FEAT-038 (8) | Yes, to FEAT-005 |
| ## 13b. The writing rule's delivery to pi (nana-pack) | nana-pack | FEAT-005 (5) | Yes, to FEAT-005 |
| ## 13c. The code-map generator (templates) | templates (code-map generator) | FEAT-029 (6), SUB-005 (7) | Yes, to FEAT-029 |
| # Part B. Knowledge pull, stage layer, installer | part heading | — | No |
| ## 14. Index, sources and builds (nana-knowledge) | nana-knowledge | FEAT-003 (16), FEAT-031 (2) | No |
| ## 15. Root discovery by convention (nana-knowledge) | nana-knowledge | FEAT-003 (8) | No |
| ## 16. Pointer rendering (nana-knowledge) | nana-knowledge | FEAT-004 (12) | No |
| ## 17. The shared prompt-time hook CLI (nana-knowledge) | nana-knowledge | FEAT-003 (3), FEAT-004 (15) | No |
| ## 18. The pi extension (nana-knowledge) | nana-knowledge | FEAT-004 (4), FEAT-006 (1), SUB-008 (1) | No |
| ## 19. Block validation (nana-stage) | nana-stage | FEAT-025 (13) | No |
| ## 20. Stamping, signing and the ledger (nana-stage) | nana-stage | FEAT-025 (13), FEAT-026 (8), FEAT-027 (1) | No |
| ## 21. Installer — what install creates (nana-setup) | nana-setup | FEAT-005 (1), FEAT-015 (2), FEAT-033 (1), SUB-011 (2), SUB-012 (10), SUB-014 (13) | No |
| ## 22. settings.json merge semantics (nana-setup) | nana-setup | SUB-013 (6), SUB-014 (6) | No |
| ## 23. pi registration identity matching (nana-setup) | nana-setup | FEAT-015 (3), SUB-013 (6) | No |
| ## 24. `project` — a folder becomes a nana project (nana-setup) | nana-setup | FEAT-015 (2), SUB-017 (9), SUB-018 (5), SUB-020 (5), SUB-021 (4) | No |
| ## 25. doctor, exit codes and the pi agent dir (nana-setup) | nana-setup | FEAT-003 (8), FEAT-015 (8), FEAT-018 (9), SUB-011 (2), SUB-012 (3), SUB-014 (1) | No |
| ## 26. win32 degrade and the desk service (nana-setup) | nana-setup | FEAT-009 (3), FEAT-015 (7), FEAT-016 (13), FEAT-018 (2), SUB-012 (1), SUB-013 (2), SUB-014 (1), SUB-015 (11), SUB-018 (2), SUB-019 (1), SUB-021 (2) | No |
| # Part C. The desk and the bench | part heading | — | No |
| ## 27. Desk startup and pi binding | apps/desk | FEAT-016 (9), FEAT-022 (1), FEAT-038 (1) | No |
| ## 28. Session reading, rail and transcript | apps/desk | FEAT-020 (14), FEAT-023 (1) | No |
| ## 29. Spawning and resource policy | apps/desk | FEAT-021 (9) | No |
| ## 30. Live drive and the prompt path | apps/desk | FEAT-022 (5), FEAT-023 (1) | No |
| ## 31. Files-changed bar and the floating diff | apps/desk | FEAT-022 (1), FEAT-023 (7) | No |
| ## 32. Reload, skill auto-detect and header surfaces | apps/desk | FEAT-022 (4), FEAT-023 (2) | No |
| ## 33. The four buffer caps | apps/desk | FEAT-022 (4), FEAT-027 (1) | No |
| ## 34. Stage generation and the resync door | apps/desk | FEAT-022 (5) | No |
| ## 35. Stage signing keys and block provenance | apps/desk | FEAT-026 (12) | No |
| ## 36. App listeners, the UI-centric slices and the dashboards | apps/desk | FEAT-026 (1), FEAT-027 (16) | No |
| ## 37. Config and context writes | apps/desk | FEAT-024 (5) | No |
| ## 38. Browser boundary: Host and Origin | apps/desk | FEAT-027 (2) | No |
| ## 39. Session lifecycle and teardown | apps/desk | FEAT-022 (4), FEAT-026 (3), FEAT-027 (2), FEAT-031 (2) | No |
| ## 40. Bench spend control and the test boundary | apps/bench | FEAT-031 (1), FEAT-034 (2), FEAT-036 (2) | No |
| ## 41. Measurement and accounting | apps/bench | FEAT-034 (1), FEAT-035 (9), FEAT-037 (2) | No |
| ## 42. Identity, ordering and resume | apps/bench | FEAT-034 (7) | No |
| ## 43. Pre-flight, budgets and stops | apps/bench | FEAT-034 (3), FEAT-035 (1), FEAT-036 (10) | No |
| ## 44. Interrupt and exactly one record per tuple | apps/bench | FEAT-036 (4) | No |
| ## 45. Deterministic grading | apps/bench | FEAT-037 (21) | No |
| ## 46. Evidence, fixtures and aggregation | apps/bench | FEAT-034 (4), FEAT-035 (1), FEAT-037 (1) | No |
| ## 47. Catch ledger E1 and the tool-profile verdict | apps/bench | FEAT-038 (9) | No |
| # Part G. General engineering requirements (every nana project — nana-pi itself included) | part heading | — | Yes, to FEAT-033 |
| ## 48. Configuration and provenance | Part G (general engineering; nana-pi copy of the shared file) | FEAT-033 (5) | No |
| ## 49. Module boundaries | Part G (general engineering; nana-pi copy of the shared file) | FEAT-033 (8) | No |
| ## 50. The code map | Part G (general engineering; nana-pi copy of the shared file) | FEAT-033 (3) | No |
| ## 51. Documentation | Part G (general engineering; nana-pi copy of the shared file) | FEAT-001 (1), FEAT-019 (1), FEAT-021 (1), FEAT-028 (1), FEAT-032 (8), FEAT-033 (3), SUB-005 (1), SUB-019 (1) | No |
| ## 54. The requirement set | Part G (general engineering; nana-pi copy of the shared file) | FEAT-033 (3) | No |
| ## 52. pi 1.0 subagent and MCP config (nana-setup) | nana-setup | FEAT-015 (10), SUB-012 (3) | No |
| ## 53. Installer edge-case hardening (nana-setup, pi-1.0-2026-10-04 review lane) | nana-setup | FEAT-015 (1), FEAT-016 (1), SUB-014 (2) | No |
| ## 56. State manifest and restore (nana-setup) | nana-setup | FEAT-017 (6) | No |
| ## 57. Updating and removal (nana-setup) | nana-setup | FEAT-018 (8) | No |
| ## 55. Template acceptance and release | templates (acceptance and release) | FEAT-019 (7) | No |

Note from ## 10. pi-review: round cap and stall watchdog

*The nana-pack ID range R-001..R-199 is exhausted above; this area and the two that follow
continue in an unreserved R-2xx block (see Extraction notes). R-919 uses the runner continuation
allocation because the pack has no IDs left; the lane brief permits R-918 or R-919 here.*
