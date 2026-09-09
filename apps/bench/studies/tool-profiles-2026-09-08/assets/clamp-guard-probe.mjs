// Bench-owned probe for the code-guard task. Copied into the run's fixture copy at
// _bench/clamp-guard-probe.mjs AFTER the model has exited, so it cannot be read or edited.
// It asserts exactly the contract the task prompt states — nothing extra.
// Run: node _bench/clamp-guard-probe.mjs   (exit 0 = guard is correct)
import { clampText } from "../packages/nana-stage/lib/blocks.mjs";

let fails = 0;
const check = (name, ok) => {
	console.log(ok ? "PASS" : "FAIL", name);
	if (!ok) fails++;
};
const throwsTypeError = (fn) => {
	try {
		fn();
		return false;
	} catch (e) {
		return e instanceof TypeError;
	}
};

for (const bad of [0, -1, -1000, 1.5, "10", null, undefined, NaN, Infinity, {}]) {
	check(`maxBytes=${JSON.stringify(bad) ?? String(bad)} throws TypeError`, throwsTypeError(() => clampText("hello world", bad, "probe")));
}

// A valid positive integer must behave exactly as before.
check("short text under the cap is returned unchanged", clampText("hello", 1000, "probe") === "hello");
const long = "x".repeat(5000);
const clamped = clampText(long, 200, "probe");
check("long text is clamped to the byte cap", new TextEncoder().encode(clamped).length <= 200);
check("clamped text announces the cut", clamped.includes("truncated at 200 bytes"));

process.exit(fails ? 1 : 0);
