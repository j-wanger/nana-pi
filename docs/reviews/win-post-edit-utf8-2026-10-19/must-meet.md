# win-post-edit-utf8: a Python check's non-ASCII output reaches the model as printed

Feature: FEAT-030 · Get trustworthy feedback after edits

**Feature sentence.** On every platform, post-edit starts each check in Python's UTF-8 mode unless pi's environment already gives PYTHONUTF8 a non-empty value. A Python 3.7 or later check then writes UTF-8, the encoding post-edit reads, so its non-ASCII output reaches the model as printed, with no replacement marks and no backslash escapes. A Python check that prints its Python child's output shows it as printed too. pi's own PYTHONIOENCODING, LANG and LC_* values reach every check unchanged, set or unset.

**Class: install, hook or gate.** The lane changes a pi extension. Ladder: the roster's final reviewer, the land reviewer (or `seat-land.md` when the roster prints `land: seat`), the seat's wrong-code pairs through the mutation runner, one independent check, and the macOS install check before nana-land.

**Threat model.** In scope: honest variation in host output encodings (the Windows ANSI code page, Latin-1 and C locales), Python 3.7 and later, and the owner's PYTHONUTF8, PYTHONIOENCODING, LANG and LC_* values. Out of scope: deliberate forgery, such as a checker that rewrites its own environment or lies about its encoding.

## Today (main f9cd9fd, probed on a temp clone: macOS, Node 22, Python 3.14)
- post-edit decodes every check's output as UTF-8. On win32 the check's env adds only NANA_PI_FILE; on POSIX it is `undefined`.
- Under `LC_ALL=en_US.ISO8859-1`, a check prints `ï — λ` through `reconfigure(errors="backslashreplace")`, as the template's readme check does. The model sees a replacement mark, then Python's backslash escapes for the dash and the lambda. ï arrives as one Latin-1 byte, which UTF-8 decoding turns into the mark. The result is the same with PYTHONUTF8 and PYTHONIOENCODING empty. A check that prints its Python child's captured output shows `child said: ` with the same mark and escapes.
- Windows' cp1252 pipe (inferred; the HANDOFF residual readme-check-cp1252): ï and the dash arrive as cp1252 bytes, so two replacement marks and the lambda's escape.
- Python precedence, probed: PYTHONUTF8=1 makes stdio and the locale encoding UTF-8. An explicit PYTHONIOENCODING still wins for stdio. An empty PYTHONUTF8 counts as unset. The C locale already turns UTF-8 mode on.

## Design
- In `nana-post-edit.ts`, every check's env is `{ ...process.env }`, plus `PYTHONUTF8=1` when `process.env.PYTHONUTF8` is unset or empty, plus NANA_PI_FILE on win32 as today. This applies on every platform. Read pi's value from `process.env`, which is case-insensitive on Windows, never from the copy. Never set PYTHONIOENCODING, LANG or LC_*.
- The variable and its value are named once, beside MAX_OUTPUT. Provenance: contract value for R-1740 and R-1741, Python's UTF-8 mode switch (PEP 540). It is not a sealed tunable; R-1740's behaviour pins it.
- Why not PYTHONIOENCODING=utf-8: it fixes direct output, but a Python check that reads its Python child as text then decodes UTF-8 in the locale encoding (probed: `Ã¯ â\x80\x94 Î»`). UTF-8 mode puts both sides on UTF-8.
- Why every platform: post-edit reads UTF-8 everywhere, and a Latin-1 locale on macOS or Linux has the same mismatch. Under a UTF-8 or C locale nothing visible changes.
- Tests go in a NEW file, `packages/nana-pack/tests/post-edit-utf8.test.mjs`, clear of post-edit-win-pin's two files. It drives the real registered handler through user-scope config under a temp HOME, as the hardening file does.
  - Python is `python3`, then `python`; a candidate counts when it exits 0, prints sys.executable and is 3.7 or later. With none, R-1740 and R-1741 FAIL naming the commands tried.
  - Checker scripts are ASCII with `\u` escapes and exit 1. The host is forced with `LC_ALL=en_US.ISO8859-1`, with PYTHONUTF8 and PYTHONIOENCODING removed; all three are restored in `finally`.
  - Control: the direct script run with raw-byte stdout. When those bytes contain the UTF-8 bytes of `ï — λ`, the host has no mismatch, and R-1740 and R-1741 print SKIP naming why. Linux without that locale falls back to C; Python 3.15 and later default to UTF-8 mode (PEP 686, inferred).
  - R-1742 and R-1743 need no Python: a node checker writes its process.env as JSON to a temp file.

