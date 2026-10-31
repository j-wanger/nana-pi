# Plan attack: owner-profile (2026-10-31)

Adversary: one pass over `plan.md`, the factory design, the personal-memory research, lane memory-making's plan, and the code the plan names (main `e5db630e`). The plan was read only; nothing was built. Claims marked **[inferred]** were not run.

Threat model used: honest variation in our own tools and the owner's two machines is in scope; deliberate forgery is out.

---

## MUST

### M1. A record cannot be both "every shape field in front matter" and "claim and quote in the body". `splitFrontmatter` also returns every value as a string.

- Must-meet 1 pins "its front matter carries every shape field by the imported names". O1 says `claim` and `quote` go in the body because `splitFrontmatter` strips quote marks. Those two cannot both hold, and `claim` is a shape field.
- `packages/nana-knowledge/lib/parse.ts` `splitFrontmatter` returns `Record<string,string>`. `invalidAt: null` reads back as the string `"null"`, `roles: [seat]` as `"[seat]"`, and `supersedes: []` as `"[]"`. Lane memory-making writes the same shape as JSONL with real `null` and arrays. The reviewer's check ("no second field list") passes. The two stores still disagree on every non-string value. A later upkeep reader treats `invalidAt` as truthy on every profile record.
- **Failing case:** save a record, read it back with `profile-record.mjs`, and compare it with a memory-making candidate for the same claim. `invalidAt` is `"null"` on one side and `null` on the other. `roles` is a string on one side and an array on the other.
- **Fix:** store each record as one JSON object (`records/…/….json`), the memory-making candidate shape plus `quote`, written with `JSON.stringify` and read with `parseJsonBytes`. That drops the `parse.ts` import and the cross-package `.ts` import, and it sidesteps O1. If markdown is kept, the shape module owns one `serialize` and one `parse`. A must-meet then pins a round trip: write, read, and deep-equal against a memory-making candidate object.

### M2. The remote check fails open on any remote it does not recognise as GitHub, and it never sees the remote that `save` pushes to.

- A9 checks visibility only for a "github.com remote". Any other remote prints `visibility not checked` and init goes ahead. Honest cases that read as non-GitHub:
  - an SSH host alias such as `git@github-personal:owner/nana-profile.git`, which is common when one machine has both a work and a personal GitHub account (the Windows work machine);
  - `ssh://git@ssh.github.com:443/owner/repo.git`;
  - a `pushurl` that differs from `url`.
- **Failing case:** `init --dir ~/nana-pi-wt/x/sub` on a machine whose nana-pi origin uses an SSH alias. `repoRootOf` returns the worktree, not `~/nana-pi`, so the "nana-pi checkout this CLI runs from" guard passes. The remote is "not GitHub", so init writes the marker, commits and pushes. Every later `save` commits owner quotes into a public nana-pi branch.
- The check runs once at init, and `save` pushes to whatever the push remote is now. After `git remote set-url origin <public repo>`, or after a second remote is added, saves go out unchecked.
- `gh repo view` with no repo argument resolves the repo from the remotes, and it prefers `upstream` or the `gh repo set-default` choice. It can check a different repo from the one being pushed to.
- **Fix:**
  1. Fail closed. An unrecognised host or an unanswered check refuses, unless an explicit `--unverified-remote` flag is given. Init records that flag per machine.
  2. Check the push URL (`git remote get-url --push <remote>`), parse `OWNER/REPO` out of it, and run `gh repo view OWNER/REPO --json isPrivate`.
  3. Store the verified push URL per machine in `ownerProfile.verifiedPushUrl`. `save` and `sync` refuse to push when the current push URL differs. This is a local string compare, with no network call per save.
  4. Base the nana-pi guard on `git rev-parse --git-common-dir`, or on a remote-URL match against nana-pi's own origin, so that worktrees count as nana-pi.
- Add these to must-meet 3: an SSH-alias remote refuses, a changed push URL refuses the push, and a worktree path refuses.

### M3. The plan's "cannot conflict" claim is false, and honest repeats across machines never count.

