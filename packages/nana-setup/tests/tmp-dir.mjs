/**
 * @module packages/nana-setup/tests/tmp-dir.mjs
 * @purpose Create test temporary roots and remove them when the test process exits.
 * @inputs A mkdtemp prefix.
 * @outputs The created temporary directory path.
 * @effects disk (creates and removes temporary directories), process (registers exit cleanup)
 * @errors Propagates directory creation errors and ignores cleanup errors.
 */
// One canonicalization and exit-cleanup policy for runner and direct invocations.
export { tmpDir } from "../../nana-pack/tests/tmp-dir.mjs";
