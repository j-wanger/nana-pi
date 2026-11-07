# Plan: hive-retire (reduction batch 2)

Feature: FEAT-039 · See the product and its decisions in one report

## Purpose

The owner, 2026-11-07, batch-2 pick "Hive city page": cut it. Evidence (seat inventory, 2026-11-07): about 83,000 lines, mostly vendored three.js; no app change since 10-31; no measured reader; adding a component to the audit turns the suite red until city.json is edited (R-3171 known bug). The product report page and the component audit stay.

## Assumptions

- A1. The component audit (`scripts/component-audit.mjs`, `docs/components/nana-pi.json`) and the published product report stay; only the hive app, its page builder and its checks go.
- A2. The Pages workflow keeps publishing the product report and its identity check; the hive build and hive identity steps go.
- A3. Hive rows in FEAT-039 are retired (kept as `retired`), never deleted or renumbered. The FEAT-039 label may change if it names the hive.
- A4. Hive known-bug lines in docs/known-bugs/FEAT-039.md are removed; lines about the product report stay.
- A5. One reviewer plus CI.

## Open choices

- O1. Builder decides whether `scripts/hive-gesture-check.mjs` and first-look's hive page option go entirely, following their readers.

## Questions for the owner

None.

## Threat model

Honest variation in tool output and Windows paths. Forgery out.

## Precedent

- `apps/hive/`, `scripts/hive-page.mjs`, `scripts/hive-page-config.mjs`, `scripts/hive-gesture-check.mjs`, `.github/workflows/pages.yml` lines 35–39: the parts to remove.
- `scripts/component-audit.mjs`: the audit that stays; remove its dependency on `apps/hive/city.json` if any (R-3171).
- `docs/plan/one-reviewer.md`: the retirement shape (rows retired, checks green) this lane follows.

## Outside precedent

none: removal of an in-house page.

## Must-meet

- M1 (gone). `apps/hive/`, `scripts/hive-page.mjs`, `scripts/hive-page-config.mjs` and the hive test files do not exist, and no tracked file outside history folders (`docs/reviews`, `docs/sessions`, `research`) names them.
- M2 (Pages). `.github/workflows/pages.yml` has no hive build or hive identity step, and still builds and identity-checks the product report.
- M3 (audit without the city). Adding a new component entry to the component audit's input passes the audit with no city.json edit. Proves the R-3171 coupling is gone.
- M4 (checks). `npm run map:check`, `npm run readme:check`, `npm run req:tree`, the component audit and the requirements trace are green; FEAT-039's hive rows are `retired`.
- M5 (first-look). `npm run first-look -- --page product` still runs and saves its shots; no first-look page option points at the hive.
- M6 (adversary 1: Pages order). Pages has no step whose only reader was the hive (the component-audit step goes unless the product report reads its output; the suite keeps the audit check), and the remaining order is product build → identity scan → upload of `site` → deploy on main only.
- M7 (adversary 2: first-look). Non-hive URL comparison, reference capture and desk capture each exit 0 and write their expected files; `--page hive` (or `--hive`) exits 2 without launching a browser.
- M8 (adversary 3: artifacts). A-087 (the public hive) stays registered as `retired` with no live reader claim; A-085 and A-086 stay live with only surviving readers; the built product report shows no live hive artifact card.
