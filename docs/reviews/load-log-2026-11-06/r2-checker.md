## Independent confirmation

Reviewed `0089c56d..5a28d6e8fe3f6e6ffe5f310685418537845afc94`. No repository files changed.

### MUST — Huge child output can crash the launcher before delivery

`packages/nana-pack/lib/pi-context-load.mjs:40` buffers stdout without a size limit:

```js
child.stdout.on('data', chunk => { text += chunk; });
```

The deadline bounds waiting, but not launcher memory consumption. A noisy measuring child can exhaust the launcher’s heap before the timer fires.

Probe: the fixture package entry writes 128 MiB of garbage through stdout’s file descriptor, retrying partial writes and `EAGAIN`. Both launchers run with `NODE_OPTIONS=--max-old-space-size=64` to reproduce exhaustion safely.

Command:
```sh
node $TMPDIR/load-log-confirm-PFDIi5/huge.mjs
```

Output excerpts:
```text
{"launcher":"pi-worker","ms":1198,"exit":null,"signal":"SIGABRT","newDeliveries":0,"oom":true}
{"launcher":"pi-review","ms":1582,"exit":null,"signal":"SIGABRT","newDeliveries":0,"oom":true}
```

The measuring child therefore still affects delivery: neither actual worker nor reviewer starts. This is not forged metadata; it is the huge-output failure case requested by the brief.

Bound the metadata channel before accumulating or parsing it. On overflow, kill measurement and return unavailable.

### NOTE — Slow, stalled and SIGTERM-resistant children no longer block delivery

Command:
```sh
node $TMPDIR/load-log-confirm-PFDIi5/probe.mjs
```

Output excerpts; times cover the whole launcher:
```text
launcher   case               elapsed   exit   measurement alive
pi-worker  slow-entry         3285 ms   0      false
pi-worker  never-resolves     3329 ms   0      false
pi-worker  ignores-SIGTERM    3330 ms   0      false
pi-review  slow-entry         3839 ms   0      false
pi-review  never-resolves     3882 ms   0      false
pi-review  ignores-SIGTERM    3836 ms   0      false
```

Each launch delivered successfully and logged:
```text
context files: unavailable (timed out)
```

The kill path uses SIGKILL and does not await child closure.

Paired-baseline command:
```sh
CONTEXT_CASE=R-3732 node packages/nana-pack/tests/context-anatomy.test.mjs
```

Output:
```text
TIMING pi-worker: baseline 527 ms, stalled 3287 ms, added 2761 ms
TIMING pi-review: baseline 1085 ms, stalled 3838 ms, added 2753 ms
PASS R-3732: stalled measurement is killed and both launchers proceed within the deadline
PASS R-3732: context measurement deadline seal is 3000 ms
```

### NOTE — Ordinary garbage, child death and missing pi fail safely

The same `probe.mjs` command produced:

```text
launcher   case          elapsed   exit
pi-worker  garbage        318 ms   0
pi-worker  child-death    326 ms   0
pi-review  garbage        951 ms   0
pi-review  child-death    984 ms   0
```

These cases delivered successfully and logged:
```text
context files: unavailable (pi context process failed)
```

Missing-pi measurement returned:
```json
{"piVersion":null,"parts":[{"name":"context files: unavailable (pi is not on PATH)","source":"pi","fullChars":0,"deliveredChars":0}]}
```

### NOTE — Source-cwd correction and touched tests pass

Commands:
```sh
CONTEXT_CASE=R-3729 node packages/nana-pack/tests/context-anatomy.test.mjs
node scripts/test.mjs context-anatomy outcome-meter
```

Output:
```text
PASS R-3729: pi review logs the child checkout context and land or reviewer slot
PASS R-3729: real review loads count by source cwd and name context statuses

2 files: 2 PASS, 0 FAIL, 0 SKIP, 0 WARN
checks: 48 pass, 0 fail, 0 skip
```

The source-cwd MUST is closed. The original unbounded-wait failure is fixed, but the new unbounded stdout buffer leaves delivery vulnerable.

VERDICT: SEND-BACK
