MUST — The reviewed tip is based on `12fe4c1`, not current main `2eb0cb8`. It reverts Windows fixes in four nana-setup tests and deletes their review record. On Windows, `restore.test.mjs` and `trust.test.mjs` again import raw drive-letter paths, causing module-load failures. The recorded Windows run tested GitHub’s merge commit, not this exact tip. Merging current main also produces conflicts in `HANDOFF.md` and `docs/sessions/2026-10.md`. Rebase or merge main, preserve both historical entries, rerun verification, and review the resulting final tip.

WR1 and WR2 otherwise match the supplied evidence.

VERDICT: SEND-BACK
