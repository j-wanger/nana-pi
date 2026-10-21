# Seat checks — ledger-stages build 1, tip 64f846e3 (2026-10-21)

- Build: one, by the roster's larger-lane pi builder through `pi-worker --lane ledger-stages --lane-size larger`. The
  lane branched from cap-kinds's branch at f6d08f0f with the plan at 9bc6bc00 (`must-meet.md`, `build-brief-1.md`;
  the adversary's evidence is folded into the must-meet's "Rules for the build").
  - Build 1 (a5fbba37): rows R-2450 to R-2454 at the end of FEAT-039's table; `buildReport` carries kind, retirement,
    successors, needs, deliverables and bound stages per capability and orders the capabilities; `renderInto` renders
    them in the Product view and adds the detail view's capability line; five checks in `product-report.test.mjs`
    through `renderHtmlAt`; one sentence each in README.md and the requirements skill.
- Seat re-runs on a5fbba37, single files: product-report, requirements-cap-kinds, requirements-tree, templates-render,
  skill-claims and readme-check exit 0 with no FAIL line; map:check, readme:check, trace and `git diff --check` clean.
  A feature outside any capability, which the report would not handle, is refused by the tree checker first (seat probe).
- Merge: main c51bfcd8 (cap-kinds landed) merged at 64f846e3 without conflict; product-report, requirements-cap-kinds
  and requirements-tree re-run green there.
- Wrong-code pairs (`seat-mutate.mjs`, macOS): 18 of 19 red on a5fbba37 (`seat-mutate-output-a5fbba37.txt`); P2
  survives as a declared test gap. D3 and P1 go red by a throw.
- Not run by the seat: the full suite (the land runs the locked suite on the reviewed tip).
