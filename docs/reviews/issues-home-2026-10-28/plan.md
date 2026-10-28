# issues-home · plan (seat, 2026-10-28; revised after one adversary pass)

Feature: FEAT-002 · Resume decisions and next actions

The seat wrote this plan and one adversary attacked it (`plan-attack.md` beside it: 2 MUST, 6 SHOULD, 4 NOTE). The seat took every finding; the revision notes at the end say where each went. Plans get no review round.

## Purpose

On 2026-10-27 the owner agreed this reading, and on 2026-10-28 he confirmed it with "Your read is right". GitHub issues become the one home for the open items he sorts, and he can see and sort them on his phone. Work then flows from an issue to the ideas that fit it, then to a lane, then to a land.

On 2026-10-28 he picked option A on the issues page: "A, plus the product page which should then be linked to github issues and updated automatically". The plan reads A as four things:

- Issues hold the live questions to him and the live Next items.
- The handoff file keeps one pointer per section.
- Session start lists the open issues.
- Known-bug files stay, and one pinned issue links their folder.

The product page part is the next lane, "page-on-pages". There he chose reading 1: "Yes 1 is the way to go". This lane must leave that lane a clean, readable issue set.

What he gets:

- His questions and next items live where he can sort and answer them on his phone.
- A fresh seat starts from the same list at session start.
- Nothing is kept twice.

## Assumptions (any may be wrong)

- D1. A plain-paragraph pointer under each heading needs no change in the frontier checker, the asks reader, nana-writing, R-2503 or the product report's validation. The adversary verified this.
  - Each of those readers reads list items only.
  - The product report accepts zero asks.
- D2. A bounded read fits inside the session-start hook.
  - An author-only `gh issue list` took 0.27 to 0.42 s on this Mac.
  - A label or search query took 0.40 to 0.87 s.
  - Windows has not been measured. One measured Windows stall ran about six times the median.
  - The sealed limit is set only after timing the pinned call on the Windows CI leg of the lane's draft pull request.
- D3. Partly verified: the repo is public, and the owner's account is admin.
  - Applying labels likely needs triage access. That is inferred, not checked.
  - The author filter holds on its own.
  - For a repo owned by an organization, no issue's author is the org, so the block prints one line saying the author filter cannot apply.
- D4. Builder and reviewer sessions never read issues, because the role check returns first (R-2610).
- D5. Until page-on-pages lands, the product page shows "Asks: 0". That is one known-bug line, not a blocker.
- D6. The name check catches only the owner's name words. It does not catch:
  - work references;
  - personal project names;
  - hints;
  - either public handle.

  The seat rewrites or holds back those lines by hand (see Migration).

## Open choices

The builder decides and reports, unless marked for the seat or the owner.

- E1. The module name and exact output lines.
  - The seat's picks: `packages/nana-pack/lib/handoff-issues.mjs` for the reader and `packages/nana-pack/lib/gh-runner.mjs` for the shared gh code.
  - The failure line has this form: "Open issues: unavailable (<cause>, after <n> ms); see <url>".
- E2. The one-word default of a blocking issue goes in a title suffix, "(default: <word>)", because the phone list shows titles only. Nothing checks it in this lane.
- E3. Labels: `ask` and `next`, plus `blocking`, `optional` or `parked` on each ask. Feature ids go in the body.
- E4. For the owner, one line in the next report. The issue set has no artifact class today. The seat's default is "no class; FEAT-002 notes the issues as an undeclared external source". Adding a class changes the owner's 2026-10-24 artifact classes.

## Threat model

In scope is honest variation in our tools' output, files and environment:

- no network, no gh, or gh not signed in;
- a slow gh, including a Windows cold start;
- `GH_HOST` set to another server;
- zero open issues;
- more issues than the fetch cap;
- long titles;
- an issue opened by someone else or without our labels;
- an org-owned repo;
- a project whose HANDOFF keeps list asks, which must stay untouched;
- a pointer that cannot be parsed: a markdown link, angle brackets, no `/issues` part or a query string;
- CRLF;
- a builder or reviewer session;
- the Windows CI leg, which has no gh token.

Deliberate forgery is out. That means a forged author or labels, and an outsider who gains label rights. A finding outside this model is a residual.

## Precedent

