## Findings

### MUST 1 — A skipped plist still triggers service replacement
**`packages/nana-setup/lib/fsops.mjs:148–149`; caller: `packages/nana-setup/lib/steps.mjs:570–586`**

The new `SKIPPED` result is not handled by `stepDesk`. It proceeds to `launchctl`, potentially stopping a working service and bootstrapping an unchanged, stale, or dangling plist.

**Executed evidence:** With a symlinked plist and stubbed `launchctl` reporting an existing service:
- Base overwrote the target and reloaded.
- Branch preserved the target and reported `desk plist: skipped`, but still called `print`, `bootout`, and `bootstrap`, reporting `reloaded`.

The preservation fix is correct; its caller needs to honor the refusal. A dangling link can now leave the service stopped because bootstrap cannot read the plist.

**Smallest fix:** Return before invoking `launchctl` when the plist write is `SKIPPED`. Add caller-level tests covering live and dangling symlinks, unchanged target bytes, and zero service-management calls.

### MUST 2 — R-379 claims a no-read guarantee its evidence does not pin
**`REQUIREMENTS.md:863`; `packages/nana-setup/tests/fsops.test.mjs:36–55`**

The cited tests pin skipped status and preserved target contents. They do not establish “instead of reading … through it.”

**Executed mutation:** I inserted a caught `fs.readFileSync(target, "utf8")` before the new guard. All ten tests still passed, despite violating that clause.

The cited checks also omit the existing assertions that the links remain symlinks; those assertions do not verify unchanged link destinations.

**Smallest fix:** Instrument reads and assert none target either link. Assert unchanged link destinations, and cite/mark those checks. Alternatively, split the unpinned clauses into honestly classified rows.

### SHOULD — Correct the readlink test’s reproduction explanation
**`packages/nana-setup/tests/shared-link-state.test.mjs:14–19,54`**

The claim that external injection into the module’s filesystem binding is impossible is false. Updating Node’s CommonJS builtin exports and calling `syncBuiltinESMExports()` reaches the ESM binding.

More importantly, running this committed test against base does **not** reproduce a throw. Base ignores its fourth argument, reads the healthy link, and returns `"linked"`. The failing assertion demonstrates API/behavior differences, not the original error path.

**Executed independent reproduction:** I wrapped `lstatSync` to remove the fixture link immediately after obtaining its real stats. Native `readlinkSync` then:
- Threw `ENOENT` on base.
- Returned `"absent"` through the branch’s catch.

**Smallest fix:** Correct the comments and distinguish the deterministic fix test from the base reproduction. Keeping the optional injection is reasonable: it is narrow, avoids global mutation, and follows the resource-injection standard. The existing `afterTempWrite` seam establishes a comparable package precedent.

## Contract and compatibility assessment

### Claim 1: confirmed
The uncaught readlink failure is real, and the fix handles it. R-377 uses WHEN and one `shall`; its cited branch test pins the failure-to-`"absent"` behavior.

### Claim 2: confirmed against the documented contract
**`packages/nana-setup/lib/paths.mjs:82–84`**

This is not merely inferred test intent:
- README line 233 explicitly forbids `pi install` and `launchctl` under `--home`.
- `--help` describes the flag as intended for “tests, dry machines.”
- The original commit, `54b5088`, already contained the unconditional override comment and README promise.

Every production reader of `isRealHome` is in `stepDesk`, `stepPiRegister`, or doctor’s package-registration/service checks.

Consequently, intentional `install --home ~` changes behavior: it still writes files under that home, but no longer registers pi packages or loads the service. Doctor suppresses its launchctl probe and treats absent registration as a note. That restores the documented contract; use no `--home` for a real installation.

The flag does **not** make filesystem writes safe when pointed at the real home.

R-378 uses WHILE and one `shall`; its cited test directly pins the reported equality case. Base failed that check; branch passed.

### Claim 3: confirmed, with the caller defect above
Repository-wide caller inspection found only one production `writeIfChanged` caller: the desk plist step.

An owner intentionally using a symlinked plist loses write-through updates. That is consistent with README line 225’s existing prohibition, not a newly invented policy. Install now reports the plist skipped. Doctor does not call this primitive and continues reading through the plist link.

R-379 has one `shall`; its WHERE wording describes a runtime condition rather than an optional feature. WHEN would express that condition more clearly.

## Verification

- Reviewed the complete eight-file `git diff main..HEAD`.
- Confirmed base `ae15067` and branch `8fd0dca`.
- New tests against base: six failed checks; against branch: all 16 passed.
- Independently reproduced the native readlink failure and the service-call regression.
- `npm test -- nana-setup requirements`: **18 files passed; 685 checks passed; 3 checks skipped**.
- `npm run map:check`: passed.
- `npm run readme:check`: failed on five missing local dependency/vendor paths. The base archive showed the same five, plus its absent `.git`.
- `worker-report.md` was absent; its reproduction and mutation records could not be inspected.
- No tracked files changed.

**VERDICT: BLOCK — 7/10**
