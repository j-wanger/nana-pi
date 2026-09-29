# L5 round 2 confirm review

## Five prior MUSTs

1. **PARTIAL — forged seat output**
   - **executed:** hostile probe now emits only:
     ```text
     [nana:adoption]
     4 entries were not printable ... and were skipped.
     ```
     No forged heading or path appears; backticks and backslashes are escaped.
   - **executed:** 1,500 hostile claims produce a bounded 142-byte, two-line response quoting no input.
   - **OPEN:** a timestamp 60 seconds in the future is accepted and listed:
     ```text
     FUTURE_PLUS_60S listed= true counted= false
     ```
     This contradicts the explicit “future timestamp drops” ruling. `packages/nana-pack/lib/adoption.mjs:20,160-170`
   - **OPEN:** an invalid path with a valid timestamp eight days old is still counted because validation precedes the seven-day filter:
     ```text
     OLD_BAD_8D output_empty=false
     1 entry was not printable ...
     ```
     `packages/nana-pack/lib/adoption.mjs:160-164`
   - The producer-side printable gate is an acceptable tightening: it uses the shared predicate and prevents permanently unactionable claims from entering the journal. `packages/nana-pack/extensions/nana-handoff.ts:343-348` **source-read**

2. **FIXED — producer/reader journal mismatch**
   - **executed:** project journal receives ordinary `handoff_missing`, while `directory_unadopted` goes to the user journal and is read successfully.
   - **executed:** relative user `journal.path` sends adoption to `<agent dir>/nana-journal.jsonl`, not either process cwd.
   - Following only user-scope `journal.enabled` is coherent for user-scope state; disabled probe produced empty output. `packages/nana-pack/lib/adoption.mjs:67-79` **source-read**

3. **FIXED — one store resolver**
   - **executed:**
     ```text
     packages/nana-pack/lib/adoption.mjs:42: storeDir
     packages/nana-pack/lib/adoption.mjs:44: canonicalCwd
     packages/nana-pack/lib/adoption.mjs:52: storePathFor
     ```
     No implementation remains in the extension; identity tests pass.
   - `ACTIVE STORE root still reported=true` is expected because the store deliberately remains `~/.pi/agent/handoffs`. `packages/nana-pack/extensions/nana-handoff.ts:57-61` **source-read**

4. **FIXED — broken versus absent journal**
   - **executed:** directory journal → `ADOPTION UNAVAILABLE ... ENOTFILE`; mode-000 journal → `... EACCES`; absent journal → empty stdout.
   - The changed assertion corrects the old false-silence behavior rather than weakening coverage. `packages/nana-pack/lib/adoption.mjs:103-131`

5. **FIXED — configured objective filename**
   - **executed:** `GOALS.md` is listed without the setting and suppresses the report with `objective.projectFile=GOALS.md`, in both producer and reader.
   - The copied one-line bare-filename validation exactly matches `objective.ts` over the tested matrix. Acceptable at this size, though extracting a shared `.mjs` predicate would remove drift risk. `packages/nana-pack/lib/adoption.mjs:75-79`

## New blocking finding

- **Test pollutes and mutates the repository.** `packages/nana-pack/tests/adoption-producer.test.mjs:195-196` deliberately configures a relative journal while ordinary handoff events retain cwd-relative behavior. The resulting runtime artifact was committed as `packages/nana-pack/rel-journal.jsonl:1-7`, containing temporary machine paths.
- **executed:** the full suite appended an eighth line and left:
  ```text
   M packages/nana-pack/rel-journal.jsonl
  ```
  I restored the test mutation afterward. Remove the committed artifact and make the test clean up or isolate the cwd-relative ordinary journal.

## Edge matrix

```text
PROMPT SUMMARY 5/5 byte-identical
COUNT_FLOOD bytes=142 lines=2
TEMP_UNREACHABLE absent_output_empty=true restored_listed=true
```

Temporary unreachability therefore does not permanently discard a journaled repository.

```text
env -u NANA_HANDOFF npm test
81 files: 80 PASS, 0 FAIL, 1 SKIP, 0 WARN
4924 pass, 0 fail, 6 skip
```

The one-line `project-dismiss.test.mjs` change is a necessary assertion correction and does not matter. The declared 11-file advisory ceiling overrun is low-impact, but the undeclared `rel-journal.jsonl` makes the actual lane 12 non-test files and is a real defect, not merely appetite accounting.

SCORE: 7/10  
MUST: reject every `t > now`; age parseable old claims out before counting; remove `packages/nana-pack/rel-journal.jsonl` and stop the test from dirtying the worktree.  
CARRY: broken installed hook symlink exits 127; tiny copied objective-filename validator; dismissal markers of any filesystem type remain accepted; advisory 11-file lane ceiling after removing the artifact.  
VERDICT: BLOCK
