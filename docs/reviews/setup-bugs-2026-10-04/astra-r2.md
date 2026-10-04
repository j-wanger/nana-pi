## Findings

### MUST 1 — Both filesystem monkeypatches can escape restoration
**`packages/nana-setup/tests/fsops.test.mjs:43–57`; `packages/nana-setup/tests/shared-link-state.test.mjs:54–74`**

Both helpers mutate the CommonJS filesystem exports and call `syncBuiltinESMExports()` **before entering `try/finally`**. If that initial synchronization throws, neither restores its patch.

**Executed evidence:** I extracted the committed helpers unchanged and installed a throwing getter on another filesystem export, `statSync`. Calling each helper invoked Node’s real synchronization function:

```text
fsops.test.mjs threw: other builtin spy getter
CJS leaked: true ESM leaked: true

shared-link-state.test.mjs threw: other builtin spy getter
CJS leaked: true ESM leaked: true
```

This requires an unusual same-process instrumentation interaction, not an ordinary filesystem failure. Nevertheless, it violates this round’s explicit every-path restoration requirement.

Separately, I forced each callback to throw. Both helpers correctly restored the CommonJS and ESM bindings on that path. The gap is specifically setup failure.

**Smallest fix:** Put patch installation and initial synchronization inside the protected `try`. Retain restoration in `finally`. Add a setup-failure regression alongside the callback-throw check.

### MUST 2 — R-380 overclaims the dry-run reporting behavior
**`REQUIREMENTS.md:864`; `packages/nana-setup/lib/steps.mjs:572–577`**

R-380 unconditionally promises that a skipped plist write produces a skipped `desk launchctl` report. However, the dry-run return precedes that report.

**Executed evidence:** With a dangling plist and `{ dryRun: true }`, `stepDesk()` returned only:

```json
[{
  "label": "desk plist",
  "status": "skipped",
  "detail": "a symlink is there — left untouched, nothing read or written through it"
}]
```

No service call occurs; the safety behavior is correct. The reporting clause and its `implemented` classification are too broad. The cited tests exercise only non-dry-run calls.

**Smallest fix:** Qualify R-380’s reporting promise as applying outside dry-run, preserving existing behavior. Alternatively, move the skipped-write handling before the dry-run return and test that reporting contract.

## Round-one closure

### MUST 1 — Closed for actual installation

The new guard returns before every `launchctl` invocation when the plist write is skipped.

My independent probe used temporary layouts with `isRealHome: true` and a PATH-first stub reporting an existing service:

| Plist entry | Plist report | Service report | Service calls |
|---|---|---|---:|
| Live symlink | skipped | skipped | 0 |
| Dangling symlink | skipped | skipped | 0 |
| Directory | skipped | skipped | 0 |
| Ordinary absent file | created | updated | 3 |

The ordinary-file control called `print`, `bootout`, and `bootstrap`. Live-target bytes remained unchanged; the dangling target was not created.

This closes the service-replacement defect without disabling normal installation.

### MUST 2 — Closed

The read instrumentation now detects the previously surviving mutation.

I inserted a caught `fs.readFileSync(target, "utf8")` before the symlink guard in a scratch copy:

```text
FAIL no read targets the live symlink or its destination
FAIL no read targets the dangling symlink or its (missing) destination
```

The other 12 checks passed. The new assertions discriminate the no-read clause independently of preserved bytes and skipped status.

The tests also check unchanged link destinations, and R-379 cites those assertions.

### SHOULD — Closed

The comments now distinguish the injected unit test from the original failure reproduction.

I independently removed each fixture link immediately after native `lstatSync` returned its genuine stats, without passing an injected argument:

```text
ae15067: native readlinkSync THREW ENOENT
0bc93eb: sharedLinkState returned absent
```

The explanation of `syncBuiltinESMExports()` is now accurate. Keeping the narrow optional injection remains reasonable.

## Requirement audit

All four rows contain exactly one `shall`.

| Row | Cited evidence and clause coverage | Assessment |
|---|---|---|
| **R-377** | Injected failure checks `"absent"`; native-race checks separately assert no throw and `"absent"`. | Pinned. |
| **R-378** | Explicit `home: os.homedir()` asserts `isRealHome === false`. | Pins the specified equal-home override case. |
| **R-379** | Live/dangling cases assert skipped status, preserved target bytes or absence, zero recorded target reads, and unchanged link destinations. | Pinned for the implemented synchronous read path; mutation killed. |
| **R-380** | Live/dangling cases assert skipped service status and zero stub calls. | Pins ordinary execution, but not the unconditional dry-run reporting promise. MUST 2. |

## Residuals to RECORD, not block on

- The symlink guard is a pre-check, not race-proof filesystem enforcement. Concurrent path replacement and symlinked ancestors remain outside this fix.
- Doctor still reads through a plist symlink; installation refusing to manage that plist does not establish doctor failure.
- The new read spy observes `readFileSync`, not every possible filesystem-reading API. Revisit instrumentation if the implementation changes APIs.
- Native Windows and real launchd operation were not exercised. Service verification used a stub and never touched the real service.
- README checking remains blocked by five missing local dependency/vendor paths, matching the round-one environment failures.

## Verification

Reviewed the complete six-file `git diff 8fd0dca..0bc93eb`, including generated map changes.

Executed:

- `npm test -- nana-setup requirements` — **18 files passed; 704 checks passed; 3 checks skipped**.
- `npm run map:check` — **0 problems**.
- `npm run readme:check` — **5 missing-path problems**.
- Independent service-call, native-readlink, caught-read mutation, callback-restoration, setup-restoration, and dry-run probes.

No tracked files changed.

**VERDICT: BLOCK — 8/10**
