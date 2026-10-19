# roster-set: must-meet (plan on main b3f6ec2, adversary AMEND)

**Feature.** `nana-roster set <slot> <tokens>` changes one roster slot in the user-scope `nana-pack.json` (pi's active agent dir) with one command. It replaces the hand edit through `--json` (D2 in `docs/reviews/roster-notice-2026-10-16/CHANGE.md`, which the owner took on 2026-10-16).
Falsifiable form: after `nana-roster set S <the tokens nana-roster prints for entry E>`, `nana-roster` prints E for S, every other slot and top-level key is unchanged, and the replaced bytes sit in `nana-pack.json.bak`. No failure path changes a byte of the file.

**Class: ordinary.** No installer, hook, extension, gate policy or land/review tool file changes. The hook imports `nana-roster.mjs` dynamically inside its try; the extension and pi-worker import only `resolveRoster` (Read: `hooks/nana-roster-notice.mjs:33`, `nana-roster-notice.ts:25`, `pi-worker.mjs:21`). `set` loads only through a dynamic `import()` in the CLI's `main`. `worker-config.mjs` (pi-watchdog imports three names) gets additive exports only. `set` can change only `roster` (R-1401 pins every other member), so even a failed guard cannot reach `gate` or `postEdit`. A build that adds a static import to `nana-roster.mjs` or touches `resolveRoster` makes this a hook lane.

**Threat model.** In scope, honest variation: the file absent; holding `objective`, `gate`, `postEdit` or unknown keys; saved with a BOM and CRLF; symlinked into a dotfiles folder; malformed, a directory or over the cap; the command run from a terminal, pi's `!`, a pi model shell or a Claude Code shell; darwin, linux and win32. pi 1.0.2 sets `PI_SESSION_ID` only in its bash and powershell tools' shells (Read: `dist/core/tools/bash.js:135-157`, `docs/environment-variables.md`, added in 0.82.0); a `!` command gets pi's own process env, which lacks it. Out of scope, deliberate forgery: a model that unsets the variable, edits the file another way, or races a writer.

**Design.**
- Grammar mirrors the print line: `set <slot>[:] <provider> <model> <level|default>`; `set largerBuilder[:] claude-code <model>`; `set <slot>[:] <null token>` (`seat` for land, `none` for scout and largerBuilder). Pasting any printed line after `set` changes nothing.
- Steps: (1) `PI_SESSION_ID` guard; (2) `resolveRoster`, a refusal re-prefixed `set refused:`; (3) parse; (4) the previous resolved roster with the slot replaced, in print order, `largerBuilder` null included as `--json` prints it; (5) `validateRosterShape`; (6) read the raw object (BOM stripped; `{}` when absent) and replace its `roster` member in place; (7) `JSON.stringify(raw, null, 2)` plus LF; (8) write `.nana-pack.json.<pid>.tmp` in the real target's folder (`wx`, the target's mode), fsync, close; (9) when the file exists, copy it to `nana-pack.json.bak` in the agent dir; (10) rename the temp over the real target. Any throw removes the temp and refuses, naming the file.
- Success: stdout holds the plain command's lines for the new roster; stderr holds `nana-roster: <slot> was: <old tokens>`. Every refusal: stderr `nana-roster: set refused: ...`, exit 1.
- Decided, not asked: Claude Code shells and pi `!` may run `set`. Claude Code has no nana gate and can already edit the file, and the seat and a Claude Code builder subagent share one process, so D2's "builder children" holds for pi builders only. The `.bak` stays, as D2 has it: this Mac's file holds only `objective` (Ran), so its first `set` pins the whole default roster, and only the `.bak` restores the no-roster state.
- New `worker-config.mjs` exports: `PI_MODEL_SHELL_ENV` (contract, pi 1.0.2) and the print's null token per slot and `default` (contract, R-1123). `formatRosterLines` reads them; its output stays byte-identical.
- R-1123 and R-1192 gain "and its first argument is not `set`" in their WHEN; no test changes.

**Must-meet.** All in `packages/nana-pack/tests/nana-roster-set.test.mjs`. Each spawned CLI gets a temp HOME, USERPROFILE and `PI_CODING_AGENT_DIR`, with `PI_SESSION_ID` deleted except where a test sets it.

| Row | Test title | Red today |
|---|---|---|
| R-1400 | set given a printed line's tokens replaces only that slot and prints the new roster and the old line, from an absent file and from a file roster | Ran: absent file, `set builder example-gateway gpt-7 high` exits 0, prints the default lines, writes no file |
| R-1401 | set keeps objective, gate and every other top-level member, from a file saved with a byte-order mark and CRLF | Ran: BOM+CRLF file with objective, gate and a roster; after `set builder ...` the sha and the builder are unchanged |
| R-1402 | set refuses no slot, an unknown slot and each malformed entry, naming the slot or field, and changes no byte | Ran: bare `set` and `set reviewr a b high` exit 0 |
| R-1403 | set refuses a path the resolver refuses and leaves it unchanged | Ran: invalid JSON exits 1 with `roster refused:`; red only on the `set refused:` prefix (it guards a writer that falls back to the default) |
| R-1404 | set inside a pi model shell refuses naming PI_SESSION_ID before reading the file and writes nothing | Ran: `PI_SESSION_ID=abc ... set builder a b high` exits 0 |
| R-1405 | set renames a temporary file from the target's folder, and a failed temporary write or rename leaves the file byte-identical with no temporary file behind | Read: no `lib/roster-set.mjs` on main, so the import fails |
| R-1406 | set through a symlinked nana-pack.json writes the target and keeps the link | Ran: symlinked file, `set builder: a b high` exits 0, target sha unchanged |
| R-1407 | set leaves the replaced bytes in nana-pack.json.bak | Ran: after today's `set`, the agent dir holds only `nana-pack.json` |

