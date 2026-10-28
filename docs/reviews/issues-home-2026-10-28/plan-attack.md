# issues-home · plan attack (one adversary, 2026-10-28)

Verdict: two MUST findings. Both come from one gap: the must-meets test an injected read, so a build can pass while its real gh call or its real time limit fails the purpose.

- **The real query is not pinned.** With repeated `--label` gh runs an AND search, so no issue matches. Its default limit of 30 sits at about the size of the migrated set. `-R owner/repo` follows GH_HOST to another server.
- **The bounded read is not tested end to end.** The launcher's timeout wraps the whole producer child, not just gh. The fake-gh precedent skips Windows, the platform the plan names as most likely wrong. A seam that works on every OS already exists: ci-records' `ghFromEnvironment`.

Assumption checks:
- **D1 holds.** The frontier checker and the asks reader read list items only (frontier-check.mjs:48-56, markdown-list-sections.mjs:58-61). product-report.mjs:659-663 accepts zero asks. R-2503 needs only one sentence of three or more words in each live section.
- **D2 holds only for a plain list.** I measured 0.27-0.42 s for an author-only list and 0.40-0.87 s for any label or search query, on this Mac. Windows is unmeasured.
- **D3 is partly verified.** The repo is public, the viewer is ADMIN and there are no issue templates. The label-rights claim comes from my memory of GitHub's docs, which I did not fetch. The author filter holds alone, except for repos owned by an organization.
- **D4 holds.** The role check is at frontier-summary.mjs:65, and pi-worker and REVIEWER_CHILD_ENV set NANA_ROLE.
- **D5 holds.** The product page will show "Asks: 0".
- **D6 holds.** The scan covers four name words of lengths 4, 5, 4 and 3. The GitHub handle is already in 223 tracked files, so the pointer URL leaks nothing new.

Precedent paths all exist, with three problems. githubRepoOf cannot parse an /issues URL. ci-records' ghResult is private and has no timeout class. ghDefault has a third caller in scripts/ci-records.mjs, plus tests that call it through nana-land.

