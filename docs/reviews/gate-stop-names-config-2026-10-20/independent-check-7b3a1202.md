# Independent check — gate-stop-names-config at 255846f0 (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at tip 255846f0 under <tmp>, with a temp HOME and TMPDIR for every probe. Node is 22.22.2 and pi is 1.0.2, on macOS. I ran single test files only. No file in the clone changed, and I removed <tmp> afterwards. No probe process is still running.

Baseline (single files, run on the tip):
- These files all pass: config-gate-fallback 42/0, config-project-gate-fallback 28/0, config-normalize, gate-survives-mutation 38/0, config-display-text 38/0, bounded-read 4/0, gate-corpus 227/0, objective-golden 1280/0.
- With config.ts put back to 9552afb1, the five new checks (R-2360 to R-2364) all fail, along with the 14 churned checks. So the new tests do not pass without the feature.
- The map check reports 0 problems, the readme check 0 problems over 727 claims, and requirements-moved lists R-2360 to R-2364 as new and implemented.

Probes. Each one drives the real nana-gate tool_call handler in a fresh node child unless it says otherwise:
P1 `{"objective":{"path":"C:\Users\demo\notes\OBJECTIVE.md"}}`, bash and write
  -> "nana-gate: user nana-pack.json does not parse: <tmp>/h1/.pi/agent/nana-pack.json at line 1, column 26. Write paths in this file with forward slashes ... as an escape. Recovery: repair the named config file outside pi, then retry." -- HOLDS (one period before Recovery)
P2 UTF-16LE BOM file, multi-line, trailing comma
  -> "... does not parse: <tmp>/h2/... at line 4, column 3. Repair the JSON by hand. Recovery: ..." -- HOLDS
P3 empty file, powershell call
  -> "... does not parse: <tmp>/h3/.../nana-pack.json. Repair the JSON by hand. Recovery: ..." -- HOLDS (no place given)
P4 `{"gate": sk_live_zq7demo}`
  -> "... does not parse: <tmp>/h4/.../nana-pack.json. Repair the JSON by hand. Recovery: ..." -- HOLDS (no file text in the stop)
  The UI warning still reads "invalid JSON (Unexpected token 's', \"{\"gate\": sk_live_zq\"... )". This is the declared residual.
P5 a file cut off mid-write, `{"gate": {"extraPatterns": ["\\bterraform`
  -> "... at line 1, column 42. Repair the JSON by hand. ..." -- HOLDS
P6 a HOME folder name holding a newline and ESC[31m
  -> "... does not parse: \"<tmp>/h6\\u000A\\u001B[31mx/.pi/agent/nana-pack.json\" at line 1, column 26. Write paths ..." -- HOLDS (one line, controls escaped)
P7 valid JSON with a bad gate leaf, `{"gate":{"extraPatterns":"rm"}}`
  -> "... gate block is malformed — repair it (<tmp>/h7/...:gate.extraPatterns: expected an array of regex strings, got string). Recovery: ..." -- HOLDS (old text kept)
P7b top-level `[]` -> "... gate block is malformed — repair it (...:top level: expected an object, got array)" -- HOLDS (a declared known limit)
P8 a valid terraform deny, then the file broken mid-session with `"C:\Users\demo\o.md"`
  -> tf1 is blocked, tf2 is blocked, ls2 is allowed. So the last valid policy holds and no stop shows.
  Fresh process on the broken file -> ls stopped "... does not parse: ... at line 1, column 82. Write paths ...".
  After the repair in the same process -> ls_after_fix is allowed and tf_after_fix is blocked. -- HOLDS (repair lifts the stop live, the deny survives, no fail-open)
P9 a trusted project file `{"handoff":{"path":"D:\work\HANDOFF.md"}}` with a valid user file
  -> edit stopped: "nana-gate: project nana-pack.json does not parse: <tmp>/proj9/.pi/nana-pack.json at line 1, column 24. Write paths ..." -- HOLDS
  The same broken file in an untrusted project -> allowed. -- HOLDS (unchanged)
  User file `{"gate":{},}` broken as well -> "user nana-pack.json does not parse: ... at line 1, column 12. Repair the JSON by hand." -- HOLDS (user wins)
P10a a win32-shaped file path through the lane's exact expression (json-text plus displayPath)
  -> "user nana-pack.json does not parse: C:\Users\demo\.pi\agent\nana-pack.json at line 1, column 26. Write paths ..." -- HOLDS
  The changed path has no process.platform branch, so I did not force win32 at runtime.
P10b PI_CODING_AGENT_DIR set to a folder named with backslashes (`C:\Users\demo\agent`), real gate
  -> "... does not parse: <tmp>/h10/C:\Users\demo\agent/nana-pack.json at line 1, column 26. Write paths ..." -- HOLDS
P10c the objective config-failure line against the gate stop for the same file, through loadConfig
  -> objective: "NANA-PACK CONFIG UNPARSEABLE: <file> at line 1, column 26. Write paths ... escape."
  -> gate: "user nana-pack.json does not parse: <file> at line 1, column 26. Write paths ... escape" -- HOLDS (same place and same advice)

Harm check:
- Every stop branch still sets a non-empty reason, and the block return is unchanged, so the gate does not fail open.
- No code outside the pack tests matches on the old "gate block is malformed" text, in apps, nana-setup, nana-knowledge or nana-stage (checked with git grep).
- The new tests write only under tmpDir(os.tmpdir()).
- The lane does not touch nana-setup or any hook file, and objective-golden stays green.

Findings: no MUST.
- Known bug (declared): the config warning and the config_invalid journal line still quote up to 120 characters of the parser message, which can include file text (P4).
- Known bug (declared): an unreadable file, a file over the size cap, or a top level that is not an object keeps the old "gate block is malformed" text (P7b).

HANDOFF (unchanged on the tip, 9552afb1..255846f0 touches no HANDOFF line):
- The carried residual "Config line (win-config-json-path, out of scope): pi's gate stop for a broken config still calls the gate block malformed. That stop, pi's config warning and the journal still quote up to 120 characters ..." becomes untrue for a file that does not parse. It must shrink to the warning and the journal only. It could also note that unreadable, over-cap and non-object files keep the malformed text.
- The tip has no Landed line and no residual lines for this lane yet. The seat must add them before the final round.
