# handoff-pins: builder mutation record

Each wrong version was applied alone in the worktree (via Edit, then reverted with
`git checkout --`), the row's own test file run alone with
`env -u NANA_HANDOFF -u PI_CODING_AGENT_DIR node --experimental-strip-types <file>`, and the
result recorded before the next mutation. `git status --porcelain` on the touched source file
was confirmed clean after every revert.

| Wrong version | File mutated | Test run | Result |
|---|---|---|---|
| W1: marker case-folds at both sites (`?.toLowerCase()`) | extensions/nana-handoff.ts (pickup + write) | handoff-writer-role.test.mjs | Both new checks (R-138, R-807) FAIL; every other check PASS |
| W2: marker trims at both sites (`?.trim()`) | extensions/nana-handoff.ts (pickup + write) | handoff-writer-role.test.mjs | Both new checks (R-138, R-807) FAIL; every other check PASS |
| W2b: marker trims at the write site only | extensions/nana-handoff.ts (write) | handoff-writer-role.test.mjs | Both new checks (R-138, R-807) FAIL; every other check PASS |
| W3: marker case-folds at the write site only | extensions/nana-handoff.ts (write) | handoff-writer-role.test.mjs | Both new checks (R-138, R-807) FAIL; every other check PASS |
| W4: marker case-folds at the pickup site only | extensions/nana-handoff.ts (pickup) | handoff-writer-role.test.mjs | Both new checks (R-138, R-807) FAIL; every other check PASS |
| W5: storeDir returns piAgentDir()/handoffs | lib/adoption.mjs | handoff-store.test.mjs | R-244 check FAILs cleanly (53 PASS / 1 FAIL); every other check PASS |
| W6: compaction writes a .gitignore beside the default store file when no custom path is set | extensions/nana-handoff.ts | handoff-store.test.mjs | R-830 check FAILs (53 PASS / 1 FAIL); every other check PASS. Also ran handoff-artifact.test.mjs (unaffected, 8/8 PASS) |
| W7: INJECT_CAP is 9000 | extensions/nana-handoff.ts | handoff-artifact.test.mjs | R-189 check FAILs; every other check PASS |
| W8: INJECT_CAP is 7999 | extensions/nana-handoff.ts | handoff-artifact.test.mjs | R-189 check FAILs; every other check PASS |
| W9: the body is cut by code points (`Array.from(...).slice(...).join("")`) | extensions/nana-handoff.ts | handoff-artifact.test.mjs | R-189 check FAILs; every other check PASS |
| W10: the body goes through promptText | extensions/nana-handoff.ts | handoff-artifact.test.mjs | R-189 check FAILs; every other check PASS |
| W11: there is no cap | extensions/nana-handoff.ts | handoff-artifact.test.mjs | R-189 check FAILs; every other check PASS |
| W12: the raw file text is cut before parsing | extensions/nana-handoff.ts | handoff-artifact.test.mjs | R-189 check FAILs; every other check PASS |
| W13: isLegacyShape drops both toLowerCase calls | extensions/nana-handoff.ts | handoff-trust.test.mjs | R-248 check FAILs (52 PASS / 1 FAIL); R-880 and every other check PASS |
| W14: isLegacyShape drops the basename toLowerCase only | extensions/nana-handoff.ts | handoff-trust.test.mjs | R-248 check FAILs (52 PASS / 1 FAIL); R-880 and every other check PASS |
| W15: isLegacyShape drops the parent toLowerCase only | extensions/nana-handoff.ts | handoff-trust.test.mjs | R-248 check FAILs (52 PASS / 1 FAIL); R-880 and every other check PASS |
| W16: the realpath-of-the-parent fallback returns false | extensions/nana-handoff.ts | handoff-trust.test.mjs | R-880 check FAILs (52 PASS / 1 FAIL); R-248 and every other check PASS |
| W17: no read-site handoff_symlink_refused | extensions/nana-handoff.ts | handoff-symlink.test.mjs | R-245 (block g) check FAILs; every other check PASS |
| W18: no write-site handoff_symlink_refused | extensions/nana-handoff.ts | handoff-symlink.test.mjs | R-245 (block g) check FAILs; every other check PASS |
| W19: no write-site warning | extensions/nana-handoff.ts | handoff-symlink.test.mjs | R-245 (block g) check FAILs; every other check PASS |
| W20: the read-site warning is sent at level info | extensions/nana-handoff.ts | handoff-symlink.test.mjs | R-245 (block g) check FAILs; every other check PASS |
| Solid rule removed in scripts/product-report.mjs (R-1024 gate on an own row's status disabled) | scripts/product-report.mjs | product-report.test.mjs | Both R-1024 checks FAIL ("rejects solid ratings with unready own rows", "rejects solid ratings with planned own rows"); every other check PASS |

## Check red on unchanged code

None. Every new check passed on unchanged code before any mutation was tried (confirmed per
file immediately after writing each check, and again after the title/body-line formatting fix
below).

## One self-found issue, fixed before mutation testing

The R-244 check in handoff-store.test.mjs first called `fs.readFileSync(file, "utf-8")`
directly with no existence guard. Under W5 this crashed the run (uncaught ENOENT) rather than
printing a clean FAIL for that one check. Fixed by guarding with `fs.existsSync(file) &&` first;
re-confirmed green on unchanged code, then re-ran W5 to confirm the check now fails cleanly
(53 PASS / 1 FAIL, every other check green).

## Formatting fix required by requirements-trace

Three new checks (R-189 in handoff-artifact.test.mjs, R-244 in handoff-store.test.mjs, R-245
in handoff-symlink.test.mjs) were first written as `check(\n\t"title",\n\tcondition...)`, with
the title string on the line after `check(`. `requirements-trace.test.mjs` requires the line
directly under a `// req:` marker to carry the call AND its title string literal on the same
line. Reformatted all three to `check("title",\n\tcondition...)` (title on the same line as the
call, condition continuing on following lines), matching the house style used elsewhere (e.g.
packages/nana-pack/tests/blast-radius.test.mjs, code-map.test.mjs). Re-ran
requirements-trace.test.mjs: 61 PASS, 0 FAIL.
