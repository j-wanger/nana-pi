/**
 * @module packages/nana-pack/lib/review-standard.mjs
 * @purpose Read and validate the pack's shared review standard before a launcher admits a review.
 * @inputs the review-standard.md URL, or an injected URL for a caller test.
 * @outputs readReviewStandard() -> {text, path} or {problem, path}.
 * @effects disk (stats and reads the review-standard file).
 * @errors filesystem failures are returned as a named problem; none are thrown.
 */
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const REVIEW_STANDARD_URL = new URL('../prompts/review-standard.md', import.meta.url);

export function readReviewStandard(url = REVIEW_STANDARD_URL) {
  const path = fileURLToPath(url);
  let text;
  try {
    if (!statSync(url).isFile()) return { path, problem: `${path} is not a regular file` };
    text = readFileSync(url, 'utf8');
  } catch (error) {
    return { path, problem: error?.code === 'ENOENT' ? `${path} is missing` : String(error?.message ?? error) };
  }
  if (!text.trim()) return { path, problem: `${path} is blank` };
  return { path, text };
}
