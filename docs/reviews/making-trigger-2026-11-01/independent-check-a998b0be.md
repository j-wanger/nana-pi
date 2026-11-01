PASS. Build 4 (tip a998b0be) closes M1, S1 and S2, and it opens no new path that loses a record or blocks a save.

Evidence: I re-ran the probes on the synthetic fixture under a scratch HOME, with no real clone, transcripts, agent dir or model calls. The lane tests all pass: memory-run 8, memory-run-recovery 4, seals 16, profile-sync 2, profile-store 18, land 66.

## Rechecks

**M1 is closed.** I planted three bad project files: a truncated record, an empty seen file, and a record holding invalid bytes.
- `nana-profile save` exited 0, and the saved claim is live.
- The next `make` gave `complete; sent 1; done 1`, and the run after it sent nothing.
- `status` reports `unparseable 3`, which is the right count.
- Writes now go through `exclusiveJsonAt` (`profile-store.mjs:42-51`): write a temp file, fsync it, link it to the final name, then remove the temp. A killed write can no longer leave a partial `.json` file.
- `ensureRepository` still gets EEXIST when the file exists, so the repository collision check still works.

**S1 is closed.** `memory-run.mjs:106` now refuses a call when elapsed time plus one call timeout would pass `MAX_RUN_MS`.

**S2 is closed.**
- A clone lock held for 300 ms gave `complete; done 1`.
- A lock held for 3 s gave `busy; pending 1`, with nothing lost.
- Any other merge error now reports `memory: merge failed` instead of `busy` (`memory-run.mjs:124`).

## SHOULD

None.

## NOTE

- **Leftover temp files:** a write killed between the temp file's open and its removal leaves a `.json.<uuid>.tmp` file.
  - Readers ignore it, because they filter on `.json`.
  - `commitProfile` then commits it to the private repo: I planted one and found it in `ls-files`.
  - `countUnparseable` does not count it, and nothing reports it.
  - The text stays in the private repo only. A cleanup of old `.tmp` files in `recoverProfile` would close this.
- **Supersede events:** if a project-area supersede event is torn and skipped, the old extracted record shows as live next to the saved one. The save itself is kept, so this shows a duplicate rather than dropping anything.
- **Profile area unchanged:** a torn file in the profile area's own `records/` or `events/` still makes saves throw, as before this lane. New writes there are now atomic, so this mostly guards older files.
- **Windows path length:** the temp name adds 41 characters to a path that can already be 180 characters relative to the clone. With a long clone folder on Windows, that can pass 260 characters, unless `core.longpaths` is set or Node's long-path handling covers it.
- **Hard links:** `linkSync` needs hard-link support. A clone on FAT or exFAT, or some network shares, would make every write fail loudly. Nothing would be lost silently.
- **Merge wait:** the 1,000 ms wait blocks the process with `Atomics.wait`. That is fine inside the detached run.
