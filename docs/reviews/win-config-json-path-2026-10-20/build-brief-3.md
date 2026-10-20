# win-config-json-path — build brief 3 (one sentence)

Same worktree and branch (tip after the seat's merge of main 8466795b). Class: install, hook or gate. Follow packages/nana-pack/prompts/builder-preamble.md. Single test files only; do not push; do not edit HANDOFF.md or docs/sessions/.

## The finding
The seat's notes found that build 1's new bullet in packages/nana-pack/README.md (the objective contract) is untrue since build 2. It says the config line always gives the forward-slash advice. Since build 2, only a bad escape or bad control character gets that advice. Every other parse error gets "Repair the JSON by hand." The README is a contract, so the sentence must match the code.

## Change
Reword that one bullet so it says what the code does: the line names the file and, when the parser reports it, the line and column. It gives the forward-slash advice for a backslash error and the by-hand advice for any other parse error, and it never shows file text. Keep it to the bullet's current length. Change nothing else.

## Done
`npm run readme:check` and `npm run map:check` exit 0; objective-golden green alone. Commit with an explicit path.

## Report (≤ 4 lines)
VERDICT; commit; the new sentence.
