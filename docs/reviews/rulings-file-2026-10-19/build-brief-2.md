# Lane rulings-file — build brief 2 (2026-10-19 · feat/rulings-file · on 743c568)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/rulings-file`.** The same rules as brief 1: single test files only, in the foreground; no full suite; no push; no `HANDOFF.md` or `docs/sessions/`.

The seat's wrong-code pairs (`seat-mutate-output-743c568.txt`, 28 of 29 red) and one independent check ran on 743c568. Two items come back.

## 1. MUST — the new extension turns an existing check red

`node packages/nana-pack/tests/templates-render.test.mjs` exits 1 on 743c568, and 0 on base b3f6ec2:

`FAIL shared runtime matrix declares four runtime surfaces, ten capabilities, and the discovered source inventory` (req R-680 R-985).

`runtimeInventory()` collects every `.ts` file under `packages/nana-pack/extensions`. Each needs an entry in that test's `RUNTIME_INVENTORY_TEXT` and matching text in the shared runtime table in `templates/_shared/working-under-nana-pi.md`. Known limit 7 in `must-meet.md` deferred this table; R-985 forbids deferring it.

Fix in this lane:
- In `templates/_shared/working-under-nana-pi.md`, add the rulings surface to the runtime table. A pi TUI or desk session and a pi reviewer or worker child each get the `nana-rulings` extension. The Claude Code seat gets the Claude rule `nana-rulings.md`. Codex stays "Not specified". Choose either a new column or a cell in an existing column; follow what the test's capability count demands. Read the test before choosing.
- Add the `nana-rulings` entry to `RUNTIME_INVENTORY_TEXT`.
- Regenerate every copy the shared section feeds: the repo root `AGENTS.md` marker region, and whatever else `templates-render.test.mjs` and the readme check compare against. Find them by grepping for an existing extension name from the table, such as `nana-roster-notice`.
- Remove known limit 7 from `must-meet.md`, or rewrite it to say the table is now done.
- Run `templates-render.test.mjs`, `readme-check` (`npm run readme:check` or the test file), `map:check` and the requirement tests. All exit 0.

## 2. Test gap — the unavailable marker's named parts are unpinned (survivor E13)

R-1411 says the marker "names the file and `nana-setup install`". No check pins either. A marker cut to `` `${RULINGS_UNAVAILABLE} ${cause}.` `` passes every test.

Add assertions to the existing R-1411 check in `packages/nana-pack/tests/rulings.test.mjs`. The marker must contain the file name `nana-rulings.md` and the text `nana-setup install`. Add no new check call. Then show the wrong code: cut the marker as above, run the test, see it red on R-1411's title, restore the code.

## 3. CI Windows leg

CI on 743c568 (run 39250052854) ran `packages/nana-setup/tests/rulings-install.test.mjs` on a real Windows host: 5 pass, 3 fail (macOS and Ubuntu passed it clean). The three failures: "install places nana-rulings.md in the pi agent dir (link on POSIX, byte-equal copy on win32)", the same title for the Claude rules folder, and "doctor marks pi nana-rulings.md ✗ when missing, a POSIX copy or a stale win32 copy, and ✓ after install" (doctor printed `✓ pi nana-rulings.md -> …` where that sub-case expected ✗). Log excerpt: `/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/winplan/rf-1-rulings-install-windows.txt`.

Cause: the "POSIX" test blocks (the first R-1412 block, the first R-1413 block, and R-1414's posix-copy sub-case) called `run(["install"/"doctor", ...])` with no `NANA_SETUP_PLATFORM` override at all, unlike every win32 block, which always forces `NANA_SETUP_PLATFORM: "win32"` (a no-op on a real win32 host). On a real Windows host, the un-overridden "POSIX" blocks ran under native win32 behavior instead: install wrote a byte-equal copy, not a symlink, so the symlink assertions failed; and a plain byte-equal copy is the CORRECT win32 shape, so doctor read it ✓, not the ✗ the posix-only sub-case expected.

Fix: each of the three blocks is now gated on `process.platform !== "win32"`; on an actual win32 host it logs a `SKIP ... (win32: ...)` line (precedent: `install.test.mjs`'s "SKIP rule symlink checks (win32: Windows needs a privilege for symlinks …)") instead of running. Forcing `NANA_SETUP_PLATFORM` to a non-win32 value on a real win32 host was rejected: it would make the installer attempt a real NTFS symlink, which Windows gates behind a privilege (Developer Mode or elevation) this suite cannot assume the CI runner has, so the probe could fail for a reason unrelated to the feature. The win32-copy blocks and the "missing ✗" / "after-install ✓" sub-checks in R-1414 are untouched — they already ran natively and correctly on the Windows host (the CI log's 5 passes), and now continue to run unconditionally on every platform, able to fail. No check was weakened: the win32-copy expectation stays exactly as strict, and every check that CAN run without assuming a privilege still runs and can fail; only the three POSIX-only shapes that are categorically inapplicable on win32 are skipped there, with a reason.

Verified locally on macOS (where `process.platform !== "win32"` so every block still runs, none skipped): `node --experimental-strip-types packages/nana-setup/tests/rulings-install.test.mjs` exits 0, 8 PASS, 0 FAIL, 0 SKIP. The Windows leg itself cannot be executed in this environment; the claim that it now passes there is inferred from the gating logic (`process.platform` is read natively, not mocked) and the precedent pattern, not from a run.

## Report

First line `VERDICT: DONE | PARTIAL | BLOCKED`. Then the commits, every command you ran with its exit code, and the E13 red-then-green evidence.
