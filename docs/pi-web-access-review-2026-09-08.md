# pi-web-access — source review (v0.28.0)

**Verdict: SAFE-TO-LOAD-FOR-BENCH** (no key needed on your Codex login)

## 1. Identity

- `pi-web-access@0.28.0`, MIT, author **Nico Bailon** (`nicopreme <nico.bailon@gmail.com>`).
- Repo `github.com/nicobailon/pi-web-access` — **1394★**, 240 forks, last commit `811ef82a` 2026-09-06, 123 total issues (6 open), external contributors merged (PR #359). Not astroturfed.
- **Scope correction:** unscoped `pi-web-access`, **not** `@earendil-works` (that's the pi runtime, listed only as peerDeps). Same author as your installed `pi-mcp-adapter` + `pi-subagents` — all `nicopreme` per `npm view maintainers`.
- Deps: 9 runtime (`undici`, `turndown`, `linkedom`, `@mozilla/readability`, `defuddle`, `typebox`, `unpdf`, `p-limit`, `promise.try`). Temp install = **361 packages** incl. the pi peer stack.
- Ships **raw TypeScript, no dist, no minified/eval code** — `grep 'eval(|new Function'` → zero hits. **No postinstall/prepare** (`package.json:5-9`).

## 2. Tools registered

Four (renameable via `toolNames` config; defaults `index.ts:223-226`):

| tool | key params | caps |
|---|---|---|
| `web_search` | query/queries[], numResults(1-20), includeContent, recencyFilter, domainFilter[], provider, workflow, proxy | 30k chars inline (`index.ts:644`) |
| `source_check` | claim, queries[], numResults, fetchContent, domainFilter, provider, proxy | ≤8 queries, ≤20 results, ≤5 pages (`index.ts:2408`) |
| `fetch_content` | url/urls[], mode(readable\|raw\|answer), prompt, forceClone, timestamp, frames, model, **auth**, proxy | 30s (`extract.ts:33`), PDF 5MB (`:1179`) |
| `get_search_content` | responseId, urlIndex, offset, limit, findText, findMode | limit ≤ 30k |

Allowlist: `--tools web_search,source_check,fetch_content,get_search_content`.

## 3. Network + secrets

- ~28 backends. **No key required for you**: with `--provider openai-codex` it uses your Codex subscription against `https://chatgpt.com/backend-api/codex/responses` (`openai-search.ts:9,71-76`). DuckDuckGo HTML scrape (`duckduckgo.ts:5`) is keyless but opt-in-only. All 50+ env reads are provider keys, proxy vars, or platform paths. **No AWS/SSH/token harvesting, no telemetry host** — every hardcoded host is a provider API, signup page, or curator CDN/font.
- **SSRF: genuinely good.** `validateRemoteUrl` (`ssrf-protection.ts:183`) blocks non-http(s), `localhost`/`.localhost`, and all private/reserved v4+v6 (`:364-396`). Re-validated on **every** redirect (`:246`), max 5. I ran it live — blocked `127.0.0.1`, `localhost`, **`169.254.169.254`** (cloud metadata), `10.x`, `192.168.x`, `[::1]`, `0.0.0.0`, `file://`; allowed `example.com`. All `fetch_content` paths route through it (`extract.ts:26,358,514,1148`).
- **Browser cookies — default OFF, triple-gated.** `getBrowserCookiesForHosts` reads Chrome/Brave/Arc/Edge cookie DBs, decrypting via macOS Keychain (`security find-generic-password`, `chrome-cookies.ts:473`). Gate 1: `allowBrowserCookies:true` in `web-search.json` or `PI_ALLOW_BROWSER_COOKIES=1` (`gemini-web-config.ts:86-100`) — false when no config file exists. Gate 2: model must pass `auth:` **and** a named `authFetch` profile must exist. Gate 3: HTTPS-only, host allowlist, same-origin redirects (`auth-fetch.ts:39-59`). The model cannot reach cookies on its own.
- HTML→text via readability/defuddle/turndown; `<script>` stripped (`extract.ts:1026`).
- **Residual risk:** `fetch_content` output is **not** wrapped in untrusted markers — only the `mode:answer` sub-call is (`page-query.ts:128-134`). Standard prompt-injection exposure; treat fetched text as untrusted yourself.

## 4. Local footprint

- Writes only `~/.pi/agent/web-search.json` (config, via `/websearch`) and `web-search-cache/` (mode 0700, `storage.ts:76,173`). **My run created neither** — `~/.pi` verified unchanged.
- Child processes are all opt-in feature paths: `gh`, `git`, `curl`, `sqlite3`/`python3` (cookie DB), `yt-dlp`/`ffmpeg` (video), `open`/`xdg-open` (curator).
- Curator HTTP server: `listen(0, "127.0.0.1")`, session-token gated, `enabled:false` by default; `0.0.0.0` only via explicit `curatorRemote` (`utils.ts:126,148`).

## 5. Bench invocation (no install)

```bash
cd WORK/tmpinstall && npm init -y && npm install pi-web-access   # then, from a throwaway cwd:
pi -p --no-session --no-skills --no-context-files --no-prompt-templates --no-extensions \
  -e WORK/tmpinstall/node_modules/pi-web-access/index.ts \
  --tools web_search,source_check,fetch_content,get_search_content,read \
  --provider openai-codex --model gpt-5.6-sol "List the tools you have available, names only."
```

No build step; pi's jiti loads `.ts` directly (`docs/extensions.md:179`). `node_modules` **is** required (9 runtime deps) — `npm pack` alone won't load. Ran it: output `web_search / source_check / fetch_content / get_search_content / read / parallel` — **all four register**, no key error. Loaded fine despite peerDep pulling pi 0.85.1 against your host 0.84.4. `parallel` is a pi builtin the `--tools` allowlist did not suppress.

Headless is safe: `resolveWorkflow` forces `"none"` when `!hasUI` (`index.ts:350-356`), so no browser opens under `-p`. Caveat: explicit `workflow:"auto-summary"` bypasses that check and spends a nested model call.

## 6. Verdict

**SAFE-TO-LOAD-FOR-BENCH.** Big surface (29k LOC) but the security-relevant code is deliberate: real SSRF guard with redirect re-validation, cookies default-off behind three gates, no eval, no postinstall, no telemetry.

**The claim I'd most expect to be wrong:** that the SSRF guard holds against **DNS rebinding**. `validateRemoteUrl` resolves and checks, then `fetchImpl` resolves *again* independently (`ssrf-protection.ts:234-238`) — classic TOCTOU, no pinning of the validated IP. Low risk on URLs you choose; matters if you later let it fetch adversarial model-supplied URLs on a host with reachable internal services.

**Alternatives:** none needed — no paid key required on your Codex login.
