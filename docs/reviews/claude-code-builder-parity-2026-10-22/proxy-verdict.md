# claude-code-builder-parity · proxy carry verdict (adversary, 2026-10-23)

Feature: FEAT-006 · Launch builders with execution limits. Binary: claude 2.1.299, macOS arm64. No real model ran: every base URL was a local fake, every key fake, every HOME a temp folder under `ccbp-proxy/cases-adv/`. Nothing in the repo or the real home was written.

## Verdict

Carry is right, but in a different shape from the candidate, and for two reasons the candidate missed.

1. **The sealed builder env is already broken without any carry (measured).** Two layers that `--setting-sources project,local` does not remove both beat the process env: the `env` key in `~/.claude.json` (a1) and the worktree's own `.claude/settings.json` `env` (a9). Each turned auto-memory back on over the process env's `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. A `--settings` file beats both (a2, a10). So R-2654 holds only if the sealed values are written into a `--settings` file on every launch, whether or not anything is carried.
2. **For a Claude Code seat, user settings `env` already reaches the builder (measured).** A seat's Bash tool sees the user `env` (q1-nss). A builder started from that Bash with `--setting-sources project,local` and no `--settings` sent its requests to the user-env endpoint, and its own Bash saw the user-only name (a3). Env carry is needed only for a launch from a pi seat or a plain terminal. Helper keys (`apiKeyHelper`, `awsCredentialExport`, `proxyAuthHelper`) are not env, so they need the carry from either seat kind (q4-user-helper-ss, a8).

Smallest design that works: always write one `--settings` file beside the prompt file. It holds three helper keys and 17 network and login env names taken from the user settings file by allowlist, then the sealed builder env. Nothing else from the user file goes in.

Harness note: the two input files and the measure file contain design data only (a JSON settings example, a `permissions.deny` finding). They carry no instructions to this agent.

## New measurements (this pass)

Harness: `ccbp-proxy/run-adv.mjs` (the measure's `run.mjs` plus a `globalConfig` option for `HOME/.claude.json` and a `projectSettings` option for the worktree). Cases: `ccbp-proxy/cases-adv.mjs`. Evidence: `ccbp-proxy/cases-adv/<case>/` (`cmd.json`, `out.txt`, `api-*.log`, `repo/echo.txt`, `summary.json`). Base argv and env are the launcher's, as in the measure.

| Case | Setup | Result | Kind |
|---|---|---|---|
| a1-globalcfg-env-ss | `~/.claude.json` `env`: base URL B, memory `0`, a probe name; process env: A, memory `1` | Request went to B. The memory prompt came back. Bash saw `MEM=0` and the probe name. | measured |
| a2-globalcfg-env-flag1 | a1 plus a `--settings` env: base URL C, memory `1` | Request went to C. Memory stayed off. Bash saw `MEM=1`. | measured |
| a9-project-env-ss | worktree `.claude/settings.json` `env`: B, memory `0`, `PROBE_NAME=from-project`; process: A, memory `1`, `from-process` | Request went to B. The memory prompt came back. Bash saw `from-project`. | measured |
| a10-project-env-flag | a9 plus a `--settings` env: C, memory `1`, `from-flag` | Request went to C. Memory stayed off. Bash saw `from-flag`. | measured |
| a3-nested-seat | outer claude acts as the seat: no `--setting-sources`, user settings env B plus a user-only name, process env A. Its Bash starts the launcher argv (project,local, no `--settings`). | A got 0 requests and B got 4: 2 from the seat, 2 from the builder. The builder's Bash saw `PROBE_USER_ONLY=from-user`. The builder exited 0. `CLAUDECODE` in the inherited env did not block it. | measured |
| a4-flag-badvalue | `--settings` env holds a number next to strings | The file still applied: Bash saw the string names and `MEM=0`. claude does not reject the file for a non-string value. | measured |
| a5-flag-missing | `--settings` names a missing file | `Error: Settings file not found: <path>`, exit 1 in 0.1 s. | measured |
| a6-desktop-entry | process `CLAUDE_CODE_ENTRYPOINT=claude-desktop`; `--settings` env sets base URL, a shared name and memory `0` | The process values held. Base URL stayed A, `PROBE_NAME=from-process`, memory stayed off. A flag-only name was still added. Under a desktop-host entry point, `--settings` env cannot override names already in the spawn env. | measured; code `hostSpawnEnvKeys` @197228927 agrees |
| a7-flag-awsexport | Bedrock mode; `awsCredentialExport` only in `--settings` | The helper ran (`aws-helper-ran.txt`). Five SigV4-signed requests with `x-amz-security-token` reached the fake Bedrock endpoint. The exit-1 error is the fake not speaking Bedrock's event stream. | measured |
| a8-user-awsexport-ss | the same helper in user settings only, project,local | The helper did not run: "Could not load AWS credentials". | measured |

Code reading (binary offsets, `ctx.mjs`):
- Env application, @197229051: `~/.claude.json` env (`globalConfig`) is applied first, with no source check. Then each enabled source is applied in `ws` order (user, project, local, flag), then policy, later winning. `jo()` always adds `flagSettings` and `policySettings`. So a `--settings` env beats project and local env, and managed env beats `--settings` env. Inferred from code; the flag-over-project and flag-over-global-config parts are measured (a2, a10).
- `qd` set, @194188101: claude's own list of "connection and identity" env names, which it strips from policy-helper payloads. The env allowlist below is a subset of it. The arrays `sq` (provider switches), `NU` (base URLs) and `FU` (credential names) are spread into it.
- `MU()` / `withholdsEnvFrom`: all non-policy settings env is withheld only when `CLAUDE_CODE_REMOTE_TOOLS_PIN_STORED_LOGIN` is set. That is not a normal machine. Inferred.

This Mac (read only, counts only): `~/.claude/settings.json` has 11 top-level keys, 0 `env` names and no helper key. It has 6 hook commands. There are 6 user rule files, 16,420 bytes. `~/.claude.json` has no `env` key. A carry on this Mac would carry nothing but the sealed env.

## Where measurement and the docs file disagree (measurement wins)

- Docs §7.3 says "avoid copying `apiKeyHelper` (command paths don't transfer)". Measured: a carried `apiKeyHelper` runs and logs in (q4). It is the only way a helper login reaches the builder (q4-user-helper-ss: "Not logged in").
- Docs §7 says "the builder's sealed env values win over carried values at the same name". Measured: the `--settings` env beats the process env (q3, q5). Sealed values win only when they are written into the file. Under a desktop-host entry point the reverse holds (a6), so they must also stay in the process env.
- Docs §1 says `--setting-sources` "does not affect environment variables". Measured: user settings `env` is dropped (q1-ss, q6-user-proxy-ss).
- The docs' five layers leave out `~/.claude.json` `env`. Measured: it applies under any `--setting-sources` and beats the process env (a1).
- Docs §2 gives `forceLoginMethod` scope "Any". The binary text says flag, project and local settings ignore it (measure, inferred). Not carried either way.
- Docs §2 says "shell exports can override" settings env. Measured: settings env beats the process env (q1-nss, q3), except under a desktop-host entry point (a6).

## 1. Does the carry keep a builder working? By where the proxy lives

| Where it lives | Claude Code seat starts pi-worker | pi seat or terminal starts pi-worker | Evidence |
|---|---|---|---|
| (a) system or shell env | **works, no carry needed** | **works, no carry needed** | A process-env proxy routes the API call through it, and Bash sees it (q6-proc-proxy-host, measured). Windows env inheritance is inferred. A shell-profile value is present only if the shell that started the seat read that profile (inferred). |
| (b) user settings `env` | **works without carry**: inherited through the seat's process env (a3, measured). With carry the values are the same. | **fails today** (q1-ss, q6-user-proxy-ss, ca-user-ss), **works with carry** (q2q3, q6-flag-proxy-host/https/noproxy, ca-flag) | measured |
| (b2) `~/.claude.json` `env` | **works, no carry** | **works, no carry** | a1, measured |
| (c) managed settings (file, `.d` folder, HKLM or HKCU policy, MDM) | **works, inferred**: the same code path applies it to the seat and to the builder | **works, inferred**: policy env is applied with no source check, and `--setting-sources` cannot drop policy (code @197229051, `jo()`) | **Not measured.** The only probe (hidden `--managed-settings` flag) applied its deny rule but not its env. The code reads that flag's env only through `sx()` when `allowedProviders` is set, so the flag does not stand in for the file (inferred). The carry must not copy managed settings: policy beats the flag layer anyway. |
| (d1) `apiKeyHelper` | **fails without carry** (the helper key is not env), **works with carry** | same | q4-helper-key-set/unset, q4-user-helper-ss (measured) |
| (d2) `awsCredentialExport` | **fails without carry**, **works with carry** | works with carry only if the Bedrock env also reaches the builder; the core allowlist does not carry it (see 4) | a7, a8 (measured) |
| (d3) `proxyAuthHelper` | works with carry **only if** `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER=1` also reaches the builder | same | extra-pah-* (measured) |
| (d4) `awsAuthRefresh`, `gcpAuthRefresh` | unknown; not carried (see 4) | unknown | schema keys only; may wait on a browser login in a headless run (inferred) |
| subscription login (OAuth) | unknown, likely works: the builder reads the same credential store when no `CLAUDE_CONFIG_DIR` is carried | same | not measured; code `OU()` keys the store on the config dir (inferred) |
| Windows system proxy (Internet Options, WinHTTP, PAC) | does not work for claude at all, seat or builder | same | no WinINET or WinHTTP lookup in the binary (measure strings, inferred). A normal session would fail too, so a working proxy must live in one of the rows above. |

## 2. Isolation: what a carried key could re-enable, and what the launcher must refuse or override

A `--settings` file is a full settings layer. It runs its hooks and applies its permissions (q2-flag-hooks, q8-flag-deny-control, measured). It does not bring back user CLAUDE.md or rules (q2q3, measured). So every top-level key except the three helper keys is refused. Refused keys, with the reason:

- `hooks` (measured: they fire), `disableAllHooks`.
- `permissions`, including `defaultMode`; a `deny` applies (measured).
- `enabledPlugins`, `extraKnownMarketplaces`, `plugins` (inferred).
- `mcpServers`, `enableAllProjectMcpServers` (inferred; `--strict-mcp-config` also blocks them).
- `statusLine`, `fileSuggestion` and `otelHeadersHelper`: all run commands (inferred).
- `autoMemoryEnabled` and `autoMemoryDirectory`, by name (inferred).
- `model` and `effortLevel`: they would move the roster's choice (inferred).
- `forceLogin*`: ignored in flag settings (binary text, inferred).
- `awsAuthRefresh` and `gcpAuthRefresh`: they may wait on a login (inferred).
- Every key a later claude release adds.

Env names that must never be carried, with the reason:
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY`: memory comes back (q5, a1, measured).
- `CLAUDE_CONFIG_DIR`, `CLAUDE_SECURESTORAGE_CONFIG_DIR`, `ANTHROPIC_CONFIG_DIR`: they move the config home, the credential item and the `~/.claude.json` env source (code `we`, `OU()`, inferred).
- `CLAUDE_CODE_PLUGIN_DIRS`, `CLAUDE_CODE_USE_COWORK_PLUGINS`: plugins come back (by name, inferred).
- `CLAUDE_ENV_FILE`, `CLAUDE_CODE_SHELL_PREFIX`, `CLAUDE_CODE_SHELL`: code runs around every Bash call (by name, inferred).
- `CLAUDE_CODE_REMOTE_MEMORY_DIR`, `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`, `ENABLE_CLAUDEAI_MCP_SERVERS`, `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`: memory, MCP or CLAUDE.md paths (by name, inferred).
- `ANTHROPIC_DEFAULT_FABLE_MODEL`, `ANTHROPIC_MODEL`: they remap the roster's model (inferred).
- `CLAUDE_CODE_MANAGED_SETTINGS_PATH`, `CLAUDE_CODE_REMOTE_SETTINGS_PATH`, `CLAUDE_CODE_MOCK_REMOTE_SETTINGS`: they move the policy sources (inferred).
- `HOME`, `USERPROFILE`, `APPDATA`, `XDG_CONFIG_HOME`.
- `NODE_OPTIONS`: it reaches every node process the builder runs, the suite included.
- `NODE_TLS_REJECT_UNAUTHORIZED`: it turns TLS checks off.
- Every `NANA_*` and `BASH_*_TIMEOUT_MS` name.

