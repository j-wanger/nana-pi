PASS — roster-roles independent check. No MUST findings.

1. **Scope and isolation.** Checked tip `9d9132af0217` against `origin/main` `816f63db6d3d` using separate git archives under <SCRATCH>. Used scratch <HOME>, agent and temporary directories. Never accessed the real agent configuration. The worktree stayed clean. This check serves named role slots and logged launches.

2. **Legacy compatibility.** Missing configuration, a lanes-only file and the old five-slot roster returned exit 0 on both revisions. Tip preserved the old lines and inserted:
   ```text
   planner: seat
   adversary: builder
   checker: builder
   ```
   Removing those additions made text output byte-identical to main. JSON preserved old values and ordering, adding three null keys after land. Raw output differs intentionally.

3. **Whole-file writes.** Compared `set builder openai-codex probe-model medium` from absent, lanes-only, legacy four-slot and old five-slot configurations. All four resulting files matched main by value. No unnamed new slot appeared. Other members survived, including `lanes`, `objective` and an unknown nested member. Main accepted the tip-created old-shape file. An explicit eight-slot file containing null roles worked on tip; main refused its new keys.

4. **Entries and setters.** Planner, adversary and checker each accepted pi and Claude Code entries: six successful sets, JSON reads and launches. Scout passed both runtimes too. Example output:
   ```text
   planner: openai-codex probe-planner high
   nana-roster: planner was: seat
   checker: claude-code sonnet
   nana-roster: checker was: builder
   ```
   Main refused new setters and tip-written new keys, as accepted by the plan:
   ```text
   roster has an unexpected field planner
   ```
   Main accepted a pi scout and refused a Claude Code scout. Clearing new slots retained null keys, so main still refused them, matching the README warning.

5. **Malformed entries.** Tested each new slot with a string, unsupported Claude model and invalid thinking. All nine returned exit 1 and named the offending path. Examples:
   ```text
   roster.planner is not an entry (got string)
   roster.checker.model must be one of the Claude Code subagent model names
   roster.adversary.thinking must be one of pi's thinking levels or null
   ```

6. **Exact launch selection.** PATH stubs recorded one child per launch. Pi received:
   ```text
   --provider openai-codex --model probe-<role> --thinking high
   ```
   Claude received `-p --model sonnet`. Every child received `NANA_ROLE=worker` and `NANA_WORKTREE_ROOT=<SCRATCH>/tip`. Claude scout received `Read,Grep,Glob,Bash,Edit,Write,WebSearch,WebFetch`; other Claude roles omitted web tools. The output file contained `stub child`.

7. **Fallbacks and refusals.** Absent or null adversary and checker slots launched the builder model. Diagnostics named `adversary (builder)` and `checker (builder)`. Planner returned:
   ```text
   pi-worker: slot refused: planner: seat; this role runs in the seat
   ```
   Scout returned the corresponding `scout: none` refusal. Both produced zero children and zero load lines. Builder, reviewer and land requests named their proper launchers. Main refused the unsupported slot interface without launching children.

8. **Load timing and failures.** Every successful launch wrote exactly one version-1 record containing role, supplying slot, runtime, model, cwd and brief. Claude records also included settings. A spawn-event observer recorded:
   ```json
   {"event":"spawn","exists":false,"lines":0}
   {"event":"after-spawn-listeners","lines":1}
   ```
   A child exiting 7 left one line; a missing executable left zero. An unusable log destination emitted one `nana context load skipped: EISDIR`; the child still succeeded.

9. **Notices and lineage.** Both hooks returned exit 0. Initial tip hook runs took **33.4–34.5 ms**; main took **33.2–34.4 ms**. Tip included:
   ```text
   land seat, planner seat, adversary probe-model medium, checker probe-model medium
   ```
   Default and whole-written default notices warned `checker shares openai with reviewer`. Pi launches warned `adversary versus planner unverified` when planning remained in the seat. OpenAI aliases and Anthropic/Claude aliases produced shared-family warnings. An unknown provider produced `unverified`. No model changed.

10. **Regression checks and limits.** Six targeted test files passed: roster, roster-set, roster-notice, Claude hook, worker-Claude and context-anatomy. Native Windows lifecycle coverage skipped on this Mac. This check does not establish Windows behavior. Ran the writing checker; technical-record identifiers and the mandated verdict remain intentionally.

**MUST findings:** None.

**SHOULD findings:** None.
