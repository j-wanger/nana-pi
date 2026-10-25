/**
 * @module packages/nana-pack/lib/review-movement-config.mjs
 * @purpose Define the review movement section's framing, command and resource bounds.
 * @inputs none
 * @outputs Named movement prompt, process and temporary-file tunables.
 * @effects none
 * @errors none
 */
// contract: R-2900, R-2901; chosen beside STANDARD_HEADING in claude-review-config.mjs.
export const MOVEMENT_HEADING = '## Tree movement';
// chosen 2026-10-25: other projects' managed region carries no reviewer duty for movement.
export const MOVEMENT_LEAD = 'Read every feature this names before you judge the change.';
// contract: the working pattern's lane base and AGENTS.md's --base main.
export const MOVEMENT_BASE = 'main';
// contract: R-2902, R-2908; requirements-moved.mjs's tree movement prefix.
export const MOVEMENT_NOT_COMPUTED = 'tree movement: not computed:';
// measured 2026-10-25: 0.24–0.30 s for 2,038 rows; chosen about 100× for cold loaded Windows.
export const MOVEMENT_TIMEOUT_MS = 30_000;
// measured 2026-10-25: largest report 81,097 bytes; chosen about 200×; context bounds the reader.
export const MOVEMENT_MAX_BYTES = 16 * 1024 * 1024;
// contract: the rule's script, resolved beside the running pack rather than a fixed home path.
export const MOVEMENT_SCRIPT_URL = new URL('../../../scripts/requirements-moved.mjs', import.meta.url);
// contract: TS_CHECK_ARGS's first element; warnings must not become the failure reason.
export const MOVEMENT_NODE_ARGS = ['--no-warnings'];
// chosen: names its owner and cannot match pi-review's nana-review-<pid>- reclaim pattern.
export const MOVEMENT_FOLDER_PREFIX = 'nana-movement-';
// chosen: a plain section name recognizable in the child's argv.
export const MOVEMENT_FILE_NAME = 'tree-movement.md';