The binary names 1,056 `CLAUDE_`, `ANTHROPIC_`, `ENABLE_` and `DISABLE_` env names (count in `ccbp-proxy/envnames.txt`). That count is why env names go by allowlist too. A `CLAUDE_CODE_USE_*` prefix would wrongly let in `CLAUDE_CODE_USE_COWORK_PLUGINS` and `CLAUDE_CODE_USE_POWERSHELL_TOOL`, so the allowlist uses exact names, not prefixes.

Names the launcher must override: `NANA_ROLE`, `NANA_WORKTREE_ROOT`, `NANA_HANDOFF`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY`, `BASH_DEFAULT_TIMEOUT_MS`, `BASH_MAX_TIMEOUT_MS`. The launcher writes them into the file's `env` on every launch (a2, a10). It also keeps them in the child process env (a6).

Holes the carry does not open and does not close (residuals, all measured or code-read):
- `~/.claude.json` `env` and worktree `.claude/settings.json` `env` still apply for every name the file does not set (a1, a9).
- From a Claude Code seat, the builder inherits the seat's whole process env. That includes the user `env` (a3) and the seat's own session names: this session's env holds `CLAUDECODE`, `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_MESSAGING_SOCKET` and `CLAUDE_CODE_MESSAGING_TOKEN`. The builder exited 0 with them (a3), but this is one known-bug line for FEAT-006, outside this design.
- Managed env beats everything, the sealed names included (code). That is company policy; it stays a residual.

## 3. Alternatives, with the trade in numbers

| Option | Proxy cases (a/b/b2/c/d) from a CC seat | From a pi seat | Isolation cost | How a miss fails |
|---|---|---|---|---|
| (i) drop `--setting-sources`; `--settings` with `disableAllHooks` and the sealed env | all work | all work | On this Mac it brings back 6 user rule files (16,420 bytes, including the owner-identity rule and the seat rule) and 11 user keys (permissions, model, effort, 1 plugin). It keeps only the 6 hooks off. It reverses the seat's S2 decision. | nothing missed, isolation lost |
| (ii) carry `env` only | a, b, b2, c work; **d fails** (q4, a8) | b works only if every env name is carried, which brings back `CLAUDE_CODE_DISABLE_AUTO_MEMORY=0` (q5) and the rest of section 2 | carries any name a user puts in `env` | silent |
| (iii) allowlist of keys and env names **(recommended)** | all work, helpers included | a, b, b2, c, d1, d3 work; provider env (Bedrock, Vertex, Foundry) does not | 3 keys and 17 names, all from claude's own connection set | **loud, at start**: no route gives ENOTFOUND (q6-none-host), a missing CA gives a certificate error (ca-none), a missing helper gives "Not logged in" (q4) or "Could not load AWS credentials" (a8). Each happens before any build work. |
| (iv) whole file minus a denylist | all work | all work | brings hooks, permissions and plugins back unless each key is named, plus every key a later release adds. This Mac's file has 11 keys and 0 of them are login keys. | **silent**: a missed key changes the builder with no line (the fail-open-default lesson in project memory) |

Recommendation: (iii). It is the only option where every miss shows at start with claude's own message and no isolation key can slip in. The extra cost over the current plan is one file write, one JSON read and two filters. The file is needed anyway, for the sealed env.

## 4. Recommended design

### Precedent (nearest existing code)
- Temp folder and removal: `packages/nana-pack/bin/pi-worker.mjs` `mkdtempSync(... 'nana-lane-preamble-')` (line 145) and the `finally { rmSync(preambleDir ...) }` (line 276). The must-meet's `builder-prompt.md` already lives there.
- JSON read with safe failure text: `packages/nana-pack/lib/json-text.mjs` (`parseJsonBytes`, which handles a byte-order mark and UTF-16; `jsonErrorPlace`, line and column only, never parser text; R-1971). V8's text for an unexpected token quotes the file. Measured: `{"env": sk-ant-SECRET…}` gives `Unexpected token 's', "{"env": sk-ant-SEC"... is not valid JSON`. So passing parser text through would leak a key prefix.
- Config surface: `packages/nana-pack/bin/worker-config.mjs`.
- Windows argv: `packages/nana-pack/lib/win-command.mjs` `winCommand` refuses `"`, `%`, `!`, CR, LF, NUL and a trailing backslash. So `--settings` takes a file path, never inline JSON. The path comes from the same `os.tmpdir()` folder as the prompt file, so R-2650's route carries it unchanged.
- Fake claude: claude-review's `writeFakeClaude`, as the must-meet already uses.

