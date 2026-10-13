## Review: SEND-BACK — 78/100

Reviewed `7e6ce39..95d0410`. Two regressions block landing: PowerShell can hide a live commit, and the merge changes POSIX behavior.

### MUST

**1. Do not treat an embedded `#` as a PowerShell comment.**  
`packages/nana-pack/lib/pipe-guard.mjs:212`

The lexer starts a comment at every unquoted `#`. In PowerShell argument tokens, an embedded hash can be literal.

Reproduced:
```powershell
npm test | Select-Object -Last 5; Write-Output issue#123; git commit -m x
```

The predicate returns a reason with the Bash lexer and `null` with PowerShell. An unquoted URL containing `/#summary` produces the same result. The new lexer hides the live commit.

**Smallest fix:** recognize comment starts using PowerShell token boundaries. Add positive cases for embedded hashes followed by live pipelines and commits, alongside genuine-comment negative cases. Pin the result through `decideHook` too.

**2. Restore main’s matcher-independent knowledge repair.**  
`packages/nana-setup/lib/settings.mjs:427`

For an entry without a required matcher, the new scan accepts only groups whose matcher is absent. Main scanned every group.

I compared both implementations using an installer-shaped stale knowledge entry under `matcher: "*"`:

- Main: replaces its command in place.
- Tip: reports `found: false`, leaving the stale command.
- The subsequent append path can add another knowledge entry.

This contradicts CHANGE §3’s explicit “otherwise every group” rule and the promised unchanged POSIX merge behavior.

**Smallest fix:**
```js
const matcherOk = w.matcher === undefined || group?.matcher === w.matcher;
```
Add a differential regression covering matcher-scoped knowledge entries, including stale and healthy targets.

**3. Recognize installer ownership by the complete repository suffix.**  
`packages/nana-setup/lib/settings.mjs:399–400`

The exec-form ownership check accepts any absolute path ending in the script basename. For example, an otherwise matching entry naming:
```text
C:/custom/nana-objective.mjs
```
returns `form: "win32-exec"`. Repair then replaces this customized target with nana’s checkout target.

CHANGE §3 requires the entry’s repository suffix, not merely its basename. Hand-written entries are explicitly in scope.

**Smallest fix:** require `/packages/nana-setup/claude/hooks/<name>` or `/packages/nana-knowledge/bin/nana-knowledge.ts` when identifying installer-owned exec entries. Keep invocation detection broader so preserved variants need no duplicate.

**4. Make the implemented evidence prove its stated clauses.**  
`packages/nana-setup/tests/hooks-win32-exec.test.mjs:104,111–147`  
`REQUIREMENTS.md:686,776–777,913,915`

Several assertions are weaker than the rows:

- **R-1058:** the spawn timeout adds **5,000 ms** to the installed timeout. A hook taking nine seconds can satisfy a five-second contract. No per-hook durations are recorded. The cited objective check only checks exit status; module-resolution errors are explicitly checked only for knowledge.
- **R-1064:** `isAsk` parses only the first output line. Additional JSON or diagnostic stdout passes “exactly one JSON line.”
- **R-1063:** the shared-memory assertion searches for the seeded description, not the required seeded `- [` index line.
- **R-1055:** cited doctor cases cover healthy and missing targets, but not wrong event/matcher, an existing outside-checkout target, or a good entry alongside a stale duplicate.
- **R-1060:** assertions pin the version string, but not the note’s full meaning or the prohibition on running `claude`.

**Smallest fix:** strengthen these assertions, use each entry’s actual timeout, record durations, and add the missing negative cases. Rerun the Windows file and refresh its evidence. Until then, qualify or downgrade the unproven clauses.

**5. Scope R-923 honestly.**  
`REQUIREMENTS.md:718`

The row now claims all hand-written variants survive without duplication. The plan explicitly declares that `node.exe`, backslash-only script paths, and some full interpreter paths read as absent and get another entry.

The cited tests prove narrower variants using recognized interpreter and script spellings. They cannot justify the unrestricted promotion to `implemented`.

**Smallest fix:** qualify the row to recognized invocations and record the declared Windows spelling limitation beside its evidence. Alternatively, implement and test those spellings.

### SHOULD

**6. Make Jake’s acceptance instructions deterministic and directly runnable.**  
`docs/sessions/2026-10.md:17`  
`HANDOFF.md:76`

“Pipe a test run before a commit” is ambiguous: separate tool calls do not trigger this predicate. Knowledge output also needs an indexed, relevant source; adoption alone does not guarantee it.

**Smallest fix:** provide:

- The checkout-relative `node …\nana-setup.mjs install` and doctor commands; Windows has no linked setup command.
- A disposable project and one command string containing both pipeline and commit.
- Explicit objective, shared-index and knowledge fixtures.
- The throwaway hook’s actual JSON, followed by removal instructions.
- The flag-fetching environment variables and debug-duration version floor already listed in CHANGE §5.

**7. Correct stale or overbroad prose.**  
`packages/nana-setup/README.md:44`  
`packages/nana-setup/tests/win32-degrade.test.mjs:87–91`

The README says an entry with an outside-checkout target is replaced “in either form,” without the ownership restrictions. Customized entries intentionally remain untouched.

The test title still says “only the knowledge hook is wired”; it now examines only `UserPromptSubmit`. The old prefix assertion also remains vacuous for `command: "node"`.

**Smallest fix:** qualify repair as applying to recognized installer-shaped entries; rename the knowledge-only title to its actual event scope and remove or rewrite the redundant prefix assertion.

### NOTE — verified and remaining limits

- `settings.mjs:370`: strict status-message equality correctly preserves both **different** and **missing** messages. The committed build-3 mutation results support both fixes.
- All changed requirement sentences have one `shall`. R-387 and R-936 are retired; R-1052 remains withdrawn.
- R-1050/1051 pin exec shape and checkout targets; R-1053 pins the matcher; R-1054 pins dialect routing. R-1057 pins running the Node check, and R-1059 pins healthy legacy-form conversion.
- R-1056 and R-1061 have useful coverage, but the matcher regression above defeats the stronger unchanged-merge promise.
- R-1062 covers the planned quoting cases, but misses the embedded-hash regression.
- R-1058, R-1063 and R-1064 explicitly identify Windows-only evidence. Their citations still name the earlier CI run, rather than supplied run `38313718241`.
- The three Support lines are byte-identical. The shared runtime region matches its template; `CLAUDE.md` links to `AGENTS.md`.
- The session’s 59/59 acceptance and 31/31 mutation statements agree with the committed records. Those results do not establish complete clause coverage.
- Windows uninstall, unrecognized handwritten spellings, Claude Code’s actual dispatch, PATH selection and machine latency remain declared limits—not evidence of broad parity.

### Checks run

| Check | Result |
|---|---:|
| Seat acceptance | 59/59 |
| Test-title check | 0 gaps |
| Pipe guard | 60 pass |
| Settings merge | 206 pass |
| Forced-win32 degradation | 75 pass |
| Verifier hook | 26 pass |
| Template rendering | 124 pass |
| Requirements tree | 78 pass |
| Map / README checks | Both green |

I read all three mutation outputs and did not run the mutation runner. I did not independently execute Windows, PowerShell, or the full suite. The checkout remains unchanged.

VERDICT: SEND-BACK
