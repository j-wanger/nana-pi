# Adversary brief — ledger-heading-count plan

You are the one adversary for a nana-pi lane plan. You attack the plan; you do not rewrite it, build anything, or edit any repository file. You are read-only: read, grep, find, and bash for read-only commands and small probes only.
- Probes write only under the system temp folder, and remove what they create.
- Never read, print or use a stored credential.
- Never run the full suite.

Working directory: the lane worktree, branch `feat/ledger-heading-count`, based on origin/main 5bb48872. The machine is Windows 11 with Node 22.22.2. In PowerShell, set the path first: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.

## Read

- The plan: `docs/reviews/ledger-heading-count-2026-11-02/plan.md`.
- `packages/nana-pack/tests/requirements-tree.test.mjs`, all of it.
- `scripts/requirements-tree.mjs`: `parseLedger`, `checkTree` and the heading regexes.
- `REQUIREMENTS.md`: its heading forms. Look for any heading the plan's scan form (`^#{1,3} (CAP|FEAT|SUB)-\d`) would miss or wrongly include, such as headings inside code fences, `####` headings, or headings with other prefixes.
- Every other test that reads the real ledger and pins a count: grep for `76`, `headings.length` and `=== 4[0-9]`.
- `packages/nana-pack/prompts/planner.md`; `scripts/lane-class.mjs`.

## Hunt for

- Does the ID-and-line oracle stay as strict as the literal in every way that matters? Could the scan and the parser share a blind spot, for example both using the same regex, so that a drop goes unseen? Should the scan be deliberately simpler or different from the parser's regex?
- Is "at least one heading of each level" enough to stop a vacuous pass if the ledger path is wrong or empty? Consider `REQ_TREE_LEDGER_PATH` pointing at a fixture.
- R-1158: does an LF-versus-CRLF comparison prove what the row says, or does the row need the problem lists compared too? Are other heading fields (`statusLines`, `alsoAppliesLines`, `firstMarkdownTableLine`) line-sensitive in a way the comparison should include?
- Are M1 and M2's mutations well defined, and would they really fail the new checks? Is the extra-heading copy a fair test of "no edit needed"?
- Any other heading literal in other tests or checkers that lanes also have to bump (the seat named three lanes hit tonight)?
- Rows: behaviour, not implementation; tagging; trace and tree rules. The lane class. Anything missed.

## Output

Your final reply is the whole attack, in Markdown:
- numbered findings, each labelled MUST (the plan would produce a wrong or unprovable lane) or SHOULD;
- for each, evidence (file:line, or a probe and its result) and a concrete fix;
- at the end, the counts of MUST and SHOULD.

Keep it tight.
