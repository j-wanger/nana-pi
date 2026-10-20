# Independent check — verifier-pipe-commit-match at c2d0dcb4 (2026-10-20)

VERDICT: FINDINGS

**Setup.** I cloned the lane worktree into a private temp folder and checked out c2d0dcb4. I used a temp HOME and did not edit the lane worktree, main or ~/.claude. I compared three versions of the predicate side by side: main (9552afb1), build 3 (ad08d901) and build 4 (c2d0dcb4). The pwsh lexer config is identical in all three. I drove the repository hook from the clone with PreToolUse JSON on stdin, both on the tip and on a main checkout at 9552afb1. I drove the headless pi gate by loading `nana-gate.ts` under `node --experimental-strip-types` with `hasUI:false`.

**Lane test files, run singly at c2d0dcb4.** All five pass:
- `pipe-guard.test.mjs`: 194 pass
- `pipe-guard-pwsh-oracle.test.mjs`: 38 pass, 2 skip (pwsh is not installed here)
- `gate-corpus.test.mjs`: 227 pass
- `verifier-pipe.test.mjs`: 31 pass
- `install-check.test.mjs`: 129 pass

**Probes.** Each line reads predicate outcome main → build 3 → build 4. For the first five, hook and gate results are shown as tip / main.
- The three earlier fail-opens are closed in all three layers:
  - `npm test | tail -5 && \git commit -m x`: ASK → null → ASK. Hook: ask / ask. Gate: BLOCK / BLOCK.
  - `(set -e; npm test | tail -5; git commit -m x)`: ASK → null → ASK. Hook: ask / ask. Gate: BLOCK / BLOCK. The `$(set -e; …)` and `( set -o errexit; … )` forms are also ASK on build 4.
  - `cat <<\EOF⏎don't⏎EOF⏎npm test | tail -5 && git commit -m x`: ASK → null → ASK. Hook: ask / ask. Gate: BLOCK / BLOCK. The `<<-\EOF` and CRLF variants are also ASK.
- Reverse heredoc shape, `cat <<\EOF⏎npm test | tail && git commit⏎EOF⏎git commit -m x`: null → ASK → null. Hook: abstain / abstain. Gate: run / run.
- Controls: `npm test | tail -5; git commit` is ASK on main and null on the tip (the intended narrowing). The `&& git.exe commit` form is null on main and ask/BLOCK on the tip.
- Escaped operators outside quotes:
  - `\|`, `\;`, `\&`, `\"`, `\'`, `\(`/`\)`, `\#` next to a real pipe with `&&`: ASK → ASK → ASK.
  - Main asks and the tip says null, all correct by bash:
    - `echo a \| b && git commit`: there is no real pipe.
    - `npm test | tail -5 \; git commit` and `\& git commit`: the operator is a literal argument, so no commit runs.
    - `\$?`: a literal string.
    - `tail -5 \\; git commit`: a real `;` discards the status.
  - A trailing backslash: ASK → ASK → ASK.
- Escaped backslash before an operator: `\\|` and `\\&&` are ASK → ASK → ASK.
- Escapes next to git spellings:
  - `\/usr/bin/git`: ASK → ASK → ASK.
  - `/usr/bin/\git` and `\git -C . commit`: ASK → null → ASK.
  - `git \commit` and `\git.exe`: null → null → ASK.
  - `g\it`, `gi\t`, `git co\mmit`, `\g\i\t`: null on all three (shared gap, not against main).
  - `git\ commit`: null → ASK → ASK (bash runs no commit here, so the tip over-asks).
- Heredocs:
  - `<<\EOF`, `<<-\EOF`, `<<'EOF'`, `<<"EOF"`, `<<EOF` with a pipe and `&&` in the body, then a real pipe, `&&` and commit: ASK on all three.
  - Body-only pipe followed by a bare commit: `<<\EOF` and `<<-\EOF` are null → ASK → null. `<<'EOF'` is null on all three. `<<EOF` is ASK on all three.
  - `git commit -m "$(cat <<'EOF' … don't … EOF)"`, `-F - <<\EOF` and `-F - <<'EOF'`: ASK on all three.
  - `<<\EOF > file` and `<<\EOF | tee`: null on all three (a shared marker gap).
