# config-advice-fixes — plan attack (one adversary)

Verdict: AMEND

AMEND, one change: R-2092 now pins the advice's meaning for its own user. Everything else holds.

How the plan was checked:
- The adversary rebuilt the plan in a temp clone of main 385c633f with a temp HOME and ran every wrong code against it.
- Raw output was saved to scratchpad/config-advice-fixes-mut-out.txt.
- The real repo stayed untouched.

What held:
- Node 22.22.2 gives `Bad Unicode escape in JSON … (line 1 column 11)` for both `D:\umbrella` and `c:\users\x`.
- `C:\x`, `\x41` and a gate pattern's `rm\s+` give `Bad escaped character`. The adversary did not have Node 24, so the plan's Node 24 claim was not re-probed.
- With the design applied, objective-golden passes 1278 checks in 28 s and doctor-detail passes 71.
- requirements-trace exits 0, with 0 rows off EARS form and all 1282 implemented rows traced.
- requirements-tree --check passes after --write. map:check reports 0 problems, and readme:check reports 0 problems over 718 claims.

Wrong codes, each turning red only the named checks:
- W0 (main's product code plus the two exports): R-2090, R-2091, R-2092 and R-2093.
- W1: R-2094.
- W2: R-2092.
- W3: R-2090 and R-2091.
- W4: R-2093.
- W5: R-2092. This is new; under the plan it survived.
- W6 (classifier fixed, advice still names objective.path): R-2092.
- W7 (every parse error gets the forward-slash repair): the existing R-1971 and R-1972 checks.

The finding, R-2092:
- The plan's R-2092 fixture is a regex: a gate pattern with `\s`. Forward slashes are the wrong fix for a regex.
- The user of that row needs the "write the backslash as two" clause. The plan's check only imported the constant and looked for key names, so it confirmed the implementation rather than the promise. W5 (paths-only advice) passed it.
- The amended row and check require the text after the displayed file to say "backslash as two" and to name no NanaPackConfig key. W5 and W6 now go red.

Other attacks, all of which held:
1. Class install/hook/gate is right. json-text.mjs and objective.ts are the producers behind the Claude Code hook, the pi extension and doctor's row. The predecessor win-config-json-path touched the same files and had the same class.
2. A simpler design was considered and rejected: folding the u fixtures into the R-1971 and R-1972 checks. That would leave R-1971's "bad escaped character" ambiguity implicit. Separate rows make the u case explicit.
3. Re-exporting from objective.ts follows precedent: doctor-detail already imports CONFIG_FAILURE_PREFIX and displayPath from there.
4. R-2093 serves no user directly, but it earns its place: one character of code restores the producer's documented "Never throws" contract, which the last lane broke.
5. Windows and Linux: the new checks reuse R-1971's machinery, which is green on all three CI legs. R-2093 and R-2094 call the producer directly with no platform-specific path, so no check needs a skip.
6. Rows are no wider than their tests, IDs stay inside R-2090–R-2094, and every step writes inside the lane worktree.

In-flight lanes:
- pi-probe-timeout changes doctor.mjs only in the pi --version probe. It does not touch the nana-pack.json row.
- install-cli-pins touches pi-registration.test.mjs, which only imports parseJsonText. That function is unchanged.
- No in-flight worktree touches json-text.mjs, objective.ts, objective-golden.test.mjs or doctor-detail.test.mjs.

This slate:
- handoff-pins edits FEAT-002 rows. Those sit at least five unchanged lines after the insertion point, so there is no merge conflict.
- pack-config-agent-dir-pins might also append checks at the end of objective-golden.test.mjs. That would be a trivial keep-both conflict. objective-golden has no stranded-config test today, so this is unlikely.

Builder: a simple lane, so a Claude Sonnet subagent builds it.

One claim most likely wrong: that R-1971 and R-1972 need no rewording. A reviewer may read "bad escaped character" as V8's message name, not as any bad escape. Under that reading those rows send the u case to the manual repair, which contradicts R-2090 and R-2091. The fallback is to reword R-1971 and R-1972 to "a bad escape, including a backslash before u that starts no Unicode escape, or a control character". Their IDs and check titles stay the same, and each check gains one u fixture.
