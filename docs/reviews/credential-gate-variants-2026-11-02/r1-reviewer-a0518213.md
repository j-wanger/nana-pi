I reviewed the lane change `7d5f8ea4..a0518213`. That is the same diff as `origin/feat/builder-credential-strip...HEAD`, because the three-dot form diffs from the merge base 7d5f8ea4. builder-credential-strip landed on main (a66c0602) during this review. The gate files on main match 7d5f8ea4, so "main today" below means that floor. The branch still needs its merge of main before it lands.

**Answer to the question.** Yes, every named variant and the quoted-path forms are now refused. The near misses stay allowed, and with no role set the credential rule never fires. One SHOULD stands, a narrow regression in a form outside the threat model (below). No harm from the review standard stands.

## What I ran

- `node packages/nana-pack/tests/credential-gate.test.mjs` passes M1, M2, M4 and M7, exit 0.
- PR #328's CI on a0518213 is green: all three suite legs and all four install-check legs.
- The seat pairs (`seat-mutate.txt`) are 6 of 6 red, each turning M1 or M2 red on its own, not only M7. With the placeholder or the widened patterns removed, M1 and M2 go red.
- I ran the real extension from 7d5f8ea4 and from the tip side by side, from a temp folder, on 50 commands. I covered worker, reviewer and no role, bash and PowerShell, and ran with and without allowPatterns.
  - **The four forms from round 3, plus quoted paths, go from allowed to refused for both roles and tools.** The quoted-path forms tested:
    - `"C:\Program Files\Git\cmd\git.exe" -C "C:\My Repo" credential-wincred get`
    - `git --git-dir "C:/a b/.git" credential fill`
    - `git -c 'credential.helper=store --file x' credential fill`
    - `git credential-store --file "C:/Users/a b/.git-credentials" get`
    - `echo … | git-credential-store --file ~/.git-credentials get`
    - `sh -c 'git credential-store --file=x get'`
    - `git credential-gnome-keyring get`
  - **Still refused:** `& "C:\Program Files\…\git-credential-manager.exe" get`, `& "C:\Program Files\GitHub CLI\gh.exe" auth token`, `env GIT_TRACE=1 …`, `sudo -u me …`, `bash -c`, `cmd /c`, `powershell -Command` and `pwsh -c` wrappers. The curl and Invoke-RestMethod forms with quoted headers or bodies are also still refused.
  - **Still allowed:** `--get`, `getx`, `erase`, `store`, `exit`, `git config --get credential.helper`, plain `gh auth status`, `git commit -m "git credential-cache get"` and `git log --grep "credential get"`.
  - **No role:** the credential rule never fires. The only block is the existing `sudo` danger rule, the same as on main.
- `git credential-store --file get erase` is now refused. That is the A3 residual the plan accepts.
- Timing: up to 24 repeated `-c` options, and a dashed-helper command about 80,000 characters long, each matched in about 1 ms on both versions. The new patterns add no measurable cost.

## Findings

**SHOULD — `nana-gate.ts:152-153`: the placeholder also seals the command word, so a quoted command string is no longer matched.**
- **What changed:** after a wrapper that the nesting check misses, the command word is the whole quoted string. These commands are refused on main and allowed on the tip, for worker and reviewer on both tools:
  - `powershell "gh auth token"`
  - `powershell -NoProfile "gh auth token"`
  - `powershell -NoProfile "git credential fill"`
  - `pwsh -NoProfile "gh auth token"`
- **Consequence:** Windows PowerShell 5.1 runs a positional argument as a command, so the three `powershell` forms really do read the token. The environment strip resets git helpers but does nothing about gh's own login.
- **Why it is not a MUST:**
  - It is a nested-shell string the segmenter cannot see, which the plan's threat model puts out of scope.
  - Main caught it only by accident: any `/` in the string already defeats it, e.g. `powershell "cmdkey /list"`.
  - No test pins it.
  - The usual honest forms (`-Command`, `-c`) are still refused.
- **Fix:** seal only `words.slice(index + 1)` and leave `base(words[index])` as it is. Add `powershell -NoProfile "gh auth token"` to M1.
- `env "gh auth token"` also changed from refused to allowed. That change is correct, because `env` cannot run that string as a command.

**NOTE — the long-command cost line.** The new known-bug line about a whole-gate probe taking over 30 s is accurate as written. My timing rules out both the new patterns and the shared option prefix as the cause.

**NOTE — the plan's promised R-3663 edit.** The plan says R-3663's evidence will name the new forms. R-3663 is unchanged; R-3685, R-3686 and the rewritten R-3667 carry those forms instead. Only the bookkeeping is affected.

VERDICT: LAND
