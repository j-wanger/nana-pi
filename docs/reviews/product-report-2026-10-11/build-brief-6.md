# Lane product-report — build round 6: the readable page (2026-10-11 · feat/product-report)

**Why this round.** The page the command writes today renders the whole report model as one JSON
block (`scripts/product-report/template.html` puts `JSON.stringify(data)` in a `<pre>`, and the
module's `renderInto` does the same). CHANGE §3 asks for a real page: "every fact computed; text
inserted through DOM text nodes, with `**…**` and backtick spans built as `b` and `code` elements
from text; the hash route guarded with an own-property check". Jake reads this page to decide; a
JSON dump fails outcomes 1–5. R-1014–R-1018 were marked implemented on tests that search the
embedded data, not the rendered page — the seat's script missed it too (its round-2 cases read the
raw HTML). This round fixes the page and the evidence. Do every item before you report.

- [ ] **A. One renderer, the real views.** `renderInto(document, model, { hash } = {})`, exported
  from `scripts/product-report.mjs` (or a module it re-exports), renders into
  `document.getElementById("report")` the view the hash names: `""`, `#decisions` → **Decisions**
  (every HANDOFF "Open for Jake" ask: kind, since-date, title, full body); `#product` →
  **Product** (every capability: purpose, outcome, its features with status counts); `#features`
  → **Features** (every feature: ID, label, status, counts, assessment state); `#FEAT-xxx` → that
  feature's **detail** (purpose, status, counts, its own rows and the rows shared into it — each
  with ID, text, status, evidence — the features that share its rows, and its assessment: every
  prose field, the rating, the state `current` / `out of date` / `unassessed`, and each named
  difference); `#shared` → **Shared** (every share: row, home feature, receiving feature);
  `#issues` → **Issues** (every violated row with its text and evidence); `#requirements` →
  **Requirements** (every row; a search box and status and feature filters may narrow it). Any
  other hash, including `#constructor` and `#__proto__`, shows Decisions: look views and features
  up with an own-property check. A tab bar links the views. Follow the prototype's layout and labels
  (`docs/reviews/product-report-2026-10-11/prototype/template.html`) but compute every fact; its
  hand-written decision cards are replaced by the HANDOFF asks.
- [ ] **B. Text only, through a fixed DOM surface.** The renderer uses ONLY
  `document.createElement`, `document.createTextNode`, `document.getElementById`,
  `node.appendChild`, `node.append`, `node.replaceChildren`, `node.setAttribute`,
  `node.addEventListener`, and assigning `textContent`, `value`, `checked` or `hidden`. No
  `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `querySelector`, and no global
  `window`, `location`, `history` or `localStorage` inside the renderer — the page's bootstrap reads
  `location.hash`, calls `renderInto(document, data, { hash })`, and re-renders on `hashchange`.
  `**…**` becomes a `b` element and a backtick span a `code` element, built from text; no literal
  markers remain.
- [ ] **C. One source.** The page inlines the renderer's source text exactly as exported (for
  example `String(renderInto)` and any helpers it needs, placed inside it so it is self-contained),
  so the tested function is the shipped one. Keep the page contract in the head (title, tokens for
  both dark-mode selectors, phone width, Google Fonts only), the `<`-escaped data script and the
  function replacer.
- [ ] **D. Evidence that reads the page.** Rewrite the R-1014–R-1018 tests in
  `product-report.test.mjs` to render each view into a DOM stub and assert on the rendered text and
  elements (not on the embedded data); keep R-1019's two halves. Rows stay `implemented` only on
  those tests.
- [ ] **E. Packets describe one ledger.** `--packets` refuses, writing nothing, while the
  working-tree `REQUIREMENTS.md` differs (after normalisation) from `HEAD`'s, naming the reason
  ("commit REQUIREMENTS.md first"). Add a test; say it in `assess-brief.md`.
- [ ] **F. Title map.** The R-291 count test was renamed (1,024 → 1,043). Add it to
  `docs/reviews/product-report-2026-10-11/test-title-map.json` with the new title and the reason;
  `seat-verify-tests.mjs` must print `0 gap(s)`.

The seat's acceptance script (frozen) now holds 38 rendered-page and packet cases; 8 fail at launch
(`seat-verify-report-r6-launch.txt`) — the page view cases pass at launch only because the JSON dump
contains every word, which the dump cases refuse. It must print `0 mismatch(es)`.

Mutation pairs, red then green — break the CODE, never an assertion: render the JSON again → the
dump cases; drop the own-property check → `#constructor`; build spans as text → the `b`/`code`
cases; drop shared rows from the detail → the shared-in case; let `--packets` run on a dirty ledger
→ its case.

Then: `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked` (report the summary line and total check count), `npm run report` twice
(identical bytes), the seat script into `seat-verify-report-output.txt` (exit 0), and
`node docs/reviews/product-report-2026-10-11/seat-verify-tests.mjs > docs/reviews/product-report-2026-10-11/seat-verify-tests-output.txt 2>&1`
(`0 gap(s)`); commit with explicit paths. Frozen: `CHANGE.md`, the seat scripts, `HANDOFF.md`,
`docs/sessions/`, `prototype/`, every assessment in `assessments.json`. No suite test runs, imports
or copies a seat script. Report ≤ 25 lines, first line `VERDICT: …`, checklist ticked, the LAST TWO
LINES of each seat output verbatim, and the one claim most likely wrong.
