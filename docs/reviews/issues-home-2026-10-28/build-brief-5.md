Feature: FEAT-002 · Resume decisions and next actions

Lane issues-home. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 5.

The lane's one independent check (`independent-check-28aebd48.md` beside this brief) found no MUST and four SHOULD points in the posting and answering loop. Fix them and the three cheap notes. Everything else stands as briefs 1 to 4 say. Run the locked full suite as a plain foreground command with its output on screen, and the local install check once with `env -u NANA_WORKTREE_ROOT` before your report.

## 1. The rule says how to post, who posts and how to read answers (R-682)

Rewrite the issue part of the open-question rule, in nana-soul.md:37, the template and AGENTS.md with one wording. Keep each sentence under 25 words and keep what is there now: the location, public, the runnable scan, the hand check and delete-never-edit. It must also say:
- only the seat posts, from the owner's gh account; builders and reviewers put open questions in their report;
- label an ask `ask` plus one of `blocking`, `optional` or `parked`, or label a next item `next`;
- a blocking ask's title ends with "(default: <word>)";
- post only when the scan exits 0;
- the hand check covers names, handles, hostnames, work references and project names;
- before acting on an open ask, read its replies with `gh issue view <number> --comments`.

## 2. Builders never post (FEAT-006's preamble)

Add one bullet to `packages/nana-pack/prompts/builder-preamble.md` Scope: never create, edit, comment on or close a GitHub issue, and put open questions in the report. Pin it in the R-682 check beside the rule.

## 3. The block shows what a seat needs to act (R-2972)

- Show each issue's number before its title, for example `- [optional] #220 The blocking-ask cap`, so a seat can read replies or close it.
- An ask with no `blocking`, `optional` or `parked` label shows `[no tag]`, as the legacy path does, not `[optional]`.
- "Open for the owner (n)" counts only the asks listed under it, not the blocking asks listed above.

## 4. Shape check (R-2973)

Valid JSON whose labels are strings, not objects with a name, prints the unreadable-output failure line, not "none found".

No new rows. Report each item with its test title or file:line, and the exact block this repo prints with gh working.

## Precedent

- `packages/nana-setup/claude/rules/nana-soul.md`: the rule, with `templates/_shared/working-under-nana-pi.md` and AGENTS.md.
- `packages/nana-pack/tests/templates-render.test.mjs:530-531`: R-682's pin.
- `packages/nana-pack/prompts/builder-preamble.md`: the builder's Scope bullets.
- `packages/nana-pack/lib/handoff-issues.mjs:53-55`: the filter and the kind expression.
- `packages/nana-pack/lib/frontier-summary.mjs:60-70`: the issue-mode block and its counts.
- `packages/nana-pack/lib/frontier-summary-config.mjs:28`: `ASK_KIND_ORDER`.
- `packages/nana-pack/tests/handoff-issues.test.mjs`: the R-2972 and R-2973 checks.
