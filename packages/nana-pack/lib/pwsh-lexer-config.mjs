/**
 * @module packages/nana-pack/lib/pwsh-lexer-config.mjs
 * @purpose Define the PowerShell lexer alphabet and oracle run settings.
 * @inputs none.
 * @outputs quote sets, token enders, shell names, corpus settings, and timeout.
 * @effects none
 * @errors none.
 */

// PowerShell tokenizer probe, 2026-10-19: pwsh 7.4.6 and 7.6.7 agreed.
export const POWERSHELL_SINGLE_QUOTES = new Set(["'", "‘", "’", "‚", "‛"]);
// PowerShell tokenizer probe, 2026-10-19: pwsh 7.4.6 and 7.6.7 agreed.
export const POWERSHELL_DOUBLE_QUOTES = new Set(['"', "“", "”", "„"]);
// PowerShell tokenizer probe, 2026-10-19: these end a bare command token; `$` does not.
export const POWERSHELL_TOKEN_ENDERS = new Set(["&", "(", ")", ",", ";", "{", "|", "}"]);
// PowerShell installations exercised by CI: pwsh everywhere and Windows PowerShell on win32.
export const POWERSHELL_ORACLE_SHELLS = Object.freeze(["pwsh", "powershell"]);
// Chosen: seed 1 reproduces the planning corpus while keeping every run deterministic.
export const POWERSHELL_CORPUS_SEED = 1;
// Chosen: 1,500 commands balance grammar breadth with one-process test time.
export const POWERSHELL_CORPUS_SIZE = 1500;
// Chosen: two minutes bounds a cold Windows PowerShell oracle with CI headroom.
export const POWERSHELL_ORACLE_TIMEOUT_MS = 120_000;
