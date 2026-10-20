# handoff-cap-surrogate — plan attack (one adversary)

Verdict: AMEND

AMEND. The design is right: one line of code using `head`, a provenance note, and an exported name. Every wrong-version claim held when probed. Five things changed.

(1) The brief misses a generated file. Adding R-2160 also requires `npm run req:tree` to regenerate docs/requirements-tree.md. Without it, requirements-tree.test.mjs fails 5 R-291 checks: it exited 1 on a probe clone with only the plan's three files changed, and exited 0 after regenerating. The brief's single-file list never ran that test, so the builder would have handed back a tip that fails the full suite. The lane now touches four files and runs the tree test and the trace scanner.

(2) The red-today evidence was misleading. On unchanged code the new check fails only because INJECT_CAP is not exported: CAP is undefined, the body becomes "😀tail" and the expected value becomes "". The real bug only shows once the export is added. Probed with export only (W0): the cut is 8000 units, ends on 0xD83D, isWellFormed is false, R-189 PASS and R-2160 FAIL. The brief now does the export first and shows that red before the head change.

(3) The row now says "end immediately before that pair". The test asserts exact equality with CAP-1 units. The old wording also allowed a much earlier cut. The EARS check passed with the new wording (0 rows off form, trace exit 0).

(4) User harm is stated honestly. pi-ai's sanitizeSurrogates already removes a lone half from the system prompt on the anthropic, openai-completions, openai-responses, google, bedrock and mistral providers. The openai-codex provider sends `instructions` without sanitizing; I read this in the pi 1.0.2 bundle. Every roster model on this machine uses openai-codex, so a pi seat on codex is exposed. How the server treats a lone \ud83d escape is not verified.

(5) The seat now runs the install check before the land. "A hook" in the install-check rule is ambiguous, and its real pi turn loads this extension.

Probes ran on a temp clone of the handoff-pins tip 54433844 with a made-up temp HOME. Results:
- W0 export-only: R-2160 FAIL.
- FIX: both checks pass.
- W1 always cap-1: R-189 FAIL.
- W2 toWellFormed: R-2160 FAIL.
- W3 drop on any surrogate: R-189 FAIL.
- W4 code-point cut: both FAIL.
- W5 drop only on a low surrogate: both FAIL.
- W6 no export: R-2160 FAIL.
- W8 head(cap+1).slice(cap): R-2160 FAIL.
- W7, sanitizing after the cut, passes both checks. It is equivalent on every reachable input, because the store never holds a lone surrogate.

With the fix, these stayed at exit 0: handoff-artifact, handoff-store, handoff-staleness, handoff-trust, handoff-symlink, handoff-writer-role, display-surfaces, product-report, requirements-unclaimed, map:check, readme:check and the trace scanner. After the tree regeneration, requirements-tree also passed.

Class confirmed as hook, because nana-handoff.ts is a pi extension. It cannot be ordinary.

Conflicts:
- No in-flight worktree touches nana-handoff.ts, display.mjs or handoff-artifact.test.mjs.
- notify-lifecycle-pins, pi-launch-followups, post-edit-timeout-name and win-lock-fix-command all touch REQUIREMENTS.md and docs/requirements-tree.md. These are textual conflicts only: regenerate the tree after merging main.
- realpath-strict-fallback most likely edits lib/real-path.mjs, which nana-handoff.ts does not import. I have not seen that plan, so this is inferred.
- mutation-runner-takeover-race touches the mutation runner only, so it does not overlap.
- handoff-pins is a hard dependency: it supplies the R-189 sealing and partner check, the test-file region and the two HANDOFF residual lines.

The claim most likely to be wrong: that the fix changes anything a user sees. On every provider except openai-codex, pi-ai already strips the lone half. On codex, the server's reaction is unmeasured; it may already accept or replace the escape. If so, the lane is hygiene plus the provenance note, closing two named residuals.