- `packages/nana-pack/lib/frontier-summary.mjs:42-101`: the frontier block (render, priority fill, caps, role check).
- `packages/nana-pack/bin/nana-frontier-summary.mjs:14-38`: the producer CLI, which fails open with one line.
- `packages/nana-setup/lib/hook-producer.mjs:23-62`: the launcher. It computes each producer's limit at `:59` and passes it to `spawnSync` at `:62`. The launcher appends the limit it computed, `--limit-ms <limit>`, to each producer that opts in.
- `packages/nana-pack/bin/nana-land.mjs:30-46`: `ghEnvironment` and `ghDefault`. Both move to `packages/nana-pack/lib/gh-runner.mjs`, which takes no default timeout. nana-land re-exports `ghDefault`, so its three callers keep working: nana-land, `scripts/ci-records.mjs:14` and the land tests. This is a named move under the 2026-10-22 second-caller ruling.
- `scripts/ci-records.mjs:19-30, :44-67`: `ghFromEnvironment`, the command seam that every OS can use, and `ghResult`, whose result classes these are. Both move into gh-runner.mjs, as named moves, and gain a timeout class.
- `packages/nana-pack/tests/ci-records.test.mjs:89-94`: a fake gh run through the command seam, which works on all three OSes.
- `packages/nana-pack/tests/known-bugs.test.mjs:41-58`: R-2505, a section that holds a pointer and no list item.
- `scripts/identity-scan.mjs:77-82` and `:147-184`: `countIdentityWords` and the CLI's exit codes. The CLI gains `--stdin`.
- `packages/nana-pack/tests/hook-deadlines.test.mjs`: R-2672's late-start preload, which the end-to-end time-limit test reuses.
- `packages/nana-setup/claude/rules/nana-soul.md:37` and `templates/_shared/working-under-nana-pi.md`: the open-question rule. R-682 pins it at `templates-render.test.mjs:531`, and R-859 at `:436` requires the AGENTS.md region to match byte for byte.
- `packages/nana-pack/tests/product-report.test.mjs:39-47, :225, :284`: the test copies the real HANDOFF. Its fixture appends one well-formed ask, as `:365-380` already does.

## Outside precedent

- GitHub's own CLI issue listing, with its author filter, JSON output and fetch limit.

## Must-meet

Rows R-2970 to R-2979 are free for this lane. Each check carries its `// req:` marker directly above it. One test pins each sealed tunable and names its row: the read limit, the write reserve and the fetch cap.

1. **Opt-in.** A project opts in only when its Open for the owner section holds no list item and a paragraph whose github.com issues URL parses to an owner and a repo.
   - A project that has not opted in gets exactly today's block, byte for byte, and its read is never called.
   - A section with no list item and an unparseable github.com paragraph prints one "issues pointer unreadable" line. The plain, angle-bracket and markdown-link forms parse.
2. **The read.** The default runner runs exactly `gh issue list -R github.com/<owner>/<repo> --state open --author <owner> --json number,title,labels,author,createdAt --limit <fetch cap>`.
   - The block keeps only rows that carry `ask` or `next` and whose author is the owner. The test feeds it an unfiltered response.
   - When the row count reaches the cap, the block says the list may be longer.
3. **The block.** Each kept issue appears once, as its title, within the existing caps.
   - Blocking asks come first, then next items, then other asks.
   - The Next and check lines still print.
4. **Failure.** When the read fails, the block prints one line naming the cause, the elapsed time and the URL. It still prints the Next lines and the check line. The causes are:
   - no gh;
   - a timeout;
   - a non-zero exit, such as offline or not signed in;
   - output that does not parse;
   - an org-owned repo, where the author filter cannot apply.
5. **The bound, end to end.** The hook keeps its block when gh is slow.
   - The producer limits gh to the smaller of the sealed limit and its `--limit-ms` minus its own elapsed time and the sealed write reserve.
   - One test runs the real objective hook with R-2672's late-start preload and a fake gh, through the command seam, that sleeps past the limit. The test runs on macOS, Linux and Windows. It asserts that the block keeps the Next lines, the one failure line and the check line.
6. **Roles.** A builder or reviewer session never runs the read, on the Claude Code path or the pi path.
7. **The name check.** `identity-scan --stdin` reads text from standard input and prints each hit's word index and count.
   - Its output never echoes any input text.
   - It exits 0 when clean, 1 on a hit and 2 on bad use. An unknown flag still exits 2.
8. **This repo's HANDOFF.** It holds an issues pointer paragraph and no list item under both Next and Open for the owner, in R-2505's form.

Also in this change, with no new row:

