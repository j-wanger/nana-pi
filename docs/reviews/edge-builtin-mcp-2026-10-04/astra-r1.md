## Review: BLOCK

The built-in MCP chain works, including persistence and replay. R-760 still has a reproducible counterexample, and the deployment instructions will not load the new manifest.

### MUST — R-760 can recommend moving a genuinely held, empty lock

**Locations:** `REQUIREMENTS.md:55`; `packages/nana-pack/lib/objective.ts:287–290,479–480`.

`lockProblem()` classifies a directory it cannot read as “lock path obstructed,” then recommends moving it aside. An unreadable directory can still be a live, empty proper-lockfile lock.

**Executed evidence:** Using installed pi’s `proper-lockfile`, I called its exact locking primitive:

```js
process.umask(0o444);
lockfile.lockSync(dir, { realpath: false, lockfilePath: lock });
```

The acquired lock had mode `333`. While holding it:

- `readdirSync(lock)` threw `EACCES`.
- `trustRecord()` returned `problem: "lock path obstructed"` and `detail: "an unreadable folder"`.
- `trustRemedy()` said **“move it aside first.”**
- The returned release function successfully removed the lock.

This is a fresh, empty, genuinely acquired lock: the narrowed R-760 still applies. The normal file/link/non-empty obstruction cases do not establish that *every* obstruction classification excludes a held lock.

The existing T17 test pins readable fresh/future-dated directories. My removal-advice mutation made all four cited held-lock checks fail, but the suite lacks this unreadable-directory case.

**Smallest fix:** Treat an unreadable lock directory as potentially held; never recommend moving it based on failed inspection. Add the acquired-lock regression above, and correct the row’s explanation. Until then, `implemented` is false.

### MUST — The deployment instructions retain the old manifest and old server code

**Locations:** `docs/reviews/edge-builtin-mcp-2026-10-04/worker-report.md:371–381`; `apps/desk/server.mjs:2460`; `apps/desk/apps.mjs:177–182,204–207,285–295`.

Step 5 says restarting only the edge child picks up the replacement manifest. It does not.

The desk loads manifests once, retains each object in its listener, and spawns subsequent children from that object. The running desk also retains the pre-lane `spawnChild()` implementation.

**Executed evidence:** I loaded a temporary manifest, replaced its file with prefixed tools and `builtin:mcp`, then inspected the retained object. It still contained the old tools/extensions. Calling `writeManifestSession()` subsequently wrote those old values back to disk.

Removing the adapter before restarting the desk therefore leaves the running listener configured to load the removed adapter. A session writeback can also undo the manifest edit.

**Smallest fix:** Correct the runbook to require an explicitly authorized desk-server restart onto the landed code and replacement manifest. Retire the adapter only after the new server has loaded that manifest. No hot-reload implementation is necessary.

### SHOULD — Record the lost aggregate bound; “no residual” is inaccurate

**Locations:** `packages/nana-stage/README.md:48–50`; `packages/nana-stage/lib/blocks.mjs:158–160,354–375`.

The validator limits individual blocks, not the structured result:

- Block JSON: 64 KiB, checked after serialization.
- Table rows: 500.
- Chart series/points: bounded.
- Rendered result text: 256 KiB.
- Block count and aggregate structured bytes: **unbounded**.

**Executed evidence:** A built-in-shaped result containing 200 individually valid cards, each with a 60,000-character extra field, produced **200 accepted entries and a 12,049,148-byte patch**, without an error.

Installed pi’s `dist/extensions/mcp/tools.js:151–164` retains the complete structured result. Its text truncation does not bound that carrier. The desk’s later stdout/SSE limits do not protect validation, signing, or ledger construction.

Retiring the adapter-specific overflow test is legitimate. Claiming that its removal leaves “no residual” is not.

**Smallest fix:** Replace that sentence with the explicit aggregate-memory/ledger limitation. Prefer a sealed aggregate byte/count cap and a deterministic over-cap carrier test. Such a stage cap would still not be a transport-level, pre-allocation bound.

### SHOULD — Test the shared spawn path under an actual project refusal

