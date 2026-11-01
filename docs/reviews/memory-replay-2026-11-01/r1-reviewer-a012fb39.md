**memory-replay review: send back for one MUST (the shared-memory slot is empty in every real transcript)**

The other checks the brief asked for hold. No arm sees anything recorded after the replay moment, and the judge gets one reply per call without knowing the arm. Owner text stays private. The spend cap stops between cases. `decide` handles case sets and the confirmatory run as specified. But one slot rule fails on every real transcript, so the first paid run would test a different contrast from the one the README describes.

### MUST

**1. The shared-memory hook output never lands in the memory slot** (`packages/nana-pack/lib/memory-replay-config.mjs:31`, `packages/nana-pack/lib/memory-replay-context.mjs:49`)

- **The code:** a SessionStart hook output goes into the slot only when its recorded `command` contains `nana-shared-memory.mjs` or `nana-shared-memory`.
- **What Claude Code records:** Claude Code 2.1.310 writes the hook's `statusMessage` into that `command` field. nana-setup sets it to `nana: shared memory index` (`packages/nana-setup/lib/settings.mjs:208`).
- **Evidence:** I counted fields only, no content, in this machine's nana-pi transcripts. Every shared-memory SessionStart record carries that label, and none contains either marker.
- **Scratch run:** I fed `rebuildContext` that real record shape. The result was `control: "AUTOMEM"` with the shared index sitting in the prefix that every arm shares.
- **Consequence:** on real input, control's slot holds only the AutoMem files. Treatment and oracle/ceiling all keep the historical shared-memory index, so treatment adds the bundle on top of the old memory instead of replacing it.
- **What this breaks:**
  - R-3371 and R-3385, and the README line "Control keeps the recorded AutoMem and shared-memory hook output", are false on real input.
  - The seat's next step, a paid run of about $130, would answer a different question than the documented one.
  - The first delivery planned for the confirmatory run (the push) works through exactly this hook.
- **Why the test passes:** its fixture (test line 88) uses `command: 'node nana-shared-memory.mjs'`, a shape Claude Code does not record.
- **Fix:**
  - Match the recorded label, for example add `shared memory index` to the hook markers.
  - Use a realistic record in the R-3371 fixture and re-pin R-3385.
  - The marker is part of the case-set hash, so the seat re-runs `plan`, which costs nothing.

### SHOULD

**2. Every SessionStart output from the whole past is kept** (`memory-replay-context.mjs:47-50`). Real sessions re-run SessionStart hooks after each compaction (`SessionStart:compact`), so every earlier copy goes into the standing text. That text has no budget limit. The seat at P saw only the set after the last compaction. This makes each call longer and costlier, pushing toward the $1 per-call cap. Once MUST 1 is fixed, it also multiplies the control slot against an 8,000-character bundle. Keep only the outputs after the last compaction boundary.

**3. The per-case difference compares counts after dropped draws** (`memory-replay.mjs:255`). Take control at 5 of 5 repeats and treatment at 3 repeats plus 2 `unclear`. That gives d = +2, "favours bundle", although both arms repeat on every judged draw. Draws lost to a failed replay call (null reply) shrink an arm the same way, and the `unclear c/t` line doesn't count them. If one arm loses more draws, the test leans toward it. This follows the plan's wording, but it is a source of bias. Compare rates, or at least print failed draws per arm.

### NOTE

- **Ceiling attrition can drop cases from the verdict:** `classify` (line 250) needs the minimum number of judged draws in every arm, so too many `unclear` draws in the oracle/ceiling arm remove a case from the main test. This matches the plan's "each of its arms".
- **Counts from private data are in public files:** the session note and review brief state plan counts from the labels ([counts removed by the seat: private labels]). Plan step 7 says counts stay private. They are counts, not owner text.
- **Isolation of the replay call is unproven:** it relies on `--setting-sources ""` and `CLAUDE_CODE_DISABLE_AUTO_MEMORY`. The canary should confirm that no current user rules or CLAUDE.md reach the replay child. If they did, today's rulings would be later records shown to every arm.
- **Screen under the cap drops cases silently:** when the cap is hit during `screen`, the cases it never screened leave the screened plan without an `unrun` mark.
- **The system prompt may now be recorded:** recent transcripts carry a `prompt_snapshot` attachment with the system prompt, so the "not recorded" residual may be closable later.

### What I verified as working

- **No later records reach any arm:**
  - The context is cut at P (`slice(0, point + 1)`).
  - The bundle filter is `at < cut && start < cut`, with the cut at the session start.
  - The oracle takes the latest earlier instance with `at < start`.
  - The ceiling arm leaks by design and stays out of the verdict.
- **Judge:** each call carries only `{description, id: r1, reply}`, one reply per call, and replies are checked fail-closed against the expected shape.
- **Privacy:**
  - stdout prints counts and hashes; stderr prints only fixed lines.
  - Every writer goes through `privateFolder` with `refuseCheckout` and exclusive 0600 files.
  - Both runners are `claude` whatever `MEMORY_SHAPE_RUNNER` says.
- **Spend cap:** it is checked between cases; a call with unknown usage reserves its per-call cap. `incomplete` prints on the verdict line, and a killed run's missing cases are filled from the header's case list as `unrun`.
- **`decide`:**
  - It refuses runs whose rows carry a different case set or mixed preamble or judge hashes.
  - Only the first run per bundle-maker hash is `confirmatory`, and duplicate run ids are refused.
  - Hand-checked p-values match.
- `node packages/nana-pack/tests/memory-replay.test.mjs`: 20 of 20 pass, exit 0.

VERDICT: SEND-BACK
