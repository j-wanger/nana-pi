// TRUSTED EVALUATOR. A separate process, a separate file, never inside the fixture.
//
// Why this exists. The previous design counted `PASS` lines a test suite printed and blocked
// `process.exit` from untrusted frames. Both are same-process trust claims, and a reviewer broke
// them from entirely inside the lines the task allows the model to edit: `process['exit']` and
// `process.stdout['write']` evade a literal token denylist, `Error.prepareStackTrace` fabricates a
// trusted stack frame, and the sentinel's own `__benchOriginal` handed back the real exit. Adding
// denylist entries cannot close that class — anything sharing mutable globals with the code under
// test is forgeable.
//
// So this evaluator does not grade EVIDENCE. It grades BEHAVIOUR:
//   * the parent hands us a random nonce plus the probe spec over file descriptor 4 — not argv, not
//     the environment, nowhere the module can read it, and the parent UNLINKS that file before we
//     are spawned, so the nonce is not sitting on disk either;
//   * we consume and CLOSE fd 4, and capture every function we will later need into closure
//     variables, all before a single line of untrusted code is imported;
//   * we import the module and call the named exports with the given arguments, comparing returned
//     PRIMITIVES with `===` — no stdout, no JSON of untrusted values, no overridable prototype
//     method on anything the module produced;
//   * we write ONE verdict line to fd 3: the JSON plus HMAC-SHA256(nonce, JSON).
//
// PROTOTYPE INDEPENDENCE (astra round 5, dimension A3). Capturing `JSON.stringify` is not enough:
// the original `JSON.stringify` still calls an inherited `Object.prototype.toJSON`, so a module that
// defines one rewrites the verdict it is being judged by — that produced a signed PASS for a wrong
// answer. Nothing between the import and the signature may therefore touch a mutable prototype:
//   * the verdict is serialised by a hand-rolled serialiser over captured primitives only (indexed
//     array loops, captured `Object.keys` + own-property checks, no `toJSON`, no `Array.prototype`);
//   * the HMAC is built from captured `createHmac` AND captured `Hmac.prototype.update/digest`,
//     uncurried through a `Function.prototype.call` binding taken before the import;
//   * every probe call goes through captured `Reflect.apply`, never `fn(...args)` — argument
//     spreading reads `Array.prototype[Symbol.iterator]`;
//   * error classification walks the thrown value's prototype chain with captured
//     `Object.getPrototypeOf` and compares prototype IDENTITY — never `.name` (a writable property)
//     and never `instanceof` (which consults a patchable `Symbol.hasInstance`);
//   * every probe field is read as an OWN property, so `Object.prototype.args` cannot substitute
//     arguments for a probe that declares none.
//
// The module may write whatever it likes to fd 3, stdout, or the filesystem; it cannot produce a
// line whose HMAC verifies, because the nonce is gone from every reachable surface before it runs.
// The parent ignores exit status and stdout entirely, accepts EXACTLY ONE signed line, and treats an
// unfinished evaluation (a module that exits during import, or a top-level await that never settles
// and makes Node exit 13) as a GRADER error. No signed verdict = no pass.
//
// THREAT MODEL. Out of scope: a module that scans this process's memory for the nonce (Node offers
// no in-process isolation against that, and defending it would need a separate privilege domain).
// Also out of scope: a module that detects it is being evaluated and returns correct values only
// then — that is indistinguishable from having implemented the behaviour, which is what we are
// asking for, and the diff-shape rule bounds where it could hide.

import { createHmac } from "node:crypto";
import fs from "node:fs";

// ── everything below is captured BEFORE any untrusted import ──────────────────────────────────
// `Function.prototype.call.bind(fn)` resolves `.call` and `.bind` NOW: the returned function
// applies the ORIGINAL `fn` to (thisArg, …args) even if `fn`, its prototype, or Function.prototype
// is replaced afterwards.
const uncurry = (fn) => Function.prototype.call.bind(fn);

