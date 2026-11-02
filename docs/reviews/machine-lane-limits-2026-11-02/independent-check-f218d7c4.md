PASS — machine-lane-limits independent check (tip f218d7c4). No MUST findings.

Scope: tip f218d7c4 (feat/machine-lane-limits) against origin/main 0bd1df89, both extracted with `git archive` into a scratch folder. Every probe ran the real commands with HOME and PI_CODING_AGENT_DIR set to a fresh scratch dir per case and per side; the real `<HOME>/.pi/agent/nana-pack.json` was never read or written. Node v22.22.2, pi 1.4.0, macOS. `<S>` below is the scratch folder.

Test roster used where a roster is present: scout null, builder `anthropic m-build high`, largerBuilder null, reviewer `claude-code opus`, land null.

## Probe results

1. No file. Tip plain: exit 0, stdout ends `lanes: 4` / `source: default`, empty stderr. `diff tip main` on stdout: only `> lanes: 4` inserted before `source:`. Hook: `nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra, lanes 4 · change: "roster" in ~/agent/nana-pack.json`, exit 0.
2. File with roster, no lanes. Plain: `lanes: 4`, `source: <S>/homes/tip-nolanes/agent/nana-pack.json`, empty stderr. Hook: `... land seat, lanes 4 · change: ...`.
3. `"lanes": 2`. Plain: `lanes: 2`, empty stderr, exit 0. Hook: `... land seat, lanes 2 · change: ...`.
4. `{"lanes":2}` with no roster member. Plain: `lanes: 2`, `source: default`, exit 0. Hook: `roster (default): ..., lanes 2`.
5. Malformed values `"2"`, `0`, `-1`, `2.5`, `1e400`, `{"mac":4}`, `true`, `[2]`: each exit 0, slot lines unchanged, `lanes: 4`, exactly one stderr line `nana-roster: lanes ignored: must be a positive safe integer`. Hook: `..., lanes 4 (file value ignored) · change: ...`, exit 0.
6. `"lanes": null`: `lanes: 4`, no warning, hook `lanes 4` without the ignored mark (matches must-meet 1).
7. `"lanes": 1e9`: accepted, prints `lanes: 1000000000`, hook `lanes 1000000000`. The pack README states "no upper cap", so this is by design.
8. Malformed JSON file: tip and main both exit 1 with the same `roster refused: ... invalid JSON (...)` stderr (identical modulo the scratch dir name). Hook identical to main: `nana active · roster refused: invalid JSON · change: ...` (no lanes text in a refused notice).
9. Valid lanes beside an invalid roster (`{"roster":{"builder":7},"lanes":2}`): refused exactly as main (`roster is missing scout, reviewer, land`); a lanes value never rescues or changes a refusal.
10. CRLF file (`{\r\n  <roster>,\r\n  "lanes": 3\r\n}\r\n`): `lanes: 3`, hook `lanes 3`. UTF-8 BOM file with `lanes: 2`: `lanes: 2`.
11. `--json` against main, all 18 cases: stdout, stderr and exit code byte-identical to main (the two refusal cases differ only in the scratch dir name inside the path). One `roster` key; lanes never appears, and no lanes warning is printed on `--json`.
12. Byte comparison with main where lanes is absent or ignored: for all 18 cases, tip plain stdout with the `lanes:` line removed is byte-identical to main's stdout. Tip hook output with `, lanes N[ (file value ignored)]` removed is byte-identical to main's hook output in all 18 cases.
13. `nana-roster set builder anthropic m-two default`:
    - on `lanes: 2`: exit 0, file keys `roster,lanes`, `lanes` still `2`; set stdout byte-equal to the plain run that follows.
    - on `lanes: "2"`: exit 0, file keeps `"2"` verbatim (no data loss, no rewrite to 4); stdout prints `lanes: 4` and the warning on stderr, before the `builder was:` line.
    - on the CRLF file: `lanes` stays `3`.
    - on no file: writes `{roster}` only; no lanes member added.
    - on `{"lanes":2}` only: keys `lanes,roster`, lanes kept.
14. Older checkout: main's `nana-roster` and its `set` on every lanes-bearing file (2, `"2"`, 0, -1, 2.5, 1e9, 1e400, null, object, bool, array, CRLF, BOM, lanes-only) exit 0 with their usual output. Main's set kept `lanes` in the file in each case tried (lanes2, str, crlf, lanesonly).
15. Session-start hook time, wall clock per run, piped `{"source":"startup"}`: tip 40-53 ms, main 40-76 ms across the 18 cases. No measurable change. Exit 0 in every case, including refusals.
16. pi roster-notice extension: imported the tip's `extensions/nana-roster-notice.ts` with `node --experimental-strip-types`, registered against a fake `pi.on`, and fired `session_start` with reason `startup` and `hasUI: true`. It set widget `nana-roster` to one line with `lanes 2` for the lanes-2 file, `lanes 4 (file value ignored)` for the object value, and `lanes 4` for no file. A full `pi` run was not attempted (no auth in the scratch home).
17. Lane tests on the scratch tip: `node --test` over nana-roster, nana-roster-set, roster-notice, rulings and seat-rule test files: 5 files, 5 pass, 0 fail.
18. Rules text: the rulings file ends with the new 2026-11-01 lanes bullet and no longer holds the 2026-10-31 bullet; the seat guide's lane bullet points to the roster command. Sizes 4018 and 4674 bytes, under the 8192-byte injection cap each.

## MUST findings

None. No case stopped the roster command, the set command or the session-start hook. No case showed a wrong limit, and no case lost data in the roster file.

## SHOULD findings

None material. Observations, all documented in the pack README and not defects:
- No upper bound: `1e9` prints `lanes: 1000000000`.
- `--json` carries no lanes and prints no warning; a script consumer has to parse the plain output to read the limit.
- On a pi seat the limit shows in the widget, not in model context; the seat guide tells the seat to run the roster command.
