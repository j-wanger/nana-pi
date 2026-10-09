/**
 * @module packages/nana-setup/lib/shared-memory-input.mjs
 * @purpose Read the bounded JSON payload supplied to the shared-memory SessionStart hook.
 * @inputs an injectable readable stream with an isTTY flag.
 * @outputs null for a TTY, otherwise at most STDIN_CAP UTF-8 input bytes.
 * @effects none (consumes only the supplied stream).
 * @errors stream read failures propagate to the hook's fail-open boundary.
 */
export const STDIN_CAP = 65536; // chosen: parity with the bash head -c 65536 limit

export async function readHookInput(stream) {
	if (stream.isTTY) return null;
	const chunks = [];
	let size = 0;
	for await (const chunk of stream) {
		const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		const take = Math.min(bytes.length, STDIN_CAP - size);
		if (take > 0) chunks.push(bytes.subarray(0, take));
		size += take;
		if (size >= STDIN_CAP) break;
	}
	return Buffer.concat(chunks).toString("utf8");
}