const writeSync = fs.writeSync;
const closeSync = fs.closeSync;
const readSync = fs.readSync;
const hmac = createHmac;
const parse = JSON.parse; // pre-import only: the spec is OUR json, read before anything is imported
const isNaN_ = Number.isNaN;
const isFinite_ = Number.isFinite;
const isArray = Array.isArray;
const ownKeys = Object.keys;
const getProto = Object.getPrototypeOf;
const reflectApply = Reflect.apply;
const bufAlloc = Buffer.alloc;
const byteLengthOf = Buffer.byteLength;
const fromCharCode = String.fromCharCode;
const addListener = process.on.bind(process);
const NODE_VERSION = process.version;
const POS_INF = Number.POSITIVE_INFINITY;
const NEG_INF = Number.NEGATIVE_INFINITY;
const NAN = Number.NaN;

const hasOwnOf = uncurry(Object.prototype.hasOwnProperty);
const strSlice = uncurry(String.prototype.slice);
const strIndexOf = uncurry(String.prototype.indexOf);
const strRepeat = uncurry(String.prototype.repeat);
const charCodeAt = uncurry(String.prototype.charCodeAt);
const numToString = uncurry(Number.prototype.toString);
const bufToString = uncurry(Buffer.prototype.toString);
// `hmac(...)` returns an Hmac whose `update`/`digest` live on a prototype the module can patch, so
// take the functions themselves from a throwaway instance while the world is still ours.
const hmacProbe = hmac("sha256", "capture-only");
const hmacUpdate = uncurry(hmacProbe.update);
const hmacDigest = uncurry(hmacProbe.digest);
// Prototype IDENTITY, not names: `.name` is writable and `instanceof` is interceptable.
const ERROR_PROTOS = [
	["TypeError", TypeError.prototype],
	["RangeError", RangeError.prototype],
	["SyntaxError", SyntaxError.prototype],
	["ReferenceError", ReferenceError.prototype],
	["EvalError", EvalError.prototype],
	["URIError", URIError.prototype],
	["Error", Error.prototype],
];

/** Read fd 4 to EOF, then close it, so the nonce is unreachable from here on. */
function consumeSpecFd() {
	let out = "";
	const size = 65536;
	const buf = bufAlloc(size);
	for (;;) {
		let n = 0;
		try {
			n = readSync(4, buf, 0, size, null);
		} catch {
			break;
		}
		if (!n) break;
		out += bufToString(buf, "utf8", 0, n);
	}
	try {
		closeSync(4);
	} catch {
		/* already closed */
	}
	return out;
}

const raw = consumeSpecFd();
let spec = null;
try {
	spec = parse(raw);
} catch {
	spec = null;
}
const NONCE = spec?.nonce ?? null;
const MODULE = spec?.module ?? null;
const PROBES = isArray(spec?.probes) ? spec.probes : [];
spec = null; // drop the last easy reference to the nonce string container

// ── verdict serialisation: captured primitives only, no prototype method on any value ─────────
const HEX = "0123456789abcdef";
const hexDigit = (v) => fromCharCode(charCodeAt(HEX, v & 15));
const hex4 = (c) => hexDigit(c >> 12) + hexDigit(c >> 8) + hexDigit(c >> 4) + hexDigit(c);

/** JSON string literal, ASCII-only so no encoding can reinterpret what we signed. */
function serString(s) {
	let out = '"';
	const n = s.length; // an own property of a primitive string
	for (let i = 0; i < n; i++) {
		const c = charCodeAt(s, i);
		if (c === 34) out += '\\"';
		else if (c === 92) out += "\\\\";
		else if (c >= 32 && c <= 126) out += fromCharCode(c);
		else out += `\\u${hex4(c)}`;
	}
	return `${out}"`;
}

/**
 * The hand-rolled serialiser. It NEVER consults `toJSON`, an iterator, or any method on the value:
 * numbers/strings/booleans/null by capture, arrays by indexed loop, plain objects by captured
 * `Object.keys` plus an own-property check. Anything else becomes an inert `<type>` string.
 */
function serialize(v) {
	const t = typeof v;
	if (v === null || t === "undefined") return "null";
	if (t === "string") return serString(v);
	if (t === "boolean") return v ? "true" : "false";
	if (t === "number") return isFinite_(v) ? numToString(v, 10) : "null";
	if (t === "object") {
		if (isArray(v)) {
			let out = "[";
			const n = v.length;
			for (let i = 0; i < n; i++) out += (i ? "," : "") + serialize(v[i]);
			return `${out}]`;
		}
		const keys = ownKeys(v);
		let out = "{";
		let first = true;
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			if (!hasOwnOf(v, k)) continue;
			out += (first ? "" : ",") + serString(k) + ":" + serialize(v[k]);
			first = false;
		}
		return `${out}}`;
	}
	return serString(`<${t}>`);
}

