# shared-memory-index-cap — plan attack (one adversary)

Verdict: AMEND

AMEND. The design is sound and earns its complexity. A file path plus a 2,000-character preview is what the model gets today. The Claude Code hooks doc, fetched 2026-10-20, confirms the 10,000-character cap: plain stdout is measured whole, the cap is per hook, and no setting raises it. No in-flight worktree touches the hook or its tests (git diff of all seven lanes against origin/main). The lane class is right. Probes ran on a git-archive copy of main 72abe19a in a mktemp folder with temp homes. A prototype of the design ran against fixtures A, B, D and E and against W1-W8 plus an under-fill mutant. The probe folder has been deleted and no probe process is left.

Red today (probe): A printed 13,899 chars. D printed 11,699 with 0 cut. E printed 19,104 with 0 cut. B printed 200 of 200 entries in 15,569 chars. The last line is an entry. The exact-budget case is green, as the baseline expects. The config module is absent.

Amendments:
(1) R-2341's check as written passes the titles-only mutant (W5) without failing. Every description is cut, so no line is printed whole, and "cut length >= longest whole description" holds trivially. The check now also requires at least one line printed whole and one shortened. With that it goes red (probe).
(2) An under-fill mutant (L halved) passed every planned check. On E it used only 5,104 of 9,000 chars. R-2341 now promises "the longest common length that fits" and the test adds a fill check: output + shortened + 2*digits(n) > budget. It is red under under-fill, drop-trailing, titles-only and proportional cuts. It is green at budgets 6,000, 9,000 and 9,500 (probe). The under-fill known limit is removed and W9 is added.
(3) R-2341 claimed "all to one common length", but the R-2342 surrogate back-off makes some cuts one unit shorter. The row now says so.
(4) R-2341 and R-2343 used "titles and links fit/exceed the budget", which left a gap of about 500 chars in which neither row described what the hook does: the titles fit the budget alone but not with the header and the fold line. Both rows now hinge on whether every entry fits with its description cut away.
(5) The over-budget fixtures take their entry counts from the imported budget, and test titles carry no size literal, so a retune changes no test code.
(6) R-2344's test checks the counts as whole-number tokens in order (s, n, d) before the path the header names, so W8 goes red without the test copying the template.
