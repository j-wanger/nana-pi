/**
 * @module packages/nana-knowledge/tests/tmp-dir.mjs
 * @purpose Create test temporary roots and remove them when the test process exits.
 * @inputs A mkdtemp prefix.
 * @outputs The created temporary directory path, resolved through realpath.
 * @effects disk (creates and removes temporary directories), process (on import deletes PI_CODING_AGENT_DIR, CLAUDE_CONFIG_DIR and every inherited NANA_* variable other than NANA_TEST_*; registers exit cleanup)
 * @errors Propagates directory creation errors and ignores cleanup errors.
 */
export { tmpDir } from "../../nana-pack/tests/tmp-dir.mjs";
