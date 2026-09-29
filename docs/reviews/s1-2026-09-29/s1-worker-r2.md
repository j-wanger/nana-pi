All three MUSTs are fixed and committed as **`1fcd0c6`** on `lane/s1-sanitization`. `env -u NANA_HANDOFF npm test` exits 0 and the gate makes the same decisions as before.

**MUST 1 — the warning as the person sees it** (a warning-level notification when the handoff is written):
> handoff written to ~/.pi/agent/handoffs/<hash>.md, but this directory's name contains characters that cannot be recorded losslessly — a future session here will not pick it up automatically

- A journal event, `handoff_cwd_unrecordable`, is written at the same time. It carries the path and the rendered `recorded` value, which is the same value the later pickup refusal logs.
- To decide whether to warn, the code parses the file text it just wrote and compares the `Cwd:` it reads back with the real directory. So it warns in exactly the cases pickup will refuse, including a trailing-space directory name.
- Tests cover: the exact warning text, one line and no control characters, the file still on disk, the journal event, a trailing-space directory, a clean directory getting the plain notice, and a custom `handoff.path` from the same hostile directory not warning (and being picked up).

**MUST 2 — the approval dialog for the path `…/x\n## FORGED\e[2J\u202Egnp/.ssh/id_rsa`:**
- **Before:** `truncate(subject,400)` put the raw newline, ESC and bidi characters into the dialog, which forged a `## FORGED` line.
- **After:** `  "…/x\u000A## FORGED\u001B[2J\u202Egnp/.ssh/id_rsa"`, escaped on one line. A command subject goes through `displayText`, and a command over 400 characters now shows a visible `…`. The label, reason and tool name in the dialog are also rendered.
- **Decision proof:**
  - The tests assert the exact results: Block returns `{"block":true,"reason":"nana-gate: blocked by user"}`, "Allow once" returns `undefined`, and the headless fail-closed reason is unchanged.
  - I also compared the old gate (from `d52fd37`) with the new one: 1038 call×mode pairs, **0 decisions differ**. The script is `/tmp/s1diff/diff.mjs`. It is not committed.

**MUST 3 — `packages/nana-pack/README.md`:**
- The guarantee is now stated as structural protection for interpolated display fields, not "sanitized model context".
- It names the exceptions: the summary body is injected raw (capped at 8000 UTF-16 code units), and journal JSON is not handled by the renderers.
- It names what is out of scope: `apps/**`, `nana-knowledge` (`clean()` and `hook.ts:93`), the shell fallback in `nana-objective.sh`, and external consumers.
- The locator marker wording is corrected.
- It says the refusal count is the reader's only: the producer drops unprintable roots before journalling them. A test name that claimed "refused and counted" now says so too.

**`npm test`:** 82 files, 81 pass, 0 fail, 1 skip; 5098 checks pass (log: `/tmp/s1diff/npmtest.log`). The objective goldens (`objective-golden.test.mjs`, 1071 pass) are unchanged, and `lib/` is unchanged since `d52fd37`, so `displayPath` and `displayText` are untouched.

**`git diff --stat d52fd37`:** README +31/−5, `nana-gate.ts` +6/−5, `nana-handoff.ts` +16/−6, `display-surfaces.test.mjs` +74/−1. Outside tests that is 3 files, +53/−16, within the 4-file / 150-line limit. Only allowlisted files changed; the gate change is to the dialog string only (the unused `truncate` helper was removed).

**Residuals:**
- Legitimate multi-line commands (heredocs, `\`-continued lines) now appear flattened onto one line in the dialog. That is 12 of the calls, 24 dialog texts, all display-only.
- No versioned lossless `Cwd:` encoding; `nana-knowledge`, the desk and external consumers are still carried.

**Claim most likely wrong:** the README's list of affected directories. It is derived from `displayText` plus the reader's trim, not tested against real directory names on each platform. On macOS a directory containing a lone surrogate may not even be creatable, and I did not test Windows.

VERDICT: DONE
