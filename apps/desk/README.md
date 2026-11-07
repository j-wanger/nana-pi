# Desk app host

The desk process is a local app host for manifest-configured apps. The desk page was retired.
Its main port serves a short retired-page note with links to the configured apps.
The app listeners, stage page, signed blocks and launchd service remain.

## Install and run

The host has no package.json, build step or npm dependencies of its own.
It requires Node ≥ 22.19 and a globally installed `@earendil-works/pi-coding-agent`.
The host spawns pi in RPC mode; it no longer imports pi's transcript parser at startup.

```bash
node apps/desk/server.mjs
# http://127.0.0.1:7317 (DESK_PORT overrides it; 4317 is reserved for OTLP)
```

`nana-setup install --desk` still installs the opt-in macOS launchd service.
Doctor still checks that service, and uninstall still removes it.
Follow the [setup update and removal runbook](../../packages/nana-setup/README.md#updating-and-removing)
before updating a checkout used by a running service.
The running process uses the code it loaded at launch; restart it to load an update.

## App manifests

The host reads `~/.pi/agent/apps/<name>.json`, or the directory named by `DESK_APPS_DIR`, at startup.
Each valid manifest gets its own loopback port and browser origin.
Names use lowercase letters, digits and hyphens. Tools must be a non-empty allowlist.

```json
{
  "port": 7320,
  "cwd": "~/my-app",
  "title": "My app",
  "tools": ["read"],
  "extensions": [],
  "skills": [],
  "trust": "no-approve"
}
```

`extensions` accepts existing paths and pi's literal `builtin:<name>` references.
`page` optionally names an app-owned directory containing index.html, app.js and app.css.
Without it, the listener serves the kit stage page.
`data` optionally maps route keys to fixed command argument arrays, run in the app cwd.
`quick` contains label/prompt pairs, and `mutating` names tools whose completion triggers an app refresh.
`session` resumes an existing file; the host atomically updates it from the child's reported session file.
Production apps use stable ports; test fixtures request zero and read the bound ports from `GET /api/apps`.

## Runtime surface matrix

| Surface | Resources and behavior | Trust step |
|---|---|---|
| App child | Only manifest-listed skills and extensions load. No nana-pack surfaces load unless the manifest lists their extensions. `--no-skills` and `--no-extensions` disable discovery; list `builtin:mcp` explicitly when needed. | `/trust` is TUI-only: open the project in pi's terminal, run `/trust`, then restart the session. |

The active agent directory is `PI_CODING_AGENT_DIR`, otherwise `~/.pi/agent`.
Relative overrides resolve once against the host's startup cwd and reach every child as an absolute path.
The manifest directory and stage-key store remain fixed under `~/.pi/agent`, independent of that override.

## Contract notes

- The main port serves only the retired note at `/` and `/index.html`, plus `GET /api/apps`.
  Removed desk-page APIs return 404 for requests that pass the boundary rules.
- Each app listener serves its page, shared stage assets and only its own app routes:
  session, events, prompt, ui-response, abort, entries, manifest and data commands.
  No general spawn, settings editor, transcript rail, rename, fork, export or RPC passthrough remains.
- Every listener enforces its own loopback Host and mutating-request Origin/JSON rules.
  A foreign Host or Origin receives 403. An absent Host or Origin remains valid for non-browser clients.
  These rules are browser guards, not authentication. Do not proxy or port-forward the host.
- A manifest fixes the child's cwd, tools, extensions, skills and one-run trust choice.
  Session-start request bodies cannot widen that declaration. Prompts wait for reported tool readiness.
- Stage assets retain theme tokens, markdown, tool cards and extension dialogs.
  Dialogs stay above the chat drawer and remain visible when that drawer closes.
- Stage keys remain one record per session header id under `~/.pi/agent/nana-desk/stage-keys/`.
  Restart and file rename reuse the latest issued key. Ledger reads verify against the child's key
  plus the session's recorded keys. Live blocks must match that child and the carrying tool event.
  Forged entries are redacted without removing their ancestry nodes.
- The stage-key store retains its existing limits: eight keys per session, private file modes,
  atomic replacement and best-effort persistence. Hygiene prunes only this host's sessions root,
  only after a successful, non-empty enumeration.
- Existing transport caps remain: 64 MiB decoded child lines, 8 MiB retained SSE output per client,
  64 pending RPCs per child, and 8 MiB stdout per data command. Oversized lines are dropped;
  slow clients disconnect; excess RPCs fail fast; oversized data commands are killed.
- App opens and prompts write privacy-bounded `desk_usage` lines to stdout, with exactly
  ts, event, surface and action. The retired note writes no usage line.

## Known limits

- Loopback is not a sandbox. Local processes running as the user can control apps and read signing keys.
- Session identity is child-reported, not cryptographically authenticated. Records are per session, not per app.
- Stage-key I/O and session enumeration remain synchronous. A hung filesystem stalls the process.
- Simultaneous writers to one session record can lose an addition; there is no cross-process lock.
- Failed key persistence preserves live verification but can lose continuity after restart.
  Unknown, lost or aged-out keys leave old blocks redacted.
- The child status, widget and unanswered-dialog maps remain unbounded.
- Extension commands can change sessions through prompts. No host fork/clone route remains to inherit keys.
- POSIX termination signals the named process, not all descendants. Windows uses taskkill's tree termination.
- Existing pi resolver and installed-pi probe tests retain their declared Windows skips.
  The manifest listener, Host, Origin, persistence, usage and retirement tests run there.

## Tests

```bash
node scripts/test.mjs apps/desk
```

Unit tests use temporary homes and deterministic RPC stubs. The retirement test's browser cases
need Playwright (`playwright` or `playwright-core`) plus Chromium; `PW_ROOT` points to its project.
Those two cases declare a skip without browser tooling; all HTTP and persistence cases still run.
The remaining stage e2e suites run manually and use the same Playwright dependency.
`pi-session.mjs` keeps its resolver exports for existing consumers and resolver tests.