- O2 makes the ID a hash of evidence plus claim. `--evidence` is free text the seat supplies. A live Claude seat does not know its own transcript uuid, so it will invent pointers **[inferred]**. Two outcomes follow:
  - **(a) Same ID, different bytes.** The seat on both machines passes the same loose evidence for the same claim, for example `"owner, chat"`. The two files differ in `date`, `quote` or the line ending, so both sides add `records/<id>.md` with different bytes. `git pull --rebase` stops on an add/add conflict. A4's guarantee does not hold, and must-meet 4 does not test this case.
  - **(b) Different IDs, same claim.** The usual case: the pointers differ, so each machine saves its own record. The exact-claim repeat check in O4 sees only local records, so after sync two live `low` records hold the same claim. `show` prints the claim twice, and neither record ever collects the repeats it earned.
- **Fix:** make the claim the key, and make every write a new file.
  - The ID is a hash of the normalised claim only.
  - Each save is a new file `records/<id>/<stamp>-<rand>.json`. The earliest file is the record, and later files are repeats.
  - Confirm, supersede and retract are events under `events/<id>/`.
  - Two machines that save the same claim then write different paths, with no conflict, and the store counts a repeat when the trust is derived. With this layout, an `--evidence` value that is free text can never collide.
- Add a case to must-meet 4: both clones save the same claim with different quotes before either syncs. Both end clean, with one live record and one repeat.

### M4. Event and record file names must be legal on Windows.

- The plan writes `events/<id>/<stamp>-<rand>.md` and `probe/runs/<stamp>.json` and leaves `<stamp>` open. An ISO stamp from `new Date().toISOString()` contains `:`. NTFS refuses `:` in a file name.
- **Failing case:** the Mac writes `events/ab12…/2026-10-31T12:00:00.000Z-x9.md` and pushes. On the Windows machine `git pull --rebase` fails with `invalid path`, and the clone is stuck for every later sync. The CI Windows leg would not catch this, because each clone in must-meet 4 is on the same OS.
- **Fix:** seal a stamp format that is safe on every platform, such as `20261031T120000Z` or epoch milliseconds, and make it a tunable. Add one assertion to must-meet 4: every path the CLI creates matches `^[a-z0-9._/-]+$`, is at most a sealed length, and has no names that differ only in case.

### M5. Two saves at once on one machine lose a record, and a stopped rebase is not recovered.

- The threat model covers two machines in the same hour. One machine can also run two writers: a Claude seat and a pi seat, or two Claude sessions. With the delivery slice, a session-start `sync` also runs while a `save` runs in another session.
- **Failing case:** two `save`s race. One `git commit` fails with `index.lock exists`. A8 covers only push failures, so that save either exits nonzero or exits 0 having committed nothing. Its record file stays untracked. If later commits stage only their own path, the orphan is never pushed. `show` on this machine shows it and the other machine never sees it.
- A rebase that stops leaves `.git/rebase-merge`. The next `save` then commits onto a detached HEAD in the middle of the rebase.
- **Fix:**
  - Take one exclusive lock file around `save`, `confirm`, `supersede` and `sync`, with a bounded wait and a rule for breaking a stale lock. Both are sealed tunables.
  - Every commit stages the whole store folders (`git add -- records events probe`), so an orphan is picked up next time.
  - `sync` detects a stopped rebase, runs `git rebase --abort`, and reports it.
  - Retry the push once after a non-fast-forward rejection.
- Add one must-meet case: two `save` processes started together both end committed and pushed.

### M6. The trust ladder rises on the seat repeating itself, and the seat alone can make a record `high`.

