# win-copy-backup-noise — must-meet

Feature: FEAT-018 · Update or remove managed components safely
Sentence: on Windows, install refreshes a rule copy, a skill mirror file or the pi rulings copy whose bytes still equal what install last wrote there, with no dated backup. Any such copy whose bytes differ still gets exactly one dated backup first.
Class: install, hook or gate (the fsops backup primitive, install's win32 copy steps, the state inventory). Full ladder: roster reviewer, land review (seat-land.md if the roster prints `land: seat`), seat wrong-code pairs, one independent check, the mutation runner, and `install-check.mjs` on macOS before nana-land.
Threat model:
- In scope (honest variation): the platform forced to win32 on macOS and Linux; native Windows CI; CRLF checkouts; a record that is absent, unparseable, not an object, a directory or read-only; homes installed before the record existed; owner edits; two checkouts installing into one home.
- Out of scope: deliberate forgery, such as writing a record entry so install drops an owner's edit, and sha256 collisions.

## Design
- Record: `layout.copyRecord` = `<claude home>/nana-setup-copies.json`. Chosen because it sits beside 10 of the 11 copies and beside the settings lock, and it follows `--home` and `--claude-home`. Format: a JSON object mapping each absolute target path to the sha256 hex of the bytes install wrote there.
- New `lib/copy-record.mjs` (six-tag header; the hash name defined once, chosen). `openCopyRecord(file)`:
  - It reads the record only if lstat says it is a regular file. Any read, parse or shape failure gives an empty record, so everything backs up.
  - It returns `unedited(target)`, a predicate over the current bytes; `remember(target, bytes)`; and `save(o)`.
  - `save` writes nothing on a dry run or when nothing was remembered. Otherwise it writes through `fsops.writeIfChanged` and keeps earlier entries.
  - `save` never throws. A SKIPPED result or a caught error becomes one SKIPPED row labelled "copy record". The row names the path and says the next update backs up each changed copy.
- `fsops.writeBytesWithBackup` gets one optional `unedited` predicate (fsops never imports copy-record). A regular file that passes it is replaced with no backup. The dry run says it would refresh and names no backup. `linkFile` passes the predicate through on `copyInstead`. When the option is absent, behaviour is today's, so the PATH launchers and every other caller are unchanged.
- `steps.mjs`: `stepRules` (win32), the `linkSkill` win32 file loop and `stepPiConfig`'s rulings copy:
  - Each passes `o.copyRecord?.unedited(target)`.
  - After a non-dry-run CREATED, UPDATED or UNCHANGED copy, on win32 only, each calls `remember(target, sourceBytes)`.
  - `install()` opens the record at the START of `fileSteps` on win32, dry run included. It pushes the `save` rows at the END, which is inside the lock on a real run. POSIX opens and writes nothing.
- `state-manifest.mjs`: `rebuild("copy record", layout.copyRecord, "file")`. Kind "file", not "generated", because uninstall deletes "generated" rows.
  - R-955 already fails without this row. R-954's install-coverage check gains the record as a win32-only target.
  - No separate row; R-2314 is left unused.
- Prototype check: a 30-line build of this design passed 20 existing nana-setup test files one at a time on macOS. restore.test fails the same way on unmodified main in a temp clone (environment).

## Must-meet
| Row | Requirement (EARS) | Test file::title | Red today |
|---|---|---|---|
| R-2310 | WHERE the platform is win32, WHEN install refreshes a rule copy, a skill mirror file or the pi rulings copy whose bytes equal the bytes install last wrote there, THEN install shall write the source's bytes to that copy and leave no dated backup. | `packages/nana-setup/tests/copy-record.test.mjs::R-2310: two source changes refresh unedited rule, skill and pi rulings copies with no dated backup` | RED (probe): two changes to nana-soul.md, nana-rulings.md and spec/SKILL.md left 8 `.bak-` files across rules, skills and the pi agent folder. The prototype left 0. |
| R-2311 | WHERE the platform is win32, IF a rule copy, a skill mirror file or the pi rulings copy holds bytes other than the bytes install last wrote there, THEN install shall leave exactly one dated backup holding those bytes before it writes the new copy. | `…/copy-record.test.mjs::R-2311: owner-edited rule, skill and pi rulings copies each get exactly one dated backup holding the owner's bytes` | GREEN guard (probe: one backup each, holding the owner's line, today and on the prototype). Red under "always unedited" and "any entry means unedited". |
| R-2312 | WHERE the platform is win32, IF the copy record is absent, is not valid JSON or is not a JSON object, THEN install shall leave one dated backup of each rule copy, skill mirror file and pi rulings copy whose bytes differ from its source. | `…/copy-record.test.mjs::R-2312: an absent, unparseable or non-object copy record falls back to one dated backup per changed copy` | GREEN guard (probe: removed, `{not json` and `["x"]` each gave 4 backups). Red under "a bad record owns every copy". |
| R-2313 | WHERE the platform is win32, WHEN install finds a rule copy, a skill mirror file or the pi rulings copy byte-equal to its source and the copy record holds no entry for it, THEN a later install that refreshes that unedited copy shall leave no dated backup. | `…/copy-record.test.mjs::R-2313: a home installed before the record existed refreshes with no dated backup after one install` | RED (probe: install, delete the record, install, change, install gave 4 backups today and 0 on the prototype). |
| R-2315 | WHERE the platform is win32, WHEN install --dry-run meets an unedited rule copy or pi rulings copy whose source changed, THEN install shall report that copy as updated with no backup named and leave every file under the home unchanged. | `…/copy-record.test.mjs::R-2315: dry run reports an unedited copy's refresh with no backup and changes nothing` | RED (probe: today prints `would back up to nana-soul.md.bak-20261020 and copy`; the prototype said refresh and left the home byte-identical). |
| R-2316 | WHERE the platform is win32, IF a directory or a read-only file stands at the copy-record path, THEN install shall finish its later steps with exit 0 and print exactly one skipped row that names the copy record. | `…/copy-record.test.mjs::R-2316: a directory or read-only file at the copy-record path leaves install finishing with one skipped copy-record row` | RED (probe: today there is no copy-record row in either case; the prototype printed one skipped row, exit 0, with the knowledge and pi rows after it). |
| R-954 (existing) | unchanged text | `packages/nana-setup/tests/state-manifest.test.mjs::every path created by install maps to a nana-setup-owned manifest row`, extended with the record (kind "file", win32-only target) | RED until the row exists. |

Test shape:
- One new file. It copies the checkout once (`checkout-spelling.test.mjs` `copyFixture`).
- Each case gets a fresh temp `--home` with `nana-knowledge/sources.json` seeded, and the copied sources are reset first.
- It sets `NANA_SETUP_PLATFORM=win32` unless the host is win32.
- A change means appending a line to a source.
- No skips: it runs forced on macOS and Linux and native on the Windows leg, so no req-candidate is needed. The one exception: R-2316's read-only case prints SKIP under POSIX root, because root writes through file modes.

## Known limits
- Backups already on disk stay. A Windows home that is already stale at land time gets one last round of backups. A current home is adopted at its next install (R-2313).
- A home reached through another spelling (letter case, short name) misses its keys and backs up once. That is fail-safe.
- Windows PATH launcher files still back up on each change (the win-path-commands residual).
- The win32 skill row still prints "N files copied" and never names a backup.
- No test pins that the save happens inside the lock (install-overlap tracks other targets).
- Windows has no uninstall, so the record stays. POSIX never writes it.
- Inferred, untested: Claude Code ignores a JSON file at the Claude folder root.