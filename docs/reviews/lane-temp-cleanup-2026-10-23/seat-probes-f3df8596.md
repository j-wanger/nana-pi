# lane-temp-cleanup · seat probes (seat step 5) at f3df8596

Measured 2026-10-23 on macOS, node v22, with `<scratch>/ltc-probes/probe.mjs`. Each probe ran the lane's own `packages/nana-pack/bin/pi-worker.mjs` in lane mode from a linked fixture worktree on `feat/alpha`, with a Claude Code larger builder in the roster and a fake `claude` that writes its pid and sleeps. HOME, USERPROFILE, TMPDIR, TEMP and TMP pointed into `<scratch>/ltc-probes/run-*`; `CLAUDE_CONFIG_DIR` was unset. The user settings held `apiKeyHelper` and a fixture `ANTHROPIC_API_KEY`. No model call ran. Every process the probes started was gone afterwards (`ps`, measured).

| Probe | Stop | Exit | Temp folder after | Key in temp | Lane lock | Fake claude |
|---|---|---|---|---|---|---|
| a | each review option (`--item`, `--role`, `--revision`, `--over-cap`, `--worker`) | 1, review-option line, no carry line | empty (5 of 5) | no | no | never started |
| b | background-task stop: SIGTERM, SIGKILL 1.45 s later if alive | 143, abort line, no SIGKILL needed | empty | no | removed | ended |
| c | SIGKILL of pi-worker 300 ms after claude started | killed | preamble folder (prompt, settings, preamble) and `pi-review-*` capture folder (`out.txt`) | yes | left | still running |
| d | pi-seat stop: pi-worker under `bash -c` in its own group, group SIGKILL 300 ms after claude started | shell killed | the same as c | yes | left | still running 1 s later |

Probes c and d are the lane's known limit: a hard kill, and a pi seat's ordinary stop of its foreground build (Esc, a closed terminal, a desk stop, a bash timeout), leave the carried settings file with its key, the capture folder and the lane lock, and the builder keeps running in its own group. The owner chose, on 2026-10-23, to plan a watcher for this as a later lane.

Raw output:

```json
[
 {
  "probe": "a",
  "option": "--item",
  "exit": 1,
  "reviewLine": true,
  "carryLine": false,
  "temp": [],
  "claudeStarted": false
 },
 {
  "probe": "a",
  "option": "--role",
  "exit": 1,
  "reviewLine": true,
  "carryLine": false,
  "temp": [],
  "claudeStarted": false
 },
 {
  "probe": "a",
  "option": "--revision",
  "exit": 1,
  "reviewLine": true,
  "carryLine": false,
  "temp": [],
  "claudeStarted": false
 },
 {
  "probe": "a",
  "option": "--over-cap",
  "exit": 1,
  "reviewLine": true,
  "carryLine": false,
  "temp": [],
  "claudeStarted": false
 },
 {
  "probe": "a",
  "option": "--worker",
  "exit": 1,
  "reviewLine": true,
  "carryLine": false,
  "temp": [],
  "claudeStarted": false
 },
 {
  "probe": "b",
  "exit": 143,
  "signal": null,
  "abortLine": true,
  "temp": [],
  "lock": false,
  "fakeClaudeAlive": false
 },
 {
  "probe": "c",
  "exit": null,
  "signal": "SIGKILL",
  "temp": [
   "nana-lane-preamble-XXXXXX/",
   "nana-lane-preamble-XXXXXX/builder-prompt.md",
   "nana-lane-preamble-XXXXXX/builder-settings.json",
   "nana-lane-preamble-XXXXXX/preamble.md",
   "pi-review-XXXXXX/",
   "pi-review-XXXXXX/out.txt"
  ],
  "keyFileHoldsKey": true,
  "lock": true,
  "fakeClaudeAlive": true
 },
 {
  "probe": "d",
  "shellSignal": "SIGKILL",
  "temp": [
   "nana-lane-preamble-XXXXXX/",
   "nana-lane-preamble-XXXXXX/builder-prompt.md",
   "nana-lane-preamble-XXXXXX/builder-settings.json",
   "nana-lane-preamble-XXXXXX/preamble.md",
   "pi-review-XXXXXX/",
   "pi-review-XXXXXX/out.txt"
  ],
  "keyFileHoldsKey": true,
  "lock": true,
  "fakeClaudeAliveAfter1s": true
 }
]
```
