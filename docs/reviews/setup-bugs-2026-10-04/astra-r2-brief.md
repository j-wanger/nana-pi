# Review brief — nana-setup bug fixes, ROUND 2 (reviewer: gpt-6-astra)

The worktree and branch are unchanged. Your round 1 was BLOCK, 7/10 (`astra-r1.md` in this folder). The fix commit is `0bc93eb`.
1. Re-derive closure of MUST 1, MUST 2 and the SHOULD from the artifact. Re-run your own probes: the symlinked and the dangling plist with a stubbed launchctl (count service calls); your caught-read mutation before the guard; and the base reproduction of the readlink throw.
2. Review `git diff 8fd0dca..0bc93eb` as new code. Check especially the `syncBuiltinESMExports` monkeypatch in two test files: it must be restored on every path, so it cannot leak into other tests run in the same process.
3. Re-audit R-377 to R-380: one `shall` each, and each cited test pins its clause.
4. State plainly any residuals to RECORD rather than block on.
Verdict format as before.
