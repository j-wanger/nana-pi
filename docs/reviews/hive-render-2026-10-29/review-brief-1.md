Feature: FEAT-039 · See the product and its decisions in one report

Lane hive-render. Class: ordinary. Final review, round 1, of the branch tip against main.

Threat model: honest variation in our tools' output is in scope (component data that is valid but unusual, an audit with more or fewer components, a browser without WebGL, a phone viewport, a slow software renderer). Deliberate forgery of the audit data or the page files is out.

The plan of record is `docs/reviews/hive-render-2026-10-29/plan.md` and its attack `plan-attack.md`. The owner chose on 2026-10-29 to copy the reference site's look first (https://3dmk.com/) and reskin as a hive later, so the page is monochrome architecture, not a hive; R-3134 names that. Rows R-3120 to R-3134 and R-3139 (the data swap). The build briefs 1 to 5 and build reports 1 to 5 sit in the lane folder.

What the lane does: a static three.js page at `apps/hive/`, published at `site/hive/` by the Pages job beside the product page. The Pages job builds the data with `component-audit --out` and passes it to `hive-page --data`, which refuses data the shared validator rejects. Frozen contract and fixture with sealed sha256. Pixel fallback without WebGL. Vendored three.js 0.186.1.

The seat's visual checks, outside git, with the real audit data: the judge (`npm run visual-reader`, on main) failed builds 3 and 4 on named spec lines and passed build 5 on all six; the seat agreed after its own side-by-side look. The remaining small flaws are known-bug lines.

Question: does the feature work for its user, the owner reading the public page, and does the change cause a harm the review standard lists? Pay attention to the Pages workflow change (the product page step must still publish as before), the validator import rather than a copy, the first-look merge with main's reference mode, and anything the page could fetch or execute beyond its own folder.
