# Local models with pi — state & snippets

Verified on this Mac 2026-09-01: `llama-server` (llama.cpp, homebrew) installed; a custom
provider `local` → `http://localhost:8080/v1` (`openai-completions` api) already exists in
`~/.pi/agent/models.json` with a 0-cost 262k-window `local-model` entry. No ollama, no LM Studio.

Two supported paths (from `docs/providers.md` / `docs/llama-cpp.md` upstream):

1. **llama.cpp router (first-class)** — `/login llama.cpp`, then `/llama` for model management.
2. **Any OpenAI-compatible server** — add a provider to `~/.pi/agent/models.json`.

Ready-to-paste when the server exists:

```jsonc
// Ollama (default port 11434)
"ollama": {
  "baseUrl": "http://localhost:11434/v1",
  "api": "openai-completions",
  "apiKey": "ollama",
  "compat": { "supportsDeveloperRole": false, "supportsReasoningEffort": false },
  "models": [{ "id": "<model-tag>", "name": "<model-tag>", "reasoning": false,
               "input": ["text"], "contextWindow": 131072, "maxTokens": 8192,
               "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 } }]
}

// LM Studio (default port 1234): same shape, baseUrl http://localhost:1234/v1
// vLLM: same shape, your serve port; upstream docs note Ollama/vLLM compat flags.
```

Switching: `--provider local --model local-model`, or `/model` in-session; pi-ai carries
context across provider switches mid-session.
