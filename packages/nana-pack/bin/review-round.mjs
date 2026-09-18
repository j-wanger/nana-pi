// review-round.mjs — the review ROUND CAP (OBJECTIVE.md rule, 2026-09-16): three review rounds
// per item, then land with residuals, subtract, or instrument/implement before any further round.
// Evidence: September 2026 ran 100+ rounds at "$0" once the priced governor disappeared, and the
// logs record implementing and instruments finding what the rounds missed
// (docs/audits/2026-09-16-session-spend-vs-objective.md). Pure; consumed by pi-review.mjs.

import { basename } from 'node:path';

export const REVIEW_ROUND_CAP = 3;

/** Round number parsed from a review-output basename, or null when not inferable.
 *  Both corpus conventions are recognised (sol-r4.md, brief-round-4.md, astra-round-4-NO-GO.md);
 *  the digits must be bounded by non-alphanumerics on BOTH sides so pr12 / r2026 / r4beta / round-4k never match. */
export function roundFromOutPath(p) {
  const m = /(?:^|[^a-z0-9])(?:r|round[-_ ]?)(\d{1,2})(?![a-z0-9])/i.exec(basename(p));
  return m ? Number(m[1]) : null;
}

/** 'allow' | 'refuse' | 'override'. `overCap` is the operator's reason (must be non-blank). */
export function roundCapVerdict(round, overCap) {
  if (round === null || round <= REVIEW_ROUND_CAP) return 'allow';
  return overCap && overCap.trim() ? 'override' : 'refuse';
}
