Feature: FEAT-043 · Measure memory outcomes
Card: fix

# Review brief 1: evidence-history — fix for red main

Main's CI fails `experiment-cut.test.mjs` R-3863 with `live reference: docs/evidence/land-fix-red/audit.log`. land-fix-red committed builder evidence under `docs/evidence/`, and memory-cuts' scan did not treat that folder as history. Review `git diff main...HEAD`: `docs/evidence` is added to the history exemption in `experiment-cut.test.mjs` and `preview-retirement.test.mjs`. Question: is `docs/evidence/` really history (committed build evidence, not a live reader), and does the change narrow nothing else? Threat model: honest variation in committed evidence; forgery out.
