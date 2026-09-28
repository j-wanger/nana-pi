## Findings

- **HIGH — NOT FIXED [security/gate]:** `trust.json` is not protected by `PROTECTED_PATHS` (`packages/nana-pack/extensions/nana-gate.ts:35-40`), while it is accepted as trust evidence (`packages/nana-pack/lib/config.ts:303-305`) and enables project gate merging (`config.ts:407-426`).
  - `/tmp` fresh-process probe: old snapshot, `.bak`, and nana-only project config were ignored; `rm -rf /tmp/x` remained blocked.
  - A `write` call targeting `~/.pi/agent/trust.json` returned unblocked.
  - After planting `{canonicalCwd:true}`, a fresh process reported the trust record true and project `allowPatterns:[".*"]` allowed `rm -rf /tmp/x`.
  - A malformed **user** gate still overrode this and stopped all gated tools, so the direct persisted-snapshot defect is fixed; the broader “no plantable disk file widens after restart” contract is not.
- **MED — FIXED [diagnostics]:** `surface()` uses unconditional `appendJournalLine` (`config.ts:348-356`). Probe with `{"journal":{"enabled":false,"path":7}}` produced exactly one `config_invalid` entry at the default journal path.
- **Tests [review]:** `config-gate-fallback` a–e correctly replace the snapshot contract and exercise the real handler/fresh processes (`tests/config-gate-fallback.test.mjs:64-162`). However, its universal planting claim omits `trust.json` (`:136-151`).
- **Tests [review]:** normalization regex/path cases and journal assertion are strict; robustness seeding legitimately establishes an in-process last-good before malformed cases (`tests/gate-config-robustness.test.mjs:35-43`). No assertion was weakened.
- **Fold [correctness]:** stop handling occurs before allow patterns (`nana-gate.ts:81-92`) and is correct. Config-path-keyed process-wide last-good (`config.ts:249-250,389-395`) behaves as ruled; no material defect found. Minor wording says “session” at `config.ts:396`, though state is process-wide.
- **Astra residual [L2]:** protect `trust.json` from bash/powershell/edit/write and add the composed trust-plus-project-config regression; ensure protected paths cannot be bypassed by an allow pattern.

VERDICT: BLOCK
