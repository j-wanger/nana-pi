PASS — credential-gate-variants independent check. No MUST findings.

Each cell shows **tip/base**: **B** = credential-rule block; **A** = allowed. Bash and PowerShell agreed throughout.

| Form | Worker | Reviewer | Unset (seat) |
|---|---|---|---|
| `git credential-store --file=x get` | B/A | B/A | A/A |
| `git -c a=b credential-cache get` | B/A | B/A | A/A |
| `git-credential-cache get` | B/A | B/A | A/A |
| `git credential-cache --timeout 5 get` | B/A | B/A | A/A |
| `git -c a=b credential-store --file=x get` | B/A | B/A | A/A |
| `git --no-pager credential-cache --socket /s get` | B/A | B/A | A/A |
| `git credential-libsecret get` | B/A | B/A | A/A |
| `git-credential-store --file=x get` | B/A | B/A | A/A |
| `"C:\tools\git-credential-cache.exe" --timeout 5 get` | B/A | B/A | A/A |
| `/usr/lib/git-core/git-credential-libsecret get` | B/A | B/A | A/A |
| `git -C "C:/work tree" credential-cache get` | B/A | B/A | A/A |
| `git -c "http.extraHeader=X Y" credential-cache get` | B/A | B/A | A/A |
| `git credential-cache --timeout 5 exit` | A/A | A/A | A/A |
| `git credential-store --file=x erase` | A/A | A/A | A/A |
| `git credential-store --file=x store` | A/A | A/A | A/A |
| `git-credential-cache exit` | A/A | A/A | A/A |
| `git config credential.helper cache` | A/A | A/A | A/A |
| `git config --get credential.helper` | A/A | A/A | A/A |
| `echo "git credential-cache get"` | A/A | A/A | A/A |
| `git credential-cache --get` | A/A | A/A | A/A |
| `git credential-cache getx` | A/A | A/A | A/A |
| `git-credential-cache --get` | A/A | A/A | A/A |
| `git-credential-cache getx` | A/A | A/A | A/A |
| `git credential-store --file "get secrets" erase` | A/A | A/A | A/A |
| `git credential-store --file x erase` | A/A | A/A | A/A |
| `gh auth status` | A/A | A/A | A/A |
| `git credential-cache exit` | A/A | A/A | A/A |
| `git push` | A/A | A/A | A/A |
| `curl https://example.com` | A/A | A/A | A/A |
| `echo "git credential fill"` | A/A | A/A | A/A |
| `printf "%s" "gh auth token"` | A/A | A/A | A/A |
| `echo "curl https://api.github.com"` | A/A | A/A | A/A |
| `git credential fill` | B/B | B/B | A/A |
| `git credential get` | B/B | B/B | A/A |
| `git credential approve` | B/B | B/B | A/A |
| `git credential reject` | B/B | B/B | A/A |
| `g''it credential fill` | B/B | B/B | A/A |
| `git -c x=y credential fill` | B/B | B/B | A/A |
| `git -C repo credential reject` | B/B | B/B | A/A |
| `"C:\tools\git.exe" --no-pager credential fill` | B/B | B/B | A/A |
| `git credential-manager get` | B/B | B/B | A/A |
| `git -c x=y credential-manager get` | B/B | B/B | A/A |
| `git credential-osxkeychain get` | B/B | B/B | A/A |
| `git credential-manager-core get` | B/B | B/B | A/A |
| `git credential-cache get` | B/B | B/B | A/A |
| `git credential-store --file x get` | B/B | B/B | A/A |
| `gh auth status -t` | B/B | B/B | A/A |
| `git credential-store get` | B/B | B/B | A/A |
| `git credential-wincred get` | B/B | B/B | A/A |
| `git-credential-manager get` | B/B | B/B | A/A |
| `/usr/bin/git-credential-osxkeychain get` | B/B | B/B | A/A |
| `"C:\tools\git-credential-manager.exe" get` | B/B | B/B | A/A |
| `gh auth token` | B/B | B/B | A/A |
| `/usr/bin/gh auth token` | B/B | B/B | A/A |
| `gh auth status --show-token` | B/B | B/B | A/A |
| `security find-generic-password` | B/B | B/B | A/A |
| `security find-internet-password` | B/B | B/B | A/A |
| `cmdkey /list` | B/B | B/B | A/A |
| `vaultcmd /list` | B/B | B/B | A/A |
| `Get-StoredCredential` | B/B | B/B | A/A |
| `curl https://api.github.com/repos` | B/B | B/B | A/A |
| `wget https://api.github.com` | B/B | B/B | A/A |
| `Invoke-RestMethod https://api.github.com/repos` | B/B | B/B | A/A |
| `Invoke-WebRequest https://api.github.com` | B/B | B/B | A/A |
| `irm https://api.github.com` | B/B | B/B | A/A |
| `iwr https://api.github.com` | B/B | B/B | A/A |
| `& "C:\tools\git.exe" credential fill` | B/B | B/B | A/A |
| `& git-credential-manager get` | B/B | B/B | A/A |
| `& "Invoke-RestMethod" -Uri "https://api.github.com/repos"` | B/B | B/B | A/A |
| `git -c "a=b c" credential-store get` | B/A | B/A | A/A |
| `git-credential-store --file x get` | B/A | B/A | A/A |
| `git-credential-store get --file x` | B/B | B/B | A/A |
| `git-credential-store --file x get --other` | B/A | B/A | A/A |
| `git config --get user.name` | A/A | A/A | A/A |
| `echo getx` | A/A | A/A | A/A |
| `git commit -m "document credential-cache get"` | A/A | A/A | A/A |
| `git credential-gnome-keyring get` | B/A | B/A | A/A |
| `git credential-store --file get erase` | B/A | B/A | A/A |

## MUST findings

None. Required reads blocked for worker and reviewer. Required near misses remained allowed. The unset-role seat remained allowed throughout.

## SHOULD findings

- Confirmed declared residual: `git credential-store --file get erase` now blocks both child roles. The plan explicitly accepts this rare option-value false positive.

## Evidence

- **Tip:** `a05182133bf4812e5e10c6fdf851a558052fb9c8`
- **Base:** `origin/feat/builder-credential-strip` at `a66c0602d027b79ca170d463e05fc46402128374`
- Invoked registered gate handlers like the lane tests, using temporary HOME and permissive allowPatterns.
- Compared **78 forms, 936 decisions**, across both revisions, three roles and both tool names.
- Credential tests passed **M1, M2, M4 and M7**.
- These checks exercised Windows spellings, not a native Windows runtime.
- I executed no examined command and accessed no real credentials, keychain or user Git configuration.
- Worktree remained clean and unchanged. No commits or pushes.
- Objective served: strengthen the shared toolkit’s builder execution limits.
- Writing check ran. Its verdict, identifier and passive-voice flags remain because this brief requires a technical report and exact PASS heading.
