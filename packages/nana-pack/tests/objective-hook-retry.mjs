/**
 * @module packages/nana-pack/tests/objective-hook-retry.mjs
 * @purpose Identify objective-hook producer load markers and retry a bounded number of attempts.
 * @inputs Hook stdout, producer marker definitions, an attempt runner and retry policy.
 * @outputs Load-marker classification and the last attempt with its retry count.
 * @effects process (through the injected attempt runner).
 * @errors Attempt runner errors propagate to the caller.
 */
export function isLoadMarker(stdout, markers) {
	const lines = stdout.split(/\r?\n/);
	return lines.some((line) => line.startsWith(markers.objectivePrefix)) || lines.some((line, index) =>
		line === markers.frontierTag && lines[index + 1]?.startsWith(markers.frontierPrefix));
}

export async function runWithRetry(runOnce, { cap, isLoad }) {
	let result;
	let retries = 0;
	for (;;) {
		result = await runOnce();
		if (retries >= cap || !isLoad(result.out)) return { result, retries };
		retries++;
	}
}
