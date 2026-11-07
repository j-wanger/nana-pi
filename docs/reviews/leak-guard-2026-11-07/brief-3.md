# Brief 3: leak-guard, Windows CI fix

Feature: FEAT-041 · Shape each agent's context by role

CI on 38668e1e passed everywhere except suite (windows-latest): `packages/nana-pack/tests/leak-scan.test.mjs` 7 pass, 2 fail. The runner printed no check names or details for this file on Windows.

1. Make every check in leak-scan.test.mjs print its name and a detail payload (counts, kinds, exit codes, the normalized forms compared; never a matched word or the real home) on FAIL, as the other test modules do. Then the next CI run shows the cause.
2. Fix the likely cause. On Windows runners, `os.tmpdir()` and the home folder show up in 8.3 short form (`C:\Users\RUNNER~1\...`, seen in other modules' CI output), while paths written into committed files or returned by realpath are in long form (`C:\Users\runneradmin\...`), or the reverse. On win32, the literal home and temp check must match both the short and the long spelling of each, plus the forward-slash and msys forms already planned. Get both spellings from the real path of each folder and from the value as given. Add a test that injects a short and a long spelling of one home and expects one home hit for text holding either. Check the end-to-end build test (M7), which writes the test's USERPROFILE into a log, for the same mismatch.

Change nothing else. Use repo-relative paths, `~` and `$TMPDIR` in committed evidence.

## Precedent
- `packages/nana-pack/lib/real-path.mjs` — the canonical-path helper the review tools use for short and long spellings.
- `packages/nana-pack/lib/leak-scan.mjs` — the home and temp matcher.

Report: the tip, the cause you found (or your best inference, marked inferred, since there's no native Windows here), and the touched tests run.
