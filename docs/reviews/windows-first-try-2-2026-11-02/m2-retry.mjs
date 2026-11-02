import assert from "node:assert/strict";
import { runWithRetry } from "../../../packages/nana-pack/tests/objective-hook-retry.mjs";
const shapes = [
	"OBJECTIVE UNAVAILABLE: producer failed (objective)\n",
	"[nana:objective]\nOBJECTIVE UNAVAILABLE: producer failed (objective)\n[nana:frontier]\nFRONTIER UNAVAILABLE: producer failed (frontier)\n",
	"[nana:objective]\n[ n/a ]\n[nana:frontier]\nFRONTIER UNAVAILABLE: producer failed (frontier)\n",
];
const isLoad = (out) => out.startsWith("OBJECTIVE UNAVAILABLE: producer failed (") || /\[nana:frontier\]\nFRONTIER UNAVAILABLE: producer failed \(/.test(out);
for (const [index, shape] of shapes.entries()) {
	let calls = 0;
	const { result, retries } = await runWithRetry(async () => ({ out: ++calls === 1 ? shape : "real block\n" }), { cap: 2, isLoad });
	assert.equal(result.out, "real block\n");
	assert.equal(retries, 1);
	console.log(`shape ${index + 1}: PASS retries=${retries}`);
}
let calls = 0;
const different = await runWithRetry(async () => ({ out: ++calls === 1 ? shapes[0] : "different real block\n" }), { cap: 2, isLoad });
assert.equal(different.result.out, "different real block\n");
assert.equal(different.retries, 1);
console.log("different block: BYTE-IDENTICAL remains false; retries=1");
