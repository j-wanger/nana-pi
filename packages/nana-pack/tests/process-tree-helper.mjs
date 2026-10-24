/**
 * @module packages/nana-pack/tests/process-tree-helper.mjs
 * @purpose End a spawned test worker's process tree without making cleanup failures escape the test.
 * @inputs a child process and optional platform and synchronous runner
 * @outputs none
 * @effects process (signals the child or starts taskkill)
 * @errors suppresses absent-process and launcher errors
 */
import { spawnSync } from "node:child_process";

/** Best-effort hard stop for a test worker and its Windows descendants. */
export function killWorkerTree(child, { platform = process.platform, runner = spawnSync } = {}) {
	if (!child?.pid) return;
	try {
		if (platform === "win32") runner("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
		else child.kill("SIGKILL");
	} catch { /* the tree already ended or the command could not start */ }
}
