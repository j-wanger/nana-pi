# FEAT-008 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Land rule: the helper checks that every recorded verdict is LAND, not who reviewed; the round records are a plain file; a narrow review counts for everything up to its revision; a direct commit to main bypasses it (the working pattern forbids that). Every revision reviewed before the land rule needs a fresh review.
