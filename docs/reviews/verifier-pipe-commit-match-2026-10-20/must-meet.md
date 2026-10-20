# verifier-pipe-commit-match — must-meet (adversary-amended)

Feature: FEAT-010 · Guard risky commands and protected resources
Behaviour: the verifier-pipe guard asks only when something reads a masking pipeline's exit status before a later git commit, and it recognises git however it is spelled. When a `;`, a newline or a background `&` discards that status, it no longer asks.
Class: install, hook or gate. The shared predicate sits behind the Claude Code PreToolUse hook and the pi nana-gate, and the install check's sealed PowerShell sample changes. Full ladder plus the local macOS install check.
Threat model: honest variation in how models and shells spell a command is in scope: separators, git spellings, letter case, quoting, CRLF. Deliberate evasion is out (eval, aliases, functions, variables, a later call), as R-982 declared. The sandbox is the boundary, and a finding outside this model is a residual.

## Design
- Only `packages/nana-pack/lib/pipe-guard.mjs` changes behaviour. nana-gate.ts and verifier-hook.mjs keep calling `verifierPipeReason(command, dialect)`.
- Commit finder: `git` or `git.exe` in any letter case. Its left neighbour is the text start, whitespace, one of ``; & | ( ) { } ` ``, `/` or `\`. Option skipping stays as today. `my-git`, `legit` and `git-lfs` do not match.
- Status reader: one forward scan per pipeline, from its first pipe, at bracket depth 0. `|&` is a pipe.
  - `&&` or `||` reads the status.
  - An unmatched `)` or `}` ends the pipeline's group and is passed over. The scan goes on with the group's status.
  - At `;`, LF or CR: skip whitespace, `;` and line ends. Then take the first of these that applies:
    - an unmatched `)` or `}`, or a bash `fi`, `done` or `esac`, is passed over and the scan goes on;
    - a next `&&`, `||` or bash `then`/`do` reads the status;
    - a `$?` in the next command (up to its next `;`, line end, `&&` or `||`) reads the status;
    - otherwise the status is discarded.
  - A bash `&` not glued to `<` or `>` backgrounds the pipeline, which discards the status. In PowerShell, `&` never ends a pipeline.
  - A live bash errexit set before the pipe reads the status: `set -<letters with e>` or `set -o errexit`.
- Live-text exposures. The lexers otherwise stay as they are.
  - A bash `$?` inside double quotes stays live.
  - A quoted string with no `$(` or backtick, whose whole content is a path ending in `git` or `git.exe`, shows as its last segment. This holds in either dialect and for either quote kind.
  - powerShellSpans output does not change.
- The reader words, closer keywords and errexit spellings are named constants with `// contract: R-2351` provenance, as gate-rm-inside does.
- Unchanged: the exact leading pipefail exemption, PowerShell pipefail treated as inactive, quoted heredoc bodies skipped, and the reason text.
- Linear cost: each pipeline is scanned once, plus its next command.
- Rows: R-982 is retired, superseded by R-2350–R-2354. R-983, R-984, R-1054, R-1062, R-1064, R-1733–R-1739 and R-2004 keep their meaning. Their test commands move from `;` or a newline to `&&`, so each case still asks exactly when its pipe is live. R-1064 is reworded. The install check's sealed PowerShell sample moves to `&&`.
- Adversary prototype, 2026-10-20, in a temp copy of main 72abe19a:
  - Every listed shape gave the result this design specifies.
  - On 8 days of local transcripts (2,820 unique commands with a pipe and "commit"): 402 ask today, 141 under the first plan, 118 under this design, and 0 ask where today does not.

## Must-meet
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-2350 | WHEN a `;`, a newline or a bash background `&` discards the exit status of every masking pipeline before a git commit, the verifier-pipe predicate shall return null in the bash and PowerShell dialects. | `packages/nana-pack/tests/pipe-guard.test.mjs::discarded status: ${name}` | Red: all 11 ask on main (probe). Bash: `;`, LF, `; git add -A &&`, `&`, `echo "$(git log \| head)";`, `; x; echo $?;`, `; pnpm check >/dev/null 2>&1; echo "check $?";` and `for f in a b; do P; done;`. PowerShell: `;`, LF and CRLF. The two `$?` cases also ask under the first plan. |
| R-2351 | WHEN `&&`, `\|\|`, a following bash `then` or `do`, a `$?` in the next command, or bash errexit set before the pipeline reads a masking pipeline's exit status, directly or through the group or loop the pipeline ends, and a git commit follows, the verifier-pipe predicate shall return the verifier-pipe reason unless the leading pipefail exemption applies. | `packages/nana-pack/tests/pipe-guard.test.mjs::consumed status: ${name}` | A pin, green today: any pipe asks today. Cases: `npm test 2>&1 \| tail -5 &&`, `\|\| exit 1;`, if/then, while/do, until/do, `set -e`, `set -o errexit`, `if [ $? -eq 0 ]`, `[ "$?" = 0 ] &&`, `rc=$?;`, `{ P; } &&`, `{ P; } 2>&1 &&`, `(P) &&`, `out=$(P) &&`, `\|&`, `do P; done &&` and `then P; fi &&`. PowerShell: `&&`, `; if ($?) {…}` and `\|\| exit 1;`. The cases `{ P; } 2>&1 &&`, `done &&` and `fi &&` are red under the first plan (probe). |
| R-2352 | WHEN a masking pipeline's exit status is read before a git commit, the verifier-pipe predicate shall recognise git written as `git` or `git.exe` in any letter case, bare, behind a directory path, as one quoted word, after PowerShell's `&` call operator, or opening a bash backtick substitution. | `packages/nana-pack/tests/pipe-guard.test.mjs::git spelling: ${name}` | Red: 13 of 14 give no reason on main (probe). Bash: `git.exe`, `GIT.EXE`, `Git.Exe`, `/mingw64/bin/git.exe`, `"git"`, `'/c/Program Files/Git/cmd/git.exe'` and `"…git.exe" -C repo`. PowerShell: `git.exe`, `GIT.exe`, `& "C:\Program Files\Git\cmd\git.exe"`, `& '…git.exe'`, `& "$env:ProgramFiles\Git\cmd\git.exe"` and `C:\Git\cmd\git.exe`. The bash `` echo `git commit` `` case asks today and is red under the first plan's finder. |
| R-2353 | The verifier-pipe predicate shall return null for a `git` or `git.exe` call without the `commit` subcommand and for a program whose name merely ends in or contains `git`, such as `legit` or `my-git`, followed by the word `commit`. | `packages/nana-pack/tests/pipe-guard.test.mjs::not a commit: ${name}` | Partly red: `&& my-git commit` asks on main. The other six pin against a looser finder: `git.exe status` in bash and in PowerShell, `legit commit`, `echo commit`, `git-lfs commit`, and `echo "git status" commit`. |
| R-2354 | The verifier-pipe predicate shall exempt a command only when its first command is exactly `set -o pipefail` or `set -<letters ending in o> pipefail` followed by `;`, `&&` or a newline with no later `set +o pipefail`, treat PowerShell pipefail as inactive, skip only quoted heredoc bodies, and leave unmatched a command reached through a later call, the sandbox being the boundary. | `packages/nana-pack/tests/pipe-guard.test.mjs::predicate table: ${name}` (R-982's old table, with cases about something else moved to `&&`), and `packages/nana-setup/tests/verifier-pipe.test.mjs::both READMEs declare the literal-text later-call gap and the sandbox boundary` | A pin, green today: this row restates what R-982 kept. |
| R-2355 | WHEN the installed Claude Code verifier hook receives a Bash event, it shall abstain with empty stdout and stderr where a `;` discards the masking pipeline's status before `git commit`, and print exactly one ask line where `&&` reads it before `git.exe commit`. | `packages/nana-setup/tests/verifier-pipe.test.mjs::installed hook abstains on a discarded pipeline status and asks on git.exe commit` | Red: on main the predicate asks for `git status \| wc -l; git commit -m x` and gives nothing for `npm test \| tail -5 && git.exe commit -m x`. It runs on every platform, through exec-form args[0] on win32. |
| R-2356 | The pack and setup READMEs shall state that the verifier-pipe guard prompts only when a masked pipeline's exit status can reach the commit, that a `;` or newline that discards it does not prompt, and that `git.exe` and path spellings count as git. | `packages/nana-setup/tests/verifier-pipe.test.mjs::both READMEs declare which pipelines the verifier-pipe guard asks on` | Red: both guard lines say "pipelines output before `git commit`". They match none of /a `;` or a newline/, /does not prompt/, /`git\.exe`/ and /path/. |
| R-2357 | WHEN a headless pi session calls the bash or powershell tool with a command in which a `;` discards a masking pipeline's exit status before `git commit`, the nana-gate shall let the call run. | `packages/nana-pack/tests/pipe-guard.test.mjs::pi headless gate lets a discarded pipeline status reach git commit` | Red: on main the gate blocks `git status --short \| head -3; git commit -m done` (bash) and its `Select-Object -First 3` form (powershell) with the verifier-pipe reason (probe). |

## Known limits (residuals)
- Still asks, although the status read cannot change the path:
  - `P \|\| true; git commit`, `P && echo ok; git commit` and `P; echo "exit $?"; git commit`.
  - `P \| while read l; do …; done; git commit` and `for f in $(P); do …`.
  - `echo "$(P)" && git commit`, where `&&` reads echo's status.
  - errexit that a later command turns off.
- Not asked:
  - a pipeline that ends an `if` branch before `else` or `elif`;
  - a `$?` read after another command;
  - PowerShell `if (P)`, which reads output, not status;
  - `$GIT commit` and `"$(which git)" commit`;
  - PowerShell `$LASTEXITCODE`, which keeps the native code and so is not masked;
  - `P \| git commit -F -`, where the commit is inside the pipeline.
- Relief is about 70%, not the scout's 97%. Of 402 asking commands in 8 days, 118 still ask by design. Most are `… \| head -3 && …` chains (76) and `git archive \| tar -x && …` copies (about 25). Narrowing by the pipe's right-hand program is a separate decision for the owner.
- PowerShell `&&` and `$?` follow the existing dialect design, which treats a pipe as masking. Windows PowerShell 5.1 has no `&&`, so there the guard asks only on the `$?` shapes.
- The span oracle needs pwsh, which is absent on this Mac. It runs on CI's three legs.
- R-1064's Windows evidence goes stale once its commands change. The seat re-reads the Windows CI leg and updates that evidence cell.