let sent = false;
function emit(verdict) {
	if (sent || !NONCE) return;
	sent = true;
	const json = serialize(verdict);
	const h = hmac("sha256", NONCE);
	hmacUpdate(h, json);
	const sig = hmacDigest(h, "hex");
	try {
		writeSync(3, `${json}\t${sig}\n`);
	} catch {
		/* the parent will see no signed verdict and fail closed */
	}
}

// If the module exits or crashes the process during import — including Node's exit 13 for a
// top-level await that never settles — still report, SIGNED, so the parent can distinguish "did not
// finish" (a grader error) from "no evaluator at all".
const state = { probes: [], expected: PROBES.length, complete: false, importError: null, specError: null, node: NODE_VERSION };
addListener("exit", () => emit(state));

/** Own-property read: `Object.prototype.args` must not become a probe's arguments. */
const own = (obj, key) => (obj !== null && typeof obj === "object" && hasOwnOf(obj, key) ? obj[key] : undefined);

const isPrimitive = (v) => {
	const t = typeof v;
	return v === null || t === "string" || t === "number" || t === "boolean" || t === "undefined" || t === "bigint";
};

/** Primitive → display string without Number/String prototype methods on the value. */
function str(v) {
	const t = typeof v;
	if (t === "string") return v;
	if (t === "number") return isFinite_(v) ? numToString(v, 10) : isNaN_(v) ? "NaN" : v > 0 ? "Infinity" : "-Infinity";
	if (v === true) return "true";
	if (v === false) return "false";
	if (v === null) return "null";
	if (t === "undefined") return "undefined";
	return `<${t}>`;
}

/** A value we are willing to put in a verdict without touching untrusted machinery. */
const safe = (v) => {
	if (typeof v === "string") return v.length > 200 ? `${strSlice(v, 0, 200)}…` : v;
	return str(v);
};

/**
 * JSON cannot carry Infinity, NaN, undefined, -0 or a 5 KB filler string, so a probe may name one
 * from this CLOSED set. Nothing here is provided by the module. (`-0` needs the escape because
 * `JSON.stringify(-0)` is "0": a literal in the task file would silently become +0.)
 */
function materialise(arg) {
	if (arg === null || typeof arg !== "object") return arg;
	const tag = own(arg, "$");
	if (typeof tag !== "string") return arg;
	if (tag === "Infinity") return POS_INF;
	if (tag === "-Infinity") return NEG_INF;
	if (tag === "NaN") return NAN;
	if (tag === "undefined") return undefined;
	if (tag === "-0") return -0;
	if (tag === "longText") {
		const n = own(arg, "n");
		return strRepeat("x", typeof n === "number" ? n : 5000);
	}
	return arg;
}

/**
 * Which error class was thrown, decided by walking the value's own prototype chain with a captured
 * `Object.getPrototypeOf`. The chain is walked from the value upwards, so the FIRST prototype that
 * matches is the most specific one. `.name` and `instanceof` are both forgeable and unused.
 */
function classify(err) {
	const t = typeof err;
	if (err === null || (t !== "object" && t !== "function")) return `non-error(${t})`;
	let proto;
	try {
		proto = getProto(err);
	} catch {
		return "unknown";
	}
	for (let depth = 0; proto && depth < 32; depth++) {
		for (let i = 0; i < ERROR_PROTOS.length; i++) if (ERROR_PROTOS[i][1] === proto) return ERROR_PROTOS[i][0];
		try {
			proto = getProto(proto);
		} catch {
			break;
		}
	}
	return `non-error(${t})`;
}

/** The kind of a non-primitive return, for a detail line — never by calling anything on it. */
function kindOf(v) {
	const t = typeof v;
	if (t !== "object") return t;
	if (isArray(v)) return "array";
	let hasThen = false;
	try {
		hasThen = typeof v.then === "function";
	} catch {
		hasThen = false;
	}
	return hasThen ? "thenable" : "object";
}