## Must-meet
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1740 | WHERE pi's environment leaves PYTHONUTF8 and PYTHONIOENCODING unset or empty, WHEN a failing post-edit check is a Python 3.7 or later program that prints non-ASCII characters on a host whose default output encoding is not UTF-8, the pack shall show the model those characters as the program printed them. | `packages/nana-pack/tests/post-edit-utf8.test.mjs::a failing Python check with PYTHONUTF8 unset or empty shows the model its non-ASCII output as printed` | Yes, probed on macOS: unset and empty both show the replacement mark and escapes; the fix turns both green. Windows inferred red. Wrong code probed red: win32-only switch; `=== undefined` (empty case). |
| R-1741 | WHERE pi's environment leaves PYTHONUTF8 and PYTHONIOENCODING unset, WHEN a failing Python 3.7 or later post-edit check prints the non-ASCII output it captured as text from its own Python child on a host whose default output encoding is not UTF-8, the pack shall show the model the child's characters as the child printed them. | `packages/nana-pack/tests/post-edit-utf8.test.mjs::a failing Python check shows the model its own Python child's non-ASCII output as printed` | Yes, probed: `child said: ` with the mark and escapes. Wrong code probed red: PYTHONIOENCODING=utf-8 in place of the switch. |
| R-1742 | IF pi's environment gives PYTHONUTF8, PYTHONIOENCODING, LANG, LC_ALL or LC_CTYPE a non-empty value, THEN the pack shall pass that value to each post-edit check unchanged. | `packages/nana-pack/tests/post-edit-utf8.test.mjs::PYTHONUTF8, PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE values from pi reach the check unchanged` | No; it guards main. Wrong code probed red: the switch always overriding the owner's PYTHONUTF8. |
| R-1743 | WHERE pi's environment leaves PYTHONIOENCODING, LANG, LC_ALL or LC_CTYPE unset, the pack shall start each post-edit check with that variable unset. | `packages/nana-pack/tests/post-edit-utf8.test.mjs::PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE that pi leaves unset stay unset for the check` | No; it guards main. Wrong code probed red: PYTHONIOENCODING=utf-8, LC_ALL=en_US.UTF-8 or LANG=C.UTF-8 added when unset. All three pass R-1740 to R-1742. |

R-1744 to R-1749 stay unused. With the fix, the hardening (21 PASS), status (30 PASS, 1 SKIP), file-queue (5) and display-surfaces (181) counts are unchanged on macOS (probed).

## Verification (seat)
- macOS: the new file prints 4 PASS. The trace exits 0 with `ears: 0` (probed with these rows). map:check and readme:check are green; a draft README sentence probed at 0 problems.
- Linux leg: R-1742 and R-1743 PASS; R-1740 and R-1741 SKIP with the reason.
- Draft PR, Windows leg: a scratch run of the test file alone on main's extension shows R-1740 and R-1741 FAIL. On the lane tip all 4 PASS, not SKIP. Hardening path checks d, e, g, h and i still PASS; they guard NANA_PI_FILE.
- In the reviewed change, the seat drops the HANDOFF residual that says post-edit reads a Python checker's cp1252 output as UTF-8.

## Known limits
- **Trade.** On Windows with Python before 3.15, a Python check that opens a file without naming an encoding reads it as UTF-8 under post-edit. The owner's terminal reads it in the ANSI code page, so such a check can pass or fail differently there.
- Python before 3.7 ignores the switch. The owner's PYTHONUTF8=0, or a non-UTF-8 PYTHONIOENCODING, still decides the output, which can still show replacement marks.
- Non-Python checkers that write in a Windows code page are unchanged. So is the model's own bash tool: pi core decodes it, not post-edit.
- Hosts with no Latin-1 locale and no non-UTF-8 code page, or whose found Python is 3.15 or later, SKIP R-1740 and R-1741. A machine with no Python 3.7 or later on PATH fails them, naming the commands tried.