- `$'…'` strings:
  - `$'a\tb'` and `-m $'l1\nl2'`: ASK on all three.
  - `$'don\'t'`: null on all three (shared gap).
- CRLF:
  - `&&⏎` and `\git` after CRLF: ASK on all three.
  - Backslash-CRLF and backslash-LF continuations: ASK on all three.
  - A plain CRLF separator: ASK → null → null, which matches bash.
- PowerShell with backslash paths (`C:\repo\git.exe`, `"C:\Program Files\Git\cmd\git.exe"`, `C:\tools\git.exe`, `git -C C:\repo\ commit`, `cd C:\repo\;`): build 3 and build 4 agree on every case, and no path backslash is treated as an escape. The `git.exe` forms are null on main and ASK on the tip. A discarded status (`; C:\repo\git.exe commit`) is null on all three.
- PowerShell differential fuzz, build 3 against build 4, 200,000 strings: 0 differences.
- 64 KB timing, predicate only:
  - Honest bash and PowerShell shapes take 3 to 13 ms in all three versions.
  - `a|(;` takes 6 to 11 ms on build 4. Main throws a stack overflow on the PowerShell `a|(;` shape.
  - Through the hook process, both honest 64 KB shapes take 45 ms on the tip and 41 to 43 ms on main.
- Slow input that predates the lane: a 64 KB double-quoted run of escaped backticks takes about 2.8 s through the hook and up to 4.9 s in-process on all three versions. It does not change between versions, and it is adversarial input.

**Findings.** None reaches MUST.
1. **Known bug, new in build 4: a `set +e` inside a subshell switches errexit off for the outer command.** Accepting `(` before `set` means `(set +e …)` and `$(set +e …)` count, but in bash a subshell's errexit change never reaches the outer shell. Example: `set -e; (set +e; make lint); npm test | tail -5; git commit -m x` is ASK → ASK → null. The hook abstains and the gate lets it run, while main asks and blocks. With stub commands, real bash showed the outer shell still has `-e` and runs the commit after a masked failure, while `set -o pipefail` stops it. The `$(set +e …)` and `( set +o errexit …)` forms behave the same. A real-bash fuzz found 63 such cases across four seeds, and every one was this shape. Frequency: 0 of 110,280 unique Bash commands in the local Claude Code transcripts (my search's only hits were this lane's own probes), and 0 in pi sessions. Fix: accept `(` as an opener only for `-e` and `-o errexit`, not for `+`.
2. **Known bug, present since build 3 (build 4 unchanged): a double-quoted string ending in an escaped backslash breaks quote tracking.** The double-quote close rule does not count an escaped backslash, which is shared with main. `echo "a\\"; echo "b\\"; npm test | tail -5 && git commit -m x` is ASK → null → null. Main asked only because its opener rule refuses a quote right after a backslash. With a single such string all three return null. Frequency: 0 real commit commands with this shape reading a status.
3. **Corpus replay, read-only.** I replayed 4,886 unique real commands that contain both git and commit through all three versions:
   - 4,180 are null everywhere.
   - 240 ask everywhere.
   - 466 asked on main and are null on build 3 and build 4.
   - Build 3 and build 4 differ on none of them.
   - A static check of the 466 found no `&&` or `||` after a pipe stage, no errexit, and no `$?`, `then` or `do` reading a pipeline's status. All of them are statuses discarded by `;`, a newline or a command substitution, which is the intended narrowing.
   - The slowest real command took 6.9 ms across all three versions.

I removed the clone and its temp HOME at the end, and the folder no longer exists. The lane worktree's tip has since moved to a7c90767 (the seat's own commit, not mine); I made no edits there.