**Locations:** `apps/desk/test/app-listener.test.mjs:237–244`; `REQUIREMENTS.md:910`; `apps/desk/server.mjs:432–450`.

The new tests establish manifest acceptance, two rejected near-misses, and ordered argv forwarding. They do not pin bypassing the project-path refusal: app manifests already disable that refusal.

**Executed evidence:** I mutated the builtin branch to call `refuseProject(p, "extension")` before forwarding it. All **75 tests remained green**.

The same code also changes the general desk endpoint, **`POST /api/spawn`**, not just app listeners’ `POST /api/session`.

**Smallest fix:** Add a general-spawn request with `approve:false` and `resources.extensions:["builtin:mcp"]`, plus a rejected project-path/near-miss control. Describe the shared API acceptance in the contract notes.

## Other attack results

### Carrier, persistence, and resume

**Pass.** Installed pi 1.0.2 confirms the nested carrier:

- `dist/extensions/mcp/tools.js:151–164`: `convertMcpResult()`.
- `dist/core/extensions/runner.js:900–955`: replacing content without structured content clears it.
- `dist/core/agent-session.js:336–369`: preserves that clearing.
- Bundled `pi-agent-core/dist/agent-loop.js:596–659`: removes it from the finalized result; transcript messages do not serialize `structuredContent`.

I ran the real edge e2e: **18/18 passed**. The live successful result contained only `content` and `details`.

I then copied its session file and reopened it with installed pi’s `SessionManager`. All three tool-result messages lacked `structuredContent`; rebuilt context also lacked it. Ledger reduction recovered the expected three blocks. This was a real persisted-session/reconstruction check, not a second model turn after resume.

### Precedence and alternate carriers

**Pass, with documented precedence.** My dual-carrier probe stamped only `details.blocks`. A prior extension can create that situation; an MCP server cannot directly populate pi’s top-level `details`, because conversion constructs it independently.

A `details.blocks:null` value suppresses fallback and leaves the result untouched. A carrier at the wrong structured location is also untouched. Neither reaches the stage: live consumers use verified `details.blocks`, and replay uses validated custom ledger entries.

Codemode/nested calls still traverse these hooks. Nested blocks receive their nested call IDs and ledger entries. Clearing structured content means codemode receives canonical text rather than the original MCP object; malformed results reject. That matters if codemode is enabled, but it is outside this app’s six-tool allowlist.

### Trust and builtin references

**No new project-config bypass found.** The regex excludes separators and empty names. Tokens such as `builtin:..` pass its syntax check, but pi resolves builtin names through a registry lookup, not filesystem traversal (`dist/core/resource-loader.js:523–540`).

The general API can now explicitly request builtins. Under `-na`, built-in MCP still ignores project MCP configuration. The app-owned registration is explicitly authorized through the operator’s manifest, matching the existing basketball pattern.

User-scope servers can connect without their tools entering the app allowlist. Connection is not model reachability. I did not independently repeat the worker’s memory-process observation.

### Requirements and documentation

R-263/R-278 retirement is justified. R-279 preserves the same no-block pass-through obligation across a carrier migration; I consider that legitimate evolution, not ID reuse.

R-282 extraction/stamping and R-283/R-284 patch omission match the implementation. The changed rows pass the EARS rail. The README/design carrier descriptions otherwise match the shipped behavior, subject to the aggregate-bound finding above.

## Executed verification

| Check | Result |
|---|---:|
| Stage unit tests | 116 passed |
| App-listener tests | 75 passed |
| Objective goldens | 1,071 passed |
| Real edge MCP e2e | 18 passed |
| Edge desk block tests | 10 passed |
| Requirements trace/EARS | Passed; zero off-form rows |
| Code map | Passed; zero problems |
| README check | Five findings, all on the declared missing gitignored paths |

Mutations reproduced: wrong extraction **red**, reattached success carrier **red**, held-lock removal advice **red**. The project-refusal mutation stayed **green**, as reported above.

All mutations were restored. I did not rerun either repository’s full suite.

**VERDICT: BLOCK — 7/10**
