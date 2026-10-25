/**
 * @module packages/nana-pack/lib/review-movement.mjs
 * @purpose Compute the reviewed tree's movement as an advisory prompt section without refusing a review.
 * @inputs A tree path, an optional process runner, HEAD's REQUIREMENTS.md and the pack's scripts/requirements-moved.mjs.
 * @outputs reviewMovementSection() returns null or the movement section text; notComputedReason() extracts its failure reason.
 * @effects process (runs git and scripts/requirements-moved.mjs with node), disk (children read git and ledger files).
 * @errors No errors escape; a failed ledger check returns null and a failed movement becomes a not-computed line.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  MOVEMENT_HEADING, MOVEMENT_LEAD, MOVEMENT_BASE, MOVEMENT_NOT_COMPUTED,
  MOVEMENT_TIMEOUT_MS, MOVEMENT_MAX_BYTES, MOVEMENT_SCRIPT_URL, MOVEMENT_NODE_ARGS,
} from './review-movement-config.mjs';

export function reviewMovementSection(tree, { run = spawnSync } = {}) {
  const options = { cwd: tree, encoding: 'utf8', timeout: MOVEMENT_TIMEOUT_MS, maxBuffer: MOVEMENT_MAX_BYTES };
  try {
    if (run('git', ['cat-file', '-e', 'HEAD:./REQUIREMENTS.md'], options).status !== 0) return null;
  } catch { return null; }
  let result;
  try {
    result = run(process.execPath, [...MOVEMENT_NODE_ARGS, fileURLToPath(MOVEMENT_SCRIPT_URL), '--root', tree, '--base', MOVEMENT_BASE], options);
  } catch (error) { result = { error }; }
  const reason = String(result.stderr ?? '').split(/\r?\n/).find((line) => line.trim())
    || result.error?.code || (result.status != null ? `exit ${result.status}` : `signal ${result.signal}`);
  const body = result.status === 0
    ? String(result.stdout ?? '').replace(/[\r\n]+$/, '')
    : `${MOVEMENT_NOT_COMPUTED} ${reason}`;
  return `${MOVEMENT_HEADING}\n\n${MOVEMENT_LEAD}\n\n${body}`;
}

export function notComputedReason(section) {
  const prefix = `${MOVEMENT_HEADING}\n\n${MOVEMENT_LEAD}\n\n${MOVEMENT_NOT_COMPUTED} `;
  return typeof section === 'string' && section.startsWith(prefix) ? section.slice(prefix.length) : null;
}
