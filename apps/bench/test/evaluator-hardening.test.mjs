// THE TRUSTED EVALUATOR UNDER ATTACK. Every case here is a way a module could manufacture a signed
// PASS for a WRONG answer, and every one of them must end in "not a pass". astra round 5 found two
// live ones at 9784d58: the nonce stayed readable at `bench-eval-*​/spec.json` while the module ran,
// and the verdict was serialised with `JSON.stringify`, which still calls an inherited
// `Object.prototype.toJSON` — a wrong `twice(n) => n*3` plus one inherited method produced an
// HMAC-VALID successful verdict with no nonce extraction at all.
//
// The rule these tests encode: between the untrusted import and the signature, the evaluator may
// touch nothing but values it captured beforehand. Each patch below is applied by the module under
// test, in its own process, exactly as a model could write it inside the lines the task allows.
// Run: node apps/bench/test/evaluator-hardening.test.mjs   (exit 0 = all PASS)
import { createHmac } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { judgeVerdict, runCheck, selectSignedVerdict } from "../lib/checkers.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-evalhard-"));
const at = () => ({ finalText: "", dir });
const write = (name, src) => {
	fs.writeFileSync(path.join(dir, name), src);
	return name;
};
/** One probe, one right answer. Every attack below ships the WRONG one. */
const TWICE = [{ name: "twice(4)", export: "twice", args: [4], equals: 8 }];
const RIGHT = "export const twice = (n) => n * 2;\n";
const WRONG = "export const twice = (n) => n * 3;\n";
const evalOf = (module, probes = TWICE, timeoutMs) => runCheck({ type: "eval-module", module, probes, ...(timeoutMs ? { timeoutMs } : {}) }, at());
/** Never a pass — a failure and a grader error are both acceptable, a PASS never is. */
const rejected = (r) => r.pass === false;

