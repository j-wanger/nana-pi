# Claude Code Builder Parity: Authentication, Settings, and Proxy Documentation

## 1. Settings Layers and Precedence (DOCUMENTED)

Claude Code reads settings from five layers in priority order:

1. **Managed settings** (highest priority) — from claude.ai admin console, plist/registry policies, or managed-settings.json files; nothing overrides managed keys except security exceptions
2. **Command line** (`--settings <file-or-json>`) — one-session only, applies above project/user/local but below managed
3. **Project local** (`.claude/settings.local.json`) — per-user personal overrides for one project
4. **Shared project** (`.claude/settings.json`) — team settings checked into version control
5. **User** (`~/.claude/settings.json`) — personal settings for all projects

Source: https://code.claude.com/docs/en/settings.md § "Settings precedence"

### `--setting-sources` control

- Controls which JSON settings files are read (project, local, shared, user)
- Does NOT affect managed settings (always applied), command-line `--settings`, environment variables, or keychain/OAuth credentials
- `--setting-sources project,local` reads only `.claude/settings.json` and `.claude/settings.local.json`, skipping `~/.claude/settings.json` and user-level files
- Keychain credentials on macOS and OAuth tokens are read independently of `--setting-sources`

Source: https://code.claude.com/docs/en/settings.md § "Settings files and precedence" and `--bare` mode documentation

### `--settings <file>` placement

- A separate command-line layer in the precedence stack
- Sits between managed settings (highest) and project files (lowest)
- Can set any key that user/project/local files can set, but cannot override managed keys or set managed-only keys
- Applied only to that session; does not persist to disk

Source: https://code.claude.com/docs/en/settings.md § "Change a setting for one session"

---

## 2. Settings Keys Affecting Login, Auth, Credentials, and Network (DOCUMENTED)

### Authentication & Credential Helpers

| Key | Type | Purpose | Scope | Notes |
|-----|------|---------|-------|-------|
| `apiKeyHelper` | command path | Execute to fetch Anthropic API key instead of using default storage | Any file | Required for headless; replaces keychain lookup |
| `awsAuthRefresh` | command path | Execute to refresh Bedrock credentials in `.aws` | Any file | For Amazon Bedrock provider |
| `awsCredentialExport` | command path | Execute to export Bedrock credentials as JSON | Any file | Alternative to `awsAuthRefresh` |
| `gcpAuthRefresh` | command path | Execute to refresh GCP credentials | Any file | For Google Cloud provider |
| `otelHeadersHelper` | command path | Execute to generate rotating OpenTelemetry headers | Any file | For dynamic observability tracking |

Source: https://code.claude.com/docs/en/settings-reference.md

### Login & Organization Control

| Key | Type | Default | Scope | Purpose |
|-----|------|---------|-------|---------|
| `forceLoginMethod` | string | unset (all methods) | Any | Restrict to `"claude-ai"`, `"console"`, or `"gateway"` only |
| `forceLoginOrgUUID` | string | unset | Managed only | Pin claude.ai logins to specific organization UUID |
| `forceLoginGatewayUrl` | string | unset | User or managed | Set cloud gateway login URL |
| `gatewayInternalNetworks` | CIDR array | unset | Managed only | Allow gateway on public IPv4 space |

Source: https://code.claude.com/docs/en/settings-reference.md

### Environment Variables Block

| Key | Type | Effect | Scope | Notes |
|-----|------|--------|-------|-------|
| `env` | object | Set environment variables for every session and subprocess | Any file | Precedence rules apply per variable; shell exports can override |