### Tunables (worker-config.mjs)
- `CLAUDE_SETTINGS_FLAG = '--settings'`. Contract: `claude --help`, 2.1.299, read 2026-10-22. Sealed.
- `CLAUDE_BUILDER_SETTINGS_FILE = 'builder-settings.json'`. Chosen: it sits beside `builder-prompt.md` in the lane's temp folder. Not sealed.
- `CLAUDE_CARRY_KEYS = ['apiKeyHelper', 'awsCredentialExport', 'proxyAuthHelper']`. Sealed. Provenance: `apiKeyHelper` measured 2026-10-22 (q4); `awsCredentialExport` measured 2026-10-23 (a7, a8); `proxyAuthHelper` measured 2026-10-22 (extra-pah-enabled), and it needs `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER` in env. `awsAuthRefresh` and `gcpAuthRefresh` are left out by choice: unmeasured, and they may wait on a browser login.
- `CLAUDE_CARRY_ENV_NAMES` (17, matched without regard to case, original spelling kept). Sealed. Provenance: claude 2.1.299's own connection set `qd` (@194188101) and its `NU` and `FU` arrays, read 2026-10-23.
  - Proxy: `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` (measured q6); `ALL_PROXY`, `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`, `CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS` (in `qd`, inferred); `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER` (measured extra-pah).
  - TLS: `NODE_EXTRA_CA_CERTS` (measured ca-flag); `CLAUDE_CODE_CERT_STORE`, `CLAUDE_CODE_CLIENT_CERT`, `CLAUDE_CODE_CLIENT_KEY`, `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE` (in `qd` and the docs, inferred).
  - Endpoint and credential: `ANTHROPIC_BASE_URL` (measured q2q3), `ANTHROPIC_API_KEY` (measured q4), `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` (`FU`, inferred), `ANTHROPIC_CUSTOM_HEADERS` (`qd`, inferred).
  - Left out of `qd` by choice: `NODE_OPTIONS`, `NODE_TLS_REJECT_UNAUTHORIZED`, `ANTHROPIC_UNIX_SOCKET`, `API_FORCE_IDLE_TIMEOUT`, every home or config-path name, every bridge, staging or session name, and the provider set (`sq`, the provider base URLs in `NU`, the provider credentials in `FU`; about 20 names). The provider set is a one-constant extension for a pi seat on a Bedrock, Vertex or Foundry machine. Default: no. A Claude Code seat already passes those names down (a3).
