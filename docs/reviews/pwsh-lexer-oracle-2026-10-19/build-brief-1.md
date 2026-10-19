# Brief: pwsh-lexer-oracle
Feature: FEAT-010 · Guard risky commands and protected resources. Rows R-1730..R-1736 (block R-1730..R-1739). Worktree `~/nana-pi-wt/pwsh-lexer-oracle`, branch `feat/pwsh-lexer-oracle`. Class: install, hook or gate.

## Change
1. REQUIREMENTS.md: add R-1730..R-1736 to FEAT-010 after R-1062, status `untested`, with the text from must-meet.md. Then run `node scripts/requirements-tree.mjs --write`, because R-291 compares docs/requirements-tree.md with a fresh render.
2. New test `packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs` and new helper `packages/nana-pack/tests/pwsh-oracle.mjs` (six-tag header, named exports).
   - Generator: seeded PRNG and a small grammar covering:
     - bare words, and variables at argument positions (`$a`, `$a[0]`, `${a}`, `$env:X[0]`);
     - ASCII and typographic strings with doubled-quote and backtick escapes;
     - here-strings of both kinds and both quote styles, with closers followed by `#`, `<#`, a space or `|`;
     - `$( … )` at a token start, mid-word, and in strings and here-strings; `( … )` and `{ … }`;
     - separators `; | , LF CRLF`; comments at token starts and glued after closers; `#`, `<#`, `@'` and `@"` mid-word.
   - Every command must parse clean in pwsh 7 and in Windows PowerShell 5.1. So: no `&&`/`||`, no line starting with `|`, no trailing `,`, and spaces around expression operators. Leave out known limits 1–4.
   - Runner: spawn with no shell, `windowsHide`, the config timeout, and `-NoProfile -NonInteractive -EncodedCommand`. Pass the corpus in through a UTF-8 temp file, read with `[IO.File]::ReadAllText(path, [Text.Encoding]::UTF8)`. Have PowerShell write ASCII offset lines to a temp file. Use `Parser.ParseInput`, recursing into `NestedTokens`.
   - Shells: `pwsh` wherever it is on PATH. On win32, `powershell` as well, which is required there (R-1731). Otherwise print one SKIP line. Inject platform and spawn so R-1731 and R-1732 run everywhere with fakes.
3. `packages/nana-pack/lib/pwsh-lexer-config.mjs` (new): quote sets, token enders, oracle shell names, corpus seed and size, and oracle timeout, each with provenance. Seed and size are chosen, not sealed.
4. `packages/nana-pack/lib/pipe-guard.mjs`:
   - Replace the three PowerShell functions with ONE token-start scanner, as must-meet Design describes.
   - The live text and `powerShellSpans` (new named export; add it to `@outputs`) come from one pass. Subexpression bounds come from the same scanner stopped at the close.
   - The bash path and `verifierPipeReason` stay unchanged. Rewrite the §2.2.3/§2.3.3 comments to cite the tokenizer probe.
   - A planning prototype of about 120 lines reached 0 disagreements on 3,445 commands.
5. `pipe-guard.test.mjs`: flip and retitle only the `$#` case named in must-meet, fix its comment, and list the edit.
6. `packages/nana-pack/README.md`, Verifier-pipe guard paragraph: add one sentence. Wherever PowerShell is installed (on CI, always the Windows leg), a test compares the PowerShell dialect's comment and string spans with PowerShell's own tokenizer over generated commands. A comment glued to an operator, a redirection or a member access, and nested strings inside a string's `$( … )`, are known gaps.
7. Run `npm run map`. Set the R-291 leaf total to the total `node scripts/requirements-trace.mjs` prints, but only if that literal is still on main.

## Tests (only these new ones)
R-1730 `oracle: ${shell} reports the lexer's comment and string spans for every generated command`; R-1731 `oracle: on win32 a Windows PowerShell that does not start fails the run instead of skipping`; R-1732 `oracle: a parse error or a missing result fails the comparison and names the command`; R-1733 `token start: ${name}`; R-1734 `typographic quotes: ${name}`; R-1735 `line end: a carriage return ends a line comment`; R-1736 `token start after a close: ${name}`.
- Each title sits on the `check(` line directly under its `// req:` marker. The table cases are exactly the must-meet's. Each expected value is read from PowerShell's tokens.
- Local oracle: unpack the current PowerShell 7.6 release tarball under $TMPDIR. Put it first on PATH for single-file runs, with a temp HOME. The CI images carry pwsh 7.6.

## Wrong code to try (each must turn a named test red)
- Keep `$` as a token ender → R-1733 (`$#c`).
- Treat every closing quote as a token start → R-1733 (`a'b'#c`, `a'b'<#c`).
- Open a here-string at any line-final `@'` or `@"` → R-1733.
- No token start after a here-string or block-comment close → R-1736.
- Compute spans from a copied scanner and leave the live path old → R-1733..R-1736.
- Drop ‘ from the single-quote set → R-1734.
- Close a `"` string only at `"` → R-1734 (`"a”`).
- End line comments only at LF → R-1735.
- Treat a missing powershell as SKIP on win32 → R-1731.
- Ignore parse errors or a short result list → R-1732.

## Done
- Single test files green: both pipe-guard files, `packages/nana-setup/tests/verifier-pipe.test.mjs`, every test `npm run map:impact packages/nana-pack/lib/pipe-guard.mjs` names, and the oracle against local pwsh 7.6.
- Green: `npm run test:locked`, `node scripts/requirements-trace.mjs` (0 missing), `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check`.
- Push the branch, open a draft PR and read the finished CI run once.
  - The oracle lines must PASS for pwsh on all three legs and for Windows PowerShell on the Windows leg.
  - If one fails, report PARTIAL with the first failing command per shell. Never fork the lexer per version.
  - R-1730's evidence cell names that run and its per-leg lines.

## Report (≤10 lines)
VERDICT; commits; rows flipped; corpus size and the per-shell oracle result per CI leg; the edited existing case; the wrong-code pairs with the red test each hit; any construct dropped from the alphabet; the suite summary line; what was not done.