Example:
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "<key>",
    "ANTHROPIC_BASE_URL": "https://proxy.example.com",
    "NODE_EXTRA_CA_CERTS": "/etc/ssl/certs/ca-bundle.pem"
  }
}
```

Source: https://code.claude.com/docs/en/settings-reference.md § "env"

### Environment Variables for Authentication (DOCUMENTED)

These are read from the shell environment OR from the `env` block in settings files:

**Anthropic API**
- `ANTHROPIC_API_KEY` — API key (takes precedence over claude.ai/keychain)
- `ANTHROPIC_AUTH_TOKEN` — custom Authorization header value
- `ANTHROPIC_PROFILE` — Anthropic profile name

**OAuth for claude.ai**
- `CLAUDE_CODE_OAUTH_TOKEN` — OAuth access token (takes precedence over keychain)
- `CLAUDE_CODE_OAUTH_REFRESH_TOKEN` — OAuth refresh token
- `CLAUDE_CODE_OAUTH_SCOPES` — space-separated scopes (required with refresh token)

**Workload Identity Federation**
- `ANTHROPIC_FEDERATION_RULE_ID`, `ANTHROPIC_ORGANIZATION_ID`, `ANTHROPIC_WORKSPACE_ID`

**Provider-Specific**
- AWS Bedrock: `AWS_BEARER_TOKEN_BEDROCK`, `ANTHROPIC_AWS_API_KEY`, `ANTHROPIC_AWS_WORKSPACE_ID`
- Google Cloud: `ANTHROPIC_VERTEX_PROJECT_ID`
- Azure Foundry: `ANTHROPIC_FOUNDRY_API_KEY`, `ANTHROPIC_FOUNDRY_AUTH_TOKEN`, etc.

**Network & Proxy**
- `ANTHROPIC_BASE_URL` — override API endpoint
- `NODE_EXTRA_CA_CERTS` — additional CA certificates for Node.js/TLS
- `CLAUDE_CODE_CERT_STORE` — CA certificate sources (`"bundled,system"`)
- `CLAUDE_CODE_CLIENT_CERT`, `CLAUDE_CODE_CLIENT_KEY`, `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE` — mTLS client certificates

Source: https://code.claude.com/docs/en/env-vars.md

### Variable Precedence (DOCUMENTED)

Settings file `env` values override shell exports, but shell environment still applies for variables not in settings:

```
Shell export → Settings file `env` block → Defaults
```

Example: if shell has `export ANTHROPIC_API_KEY=shell-key` and settings has `"env": {"ANTHROPIC_API_KEY": "settings-key"}`, settings wins.

Source: https://code.claude.com/docs/en/env-vars.md § "Precedence Rules"

---

## 3. Corporate Proxy Configuration (DOCUMENTED)

### Documented proxy setup

Claude Code does NOT have an explicit `proxy` or `proxyUrl` setting key. Network proxying works through:

1. **System environment variables**: Node.js honors `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`
2. **Settings `env` block**: Set variables in `~/.claude/settings.json` or managed settings
3. **Node.js behavior**: HTTP/HTTPS traffic respects standard `*_PROXY` variables

Example Windows corporate proxy setup (settings file):
```json
{
  "env": {
    "HTTPS_PROXY": "http://proxy.company.com:8080",
    "HTTP_PROXY": "http://proxy.company.com:8080",
    "NO_PROXY": "localhost,127.0.0.1,.company.local"
  }
}
```

### Windows proxy on corporate machines (INFERRED)

On Windows corporate machines, proxy settings most commonly live in:

1. **System environment variables** (most portable) — `HTTPS_PROXY`, `HTTP_PROXY` set system-wide
2. **Claude Code settings** (`env` block) — explicitly in `.claude/settings.json` or managed settings
3. **Windows Registry** (least portable for Claude) — WINHTTP registry settings (requires explicit configuration)
4. **Enterprise MDM/policy** — managed via Group Policy or device management

Least likely to work for Claude: WinINet registry or Internet Options GUI (Node.js uses HTTPS_PROXY env, not WinINet).

Source: https://code.claude.com/docs/en/admin-setup.md and https://code.claude.com/docs/en/env-vars.md (Network & Proxy Configuration)

### TLS/mTLS Configuration (DOCUMENTED)

For corporate TLS inspection or client certificates:

```json
{
  "env": {
    "NODE_EXTRA_CA_CERTS": "/path/to/corporate-ca-bundle.pem",
    "CLAUDE_CODE_CERT_STORE": "bundled,system",
    "CLAUDE_CODE_CLIENT_CERT": "/path/to/client.pem",
    "CLAUDE_CODE_CLIENT_KEY": "/path/to/client.key",
    "CLAUDE_CODE_CLIENT_KEY_PASSPHRASE": "optional-passphrase"
  }
}
```

Source: https://code.claude.com/docs/en/env-vars.md § "TLS & Certificate Store"

---

## 4. User Settings File Locations (DOCUMENTED)

| Platform | Location | Env Override |
|----------|----------|--------------|
| macOS | `~/.claude/settings.json` | `CLAUDE_CONFIG_DIR` |
| Linux | `~/.claude/settings.json` | `CLAUDE_CONFIG_DIR` |
| Windows | `%USERPROFILE%\.claude\settings.json` | `CLAUDE_CONFIG_DIR` |

### CLAUDE_CONFIG_DIR behavior (DOCUMENTED)

When set, `CLAUDE_CONFIG_DIR` relocates:
- User settings (`~/.claude/settings.json`)
- Project-local settings (`.claude/settings.local.json`) — still anchored to project root
- Session history, plugins, MCP configs
- Credentials and keychain data

Note: Setting `CLAUDE_CONFIG_DIR` to a non-default path does NOT disable authentication; OAuth and API key reads are affected only by `--bare` mode or when settings explicitly override them.

Source: https://code.claude.com/docs/en/settings.md and https://code.claude.com/docs/en/setup.md § "Additional dependencies"

---

## 5. Credential Storage & Keychain Behavior (DOCUMENTED & INFERRED)

### OAuth / Subscription Credential Storage (DOCUMENTED)

- **macOS**: Stored in Keychain (secure credential storage)
- **Linux/Windows**: Stored in platform-specific credential managers or files (specifics not documented in public docs; implied by `--bare` mode skipping keychain reads)

### `--setting-sources` behavior (DOCUMENTED)

`--setting-sources project,local` **does NOT affect**:
- Keychain reads (macOS)
- OAuth token reads (from Keychain or local credential store)
- Environment variables (still read from shell or settings `env` block)
- Managed settings (always applied)

### `--bare` mode behavior (DOCUMENTED)

When `--bare` is set, Claude Code:
- Skips keychain reads entirely (macOS)
- Skips OAuth login (subscriptions, claude.ai accounts)
- Requires `ANTHROPIC_API_KEY` or `apiKeyHelper` via `--settings` for authentication
- Still reads managed settings

This implies credential storage is separate from the settings-file layer controlled by `--setting-sources`.

Source: https://code.claude.com/docs/en/plugins/cli-reference.md § "`--bare` mode" and https://code.claude.com/docs/en/settings.md

---

## 6. Command-Line Flags for Auth & Network (DOCUMENTED)

From `claude --help` output:

| Flag | Purpose | Example |
|------|---------|---------|
| `--settings <file-or-json>` | One-session settings override | `--settings '{"env": {"HTTPS_PROXY": "http://proxy:8080"}}'` |
| `--setting-sources <comma-list>` | Which settings files to read | `--setting-sources project,local` (skips user file) |
| `--append-system-prompt-file <path>` | Add system prompt from file | (Builder use: pass instruction file) |
| `--bare` | Minimal mode: no keychain, no OAuth, no hooks, no plugins, no auto-memory | Implies API key or apiKeyHelper required |
| `--betas <headers>` | Beta headers for API requests | API key users only |

Source: `~/.local/bin/claude --help`

---

## 7. Builder Implementation Recommendations (INFERRED)

For the pi-worker launcher to carry proxy/auth settings to a headless builder:

1. **Read user settings file** at `~/.claude/settings.json` (or CLAUDE_CONFIG_DIR if set)
2. **Extract sealed keys** from the `env` block: `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, `NODE_EXTRA_CA_CERTS`, `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, plus provider-specific variables
3. **Avoid copying**: `apiKeyHelper` (command paths don't transfer), login state, managed settings (applied by the builder itself)
4. **Create temp settings file** with extracted keys under scratchpad
5. **Pass to builder**: `--settings <temp-file>`
6. **Set builder env** with `NANA_ROLE=worker` and timing/resource limits

**Why this works**:
- `--settings <file>` sits between managed and project files in precedence (builder's own project/user files are excluded via `--setting-sources project,local`)
- Builder's own sealed `env` values (from its copy of `~/.claude` after filtering) win over carried values at the same name
- Managed settings still apply (highest priority)
- Proxy and TLS settings reach Node.js via the `env` block

---

## Final Answer (8 lines max)

**Settings layers**: Managed (highest) → command line `--settings` → project local → shared project → user. `--setting-sources` controls which JSON files are read, NOT keychain/OAuth; `--settings <file>` is a separate layer above project files. Managed settings always apply.

**Auth/network keys**: `apiKeyHelper`, `awsAuthRefresh`, `awsCredentialExport`, `otelHeadersHelper`, `forceLoginMethod`, `forceLoginOrgUUID`; `env` block (sets variables); `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `NODE_EXTRA_CA_CERTS`, `CLAUDE_CODE_CLIENT_CERT/KEY`, provider vars. `apiKeyHelper` needed for headless.

