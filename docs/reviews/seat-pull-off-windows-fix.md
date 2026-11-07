# seat-pull-off: Windows doctor fixture fix

## Cause

The first missing-clone command matches on both platforms. The second diagnosis
used `path.resolve` and `path.join` targets. On native Windows, both contain only
backslash separators. `targetFromArgv` in
`packages/nana-setup/lib/settings.mjs` requires a forward-slash script suffix,
so neither command matches and `outsideCheck` is undefined.

This is not an `installerKnowledgeTarget` ownership failure. Doctor's retired
scan uses `entryInvokes` and `commandInvokes`, not the installer-owned matcher.
The released installer constructs targets with a literal forward-slash suffix.
The fixture now normalizes its two targets to forward slashes before writing
shell-form commands. No production code changed.

## Scope and precedent

- `packages/nana-setup/lib/settings.mjs`: retained its exact invocation and
  ownership rules; fixture uses the suffix spelling the installer emits.
- `packages/nana-setup/tests/win32-hook-repair.test.mjs`: followed its
  `NANA_SETUP_PLATFORM=win32` injection convention for the diagnostic probe.
- No precedent departures.
- Existing test edited: `doctor reports missing and out-of-repo knowledge hooks
  as retired`. Only target spelling and its requirement marker changed.
- R-3741 gains that test as evidence. Removed the obsolete R-393 marker;
  R-393 remains retired. No new requirement rows or test declarations.
- Read all of `docs/known-bugs/FEAT-013.md`. No known bug fixed. Its existing
  backslash-hook reader limit remains unchanged; this fixture now uses the
  released installer shape. No other known-bug item touched.

## Evidence

All fixtures lived under `$TMPDIR`; injected drive paths were strings only.
The diagnostic probe ran doctor with stubbed pi and forced win32 on POSIX.

```text
missing-clone original= true slash-normalized= true
native-win32 original= false slash-normalized= true
injected-win32 native-path fixture: normalized=false retired-rows=0
injected-win32 native-path fixture: normalized=true retired-rows=2
```

Each normalized diagnostic row was FAIL and named `nana-setup install`.

### Wrong-code pair

Temporarily changed the production loop in
`packages/nana-setup/lib/doctor.mjs` from
`retiredSettingsCommands(settings)` to `[]`, without changing assertions.

```text
npm test -- packages/nana-setup/tests/doctor-detail.test.mjs
wrong code: exit 1; 71 pass, 1 fail
FAIL doctor reports missing and out-of-repo knowledge hooks as retired undefined undefined
restored code: exit 0; 72 pass
```

The mutation was restored and is not committed.

### Checks before commit

| Command | Exit | Result |
| --- | --- | --- |
| `npm test -- packages/nana-setup/tests/doctor-detail.test.mjs` | 0 | 72 pass |
| `NANA_SETUP_PLATFORM=win32 npm test -- packages/nana-setup/tests/doctor-detail.test.mjs` | 0 | 72 pass |
| `npm test -- packages/nana-setup/tests/win32-hook-repair.test.mjs` | 0 | 14 pass |
| `npm test -- packages/nana-setup/tests/seat-pull-off.test.mjs` | 0 | 8 pass |
| Injected-win32 diagnostic probe | 0 | 0 raw rows; 2 normalized rows |
| `npm run map:check` | 0 | 614 modules; 0 problems |
| `npm run readme:check` | 0 | 1089 claims; 0 problems |
| `node scripts/requirements-trace.mjs` | 0 | 2542 rows; 0 EARS problems |
| `git diff --check` | 0 | clean |

Full suite deferred to hosted CI under `AGENTS.md`. No native Windows run,
model session, install check, push, or CI read occurred. The install check is
left to the seat before land because it includes a live model turn.
