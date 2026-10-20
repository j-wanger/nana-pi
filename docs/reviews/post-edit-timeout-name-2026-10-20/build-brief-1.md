# Build brief 1 — post-edit-timeout-name

Feature: FEAT-030 · Get trustworthy feedback after edits
Lane class: hook. Worktree ~/nana-pi-wt/post-edit-timeout-name, branch feat/post-edit-timeout-name, based on main 445f4d5b or newer.
Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/.
First run `npm run map:impact -- packages/nana-pack/extensions/nana-post-edit.ts` and work from that blast radius.

## Tests first (see both FAIL, then build)
New file packages/nana-pack/tests/post-edit-default-timeout.test.mjs, with the six-tag header:
- Use a `check(title, ok, detail)` helper that sets `process.exitCode = 1` on any failure.
- Set HOME and USERPROFILE to a tmpDir from ./tmp-dir.mjs, and `delete process.env.PI_CODING_AGENT_DIR`.
- Write a user .pi/agent/nana-pack.json with `journal.enabled: false` and one command, `{ match: "\\.txt$", run: 'node -e "process.exit(0)"' }`, with no timeoutMs.
- Copy extensions/nana-post-edit.ts to &lt;tmp&gt;/extensions/ and the whole lib/ to &lt;tmp&gt;/lib/ (fs.cpSync, recursive).
- In the copied lib/post-edit-config.mjs, replace `/(export const POST_EDIT_DEFAULT_TIMEOUT_MS\s*=\s*)[^;]+;/` with `RETUNED_MS = 4321`, marked `chosen`. Record whether the replace changed the text, inside try/catch.
- Import the copy through `pathToFileURL(...).href` and register the handler with a fake `pi.on`. Guard the import and the run with try/catch.
- Wrap globalThis.setTimeout around the one `tool_result` call only, and restore it in `finally`. The ctx is cwd tmp, hasUI true, isProjectTrusted, an AbortController signal, and ui.setStatus that records.
- `// req: R-2150`, then on the next line: `check("a post-edit command with no timeoutMs arms its deadline at the pack's named default, retuned in a copy", retuned && recorded.length === 1 && recorded[0] === RETUNED_MS && status.includes("✓ 1 check"), JSON.stringify({ retuned, recorded, status }));`
- Add `const cfg = await import(new URL("../lib/post-edit-config.mjs", import.meta.url).href).catch(() => ({}));`
- `// req: R-2151`, then on the next line: `check("seal: POST_EDIT_DEFAULT_TIMEOUT_MS is 30000", cfg.POST_EDIT_DEFAULT_TIMEOUT_MS === 30_000, String(cfg.POST_EDIT_DEFAULT_TIMEOUT_MS));`

## Then the code
1. Add packages/nana-pack/lib/post-edit-config.mjs.
   - Header: @module; @purpose "Define the post-edit check's default time limit once, with its provenance."; @inputs none; @outputs POST_EDIT_DEFAULT_TIMEOUT_MS; @effects none; @errors none.
   - Provenance comment: "chosen: the pack's first release (2026-09-01) gave each check 30 seconds; not measured. A command's own timeoutMs overrides it, and 0 arms no deadline (R-1702). Pinned by R-2151."
   - Value: `export const POST_EDIT_DEFAULT_TIMEOUT_MS = 30_000;`
2. In extensions/nana-post-edit.ts, import the name beside the other lib imports. Replace `c.timeoutMs ?? 30_000` with `c.timeoutMs ?? POST_EDIT_DEFAULT_TIMEOUT_MS`. Change nothing else.
3. In REQUIREMENTS.md, insert R-2150 and R-2151 (text in the must-meet) directly after R-1743, at the end of FEAT-030. Mark both `implemented`, with the two tests above as evidence.
4. Merge current main if it moved. Run `npm run req:tree` and `npm run map`, then commit the regenerated docs/requirements-tree.md and docs/code-map.md.

## Wrong code to try (restore after each; report red or green)
- W1 `c.timeoutMs ?? 30_000`, import kept: R-2150 red. W2 `c.timeoutMs`: R-2150 red. W3 `c.timeoutMs ?? 0`: R-2150 red.
- W4 config set to 20_000: R-2151 red. W6 `POST_EDIT_DEFAULT_TIMEOUT_MS / 1000`: R-2150 red.
- W5 `POST_EDIT_DEFAULT_TIMEOUT_MS ?? c.timeoutMs`: post-edit-status red (R-1702, R-095).
- W7 `c.timeoutMs || POST_EDIT_DEFAULT_TIMEOUT_MS`: post-edit-status red (R-1702).

## Done
- The new file shows 2 PASS.
- Each of these exits 0: post-edit-status, post-edit-hardening, post-edit-file-queue (pi's real loader), post-edit-utf8, display-surfaces, config-handlers-malformed.
- `node scripts/requirements-trace.mjs` exits 0 and prints ears 0 off form.
- `npm run map:check` and `npm run readme:check` are green.
- No other file is touched.

## Report (≤ 10 lines)
Give the commit, the files changed, both titles red before and green after, and the six blast-radius results. Add the W1 to W7 results, the trace, map and readme results, and anything you could not do.