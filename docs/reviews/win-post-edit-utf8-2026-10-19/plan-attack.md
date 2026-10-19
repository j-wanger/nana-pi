# win-post-edit-utf8 — plan attack (one adversary)

Verdict: AMEND

AMEND. I endorse the design: the UTF-8 mode switch on every platform, a new test file, and waiting for post-edit-win-pin. I probed it on a temp clone of main (dbbba7e, later f9cd9fd) with macOS, Node 22, Python 3.14 and a temp HOME. The real repo was not edited.

Probes:
- On main, R-1740 is red in both the unset and the empty case. R-1741 is red. R-1742 is green.
- With the fix, all three are green.
- Hardening (21), status (30 + 1 SKIP), file-queue (5) and display-surfaces (181) counts are unchanged with the fix.
- The trace exits 0 with `ears: 0` using the amended rows.
- readme-check found 0 problems with a draft README sentence.

Amendments:
1. The plan's "Today" text is wrong. The model sees a replacement mark followed by Python's backslash escapes for the dash and lambda, not `� — λ`. Only ï arrives as a raw Latin-1 byte. I fixed the evidence text.
2. Two wrong-code variants the plan says turn R-1742 red actually stay green on all three tests (probed). They are: adding PYTHONIOENCODING=utf-8 beside the switch only when it is unset, and adding LC_ALL or LANG only when unset. Yet the feature promises that pi's variables reach checks unchanged. I added R-1743 (unset stays unset), using the same node env-dump checker. It is green on main and with the fix, and red on all three variants (probed).
3. R-1740's row said "characters its host's default output encoding lacks". But ï is in Latin-1 and in cp1252, and the test asserts ï too. Reworded to "non-ASCII characters on a host whose default output encoding is not UTF-8".
4. R-1741's row described how the check is started ("start the check so it reads…"). It now states what the model sees, matching its test. The title changed to match.
5. The feature sentence said "a value". It now says "a non-empty value", matching Python's rule that an empty value counts as unset.
6. The control now checks that the raw bytes contain the expected text, not that they equal it, because Windows prints CRLF.
7. pi's PYTHONUTF8 is read from process.env, which is case-insensitive on Windows, never from the spread copy.
8. Known limits now cover Python 3.15 or later on PATH (the tests skip) and the model's own bash tool (pi core decodes it, so it is unchanged).
9. In the reviewed change, the seat drops the HANDOFF residual about post-edit reading a Python checker's cp1252 output as UTF-8.

Class: install, hook or gate is correct, because the lane changes a pi extension.

Linux leg: R-1740 and R-1741 SKIP when the en_US ISO8859-1 locale is missing. The skip comes from the control and names its reason; the leg is non-blocking.

Nothing writes outside the lane worktree or temp folders.

Claim most likely wrong: that CI's Windows runner has `python` 3.7 or later on PATH writing cp1252 to pipes, so R-1740 and R-1741 run red-then-green there rather than SKIP. The evidence is the HANDOFF's cp1252 note, which came from uv's Python, not the PATH Python. The seat's tests-only scratch CI run settles it.

Second risk, a judgement call: UTF-8 mode makes unlabelled file reads UTF-8 on Windows with Python before 3.15. The owner may prefer the narrower PYTHONIOENCODING, which R-1741 shows breaks a Python check that prints a Python child's output.