try {
	// ── A1. the nonce must not be readable from the filesystem while the module runs ─────────────
	// The module hunts os.tmpdir() for the spec file (and /dev/fd/4), and if it finds the nonce it
	// signs a forged "all probes passed" verdict. Before the fix this SUCCEEDED: the 0600 file
	// belongs to the same user as the module.
	write(
		"disk-nonce.mjs",
		'import fs from "node:fs";\nimport os from "node:os";\nimport path from "node:path";\nimport { createHmac } from "node:crypto";\n' +
			'const found = { dirs: [], specs: [], devfd: null, forged: false };\n' +
			"try {\n" +
			"  for (const name of fs.readdirSync(os.tmpdir())) {\n" +
			'    if (!name.startsWith("bench-eval-")) continue;\n' +
			"    found.dirs.push(name);\n" +
			'    try { found.specs.push(fs.readFileSync(path.join(os.tmpdir(), name, "spec.json"), "utf8")); } catch (e) { found.specs.push("unreadable:" + e.code); }\n' +
			"  }\n" +
			"} catch {}\n" +
			'try { found.devfd = fs.readFileSync("/dev/fd/4", "utf8"); } catch (e) { found.devfd = "unreadable:" + e.code; }\n' +
			"for (const raw of [...found.specs, found.devfd]) {\n" +
			"  let nonce = null;\n" +
			"  try { nonce = JSON.parse(raw).nonce; } catch {}\n" +
			'  if (typeof nonce !== "string") continue;\n' +
			'  const verdict = JSON.stringify({ probes: [{ name: "twice(4)", pass: true, detail: "equal" }], expected: 1, complete: true, importError: null, specError: null, node: process.version });\n' +
			'  const sig = createHmac("sha256", nonce).update(verdict).digest("hex");\n' +
			'  try { fs.writeSync(3, verdict + "\\t" + sig + "\\n"); found.forged = true; } catch {}\n' +
			"}\n" +
			'try { fs.writeFileSync(new URL("./leak.json", import.meta.url), JSON.stringify(found)); } catch {}\n' +
			WRONG,
	);
	const disk = evalOf("disk-nonce.mjs");
	check("A1: a module that hunts the spec file on disk cannot sign a verdict", rejected(disk), disk.detail.slice(0, 150));
	const leak = JSON.parse(fs.readFileSync(path.join(dir, "leak.json"), "utf8"));
	check("A1: …no pathname exposed the nonce (spec.json was unlinked before the spawn)", leak.specs.every((s) => s.startsWith("unreadable:")), JSON.stringify(leak.specs).slice(0, 120));
	check("A1: …and fd 4 was closed before the module ran, so /dev/fd/4 gives nothing", !/"nonce"/.test(String(leak.devfd)), String(leak.devfd).slice(0, 80));
	check("A1: …so no forged line was even attempted", leak.forged === false);
	check("A1: …and the REAL verdict reports the wrong behaviour", /got 12, want 8/.test(disk.detail), disk.detail.slice(0, 150));

	// ── A2. exactly one HMAC-valid line is a verdict ─────────────────────────────────────────────
	// The nonce cannot leak by the paths above, so the policy is tested where it lives: on the
	// parent's line selection. invalid→valid, malformed→valid and valid→valid are all covered.
	const nonce = "a".repeat(64);
	const sign = (json) => `${json}\t${createHmac("sha256", nonce).update(json).digest("hex")}`;
	const good = '{"probes":[{"name":"p","pass":true}],"complete":true}';
	const other = '{"probes":[{"name":"p","pass":false}],"complete":true}';
	check("A2: a single signed line is the verdict", selectSignedVerdict(`${sign(good)}\n`, nonce).verdict?.complete === true);
	check("A2: an unsigned line before it is ignored", selectSignedVerdict(`${good}\t${"0".repeat(64)}\n${sign(good)}\n`, nonce).verdict?.complete === true);
	check("A2: a malformed line before it is ignored", selectSignedVerdict(`garbage-with-no-tab\n${sign(good)}\n`, nonce).verdict?.complete === true);
	check("A2: TWO valid lines are ambiguous, not a selection", selectSignedVerdict(`${sign(other)}\n${sign(good)}\n`, nonce).ambiguous === 2);
	check("A2: …and the same line twice is still two verdicts", selectSignedVerdict(`${sign(good)}\n${sign(good)}\n`, nonce).ambiguous === 2);
	check("A2: an ambiguous verdict is a GRADER error, never a pass", judgeVerdict({ ambiguous: 2 }, TWICE).graderError === true);
	check("A2: no signed line at all is a FAILURE (the module blocked the evaluator)", (() => { const r = judgeVerdict({ verdict: null }, TWICE); return r.pass === false && r.graderError !== true; })());
	check("A2: signed but unparseable JSON is a grader error", judgeVerdict({ malformed: "x" }, TWICE).graderError === true);
	// shape and probe count, validated against the spec
	check("A2: a verdict that is not an object is a grader error", judgeVerdict({ verdict: [1, 2] }, TWICE).graderError === true);
	check("A2: a verdict with no probe array is a grader error", judgeVerdict({ verdict: { complete: true } }, TWICE).graderError === true);
	const shortCount = judgeVerdict({ verdict: { complete: true, probes: [{ name: "a", pass: true }] } }, [...TWICE, { name: "b", export: "twice", args: [1], equals: 2 }]);
	check("A2: fewer probe results than declared probes is a grader error", shortCount.graderError === true, shortCount.detail.slice(0, 110));
	check("A2: more probe results than declared probes is a grader error too", judgeVerdict({ verdict: { complete: true, probes: [{ pass: true }, { pass: true }] } }, TWICE).graderError === true);
	check("A2: an invalid probe SPEC is a grader error, not a model failure", judgeVerdict({ verdict: { complete: true, probes: [], specError: "no assertion" } }, TWICE).graderError === true);
	// …and end to end: a probe that declares no assertion is the spec's fault
	write("right.mjs", RIGHT);
	const noAssertion = evalOf("right.mjs", [{ name: "silent", export: "twice", args: [4] }]);
	check("A2: a probe with no assertion is a GRADER error end to end", noAssertion.graderError === true, String(noAssertion.detail).slice(0, 90));

	// ── A3. prototype-independent verdict construction ───────────────────────────────────────────
	// Each of these patches a surface the verdict used to depend on, then returns the WRONG answer.
	const patched = [
		[
			"an inherited Object.prototype.toJSON (the naive form: JSON.stringify recurses into it)",
			'Object.prototype.toJSON = function () { return { probes: [{ name: "twice(4)", pass: true, detail: "equal" }], expected: 1, complete: true, importError: null, specError: null, node: process.version }; };\n',
		],
		[
			// VERIFIED live at 9784d58: this exact module made the old evaluator sign `pass: true` for
			// `twice(n) => n*3`. The null prototypes are what makes it work — without them
			// JSON.stringify calls the inherited toJSON on every nested object until the stack dies.
			"an inherited Object.prototype.toJSON returning null-prototype objects (astra's forgery)",
			"const np = (o) => Object.setPrototypeOf(o, null);\n" +
				"Object.prototype.toJSON = function () {\n" +
				'  const probe = np({ name: "twice(4)", pass: true, detail: "equal" });\n' +
				'  return np({ probes: np([probe]), expected: 1, complete: true, importError: null, specError: null, node: "forged" });\n' +
				"};\n",
		],
		[
			// VERIFIED live at 09e6f4b: `createHmac("sha256", <string>)` routes the key through
			// `Buffer.from` (a writable property, not a primordial), so hooking it hands the module the
			// nonce at signing time. Fable's module signs a forged all-pass verdict, writes it to fd 3
			// and then throws, so the evaluator's own emit never writes and the forgery is the ONLY
			// signed line. The key is now a Buffer built before the import; this hook never fires.
			"a Buffer.from hook harvesting the nonce out of createHmac (Fable's forgery)",
			'import fsb from "node:fs";\nimport { createHmac as chB } from "node:crypto";\n' +
				"const origFrom = Buffer.from;\n" +
				"Buffer.from = function (...a) {\n" +
				'  if (typeof a[0] === "string" && a[0].length === 64 && /^[0-9a-f]+$/.test(a[0])) {\n' +
				"    const nonce = a[0];\n" +
				"    Buffer.from = origFrom;\n" +
				'    const forged = JSON.stringify({ probes: [{ name: "twice(4)", pass: true, detail: "equal" }], expected: 1, complete: true, importError: null, specError: null, node: process.version });\n' +
				'    const sig = chB("sha256", nonce).update(forged).digest("hex");\n' +
				'    fsb.writeSync(3, forged + "\\t" + sig + "\\n");\n' +
				'    throw new Error("boom");\n' +
				"  }\n" +
				"  return origFrom.apply(this, a);\n" +
				"};\n",
		],
		["a patched Array.prototype.map", 'Array.prototype.map = function () { return [{ name: "twice(4)", pass: true, detail: "equal" }]; };\n'],
		["a patched Array.prototype.push", "Array.prototype.push = function () { return 1; };\n"],
		["a patched Array.prototype[Symbol.iterator] (argument spreading)", "Array.prototype[Symbol.iterator] = function* () { yield 4; };\n"],
		["a patched TextEncoder.prototype.encode", "TextEncoder.prototype.encode = () => new Uint8Array(1);\n"],
		[
			"a patched Hmac update/digest",
			'import { createHmac as ch } from "node:crypto";\nconst proto = Object.getPrototypeOf(ch("sha256", "x"));\nproto.update = function () { return this; };\nproto.digest = () => "0".repeat(64);\n',
		],
		["a patched Error.prototype.name", 'Object.defineProperty(Error.prototype, "name", { value: "TypeError", writable: true, configurable: true });\n'],
		["an Object.prototype.pass getter", 'Object.defineProperty(Object.prototype, "pass", { get() { return true; }, configurable: true });\n'],
		["an inherited Object.prototype.args", "Object.prototype.args = [0];\n"],
		["a patched JSON.stringify and fs.writeSync", 'import fs from "node:fs";\nJSON.stringify = () => "{}";\nconst w = fs.writeSync;\nfs.writeSync = (fd, s) => w(fd, s);\n'],
		["a patched Number.prototype.toString and String.prototype.slice", 'Number.prototype.toString = () => "8";\nString.prototype.slice = () => "";\n'],
		["a patched Object.keys and Object.getPrototypeOf", 'Object.keys = () => [];\nObject.getPrototypeOf = () => Error.prototype;\n'],
		["a patched Reflect.apply", "Reflect.apply = () => 8;\n"],
		["a patched Function.prototype.call/bind", "Function.prototype.call = function () { return 8; };\nFunction.prototype.bind = function () { return () => 8; };\n"],
	];
	for (const [i, [label, prelude]] of patched.entries()) {
		const name = `patch-${i}.mjs`;
		write(name, prelude + WRONG);
		const r = evalOf(name);
		check(`A3: REJECTS a wrong fix under ${label}`, rejected(r), r.detail.slice(0, 130));
	}
	// The positive control that keeps this honest: every patch at once, plus a CORRECT fix, passes.
	write("patched-but-correct.mjs", patched.map(([, prelude]) => prelude).join("") + RIGHT);
	const control = evalOf("patched-but-correct.mjs");
	check("A3: a module that patches ALL of them and then FIXES the behaviour still PASSES", control.pass === true, control.detail.slice(0, 150));

	// A throws probe under a lying `name`/`Symbol.hasInstance`: classification is by prototype
	// identity, so a RangeError cannot present itself as the TypeError the probe requires.
	write(
		"liar-throws.mjs",
		'Object.defineProperty(Error.prototype, "name", { value: "TypeError", writable: true, configurable: true });\n' +
			'Object.defineProperty(TypeError, Symbol.hasInstance, { value: () => true, configurable: true });\n' +
			'export const boom = () => { throw new RangeError("wrong class"); };\n',
	);
	const liar = evalOf("liar-throws.mjs", [{ name: "boom throws TypeError", export: "boom", args: [], throws: "TypeError" }]);
	check("A3: a RangeError renamed TypeError (and faking hasInstance) is still REJECTED", rejected(liar), liar.detail.slice(0, 130));
	check("A3: …named for what it actually threw", /threw RangeError, expected TypeError/.test(liar.detail), liar.detail.slice(0, 130));
	write("honest-throws.mjs", 'export const boom = () => { throw new TypeError("right class"); };\n');
	check("A3: a real TypeError still satisfies a throws probe", evalOf("honest-throws.mjs", [{ name: "boom", export: "boom", args: [], throws: "TypeError" }]).pass === true);

	// byteLengthAtMost is measured with a captured Buffer.byteLength, not the module's TextEncoder.
	write("fake-encode.mjs", "TextEncoder.prototype.encode = () => new Uint8Array(1);\nexport const pad = () => \"x\".repeat(50);\n");
	const fakeEncode = evalOf("fake-encode.mjs", [{ name: "pad ≤ 10 bytes", export: "pad", args: [], byteLengthAtMost: 10 }]);
	check("A3: a patched TextEncoder cannot shrink a byte-length probe", rejected(fakeEncode), fakeEncode.detail.slice(0, 120));
	check("A3: …and the real byte count is reported", /50 bytes, limit 10/.test(fakeEncode.detail), fakeEncode.detail.slice(0, 120));

	// ── A3 (mechanical). WHICH writable properties does the post-import path actually reach? ─────
	// The patch matrix above tests the surfaces we thought of; this one ENUMERATES them. The module
	// wraps every writable, configurable function property on the globals the evaluator could plausibly
	// touch, and records the ones reached while control is OUTSIDE the module — i.e. by the evaluator
	// itself, between and after the probes. The answer must be NONE: one such reach is exactly how the
	// `Buffer.from` forgery worked, and it is the check that would have caught it without knowing to
	// look. (`Buffer.from(json, "utf8")` for the payload used to add `Buffer.prototype.utf8Write` here,
	// which is why the payload is a string with an explicit encoding.)
	write(
		"writable-sweep.mjs",
		'import fsSpy from "node:fs";\n' +
			"const writeFileSync = fsSpy.writeFileSync;\n" +
			"const applyOrig = Reflect.apply;\nconst construct = Reflect.construct;\nconst ownKeys = Reflect.ownKeys;\n" +
			"const getDesc = Object.getOwnPropertyDescriptor;\nconst defineProp = Object.defineProperty;\n" +
			"const log = [];\nlet armed = false;\nlet inside = false;\n" +
			"const targets = [[\"Buffer\", Buffer], [\"Buffer.prototype\", Buffer.prototype], [\"String.prototype\", String.prototype], [\"Number.prototype\", Number.prototype], [\"Object\", Object], [\"Object.prototype\", Object.prototype], [\"Array\", Array], [\"Array.prototype\", Array.prototype], [\"Function.prototype\", Function.prototype], [\"Reflect\", Reflect], [\"JSON\", JSON], [\"Error.prototype\", Error.prototype], [\"TextEncoder.prototype\", TextEncoder.prototype], [\"Uint8Array.prototype\", Uint8Array.prototype], [\"TypedArray.prototype\", Object.getPrototypeOf(Uint8Array.prototype)], [\"process\", process]];\n" +
			'const skip = new Set(["constructor", "__proto__", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "call", "apply", "bind", "defineProperty", "getOwnPropertyDescriptor", "ownKeys"]);\n' +
			"for (const [label, obj] of targets) {\n" +
			"  for (const key of ownKeys(obj)) {\n" +
			'    if (typeof key !== "string" || skip.has(key)) continue;\n' +
			"    const d = getDesc(obj, key);\n" +
			'    if (!d || typeof d.value !== "function" || !d.writable || !d.configurable) continue;\n' +
			'    const orig = d.value;\n    const name = label + "." + key;\n' +
			"    const w = function (...a) {\n" +
			"      if (armed && !inside) { inside = true; log[log.length] = name; inside = false; }\n" +
			"      return new.target ? construct(orig, a, new.target) : applyOrig(orig, this, a);\n" +
			"    };\n" +
			"    try { defineProp(obj, key, { ...d, value: w }); } catch {}\n" +
			"  }\n" +
			"}\n" +
			'process.on("exit", () => { try { writeFileSync(new URL("./sweep-calls.json", import.meta.url), JSON.stringify([...new Set(log)])); } catch {} });\n' +
			"const outside = (fn) => (...a) => { armed = false; try { return fn(...a); } finally { armed = true; } };\n" +
			"export const twice = outside((n) => n * 2);\n" +
			'export const boom = outside(() => { throw new TypeError("x"); });\n' +
			'export const pad = outside(() => "x".repeat(50));\n' +
			'export const label = outside(() => "héllo ≤ x");\n' +
			"export const echo = outside((v) => v);\n",
	);
	try {
		fs.unlinkSync(path.join(dir, "sweep-calls.json"));
	} catch {
		/* first run */
	}
	const sweep = evalOf("writable-sweep.mjs", [
		{ name: "twice(4)", export: "twice", args: [4], equals: 8 },
		{ name: "boom", export: "boom", args: [], throws: "TypeError" },
		{ name: "pad bytes", export: "pad", args: [], byteLengthAtMost: 60 },
		{ name: "pad includes", export: "pad", args: [], includes: "xx" },
		{ name: "non-ascii detail", export: "label", args: [], equals: "héllo ≤ x" },
		{ name: "materialised arg", export: "echo", args: [{ $: "longText", n: 4 }], equals: "xxxx" },
	]);
	check("A3 sweep: the evaluator still grades correctly with every writable global wrapped", sweep.pass === true, sweep.detail.slice(0, 140));
	const reached = JSON.parse(fs.readFileSync(path.join(dir, "sweep-calls.json"), "utf8"));
	check("A3 sweep: …and reaches NO user-writable function property after the import", reached.length === 0, JSON.stringify(reached).slice(0, 200));

	// ── A4. non-primitive returns are rejected EXPLICITLY, before `===` ──────────────────────────
	for (const [label, body, pattern] of [
		["a boxed String", 'export const twice = () => new String("8");\n', /non-primitive \(object\)/],
		["a boxed Number", "export const twice = () => Object(8);\n", /non-primitive \(object\)/],
		["a thenable", "export const twice = () => ({ then(res) { res(8); } });\n", /thenable/],
		["a promise", "export const twice = async () => 8;\n", /thenable/],
		["a Symbol.toPrimitive carrier", "export const twice = () => ({ [Symbol.toPrimitive]: () => 8, valueOf: () => 8, toString: () => \"8\" });\n", /non-primitive \(object\)/],
		["a function", "export const twice = () => () => 8;\n", /function/],
		["an array", "export const twice = () => [8];\n", /array/],
	]) {
		const name = `nonprim-${label.replace(/\W+/g, "-")}.mjs`;
		write(name, body);
		const r = evalOf(name);
		check(`A4: REJECTS ${label} instead of coercing it`, rejected(r), r.detail.slice(0, 120));
		check("A4: …naming it as a non-primitive", pattern.test(r.detail), r.detail.slice(0, 120));
	}
	check("A4: a plain primitive still compares equal", evalOf("right.mjs").pass === true);
	// An expectation that is not a primitive is OUR bug, so it is a grader error.
	check("A4: a non-primitive EXPECTATION is a grader error", evalOf("right.mjs", [{ name: "bad spec", export: "twice", args: [4], equals: { n: 8 } }]).graderError === true);

	// ── A5. an unfinished evaluation is a grader error, and it is not a timeout ──────────────────
	// Node exits 13 for a top-level await that never settles — BEFORE any watchdog fires — and the
	// evaluator's exit hook signs an incomplete verdict. Grading that as a model failure would file
	// a harness fault as a wrong answer.
	write("unresolved-await.mjs", "export const twice = (n) => n * 2;\nawait new Promise(() => {});\n");
	const unresolved = evalOf("unresolved-await.mjs", TWICE, 15000);
	check("A5: an unresolved top-level await is a GRADER error, not a failure", unresolved.graderError === true, unresolved.detail.slice(0, 150));
	check("A5: …described as an unfinished evaluation", /did not finish/.test(unresolved.detail), unresolved.detail.slice(0, 150));
	// The watchdog still exists, and it is a DIFFERENT path: a busy loop never reaches exit at all.
	write("busy-loop.mjs", "const t = Date.now();\nwhile (Date.now() - t < 30000) {}\nexport const twice = (n) => n * 2;\n");
	const busy = evalOf("busy-loop.mjs", TWICE, 1200);
	check("A5: a busy loop is stopped by the watchdog, also a grader error", busy.graderError === true, busy.detail.slice(0, 120));
	check("A5: …and the two are distinguishable in the record", /could not run/.test(busy.detail) && !/could not run/.test(unresolved.detail));
	write("exit-during-import.mjs", "process.exit(0);\nexport const twice = (n) => n * 2;\n");
	const exited = evalOf("exit-during-import.mjs");
	check("A5: a module that exits during import is an unfinished evaluation too", exited.graderError === true && /did not finish/.test(exited.detail), exited.detail.slice(0, 120));
	// …and an incomplete verdict that ALREADY holds a failure is a failure, not an exclusion: a module
	// must not be able to trade a wrong answer for a grader error by killing the process afterwards.
	write("fail-then-exit.mjs", 'let n = 0;\nexport const twice = (x) => { if (++n > 1) process.exit(0); return x * 3; };\n');
	const failThenExit = evalOf("fail-then-exit.mjs", [TWICE[0], { name: "twice(5)", export: "twice", args: [5], equals: 10 }]);
	check("A5: a failure already observed before the death is still the MODEL's failure", failThenExit.pass === false && failThenExit.graderError !== true, failThenExit.detail.slice(0, 140));
	check("A5: …naming the probe that had already failed", /had already failed/.test(failThenExit.detail), failThenExit.detail.slice(0, 140));
	write("pass-then-exit.mjs", 'let n = 0;\nexport const twice = (x) => { if (++n > 1) process.exit(0); return x * 2; };\n');
	const passThenExit = evalOf("pass-then-exit.mjs", [TWICE[0], { name: "twice(5)", export: "twice", args: [5], equals: 10 }]);
	check("A5: …while killing the evaluator after PASSING probes is still a grader error", passThenExit.graderError === true, passThenExit.detail.slice(0, 140));
	write("broken-syntax.mjs", "this is not javascript {{{\n");
	const broken = evalOf("broken-syntax.mjs");
	check("A5: a module that will not IMPORT is still the model's failure", broken.pass === false && broken.graderError !== true, broken.detail.slice(0, 110));
} finally {
	fs.rmSync(dir, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