- The gh-runner moves named in the Precedent.
- The product report test's fixture change.
- R-2612's golden test gets the same injected read on the pi path and the Claude path.
- `hooks-win32-exec.test.mjs` points its project outside the worktree, or sets the gh command seam, so the Windows leg calls no network.
- The pack README:
  - its runtime-dependency line names gh for session start;
  - its frontier section says how the opt-in works and what the failure line means.
- The open-question rule, in `nana-soul.md:37`, the template and AGENTS.md together. It becomes: one HANDOFF line each, or one issue each where the HANDOFF points to its issues, with the title and body first passed through `identity-scan --stdin`. R-682's pin moves with it.
- One known-bug line in FEAT-039: the product page shows "Asks: 0" until page-on-pages lands.

## Migration (seat work at build start, outward-facing, approved under A)

1. The seat lists the planned removals and rewrites to the owner before the build. The default for each is shown with it.
2. The seat creates the labels.
3. The seat opens one issue per live Open line, about 26, and one per live Next line, about 3.
   - Each title and body passes `countIdentityWords` first, through a node one-liner until `--stdin` lands.
4. The seat opens one pinned issue that links the `docs/known-bugs` folder, without counts.
5. The seat commits the HANDOFF pointer paragraphs on the lane branch, so the build's real-HANDOFF check holds. Main's HANDOFF keeps its list until the land. In that short window, the seat edits neither copy.
6. If a posted issue turns out to be wrong, the seat deletes it rather than editing it. Edit history is public.
7. The other-repo line goes to that repo's own HANDOFF before it leaves this one.
8. The land report tells the owner in plain words that the issues and his replies are public.

## Expected changes to existing tests (forecast, not a limit)

- `frontier-summary.test.mjs` and `frontier-golden.test.mjs`: the read is injected, existing fixtures stay, and the new cases cover the opt-in.
- `hook-producers.test.mjs` (R-2674): the frontier entry's arguments gain `--limit-ms`. Its time-limit assertion stays.
- `hook-deadlines.test.mjs`: the new end-to-end case.
- `hooks-win32-exec.test.mjs`: the project location or the seam.
- `product-report.test.mjs`: the fixture.
- `identity-scan.test.mjs`: the `--stdin` cases.
- `land.test.mjs:593, :597` and `land-ci-records.test.mjs:217`: unchanged through the re-export.
- `ci-records.test.mjs`: the moved seam.
- `templates-render.test.mjs:436, :531`: R-859 byte equality with the reworded template, and the R-682 phrase.
- `known-bugs.test.mjs` or a new file: the pointer check, in R-2505's form.

## Class and size

- Class: install, hook or gate. The lane:
  - changes the Claude Code hook's producer arguments;
  - changes what the pi extension shows;
  - moves code out of nana-land;
  - edits a nana-setup rule.
- The review ladder:
  - the roster's reviewer;
  - the land reviewer;
  - the seat's wrong-code pairs;
  - one independent check;
  - the local macOS install check before the land;
  - the Windows CI leg read before the review briefs.
- Every adopted project shows the stale working-section notice until `nana-setup project` runs there. The land report says so.
- Size: larger, so `pi-worker --lane-size larger --stall-secs 1200`.
- The claim most likely to be wrong: the sealed read limit on Windows. Timing it on the CI leg comes before sealing it.

## Revision notes (seat, after the attack)

- **MUST, the real query:**
  - The exact argv is pinned (must-meet 2).
  - Filtering by author only avoids the AND-label search and its rate limit.
  - `github.com/` in `-R` defeats `GH_HOST`.
  - The fetch cap carries a "may be longer" line.
- **MUST, the bound:**
  - The launcher appends `--limit-ms`.
  - The producer subtracts its elapsed time and a sealed write reserve.
  - gh-runner has no default timeout.
  - The end-to-end hook test runs on all three OSes through the command seam (must-meet 5).
- **SHOULD findings, all taken:**
  - **D2:** timing on Windows before sealing; the elapsed time goes in the line.
  - **Rule wording:** tied to the opt-in and the name check; delete, never edit; public in plain words.
  - **One home:** Next is pointer-only (must-meet 8). The other-repo line has a named destination. The pinned issue links the folder only.
  - **Unreadable pointer:** must-meet 1.
  - **Forecast:** items 1 to 7, with the HANDOFF pointer committed by the seat at build start.
  - **Width:** must-meet 1 split into 1, 2 and 3; must-meet 7 never echoes input.
- **NOTE findings, all taken:**
  - D3's org case.
  - Removals put to the owner before the build.
  - The Windows leg and pi blocking: pi blocks for at most the sealed limit, which is accepted.
  - The artifact class, as E4.
