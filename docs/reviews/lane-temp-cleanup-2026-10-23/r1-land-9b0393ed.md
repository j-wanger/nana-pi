### MUST — PID-directed cancellation can hang indefinitely

`packages/nana-pack/bin/pi-worker.mjs:155` installs no-op signal listeners before unbounded synchronous startup calls, including `trusted()`.

Realistic input: on macOS or Linux, a trust store on an unavailable network-mounted home stalls the trust-check child. A task stop sends SIGTERM to pi-worker’s PID.

Consequence: main terminates pi-worker; this revision remains alive indefinitely. Repeated SIGTERM, SIGINT and SIGHUP cannot stop it. The watchdog ceiling has not started. Forcing SIGKILL leaves the carried settings behind.

The independent check’s section (e) confirms this behavior with stalled helpers. Recording it as a known bug does not restore cancellation.

Make startup helpers cancellable and bounded, preserving cleanup, and add a regression test that stops a worker while its helper remains stalled.

### NOTE — Other checks passed

Locally, `worker-claude.test.mjs` and `build-records.test.mjs` passed, with the Windows-only case skipped. Review-option precedence, closed-stderr survival and environment isolation match the declared changes. Windows evidence comes from the supplied CI record, not a local run.

VERDICT: SEND-BACK
