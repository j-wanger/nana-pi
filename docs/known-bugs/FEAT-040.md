# FEAT-040 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*

- The profile-store save case's daily-cap step fails when the file runs across UTC midnight, because the save reads the real clock (`packages/nana-pack/bin/nana-profile.mjs` about line 109); `packages/nana-pack/README.md` about lines 102-105 still describes automatic profile saving, which the seat guide paused.
- Owner profile (owner-profile, plan residual): the pushback probe moved to a later checking lane; until it lands, nothing measures whether the profile makes the seat agree more.
- Owner profile (owner-profile, plan residual): a quote the seat wrongly attributes to the owner is saved like a real one; only the trust ladder limits it.
- Owner profile (owner-profile, final review): privacy is checked only at init; a repo made public later is not re-checked.
- Owner profile (owner-profile, final review): with no session variable the session key falls back to the local date while the record date is UTC, so they can disagree near midnight.
- Owner profile (owner-profile, final review): the "locked" reason word is never used.
- Owner profile (owner-profile build 3): a second writer now waits up to 420,000 ms for the clone lock, so a save behind a hung sync can block the seat for seven minutes.
- Owner profile (owner-profile, confirmation review): the lock poll interval is the total wait over 100, now 4,200 ms, so a waiting save can notice a released lock about four seconds late.
- Owner profile (owner-profile, confirmation review): the 28 locked git steps behind the lock wait are not counted from the code; the risk runs only toward waiting too long.
- Requirements (owner-profile, round-3 review): SUB-023 sits above SUB-022 in REQUIREMENTS.md; the tree keeps the same order.
- Requirements (owner-profile, round-3 review): the SUB-022 heading follows the R-3249 table row with no blank line, so a strict Markdown renderer may read it as part of the table.
- Owner profile store (making-trigger, independent recheck): a write killed partway leaves a temp file that readers ignore but the next commit adds to the private store, and nothing counts or removes it.
- Owner profile store (making-trigger, independent recheck): a damaged, skipped supersede event in the project store shows the old extracted record live beside the saved one, a duplicate rather than a loss.
- Owner profile (making-trigger, independent recheck): a damaged file already in the profile's own records or events folders still blocks saves; only new writes are safe.
- Owner profile store (making-trigger, independent recheck): the temp name adds 41 characters to store paths, so a long clone folder on Windows can pass the 260-character limit without long paths enabled.
- Owner profile store (making-trigger, independent recheck): store writes need hard links, so on FAT, exFAT or some network drives every write fails with an error.
- Owner profile sync (making-session-end, plan residual): `profileGit` spawns git without `windowsHide`; only the owner's Windows check can see a stray window.
- Setup (making-session-end, plan residual): recognition and removal of an installed memory-end hook still gates on `timeout === 5`, which a future hook with another timeout would meet.
- Setup (making-session-end, independent check): win32 uninstall of an installed memory-end hook matches only the current checkout's entry, so a moved checkout leaves the old SessionEnd entry failing at every exit.
- Setup (making-session-end, independent check): the settings doc comment still says "timeout: 5"; the code uses each row's own timeout.
- Bench (claude-cmd-launch, plan residual): `apps/bench/lib/catch-judge.mjs`'s own default spawn, used when no spawn is injected, still calls bare `claude`; the bench runs on the seat Mac.
- Carry (memory-end-ebusy): `tests/profile-fixture.mjs` assumes its roughly one-second folder-removal retry window covers Windows holds on remote.git; the hold duration remains unmeasured.