**Cases per test.**
- R-1400: an absent file with the builder set; on a file roster: a pi entry with a level; with `default`; `largerBuilder claude-code sonnet`; `scout none`, `land seat`, `largerBuilder none`; a printed line pasted verbatim with its colon. Each compares the whole resolved roster, stdout with a plain run after, and the stderr `was:` line.
- R-1401: a BOM+CRLF file holding `objective`, `gate`, `postEdit`, an unknown key and a roster; every non-roster member deep-equal after; the builder changed.
- R-1402: bare `set`; `reviewr`; a builder with 2 and with 4 tokens; level `extreme`; `builder none`; `land none`; `reviewer claude-code sonnet`; `largerBuilder claude-code gpt-5`. Bytes and the folder listing unchanged.
- R-1403: invalid JSON, a top-level array, an unknown roster slot, a bad thinking value, a file over the 1 MiB cap, a directory at the path, a dangling symlink (POSIX only, as `nana-roster.test.mjs:182`). The path is unchanged (same bytes, still a directory, or the same link) and no entry is added to the folder.
- R-1404: a valid file (bytes unchanged), a malformed file (stderr names `PI_SESSION_ID`, not invalid JSON), an absent file (stays absent).
- R-1405: the lib seam `setRosterSlot(agentDir, args, {env, writeTemp, rename})`: a throwing `writeTemp` and a throwing `rename` (file byte-identical; the folder holds only `nana-pack.json` and at most `nana-pack.json.bak`); a recording `rename` on success (the temp held the full new text; its folder's `fs.realpathSync.native` equals the real target folder's).
- R-1406: logs SKIP when `symlinkSync` fails (unprivileged win32 without Developer Mode); runs everywhere else.
- R-1407: the BOM+CRLF file; after `set`, `nana-pack.json.bak` is byte-identical to the original.

**Known limits.**
1. No lock: a writer (desk save, installer, editor) between the read and the rename loses its write.
2. Re-serialized: two-space JSON, LF, BOM dropped, duplicate keys collapsed to the last, number spellings normalized; values equal. The `.bak` keeps the original bytes.
3. A file with no roster gets the whole roster, so later code-default changes stop reaching that machine (R-1121). Copy the `.bak` back to undo.
4. The guard is advisory: a model that unsets `PI_SESSION_ID`, an MCP or SDK shell without it, and pi older than 0.82.0 all pass it. Same scope as the gate.
5. Claude Code shells can run `set`: the seat, Claude Code builder subagents and pi-subagents' Claude Code children.
6. A relative `PI_CODING_AGENT_DIR` writes under the current folder, as the read does; a missing agent dir is refused with nothing created.
7. The desk's nana-pack editor still refuses a file that holds `roster` (CHANGE.md residual 22).
8. `set` validates only `roster`; a `gate` block that parses but is invalid policy is kept as is.
9. The mode is kept but not pinned; a hard-linked file loses its other link.
10. On Windows, a process holding the file without delete sharing fails the rename; that takes the R-1405 path. Re-run.
11. `set` must be the first argument: `nana-roster --json set ...` prints the roster and sets nothing. One `.bak` only: the next write by `set` or the desk replaces it.

## Rows the builder adds as `planned` first (seat, 2026-10-19)

- **R-1400** — WHEN `nana-roster set` is given a roster slot, with or without the printed colon, followed by the tokens the roster command prints for a valid entry of that slot, `nana-roster set` shall write the user-scope nana-pack.json so that the roster resolver returns the previous roster with only that slot replaced, print on stdout the lines the roster command then prints and on stderr that slot's previous tokens, and exit 0.
- **R-1401** — WHEN `nana-roster set` writes the user-scope nana-pack.json, it shall keep every top-level member other than `roster` equal in value to that member of the file it read, including a file saved with a byte-order mark and CRLF line endings.
- **R-1402** — IF `nana-roster set` names no roster slot, or its tokens do not form an entry the roster resolver accepts for the named slot, THEN `nana-roster set` shall print `nana-roster: set refused:` and the failing slot or field on stderr, exit 1 and leave the user-scope nana-pack.json byte-identical.
- **R-1403** — IF the user-scope nana-pack.json path is present and the roster resolver refuses it, THEN `nana-roster set` shall print `nana-roster: set refused:` with the resolver's refusal on stderr, exit 1, leave that path unchanged and add no entry to its folder.
- **R-1404** — IF the environment variable `PI_SESSION_ID` is non-empty, THEN `nana-roster set` shall print a refusal naming `PI_SESSION_ID` on stderr before it reads the user-scope nana-pack.json, exit 1 and write nothing.
- **R-1405** — `nana-roster set` shall replace the user-scope nana-pack.json only by renaming a fully written temporary file from the real target's own folder over that target, so that a failed temporary write or rename leaves the file byte-identical and no temporary file behind.
- **R-1406** — WHERE the user-scope nana-pack.json is a symlink to a regular file, `nana-roster set` shall write the new content to the link's target and leave the link in place.
- **R-1407** — WHEN `nana-roster set` replaces an existing user-scope nana-pack.json, it shall copy that file's previous bytes to `nana-pack.json.bak` in the same agent dir before the new content replaces it.
