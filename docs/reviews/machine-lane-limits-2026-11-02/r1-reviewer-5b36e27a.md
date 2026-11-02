The feature works for a seat on each machine, and I found nothing that blocks the land.

**What I checked**
- **A machine with no `lanes` member** keeps the same roster, source, `--json` output and refusals as today. The only differences are the intended ones: a `lanes: 4` line before `source:`, and `, lanes 4` in the session-start notice. A file holding `lanes` but no `roster` still reports `source: default` and reads its limit.
- **A bad value never stops anything.** The new check in `nana-roster.mjs:129-133` cannot throw: `Number.isSafeInteger(value) && value >= 1`, and anything else falls back to 4. I tried strings, booleans, arrays, objects, 0, -1, 2.5, `1e400`, -0 and 1e20. Each resolves `ok` with one warning; the plain command exits 0 and `set` still works. `pi-worker`, `claude-review` and both reader scripts use only `.roster`, so builds and reviews are untouched. pi's own config reader (`lib/config.ts`, `normalizeRaw`) ignores an unknown top-level member, so the gate is not affected either.
- **An older checkout** is fine. I ran `origin/main`'s `nana-roster.mjs` against a file holding `"lanes":2`. It printed the roster and exited 0, and its `set` kept `"lanes": 2` in the rewritten file. `nana-setup install` only creates the file when it is missing and never rewrites it.
- **Notice:** the Claude Code hook and the pi extension both pass the resolver result through unchanged. A refused notice and a relative-dir notice show no lane text.
- **Tests:** I ran the touched files plus the nearby roster tests: nana-roster, nana-roster-set, roster-notice, rulings, seat-rule, pack-config-utf16, linked-launch, roster-notice-hook, claude-review and agent-dir-config. All pass. The seat's mutation log shows 12 of 12 wrong-code pairs red, run at 3a904a9c. The two later commits change only review records, not code or tests.
- **No stale wording:** no "four lanes" or "at most four" text remains in the rules, prompts, templates, AGENTS.md or the pack README. The rulings file (4018 bytes) and seat guide (4674 bytes) fit under their 8192-byte injection caps.

**Findings (all NOTE, none blocks the land)**
- NOTE: the plan expected three residuals in `docs/known-bugs/FEAT-006.md`, but the diff adds none:
  - a rule line cannot prove a seat obeys its limit;
  - a pi seat's model sees the limit only by running the roster command, because pi shows the notice as a widget;
  - the laptop prints 4 until its Carry issue is done.
- NOTE: the warning comes out in a different place in the two commands. The plain command writes it to stderr before its stdout lines; `set` writes it after its stdout lines, before `was:` (`nana-roster.mjs:189` vs `:204`). This is cosmetic.
- NOTE: `--json` gives no sign that a `lanes` value was ignored. R-1192 intends this, and the plain command and the notice both show the fallback.
- NOTE: a Windows laptop that pulls but skips `nana-setup install` keeps its byte-equal copy of the old "four lanes" ruling and seat guide. The README and the plan's Carry steps cover this. Main behaves the same way until then.
- NOTE: `nana-writing` flags the new ruling's last sentence as possibly passive ("are planned"). That check only reports, and this is not HANDOFF.

**Still open:** CI on this tip was still running when I looked (run 41381861189). The run on the previous tip passed.

VERDICT: LAND
