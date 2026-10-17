# Seat's checks of build 1 (2026-10-16, at 59db91d)

- Seat acceptance: 296 of 298 (the two misses are the seat's notes). Title check: 0 missing.
- Full suite: two failing files, both tripped by the seat's own acceptance script (it read the agent dir directly and
  started a real pi without a private knowledge home; R-190 and R-898 scan the review folders). Fixed in the seat's
  script; both files pass.
- The seat's mutation runner, five-way split: 66 of 68 red; pairs 13 and 53 survive (`seat-mutate-output-59db91d.txt`).
- The lane's one independent check (five angles, each finding re-run by another checker): 42 confirmed (23 MUST, 10
  SHOULD, 9 NOTE), 0 not confirmed. Many MUSTs repeat across angles: one behaviour bug (a home path ending in `/`
  prints the absolute path), and rows that read implemented on tests that do not pin their clauses. Build brief 2 is
  a closed list built from them. The full record stays in the seat's scratch. No checker touched the real home folder,
  `~/.claude` or `~/.pi` (a guard watched).

## Findings

- [0] MUST · notice · R-1202 reads implemented, but no suite test pins the cut before ' (': removing the cut leaves every notice test green and puts echoed values in the notice
- [1] MUST · notice · R-1194's 'one line' and each entry's thinking level are not pinned by its cited tests (L1, L3): a four-line notice, or one that drops the reviewer's and land's thinking, passes
- [2] MUST · notice · With HOME ending in '/', both seats print the absolute home path in the pointer and in a path-bearing refusal, even with no PI_CODING_AGENT_DIR
- [3] MUST · notice · R-1210's 'above the editor' is not pinned: the extension can place the widget below the editor and every check stays green
- [4] SHOULD · notice · The shared runtime matrix says a pi reviewer/worker child shows the roster notice as a widget, but children have no UI and show nothing
- [5] SHOULD · notice · R-1206's 'can read no source' is pinned only for empty and non-JSON input: a JSON input without a source can lose the user message and H2 stays green
- [6] NOTE · notice · The hook also raises systemMessage for source 'new', which is outside R-1206's list
- [7] NOTE · notice · An agent dir path holding a line feed makes the notice three lines, because the path is put back raw
- [8] MUST · lineup · The cited tests do not check that the Claude Code refusal and the no-size refusal come before the worktree lock; plan pair 53 would survive
- [9] MUST · lineup · The --json check does not pin 'the resolved roster with every slot in print order'; a --json that drops the file's largerBuilder and reviewer passes
- [10] MUST · lineup · R-1122's new clause naming `roster.largerBuilder.model` is checked only for the word 'model'
- [11] SHOULD · lineup · The README and the pi-worker header say every `--lane-size larger` launch prints `builder (larger lanes):`; with a null largerBuilder it prints `builder:`
- [12] NOTE · lineup · The README's roster command line format leaves out the `claude-code <model>` form
- [13] SHOULD · lineup · The shared runtime table says the reviewer/worker child shows the roster notice widget, but the extension shows nothing without a UI
- [14] MUST · install · R-1209 reads implemented, but its cited test pins neither the install-check wiring nor three of its clauses
- [15] MUST · install · R-1207 reads implemented, but its clause 'throws other than while reading its input' is pinned by no test
- [16] SHOULD · install · Shared runtime table says reviewer/worker children show the roster widget, but those children have no UI, so the extension shows nothing
- [17] NOTE · install · Hook gives a systemMessage for input source "new", a value outside R-1206's list
- [18] MUST · tests-pin · The refusal cut in R-1202 is not tested: removing the cut leaves all 16 roster-notice checks green and lets a provider value into the notice
- [19] MUST · tests-pin · R-1194's "one line" is not tested: a notice that spans three lines passes every check
- [20] MUST · tests-pin · "Before taking the worktree lock" in R-1191 and R-1212 is not tested: moving either refusal after the lock leaves all 50 worker-lane checks green
- [21] MUST · tests-pin · `--lane-size small` with largerBuilder set is never launched: ignoring the size passes, though it would send every small lane to the larger-lane builder or refuse it
- [22] MUST · tests-pin · I1 does not test R-1209's hookEventName or either prefix: four predicate breaks each leave install-check green
- [23] MUST · tests-pin · H2 checks only the systemMessage prefix, so the user message can drop the change pointer on startup, resume, clear and fork
- [24] MUST · tests-pin · L13 does not test R-1210's "above the editor": a widget placed below the editor passes
- [25] MUST · tests-pin · The "throws other than while reading its input" clause of R-1207 is not tested: a hook that catches only load errors passes
- [26] SHOULD · tests-pin · X1 and X2 on the Windows leg pass a roster hook that cannot resolve its modules
- [27] MUST · tests-pin · N4 does not test R-1192's "every slot in print order" or the read-back of a file roster
- [28] MUST · tests-pin · T1 matches three substrings, so an inverted larger-lanes bullet passes
- [29] MUST · tests-pin · N2 tests only some of what its title and R-1122 claim: a runtime field on scout or land, and the `roster.largerBuilder.model` field path
- [30] SHOULD · tests-pin · The fallback builder line is not tested: `--lane-size larger` with a null slot can print `builder (larger lanes):`
- [31] MUST · tests-pin · L9 does not test R-1201's "after `roster`"
- [32] MUST · tests-pin · The plan's red lists in §5.4 are wrong for pairs 1, 3, 13 and 36
- [33] NOTE · tests-pin · H2's in-process read-failure case reads the ambient HOME agent dir when the file runs outside scripts/test.mjs
- [34] MUST · docs-rules · R-1193 reads implemented, but T1 does not pin its routing clause ('a seat builds a larger or riskier lane with it')
- [35] SHOULD · docs-rules · The shared runtime table says reviewer and worker children show the roster widget; they never do
- [36] SHOULD · docs-rules · The pack README says a '--lane-size larger' launch prints 'builder (larger lanes):'; the null-slot fallback prints 'builder:'
- [37] SHOULD · docs-rules · R-1213's test pins 'stops and asks' but not its trigger ('a seat that cannot start that builder')
- [38] NOTE · docs-rules · README's 'stops pi's gate' can read as the gate turning off; a JSON slip actually blocks every gated tool
- [39] NOTE · docs-rules · The roster-command line format in the README leaves out how a Claude Code entry prints
- [40] NOTE · docs-rules · The working pattern's 'Builder launcher' command is refused once largerBuilder is set
- [41] NOTE · docs-rules · No README states the Claude Code hook's output contract
