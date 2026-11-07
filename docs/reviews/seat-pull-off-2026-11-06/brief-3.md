# Brief 3: seat-pull-off, Windows CI fix

Feature: FEAT-013 · Install and connect harness runtimes

CI on 7456e78b failed only on suite (windows-latest), in one check in `packages/nana-setup/tests/doctor-detail.test.mjs`:

FAIL doctor reports missing and out-of-repo knowledge hooks as retired {"status":"fail","label":"settings UserPromptSubmit retired hook","detail":"retired hook still wired: NODE_NO_WARNINGS=1 node /missing-clone/packages/nana-knowledge/bin/nana-knowledge.ts hook — run `nana-setup install`"} undefined

One of the two retired-hook rows the test expects is missing on win32 (`undefined`). The likely cause is that a POSIX-only path (`/missing-clone/...`, or the out-of-repo fixture) isn't recognised as an installer-shaped knowledge entry under win32 path rules, or the fixture writes a POSIX shell form where win32 expects the exec form. Find which, and fix the matcher or the fixture so both rows appear on every platform. Prefer fixing the code if a real win32 install could hold that shape. Change nothing else. Use repo-relative paths, `~` and `$TMPDIR` in any committed evidence.

## Precedent
- `packages/nana-setup/lib/settings.mjs` — `installerKnowledgeTarget` and the retired-knowledge matcher.
- `packages/nana-setup/tests/win32-hook-repair.test.mjs` — how win32 hook shapes are faked on POSIX.

Report: the tip, the cause with evidence, and the touched tests run (including any injected-win32 cases).
