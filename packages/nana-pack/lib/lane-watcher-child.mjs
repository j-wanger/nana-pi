#!/usr/bin/env node
/**
 * @module packages/nana-pack/lib/lane-watcher-child.mjs
 * @purpose Hop once outside pi-worker's process tree, then enter one silent lane watch.
 * @inputs --hop or --watch plus one absolute JSON lane-watch specification
 * @outputs none
 * @effects process (the hop starts and unreferences a detached watcher; the watcher delegates cleanup)
 * @errors malformed input and launch or cleanup failures exit silently
 */
import { spawn } from "node:child_process";

const [flag, raw] = process.argv.slice(2);
let spec = null;
try { spec = JSON.parse(raw); } catch { /* silent entry failure */ }

if (spec && flag === "--hop") {
	try {
		const child = spawn(process.execPath, [process.argv[1], "--watch", JSON.stringify(spec)], {
			cwd: spec.watcherCwd,
			detached: true,
			stdio: "ignore",
			windowsHide: true,
		});
		child.on("error", () => {});
		child.unref();
	} catch { /* silent hop failure */ }
} else if (spec && flag === "--watch") {
	try {
		const { watchLane } = await import("./lane-watcher.mjs");
		await watchLane(spec);
	} catch { /* silent watcher failure */ }
}
