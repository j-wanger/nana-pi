## Independent check

Reviewed `feat/load-log` at `0089c56d5ded1dca0f8835aea01226275747f3a4` against `2c0a3e4a`. No repository files changed.

### MUST — Best-effort lookup can delay launch without a limit

`packages/nana-pack/lib/pi-context-load.mjs:24–28` awaits package import and loader execution without a deadline. Both launchers await this measurement before spawning their child.

A valid package entry with slow asynchronous initialization therefore delays an otherwise working child. A stalled entry can prevent launch entirely.

Command:
```sh
CONTEXT_CASE=INDEPENDENT node "$TMPDIR"/load-log-probe-OQQn7p/independent.mjs
```

The temporary probe uses the existing fixture harness, a recording pi executable, and an entry awaiting five seconds before exporting the loader.

Output:
```text
BASELINE worker argv/env/prompts: byte-identical after generated path normalization
SLOW ENTRY launch elapsed ms: 5305 child recorded: true
PASS INDEPENDENT: baseline delivery and slow package entry
```

This violates the brief’s non-blocking lookup requirement. Run measurement in an isolated process with a bounded deadline and an unavailable fallback.

### NOTE — Installed pi import changes launcher process state

Command:
```sh
node --input-type=module
```

The inline probe snapshots process functions and listeners, then imports installed pi’s public entry.

Output:
```text
emitChanged: true
reallyExitChanged: true
exitChanged: false
```

Pi 1.4.0 also adds 13 signal listeners, including `SIGINT` and `SIGTERM`. Thus, the requested side-effect-free import is not satisfied. I did not establish a separate material failure from these handlers.

An unreadable-file probe also emitted `Warning: Could not read … EACCES` directly to launcher stderr. Measurement completed and matched pi’s fallback selection.

### NOTE — Other checks passed

Command:
```sh
node scripts/test.mjs context-anatomy worker-lane worker-claude win32-launch watchdog-exit watchdog-cpu agent-dir- immutable-review review-ledger-launch seat-rule
```

Output:
```text
14 files: 14 PASS, 0 FAIL, 0 SKIP, 0 WARN
checks: 457 pass, 0 fail, 12 skip
```

R-3726 through R-3732 passed. Installed-pi coverage ran without skipping.

Additional inline `node --input-type=module` probes confirmed:

- Missing PATH, missing export, and throwing import return unavailable parts.
- Both context-disable flags return only the disabled part.
- Symlinked cwd and relative child agent directories select the expected files.
- A nested linked worktree selects its own context without duplicating the shadowed main-worktree file.
- With both names present, pi selects `AGENTS.md`.

The Windows locator move retains the original refusal texts and launch checks by inspection. Injected tests passed; native Windows execution remains unverified here.

VERDICT: SEND-BACK