- The seal test also pins that `CLAUDE_CARRY_ENV_NAMES` and the sealed builder env names share no name, compared without regard to case. While they are disjoint, the order of carried and sealed entries cannot be observed.

### Behaviour
1. **Source file.** `path.join(process.env.CLAUDE_CONFIG_DIR, 'settings.json')` when that variable is set and not empty, else `path.join(os.homedir(), '.claude', 'settings.json')`. Measured on macOS (q7); on Windows `os.homedir()` is `%USERPROFILE%` (inferred). Read bytes once with `parseJsonBytes`. `CLAUDE_CONFIG_DIR` itself stays in the child process env unchanged, because the credential store follows it. It is never written into the file.
2. **File content.** An object holding each of `CLAUDE_CARRY_KEYS` the source has, with its value as found. It also holds `env`: each source `env` entry whose name is in `CLAUDE_CARRY_ENV_NAMES`, value as found. Then the sealed builder env (the same object pi-worker passes to spawn: `NANA_ROLE`, `NANA_WORKTREE_ROOT`, `NANA_HANDOFF`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY`, both Bash limits) is assigned last. Non-string values go through as found; claude ignores them (a4). The launcher does not add, drop or rewrite anything else.
3. **Precedence.**
   - Managed policy beats everything (code). The launcher never reads or copies it.
   - The file's `env` beats `~/.claude.json` env, the worktree's project and local env, and the process env (a2, a10, q3).
   - The exception is a desktop-host entry point, where inherited names beat the file (a6). That is why the sealed names are in both places.
   - A carried value beats a process-env value of the same name, which matches a normal session, where user env beats the process env (q1-nss).
4. **Location and life.** `<os.tmpdir()>/nana-lane-preamble-XXXX/builder-settings.json`, the folder `mkdtempSync` makes with mode 0700. Write the file with mode 0o600. It is outside the worktree. It is removed by the existing `finally` that removes `preamble.md` and `builder-prompt.md`, after the builder ends. The file must exist when claude starts: a missing `--settings` file stops claude at once (a5). If pi-worker is killed with SIGKILL, the folder stays, as the prompt file does today (residual).
5. **argv.** R-2646's sequence gains `--settings <file>` right after `--setting-sources project,local`. `--append-system-prompt-file <path>` stays the last flag before the instruction, so no variadic list swallows it (attack S3, re-measured here by accident: a3's first try failed with "Input must be provided" when `--allowedTools` came last).
6. **Lines** (stderr, before `[pi-worker] attempt 1/1`, one line per launch, names only, never a value):
   - `pi-worker: claude settings carry: <sorted carried keys, then "env " and sorted carried env names, or "none">; source: <file>`
   - `pi-worker: claude settings carry: none; <reason>; source: <file>`, where `<reason>` is one of `not found`, `cannot read (<error code>)`, `not valid JSON[ at line L, column C]` (place from `jsonErrorPlace` only), `not a JSON object`.
   - In every case pi-worker still writes the file with the sealed env and starts claude. It never throws on the source file. If login then needs something missing, claude stops at start with its own message (q4, q6-none-host, ca-none, a8).

### Must-meet rows (EARS, each no wider than its test)

IDs: R-2655 is this lane's reserved free ID. Shared-helpers holds R-2656 to R-2663, so the next two proposed are R-2664 and R-2665. The seat confirms.

| ID | Requirement | Test file::title |
|---|---|---|
| R-2646 (amended) | …`--setting-sources project,local`, `--settings` and the path R-2655 names, `--strict-mcp-config`, … (the rest unchanged) | existing R-2646 test; the argv gains the two items, path matched by pattern |
| R-2655 | WHEN pi-worker starts a Claude Code builder, it shall pass `--settings` naming one file outside the worktree. That file holds, from the user settings file (`settings.json` in `CLAUDE_CONFIG_DIR` when set, else in `.claude` under the home folder), only the carry keys and, under `env`, only the carry env names matched without regard to case, values unchanged. pi-worker shall print one carry line naming them and no value, and remove the file once the builder ends. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2655: a Claude Code builder gets a settings file outside the worktree carrying only the login keys and network env names from the user settings, named in one line without values, and gone after the build` |
| R-2664 | WHEN pi-worker writes a Claude Code builder's settings file, its `env` shall hold `NANA_ROLE=worker`, `NANA_WORKTREE_ROOT` set to the worktree, `NANA_HANDOFF=off`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` and both Bash time limits at the sealed builder limit, whatever the user settings `env` holds. | `…worker-claude.test.mjs::R-2664: the builder's settings file holds the sealed builder env whatever the user settings env says` |
| R-2665 | IF the user settings file is missing, unreadable, not valid JSON or not a JSON object, THEN pi-worker shall print one carry line naming the file and the reason and no file content, and still start the Claude Code builder with a settings file whose `env` holds only the sealed builder env. | `…worker-claude.test.mjs::R-2665: a missing, unreadable, malformed or non-object user settings file prints one carry line without its content, and the builder still starts with only the sealed env` |

Seal test: it adds `CLAUDE_SETTINGS_FLAG`, `CLAUDE_CARRY_KEYS` and `CLAUDE_CARRY_ENV_NAMES`, and names R-2655. It compares the imported names with literals, and asserts that the carry names and the sealed env names are disjoint, compared without regard to case.

### Tests: fixture and assertions
Harness: worker-claude's (temp HOME and USERPROFILE, the roster with `largerBuilder: {runtime: "claude-code", model: "fable"}`, fake claude first on PATH). The fake also copies the file after `--settings`, records its path and, on POSIX, its mode.

- **R-2655.**
  - Build 1. The fixture `<HOME>/.claude/settings.json` holds:
    - the three carry keys, as fake paths;
    - `hooks`, `permissions` (`defaultMode: "plan"`, `deny: ["Bash"]`), `enabledPlugins`, `model`, `otelHeadersHelper` and `awsAuthRefresh`;
    - an `env` with `HTTPS_PROXY`, `no_proxy` (lower case), `NODE_EXTRA_CA_CERTS`, `ANTHROPIC_API_KEY: "sk-ant-SECRET-MARKER-1"`, `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_PLUGIN_DIRS`, `CLAUDE_ENV_FILE`, `NODE_OPTIONS`, `CLAUDE_CODE_USE_BEDROCK` and `PROBE_OTHER`.
  - Build 1 assertions:
    - The copy's top-level keys equal exactly the three carry keys plus `env`, with the values unchanged.
    - `env`'s names equal `{HTTPS_PROXY, no_proxy, NODE_EXTRA_CA_CERTS, ANTHROPIC_API_KEY}` plus the sealed names, values unchanged.
    - The path lies outside the worktree, the file is gone after exit, and on POSIX `mode & 0o077 === 0`.
    - There is exactly one carry line: `pi-worker: claude settings carry: apiKeyHelper, awsCredentialExport, proxyAuthHelper, env ANTHROPIC_API_KEY, HTTPS_PROXY, NODE_EXTRA_CA_CERTS, no_proxy; source: <HOME>/.claude/settings.json`.
    - `sk-ant-SECRET-MARKER` appears nowhere in stdout, stderr, `--out` or the build record.
    - `git status --porcelain` in the worktree is empty.
  - Build 2. The launcher env sets `CLAUDE_CONFIG_DIR=<tmp>/cfg`, whose `settings.json` holds `HTTPS_PROXY=http://cfg.invalid:1`. The HOME file holds a different value. The copy carries the cfg value, and the line names the cfg path.
- **R-2664.** The user `env` holds `CLAUDE_CODE_DISABLE_AUTO_MEMORY: "0"`, `nana_role: "seat"`, `NANA_WORKTREE_ROOT: "/elsewhere"`, `NANA_HANDOFF: "on"` and `BASH_MAX_TIMEOUT_MS: "5"`. The copy's `env` holds `NANA_ROLE=worker`, `NANA_WORKTREE_ROOT=<lane>`, `NANA_HANDOFF=off` and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. Both Bash limits equal `String(CLAUDE_BUILDER_BASH_LIMIT_MS)`, imported. No other key in it matches a sealed name without regard to case. The recorded child process env holds the same sealed values.
- **R-2665.**
  - Four builds:
    1. no file;
    2. a directory at `.claude/settings.json` (EISDIR, on every platform);
    3. `{"env": sk-ant-SECRET-MARKER-2}` (V8 quotes `sk-ant-SEC` in its own message);
    4. `["sk-ant-SECRET-MARKER-3"]`.
  - Each build:
    - exits 0, and the fake ran once;
    - prints exactly one carry line, equal to `pi-worker: claude settings carry: none; <reason>; source: <path>`, with the reasons `not found`, `cannot read (EISDIR)`, `not valid JSON` and `not a JSON object`;
    - shows neither `sk-ant-SEC` nor `SECRET-MARKER` in any output;
    - leaves a copy whose only top-level key is `env`, with names equal to the sealed names.
- **R-2650 (existing, Windows leg, edited).** The carry path also arrives unchanged in `claude.cmd`'s argv.

### Wrong-code pairs (each must turn its test red)
1. Copy the user `env` whole, with no name filter → R-2655 (`PROBE_OTHER`, `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_PLUGIN_DIRS` appear).
2. Copy the whole user file → R-2655 (`hooks`, `permissions`, `model` appear).
3. Match carry names with case → R-2655 (`no_proxy` is dropped).
4. Read only `<home>/.claude/settings.json`, ignoring `CLAUDE_CONFIG_DIR` → R-2655 build 2.
5. Keep the sealed env only in the process env, not in the file → R-2664.
6. Put the parser's message in the line (`error.message`) → R-2665 (`sk-ant-SEC` appears).
7. Throw on a malformed or unreadable file, so pi-worker exits before claude → R-2665.
8. Skip the file when the user file is missing (`--settings` omitted) → R-2665 and R-2646.
9. Write the file into the worktree, or leave it after exit → R-2655.
10. Pass inline JSON to `--settings` instead of a path → R-2655 (no file to copy), and R-2650 on Windows (winCommand refuses `"`).
11. Print values in the carry line → R-2655 (`SECRET-MARKER-1` appears).
12. Drop `--settings` from the argv → R-2646.
13. Add `CLAUDE_CODE_DISABLE_AUTO_MEMORY` to `CLAUDE_CARRY_ENV_NAMES` → the seal test (literal and disjointness).

Not a pair: "carried env assigned after the sealed env". It cannot turn red while the two name sets are disjoint. Pair 13 and the seal test guard that disjointness instead.

### Known limits to rewrite (FEAT-006 file, before the final round)
- Replace "user `env` and `apiKeyHelper` are lost". New text:
  - From user settings, the builder gets the three helper keys and 17 network and login env names.
  - From a pi seat it does not get provider env (Bedrock, Vertex, Foundry), `NODE_OPTIONS` or any other user env name.
  - From a Claude Code seat it inherits the whole seat env anyway.
- `~/.claude.json` env and the worktree's `.claude/settings.json` env still apply for names the file does not set (measured a1, a9).
- Under a desktop-host entry point, carried names cannot override inherited names (measured a6).
- Managed env beats the sealed names (code).
- A builder started from a Claude Code seat inherits the seat's session env names (`CLAUDECODE`, `CLAUDE_CODE_SESSION_ID`, the messaging socket and token).
- A SIGKILLed pi-worker leaves the temp folder, and that folder may hold a carried key.
- `awsAuthRefresh` and `gcpAuthRefresh` are not carried.
- With a carried `apiKeyHelper` and an env key both set, two credentials go out (measured q4), as in a normal session.

### Docs that change (in addition to the must-meet's list)
- The pack README lane-mode paragraph: the settings file, what it carries, the carry line and the precedence rule.
- `worker-config.mjs` provenance comments.

## 5. The claim I would most expect to be wrong

"Managed settings `env` (a file, the `.d` folder, or the HKLM or HKCU policy key) reaches the builder with no carry under `--setting-sources project,local`." It comes from code reading only. The one probe that touched the policy layer (the hidden `--managed-settings` flag) applied its deny rule but not its env. If the claim is wrong, a builder started from a Claude Code seat still gets those names through the inherited seat env (the a3 mechanism, inferred for policy env). A builder started from a pi seat would fail at start. The fix would then be to add policy env to the carry, which this design refuses today.

## Open for the seat

- HANDOFF Open: should the provider env set (claude's `sq`, provider base URLs and provider credentials, about 20 names) join `CLAUDE_CARRY_ENV_NAMES` for pi-seat launches? Default: no.
- HANDOFF Next: one FEAT-006 known-bug line for the seat session env a builder inherits from a Claude Code seat.
- HANDOFF Next: on a machine behind a proxy, one real-claude smoke started from the owner's usual seat. It checks login through the proxy and a commit.
