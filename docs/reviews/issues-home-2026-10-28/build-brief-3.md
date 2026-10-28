Feature: FEAT-002 · Resume decisions and next actions

Lane issues-home. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 3.

Build 2 at 6387aac0 built must-meets 1 to 9, and the seat's check found no MUST. It found four SHOULD points and some cheap notes; fix them here. The evidence is in `seat-check-6387aac0.md` beside this brief. The plan of record, the sealed tunables and the done-when checks stay as briefs 1 and 2 say. Run the locked full suite as a plain foreground command with its output on screen, and the local install check once before your report.

## 1. The open-question rule says what posting means

In `packages/nana-setup/claude/rules/nana-soul.md:37`, the template and AGENTS.md (one wording, R-682's pin moving with it), the issue clause must say:

- issues and the replies on them are public;
- the title and body pass `node "$HOME/nana-pi/scripts/identity-scan.mjs" --stdin --root "$HOME/nana-pi"` first, and then a hand check for work references and project names, because the scan knows only four words;
- a wrong post is deleted, never edited.

`identity-scan --stdin` is not a command anywhere, so the rule must name the form that runs. Keep each sentence under 25 words.

## 2. Organisation-owned repos

Real gh 2.91.0 returns `[]` with exit 0 for `--author <org>`, so the stderr match at `packages/nana-pack/lib/handoff-issues.mjs:36` never fires and an org-owned project shows an empty list with no notice. When the issue list comes back empty, make one more bounded call within the remaining budget to learn the owner's type, for example `gh api users/<owner> --jq .type`, and print the "author filter cannot apply" line when it is `Organization`. Drop the stderr match; it also misreads other gh errors. R-2973's org case feeds the real shape: an empty list, then the type answer.

## 3. Say that the suite enforces pointer-only sections

Add one sentence to the "HANDOFF writing check" section of nana-pi's AGENTS.md (after the shared markers): the suite also fails when HANDOFF's Next or Open for the owner section holds a list item, because those items live as GitHub issues.

## 4. Pin what reaches the owner

Each of these wrong versions left every check green. Add a case that turns red on each:

- deleting the `github.com` guard (`handoff-issues.mjs:20`): a project whose Open section is a plain paragraph with no issues URL keeps today's block byte for byte, and a project with no Open section but an issues URL elsewhere makes no read (R-2970);
- deleting the output-shape check (`:42`): valid JSON of another shape, such as an object or a row whose labels are null, prints the one failure line and keeps the Next and check lines (R-2973);
- substring or case-blind label matching (`:47`): issues labelled `task`, `asks` or `Ask` do not appear (R-2971).

## 5. Cheap notes

- After a failure line, do not print "none found" for Next or the asks; nothing was read.
- Order the other asks optional before parked, as the legacy path does with `ASK_KIND_ORDER`.
- The moved `ghResult` now gives a bare "timeout"; make it say gh timed out and after how many ms, so ci-records and nana-land keep a useful line.
- Make R-2973's timeout case spawn a slow fake gh with budget left, so the timeout path is pinned outside the 34 s hook test.
- Pin three more: `--limit-ms` goes only to the frontier producer (R-2974's form); gh-runner has no default timeout; the stdin scan echoes no input word on a clean or a hit scan (R-2976).
- The pi extension's header (`packages/nana-pack/extensions/nana-frontier-summary.ts:6`) says `@effects disk`; it now runs gh. Move the issues-mode framing sentence into the config beside `FRONTIER_DATA_NOTE`.
- Indent `gh-runner.mjs` and `handoff-issues.test.mjs` with tabs, as the code they came from and their siblings are.
- Accept a pointer that ends in `/issues/`.

No new rows; each fix sits under an existing one. Report each item with its test title or file:line.

## Precedent

- `packages/nana-pack/lib/handoff-issues.mjs`: the reader these fixes change.
- `packages/nana-pack/lib/gh-runner.mjs`: `ghResult`'s timeout class and `ghDefault`.
- `packages/nana-pack/tests/handoff-issues.test.mjs`: the R-2970 to R-2973 checks this build extends.
- `packages/nana-pack/lib/frontier-summary-config.mjs:18, :28`: `FRONTIER_DATA_NOTE` and `ASK_KIND_ORDER`.
- `packages/nana-pack/lib/frontier-summary.mjs:101`: the legacy ask order.
- `packages/nana-setup/claude/rules/nana-soul.md`: the rule, with `templates/_shared/working-under-nana-pi.md` and AGENTS.md.
- `packages/nana-pack/tests/templates-render.test.mjs:530-531`: R-682's pin.
- `scripts/identity-scan.mjs`: the `--stdin` and `--root` forms the rule names.
