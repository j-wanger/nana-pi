# Lane roster-notice — build brief 2 (2026-10-16 · feat/roster-notice · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Build 1 (`59db91d`) passed the seat's acceptance (296/298, the two misses are the seat's
notes) and the full suite. The seat's mutation runner caught 66 of 68 breaks (`seat-mutate-output-59db91d.txt`; pairs 13
and 53 survive). The lane's one independent check (`seat-verify-59db91d.md`) found one behaviour bug, doc errors, and
rows that read implemented on tests that do not pin their clauses. This brief is a closed list. For every new or
strengthened assertion: break the code it pins, see red, restore. Build brief 1's rules hold.

1. **Home path with a trailing slash (R-1204).** With `HOME` ending in `/` (or `\` on Windows), both seats print the
   absolute home path in the pointer and in a path-bearing refusal. Normalise the home folder before the `~` rewrite.
   L12 gains the case.
2. **Pin each clause its row claims.** Each item is one assertion or one fixture, in the test the plan names:
   - R-1202 (L10): a refusal whose problem carries an echoed value after ` (` — for example a builder provider `acme
     corp` — shows no echoed value (pair 13).
   - R-1194 (L1): a resolved-roster notice holds no line break; reviewer and land with thinking levels show them.
   - R-1201 (L9): `(default)` sits right after `roster`.
   - R-1210 (L13): the widget is placed above the editor.
   - R-1191, R-1212 (W3, W6): each refusal leaves no lock file and starts no pi — check the lock path does not exist
     after the refused launch (pair 53).
   - `--lane-size small` with `largerBuilder` set starts the builder (a W case).
   - `--lane-size larger` with a null slot prints `builder:` (W5 or a W case).
   - R-1192 (N4): a file roster's `--json` output holds every slot in print order and reads back the same.
   - R-1122 (N2): a runtime field on scout or land is refused; a full Claude model name is refused naming
     `roster.largerBuilder.model` exactly.
   - R-1209 (I1): the install check's hook branch calls the predicate (a stub hook printing plain text, the unavailable
     notice, a missing `hookEventName` or a wrong prefix each fails the run's roster row).
   - R-1206 (H2): the user message carries the change pointer; a JSON input with no `source` shows it.
   - R-1207 (H3): a throw after the modules load (not only a load failure) prints the unavailable notice.
   - R-1193, R-1213 (T1, T2): assert the bullet's routing and trigger sentences, so an inverted bullet fails.
3. **Docs that say what is true.** The shared runtime table must not say a reviewer or worker child shows the widget
   (children have no UI). The pack README and pi-worker header: `--lane-size larger` with no `largerBuilder` prints
   `builder:`. The README's roster command format shows the `claude-code <model>` line. "Stops pi's gate" reads as
   "blocks every gated tool until the file parses".

Do not change any row's requirement text. Do not touch `CHANGE.md`, the seat's files, `HANDOFF.md` or `docs/sessions/`.

## Done
The touched test files green; `node docs/reviews/roster-notice-2026-10-16/seat-titles.mjs 1` → `0 missing`; the seat's
acceptance → only its two note cases miss; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs
--check`; `npm run -s readme:check`; `node scripts/requirements-trace.mjs`. Commit, push.

## Report
≤ 20 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output; the one claim most likely wrong.
