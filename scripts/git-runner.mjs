/**
 * @module scripts/git-runner.mjs
 * @purpose Run read-only report git commands with a shared bounded output buffer.
 * @inputs Project root and git arguments.
 * @outputs A spawnSync result with UTF-8 stdout and stderr.
 * @effects process (git without a shell)
 * @errors Spawn failures remain in the result for each report's existing refusal handling.
 */
import { spawnSync } from 'node:child_process';

// Chosen: 64 MiB, matching requirements-lift.mjs's committed ledger blob reader.
export const MAX_GIT_BUFFER = 64 * 1024 * 1024;

/** No shell, cwd pinned to the project root, buffer sized by MAX_GIT_BUFFER. */
export function defaultGit(root, args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: MAX_GIT_BUFFER });
}