function runProbe(mod, p) {
	const declaredName = own(p, "name");
	const exportName = own(p, "export");
	const out = { name: typeof declaredName === "string" ? declaredName : `${str(exportName)}(…)`, pass: false, detail: "" };
	const fn = typeof exportName === "string" && mod ? mod[exportName] : undefined;
	if (typeof fn !== "function") {
		out.detail = `export ${str(exportName)} is ${typeof fn}, not a function`;
		return out;
	}
	const rawArgs = own(p, "args");
	const args = [];
	if (isArray(rawArgs)) {
		const n = rawArgs.length;
		for (let i = 0; i < n; i++) args[i] = materialise(rawArgs[i]);
	}
	let value;
	let thrown = null;
	let threw = false;
	try {
		// captured Reflect.apply: `fn(...args)` would read Array.prototype[Symbol.iterator].
		value = reflectApply(fn, undefined, args);
	} catch (e) {
		thrown = e;
		threw = true;
	}

	if (hasOwnOf(p, "throws")) {
		const want = own(p, "throws");
		if (!threw) {
			out.detail = `expected a ${str(want)} but it returned ${safe(value)}`;
			return out;
		}
		const cls = classify(thrown);
		if (cls !== want) {
			out.detail = `threw ${cls}, expected ${str(want)}`;
			return out;
		}
		out.pass = true;
		out.detail = `threw ${cls}, as required`;
		return out;
	}
	if (threw) {
		out.detail = `threw ${classify(thrown)} unexpectedly`;
		return out;
	}
	if (hasOwnOf(p, "equals")) {
		const want = own(p, "equals");
		if (!isPrimitive(want)) {
			out.detail = `probe expectation is a non-primitive (${kindOf(want)}) — the spec is wrong, not the module`;
			out.specError = out.detail;
			return out;
		}
		// EXPLICIT non-primitive rejection before `===`. A boxed String, a thenable, a
		// Symbol.toPrimitive carrier or a function would all fail `===` anyway, but saying so is
		// what keeps the comparison from ever depending on a coercion hook the module wrote.
		if (!isPrimitive(value)) {
			out.detail = `returned a non-primitive (${kindOf(value)}) — a probe compares primitives with ===`;
			return out;
		}
		const hit = typeof want === "number" && isNaN_(want) ? typeof value === "number" && isNaN_(value) : value === want;
		out.pass = hit;
		out.detail = hit ? "equal" : `got ${safe(value)}, want ${safe(want)}`;
		return out;
	}
	if (hasOwnOf(p, "byteLengthAtMost")) {
		const limit = own(p, "byteLengthAtMost");
		if (typeof limit !== "number") {
			out.detail = "probe byteLengthAtMost is not a number — the spec is wrong, not the module";
			out.specError = out.detail;
			return out;
		}
		const n = typeof value === "string" ? byteLengthOf(value, "utf8") : -1;
		out.pass = n >= 0 && n <= limit;
		out.detail = out.pass ? `${str(n)} bytes ≤ ${str(limit)}` : `${str(n)} bytes, limit ${str(limit)}`;
		return out;
	}
	if (hasOwnOf(p, "includes")) {
		const needle = own(p, "includes");
		if (typeof needle !== "string") {
			out.detail = "probe includes is not a string — the spec is wrong, not the module";
			out.specError = out.detail;
			return out;
		}
		const hit = typeof value === "string" && strIndexOf(value, needle) >= 0;
		out.pass = hit;
		out.detail = hit ? "substring present" : `does not contain ${safe(needle)}`;
		return out;
	}
	out.detail = "probe declares no assertion — the spec is wrong, not the module";
	out.specError = out.detail;
	return out;
}

let mod = null;
try {
	// try/catch rather than `.catch(…)`: the rejection handler would be read off Promise.prototype.
	mod = await import(MODULE);
} catch (e) {
	let msg = "";
	const m = own(e, "message");
	if (typeof m === "string") msg = strSlice(m, 0, 300);
	const code = own(e, "code");
	state.importError = `${typeof code === "string" ? code : "import failed"}: ${msg || classify(e)}`;
	mod = null;
}
if (mod) {
	const n = PROBES.length;
	for (let i = 0; i < n; i++) {
		const result = runProbe(mod, PROBES[i]);
		if (result.specError && !state.specError) state.specError = result.specError;
		state.probes[state.probes.length] = result; // own `length`, never Array.prototype.push
	}
	state.complete = true;
}
emit(state);