**Windows proxy**: Most likely in system env (`HTTPS_PROXY`) or Claude Code settings `env` block, least likely WinINet registry. Set via settings file `env` block for portable carrier.

**Settings files**: `~/.claude/settings.json` (macOS/Linux), `%USERPROFILE%\.claude` (Windows); `CLAUDE_CONFIG_DIR` redirects all. Keychain (macOS) and OAuth are read separately; `--setting-sources` doesn't affect them.

**Credentials**: Keychain on macOS, file-based elsewhere; `--setting-sources` and `--settings` don't prevent OAuth/keychain reads (only `--bare` does). Builder needs either `ANTHROPIC_API_KEY` or `apiKeyHelper` in carried `env` or settings.

**Recommendation**: Extract sealed `env` keys (proxy, TLS, API key) from user settings into temp file, pass `--settings <temp>` to builder. Builder's own project settings apply via `--setting-sources project,local`; sealed env values win over carries.

---

Sources:
- https://code.claude.com/docs/en/settings.md
- https://code.claude.com/docs/en/settings-reference.md
- https://code.claude.com/docs/en/env-vars.md
- https://code.claude.com/docs/en/setup.md
- https://code.claude.com/docs/en/admin-setup.md
- `~/.local/bin/claude --help` (built-in CLI reference)