The forecast misses these breaks: the R-682 soul phrase pin, the R-859 rule that AGENTS.md matches the shared file byte for byte (which also makes every adopted project's AGENTS.md stale), and a suite that stays red because the seat, not the builder, edits HANDOFF.

On the owner's privacy:
- The repo is public. Future asks would go to issues with no review and no identity scan, and the owner's replies would be public.
- The edge-screener line has no destination once it leaves HANDOFF.
- The pinned issue's counts are a hand-kept second copy of the known-bug files.
- Leaving Next list lines beside next-labelled issues keeps two homes.

Read-only note: I accidentally wrote five small timing files under /tmp/claude-501 (t.1 to t.5). I left them in place; nothing in the repo changed.

## 1. MUST · Must-meets 1 and 2 against the real gh query

**Problem.** The forecast injects the read, so every must-meet passes on a build whose real gh call returns the wrong set. Three honest failures stay invisible. (a) `--label ask --label next` is an AND search, so no issue matches. (b) gh's default limit of 30 silently truncates, and the migration creates about 30 open issues by the owner: 29 Open lines plus 3 Next lines, less the drops, plus the pinned issue. (c) `-R owner/repo` follows GH_HOST, so a machine with GH_HOST set, such as a work machine, queries the wrong server.

**Fix.** Pin one call in a must-meet: `gh issue list -R github.com/<owner>/<repo> --state open --author <owner> --json number,title,labels,author,createdAt --limit <sealed fetch cap>`. Filter labels and author again on the returned rows. When the row count reaches the cap, the block says the list may be longer. The test asserts the default runner's argv and feeds it an unfiltered response. An author-only query also avoids the search API and its 30-per-minute limit.

**Evidence.** `GH_DEBUG=api gh issue list -R github.com/j-wanger/nana-pi --label ask --label next` sent the search query "label:ask label:next repo:j-wanger/nana-pi state:open type:issue", which is AND. `gh issue list --help` says "-L, --limit int Maximum number of issues to fetch (default 30)". `GH_HOST=example.invalid gh issue list -R j-wanger/nana-pi` printed "Error connecting to example.invalid", while `-R github.com/j-wanger/nana-pi` returned []. HANDOFF.md:23-51 holds 29 Open lines. Timings on this Mac with zero issues: the author-only list took 0.27-0.42 s, and any --label or --search query took 0.40-0.87 s.

## 2. MUST · Must-meet 4: the bounded read and the hook launcher

**Problem.** The limit that matters is the launcher's spawnSync timeout around the whole producer child: node start, HANDOFF read, gh, render and write. An injected-reader test cannot see that limit. The launcher computes the limit after the hook entry has fixed the args. The child might get a static --limit-ms, or might not subtract its own elapsed time and a write reserve. Either way the launcher kills it and prints 'FRONTIER UNAVAILABLE: producer failed', the lost block MM4 forbids. The precedent fake-gh timeout tests skip Windows, the platform the plan names as most likely wrong. The moved ghDefault defaults to a 30 s timeout, so a caller that omits its own limit overruns the 2,500 ms cap.

**Fix.** runHookProducer appends the limit it computed (`--limit-ms <limit>`) for any definition that opts in. The child budgets gh as min(sealed limit, limit-ms - performance.now() - reserve), and the reserve is a second sealed tunable. gh-runner takes no default timeout. MM4's test runs the real objective hook with R-2672's late-start preload and a fake gh that sleeps past the limit, on all three OSes. Route the fake through a command seam like ci-records' ghFromEnvironment, moved into gh-runner.mjs and named as a move. The test asserts the block keeps the Next lines, the one failure line and the check line.

**Evidence.** hook-producer.mjs:59 computes the limit, and :62 calls spawnSync(..., {timeout: limit}). nana-objective.mjs:18 fixes the args before that. frontier-summary.mjs:64 is synchronous. land.test.mjs:591 and :666 guard their fake-gh cases with `if (process.platform !== "win32")`. ghDefault defaults to CI_READ_TIMEOUT_MS = 30_000 (land-config.mjs:27; nana-land.mjs:37). A seam that works on every OS already exists: scripts/ci-records.mjs:19-30 `ghFromEnvironment` reads NANA_CI_RECORDS_GH_COMMAND (suite-records-config.mjs:71, R-2634), and ci-records.test.mjs:89-94 runs `node fake-gh.mjs` with it.

## 3. SHOULD · D2: the 1,000 ms limit

**Problem.** D2's 0.28-0.71 s fits a plain list. A query that OR-filters labels on the server goes through search, at about 1.5 times the cost. Windows is unmeasured, and a six-times stall puts even the plain call at about 2 s. The seal would be chosen blind on the platform the plan expects to fail.

**Fix.** Time the pinned argv on windows-latest in the lane's draft-PR CI, or on the Windows machine, before sealing the limit. Put the elapsed time in the timeout line, for example 'unavailable (timeout after N ms)', so the owner sees the margin from use.

**Evidence.** Measured here on 2026-10-28: author-only 0.27-0.42 s over 12 runs; label or search 0.40-0.87 s over 18 runs. The plan says 'Windows has not been measured'. The R-2674 history in hook-producer.mjs:19-22 records the six-times stall.

## 4. SHOULD · Soul and template rewording sends future asks to a public, unreviewed, unscanned place

**Problem.** The repo is public. After the rewording, a seat in any project files new asks straight to issues. Nothing reviews those issues, and the suite's identity scan and R-2503 writing check never read them. The owner's phone replies are public too. GitHub keeps issue edit history on a public repo, so a line rewritten after posting stays readable. 'The project's issues' is also loose wording for a global rule that every project loads, including a work project with its own tracker.

**Fix.** Tie the wording to the opt-in, for example: '...on one HANDOFF line each, or one issue each where the HANDOFF points to its issues, its title and body first passed through identity-scan --stdin.' In Migration step 3, a post found wrong is deleted, not edited. The land report says in plain words that the issues and his replies are public.

**Evidence.** `gh repo view j-wanger/nana-pi` returned visibility PUBLIC and viewerPermission ADMIN. nana-soul.md:37 is a global rule linked for every project (steps.mjs:65). identity-scan reads tracked files only (identity-scan.mjs:88-91, 108-141). R-2503 reads only HANDOFF (writing-check.test.mjs:98). HANDOFF.md:40 already names 'the work project', and :27-28 and :39 hint at the second machine. The edit-history claim comes from GitHub's behaviour as I know it; I did not check it here.

## 5. SHOULD · Two homes and lines with no home

**Problem.** (a) MM7 keeps 'remaining live lines' under Next, while next-labelled issues also feed Next. That leaves two homes for next items, which breaks 'nothing is kept twice'. (b) Once Open must hold no list item, the other-repo line (edge-screener) has no named destination and is lost. (c) The pinned issue copies 30 file names and their counts. Every lane that adds a known bug makes that copy stale, so someone must keep it by hand.

**Fix.** Make Next pointer-only too: MM7 asserts no list item under Next or Open, in R-2505's form. Otherwise name each Next line that stays and why it is not an issue. Name the other-repo line's destination before it leaves HANDOFF. The pinned issue links the docs/known-bugs folder only, with no counts.

**Evidence.** Plan MM7 and Migration steps 2-4. HANDOFF.md:11-19 (Next) and :47 (edge-screener; that repo is also PUBLIC per gh). The known-bugs folder is the home under R-2505 (known-bugs.test.mjs:41-58).

## 6. SHOULD · Must-meet 1: a malformed pointer reads as 'none found'

**Problem.** An Open section with no list item and an unparseable pointer is silently not opted in. Examples are a markdown link, a URL without /issues, or a URL with a query string. The block then says 'Open for the owner: none found.', and a fresh seat concludes nothing waits on the owner. The cited precedent cannot parse the pointer: githubRepoOf anchors the repo as the last path segment, so it returns null for an /issues URL.

**Fix.** Add to MM1: when an Open section with no list item holds a paragraph naming github.com that yields no owner and repo, the block prints one 'issues pointer unreadable' line. Test the plain, angle-bracket and markdown-link forms. The builder writes its own issues-URL parser and does not reuse GITHUB_REMOTE.

**Evidence.** frontier-summary.mjs:52 prints 'Open for the owner: none found.'. land-ci.mjs:21 has GITHUB_REMOTE = /^(?:https:\/\/github\.com\/|...)([^/]+)\/([^/]+?)(?:\.git)?$/, which rejects 'https://github.com/j-wanger/nana-pi/issues'.

## 7. SHOULD · Forecast misses breaks and callers

**Problem.** The forecast misses several tests, callers and contract lines this change touches:
(1) templates-render.test.mjs:531 (R-682) pins the soul phrase 'every unresolved item and every open question to the owner on one HANDOFF line each'.
(2) templates-render.test.mjs:436 (R-859) requires the marker region in AGENTS.md to be byte-identical to the shared file. AGENTS.md:85 must change in the same commit. Every adopted project's AGENTS.md then shows the stale working-section notice until `nana-setup project` runs there.
(3) ghDefault has a third caller: scripts/ci-records.mjs:14 imports it from nana-land.mjs. land.test.mjs:593 and :597 and land-ci-records.test.mjs:217 call nanaLand.ghDefault.
(4) ci-records' ghResult (ci-records.mjs:44-55) is private and has no timeout class, because ETIMEDOUT reads as 'gh could not start'. Copying it breaks the 10-22 second-caller ruling.
(5) The pack README's runtime-dependency line (README.md:9) names gh only for nana-land.
(6) R-2612's golden test needs the same injected read on the pi path and the Claude path. Without it, the opted-in pi extension has no test.
(7) MM7 tests the real HANDOFF, but Migration step 5 gives that edit to the seat, so the builder's suite ends red.

**Fix.** List items (1) to (6) in the forecast. Have nana-land re-export ghDefault, or update all three callers. Name the ghResult and ghFromEnvironment moves into gh-runner.mjs. Add gh to the README's runtime dependencies and frontier section. Let the builder write the HANDOFF pointer paragraphs, text only, so the build ends green. The seat then only creates issues.

**Evidence.** File and line references are in the problem. stale-copies.mjs:77-99 produces the 'AGENTS.md working section' notice. Precedent nit: identity-scan.mjs:66-77 is countText; countIdentityWords is :77-82.

## 8. SHOULD · Must-meet width and falsifiability

**Problem.** MM1 bundles four behaviours: opt-in, the author and label filter, ordering and caps, and the legacy block. MM2 repeats MM1's filter clause. 'Exactly today's block' does not assert that gh is never run for a project that has not opted in. A build that runs gh for every project and discards the result passes, yet adds a network call and up to 1 s to every session in every project. MM6's 'never the word' is always true, because the scanner holds only digests.

**Fix.** MM1: opt-in detection, the legacy block byte-identical, and the read never called. MM2: the filter. One more row: order, once-only and caps. MM6 asserts that output never echoes any input text, plus the exit codes.

**Evidence.** Plan Must-meet 1-2 and 6. nana-standards: 'one requirement row, written no wider than the test'. identity-scan.mjs:17-21 holds only digests and lengths.

## 9. NOTE · D3 and author filter limits

**Problem.** I verified that the repo is public, the viewer is ADMIN, and there is no .github/ISSUE_TEMPLATE. I did not fetch GitHub's docs. From what I know of them, applying labels needs triage access, and a template's `labels:` are applied for any author. Either way the author filter holds alone, as D3 says. For a repo owned by an organization, the author filter matches nothing, because no issue's author is the org. Another project that opts in would then silently list zero issues.

**Fix.** Mark D3 as partly verified. For a repo owned by an organization, make the opt-in name the account, or print one line saying the author filter cannot apply.

**Evidence.** `gh repo view` and `gh api repos/j-wanger/nana-pi`: has_issues true, visibility public. `ls .github` shows only workflows.

## 10. NOTE · Migration sequencing

**Problem.** Step 5 replaces the HANDOFF sections before the final round, but the drops are put to the owner 'in the land report', after the lines are already gone. They can be restored from git history, so the blast is low. Issues are created after build review, while main's HANDOFF still lists the same asks until the land. That opens a short window with two homes.

**Fix.** List the proposed drops in the review-round notes, or ask before the final round. Keep the window between issue creation and the land short, and do not edit either copy during it.

**Evidence.** Plan Migration steps 1-5 and step 3's 'if the owner agrees in the land report'.

## 11. NOTE · Windows CI leg and the pi extension now run real gh

**Problem.** hooks-win32-exec.test.mjs runs the objective hook in a project inside a detached worktree of HEAD. After MM7, that HANDOFF opts in, so the Windows suite leg calls github.com. ci.yml sets no GH_TOKEN, so the leg gets a 'not signed in' line. Current assertions still pass, but the leg now depends on the network. In pi, the read is synchronous in session_start. It blocks the TUI up to the sealed limit on every start reason R-2612 covers: startup, new, resume, fork and reload.

**Fix.** Point that test's project outside the worktree, or set the gh command seam there. Accept the pi blocking, or let the async session_start handler await an async read.

**Evidence.** hooks-win32-exec.test.mjs:58-64 sets project = path.join(worktree, ...). .github/workflows/ci.yml has no GH_TOKEN. nana-frontier-summary.ts:15-18. R-2612 at REQUIREMENTS.md:272.

## 12. NOTE · The issue set as an artifact

**Problem.** The 10-22 ruling wants every produced artifact declared with its maker and reader. Code (frontier-summary) and the next lane (page-on-pages) will read the open-issue set, but ARTIFACT_CLASSES has no class for GitHub issues. Adding a class changes the owner's 2026-10-24 artifact classes, which is the owner's call.

**Fix.** Put it to the owner as a one-line call, with the default 'no class; FEAT-002 notes the issues as an undeclared external source'. Or leave it to page-on-pages and say so.

**Evidence.** scripts/deliverables.mjs: ARTIFACT_CLASSES = tracked, clone store, user-home store, other project, git ref, CI record. FEAT-002's artifact lines are at REQUIREMENTS.md:173-175.