- O4 counts an exact re-save of the same claim as a repeat, and `--repeat-of` counts too. Nothing requires the repeat to come from a different session or a new owner statement.
- **Failing case 1 (in one session):** the seat saves "prefers short pages" and re-saves it after a compaction, or after re-reading the conversation. With `PROFILE_MEDIUM_REPEATS = 2` the record is `medium` before the session ends, and the owner said it once.
- **Failing case 2 (a loop once delivery lands):** session start prints `show`'s output. The seat reads its own profile line, "learns" it, and saves it again, quoting the stored quote. Every session adds a repeat, and every record climbs by being loaded. This is the self-reinforcement that the CHI 2026 study measured.
- `confirm` has no condition. The seat can call it whenever it reads "ok" as a confirmation, and one confirm makes a record `high`.
- **Fix:**
  - A repeat counts only when (a) its session differs from every earlier save of that claim, using a session key the CLI derives (`CLAUDE_SESSION_ID` or pi's session file if available **[inferred]**, else the date), and (b) its quote is not byte-equal to a stored quote.
  - `confirm` requires `--quote`, the owner's own words, and the quote must differ from the record's.
  - The rule line tells the seat to confirm only on an explicit owner yes.
- Must-meet 2 then pins that three re-saves in one session leave the record `low`.

### M7. The probe's transcripts would feed fake owner turns into lane memory-making.

- A Claude Code `-p` run saves its transcript under `~/.claude/projects/<cwd-slug>/` unless persistence is turned off. The plan's empty temporary cwd on macOS is under `/var/folders/…`, so the slug is `-private-var-folders-…`. Lane memory-making's A5 skips only `-wt-` and `-private-tmp-` folders.
- **Failing case:** `nana-profile probe` runs 200 calls. Each wrong-premise prompt is written as if the owner said it. `npm run memory:make` then reads those transcripts and emits user `correction` or `decision` candidates from synthetic owner text, and the profile text appears in the same files. The two lanes contaminate each other, and memory-making's recall and precision score takes in the noise.
- pi without `--no-session` also writes a session that the desk shows.
- **Fix:**
  - Add `--no-session-persistence` (claude) and `--no-session` (pi) to the default runner. Both flags appear in `--help` on this machine.
  - Put the temporary cwd under a folder whose slug memory-making skips, or add the probe's slug to memory-making's skip list in the shared config.
  - Must-meet 7 asserts that no new file appears under a stubbed `~/.claude/projects` or pi sessions dir.

---

## SHOULD

### S1. The probe as specified cannot detect the effect it exists to catch.

- **The gate is in points; the evidence is relative.** CHI 2026 reports +33% and +45% *relative* rises in agreement. With baseline agreement at 20%, +33% gives 26.6%, a 6.6-point drop in pushback, and +45% gives 9 points. Both fall below `PROBE_DROP_POINTS = 10`, so the gate does not fire at the documented effect size.
- **Power is too low.** 20 items × 5 samples × 2 conditions gives about 100 replies per arm. The standard error of the difference is about 6 points (p≈0.2 vs 0.27). The chance of seeing a drop of 10 or more points when the true drop is 6.6 is about 28%. The chance when the true drop is 0 is about 5% **[inferred, normal approximation, ignoring item clustering, which makes it worse]**. Samples within an item are correlated, so the effective n is closer to 20 than 100.
- **A forced verdict line changes the task.** Asking for `VERDICT: PUSHBACK|AGREE` first makes the model judge the premise explicitly. That is the condition under which sycophancy is lowest. Expect both arms near the ceiling, with no room to see a drop **[inferred]**.
- **Unparsed replies can bias the rates.** If the profile says "terse", the profile arm may drop the verdict line more often. Rates over parsed replies only are then biased.
- **Fix:**
  1. Let the model answer naturally. Score each reply deterministically: each probe item carries the correct fact as sealed keywords or a regex, and a reply that states it counts as pushback. That needs no judge model and no extra spend, and it fits the repo's posture of deterministic checks over model judges.
  2. Pair by item. Report the per-item paired drop with a 90% interval (a bootstrap over items).
  3. Gate on the interval, not the point value: hold back when the interval's upper end reaches the threshold.
  4. Size the set to 40 or more items, or state the smallest drop it can detect.
  5. Fail the run when the unparsed or unscored rates differ between arms by more than a sealed margin.
- Also test the delivery slice's real combination, profile plus the fixed guard line, as a third arm. The guard line is the mitigation the plan relies on.

### S2. `claude --bare` cannot use the owner's subscription, and the default runner will bill the API or fail.

- `claude --help` on this machine reads: under `--bare`, "Anthropic auth is strictly ANTHROPIC_API_KEY or apiKeyHelper … (OAuth and keychain are never read)". The roster's Claude entry (`reviewer: claude-code opus`) runs on OAuth.
- **Failing case:** the seat runs `probe --runtime claude-code --model opus`. Every call fails with an auth error, which counts as unparsed, or it bills `ANTHROPIC_API_KEY` if one is set. Neither outcome is visible before the run, and `PROBE_MAX_CALLS` caps the call count but not the spend.
- **Fix:**
  - Pick isolation that keeps OAuth, for example `claude -p --no-session-persistence --append-system-prompt-file …` with an empty `--settings` and a cwd outside every project. Check by experiment which of CLAUDE.md, rules and auto-memory still load. Or document that the claude-code arm needs an API key, and print the estimated spend before the first call.
  - Make the isolation flags a sealed tunable list.
  - Must-meet 7 tests the property, not the flags: a fake `claude` and a fake `pi` on PATH record argv, env, stdin and cwd. In the `none` arm no store text appears in any of them. In the `profile` arm the text appears exactly once.
- For pi, `<agent-dir>/APPEND_SYSTEM.md` and `SYSTEM.md` still load under `--no-context-files` (pi docs, configuration.md, lines 19-20). Add `--no-skills`, pass `--system-prompt` explicitly, or refuse when those files exist.

### S3. Passing the profile on the command line breaks on Windows.

- An npm-installed `claude` on Windows is a `.cmd` shim **[inferred]**. Spawning it goes through `cmd.exe`, which caps a command line at 8191 characters. It also re-parses quotes, `%`, `^` and newlines in owner quotes.
- **Failing case:** a 4,000-character `show` output with quotes and newlines is passed as `--append-system-prompt <text>`. It is truncated or garbled on the Windows machine, and the profile arm silently measures a different prompt.
- **Fix:** write the profile to a 0600 temporary file and pass `--append-system-prompt-file` (claude), or a file path to `--append-system-prompt` (pi, which takes "text or file contents"). Also put the profile where the delivery slice will put it (session-start context, not the system prompt) when the runtime allows, or record the difference as a residual.

### S4. Automatic saving has no limit on volume and no undo.

- With no approval step, the plan's only controls are the trust order and the `show` budget. No cap limits saves per session or per day, or the length of a claim or a quote.
- No command retracts a wrong record. `supersede` needs a replacement record, so "drop that" from the owner cannot be carried out. The research's preferred pattern for no-approval saving is to show the save and allow an easy veto (personal.md §5, P2).
- **Failing case:** a looping seat saves 300 `low` records in an afternoon. Each save pushes. Every other `low` record leaves `show`, and the owner has no single command to remove them.
- **Fix:**
  - Add a sealed per-day save cap and claim and quote character caps, each refused with a named line.
  - Add `retract <id> --quote <owner words>`, which writes an event that hides the record.
  - The rule line tells the seat to print `Saved: <claim>` in its reply each time, so the owner can veto.
  - Superseding a `high` record requires `--quote`.

### S5. The save rule line reaches reviewers, builders and work projects.

- A12 puts the line in `nana-soul.md`, which loads in **every** Claude Code session on both machines. `claude-review.mjs` launches reviewers with plain `claude -p` and does not set `NANA_ROLE`; only `pi-worker` sets it. Claude Code builders and reviewers would read "save what you learn about the owner".
- **Failing case:** a Claude reviewer reads a brief that quotes an owner preference and saves it. The record carries a reviewer's paraphrase as a quote.
- **Failing case:** on the Windows work machine, the seat in a work project saves a work fact. The fact is then synced to a personal GitHub repo. The research flags work and personal separation as the thing users care about (§2d).
- **Fix:**
  - Put the line in `nana-seat.md`, the rule that builders and reviewers are told to skip.
  - `save` refuses when `NANA_ROLE` is set, and when the cwd is under a configured worktree root.
  - Add an optional per-machine `ownerProfile.save: false`, or a project allow-list.
  - Add a fourth owner question: "Should the seat save from sessions on your work machine or in work projects?" (default: no).

### S6. The two lanes' shape blocks do not yet agree on `source`, `evidence`, `trust` and `invalidAt`.

- **`source`:** A2b says that if this lane lands first it writes the shape block "exactly as lane memory-making's plan lists them". That plan lists only `extracted`, yet this lane needs `saved`. Memory-making also pins "the starting trust and source words". If `saved` joins a shared list, its pin breaks. If `saved` is kept separately, a second vocabulary exists.
  - **Fix:** the shape exports `SOURCE_WORDS = ['extracted','saved']`. Each lane pins only its own starting word. State this in both briefs.
- **`evidence`:** memory-making's evidence is a pointer that `resolveEvidence` resolves (`claude-code:<sessionId>#<uuid>`). A seat save's `--evidence` is free text and resolves to `missing` every time.
  - **Fix:** the CLI derives the evidence, using a sealed `seat:<runtime>:<session key>:<date>` form, with the quote as the content check, and the shape documents that this form resolves to the record's own quote.
- **`trust` and `invalidAt`:** in memory-making these fields are the record's state. Here they stay `low` and `null` forever while the effective values are derived from events. A later upkeep or delivery reader that reads the fields directly treats a confirmed record as `low` and a superseded one as live.
  - **Fix:** document in the shape module that stored `trust` is the trust at write time and `invalidAt` is the time set at write. Export a single `effectiveState(record, events)` from the profile store as the only reader.

### S7. Line endings differ on Windows.

- Git for Windows defaults to `core.autocrlf=true`. Records committed on the Mac are checked out with CRLF on Windows. The normalised-claim compare, the quote compare in M6 and any content hash then differ by `\r` unless every reader normalises.
- **Fix:** init writes `.gitattributes` with `* -text`, or `* text eol=lf`, so the bytes are identical on both machines. Must-meet 4 sets `core.autocrlf=true` on one clone.

### S8. Concurrent supersedes need a defined outcome.

- **Failing case:** the Mac supersedes X with Y1 and Windows supersedes X with Y2, both offline. After sync, Y1 and Y2 are both live and contradict each other, with nothing flagged.
- **Failing case:** A supersedes B on one machine and B supersedes A on the other. Under "a superseded record is never shown", both vanish.
- **Fix:** a record is hidden only by a live superseder, and the newest stamp wins a cycle. `show` prints one marked line when two live records supersede the same ID. Add both cases to must-meet 2 or 5.

### S9. The gh check refuses the Windows machine if gh is missing there.

- "gh missing" is in the threat model, and A9 refuses an unanswered check. So a Windows machine without `gh` can never run init, although the repo is private.
- **Fix:** keep M2's fail-closed rule, and allow an explicit `--unverified-remote` that is recorded per machine. Or accept a push URL whose `OWNER/REPO` matches the repo that another machine verified, recorded in the marker. Must-meet 3 pins both the refusal and the override.

---

## NOTE

- **N1. Tunables missing from O5.** O5 does not list these, and each will otherwise become an inline literal:
  - the `not pushed:` prefix and the refusal lines;
  - the accepted remote hosts;
  - the probe condition names `none` and `profile`;
  - the verdict tokens;
  - the runner flag lists;
  - the `saved` source word;
  - the stamp format;
  - the lock wait;
  - the push retry count;
  - the claim, quote and per-day caps.
- **N2. `not pushed:` reasons.** They should be classified words (`offline`, `auth`, `rejected`), not raw git stderr. Raw stderr carries the private repo's URL and the home path, and the seat may copy a report line into a public issue.
- **N3. Keep the helper move lazy.** `nana-roster.mjs` loads `roster-set.mjs` only through a dynamic `import()` inside `set`. The session-start roster hook and `claude-review` load `nana-roster.mjs`. The new `pack-config-write.mjs` must stay behind that dynamic import, never a static import in `nana-roster.mjs`, so a fault in it cannot break the hook or the review launcher. Add one pin: `init` writes the pointer when `roster` is absent, without calling `resolveRoster`.
- **N4. Must-meet 7 restates the implementation.** It pins flags (`--bare`, `--no-tools`). The property that matters is "no store text reaches the `none` arm". See S2 for a test of the property. Keep the flag list as a sealed tunable and pin it once.
- **N5. A misattributed quote is honest variation, not forgery.** The seat may quote text from a tool result or a GitHub issue reply by someone else as "the owner's words". The quote rule does not catch this. It is the main honest route by which wrong records enter, so add it to the threat model's in-scope list and the known-bug line. M6's session rule and the "Saved:" line in S4 bound it.
- **N6. The first real probe needs a real profile.** With only a few records, `show` prints little, and the probe measures almost nothing. Run it once the profile holds the planned move of today's owner entries, or say the first run is a check that the runner works.
- **N7. A symlinked config file.** If an owner has hand-linked `nana-pack.json` into a dotfiles repo, `realpathSync` makes init write the clone path, which contains the home folder name, into that repo. `roster set` does the same today, so this is not new. Name it in the pack README contract notes.
- **N8. Lane class.** `ordinary` is what the script prints and is defensible: no hook, extension, gate or install file is touched. But the rule line changes what every Claude session does, and that change goes live as soon as the lane lands, through the symlink on macOS. If S5 moves the line to `nana-seat.md` with the `NANA_ROLE` guard, ordinary is fine. If the line stays in `nana-soul.md`, the seat should treat it like a hook change and get one independent check.
