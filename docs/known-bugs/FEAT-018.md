# FEAT-018 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Windows copy backups (win-copy-backup-noise, plan): backups already on disk stay. A Windows home that is stale when this lands gets one last round of backups. A home whose copies are current starts its record at the next install.
- Windows copy backups (win-copy-backup-noise, plan): a home reached through another spelling of its path misses its record entries. Another letter case or a short name is such a spelling. Each changed copy then gets one backup, which is safe.
- Windows copy backups (win-copy-backup-noise, plan): the Windows skill row still prints only the number of files copied. It never names a backup.
- Windows copy backups (win-copy-backup-noise, plan): no test pins that install saves the record inside its settings lock. The install overlap tests cover other files.
- Windows copy backups (win-copy-backup-noise, plan and independent check): Windows has no uninstall, so the record file stays there. macOS and Linux never write it. Uninstall there leaves a record file that something else put in place.
- Windows copy backups (win-copy-backup-noise, plan): the record is a JSON file at the top of the Claude folder. The plan infers that Claude Code ignores it; nobody has tested that.
- Windows copy backups (win-copy-backup-noise, seat): no run proves that Windows itself refuses a rename over a read-only copy. The read-only check fakes that refusal on every system, the Windows leg included. So the backup fallback has not met a real Windows refusal.
- Windows copy backups (win-copy-backup-noise, seat): a crash between the temporary write and the rename leaves a hidden temporary file beside the copy. Nothing removes it later. Its name does not end like a rule file, so Claude Code should not load it as one (inferred).
- Windows copy backups (win-copy-backup-noise, land review): when the temporary write fails, as on a full disk, install prints a problem row. It leaves the partial temporary file behind. No owner text is lost.
- Windows copy backups (win-copy-backup-noise, final review): when both renames fail, the problem row names a second backup that install never made. The old text still sits at the copy's path.
- Windows copy backups (win-copy-backup-noise, final review): a refreshed copy gets the default file mode. So an owner's read-only setting on it is lost. Main's backup and write did the same.
