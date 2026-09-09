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
//     the environment, nowhere the module can read it;
//   * we consume and CLOSE fd 4, and capture every function we will later need into closure
//     variables, all before a single line of untrusted code is imported;
//   * we import the module and call the named exports with the given arguments, comparing returned
//     PRIMITIVES with `===` — no stdout, no JSON of untrusted values, no overridable prototype
//     method on anything the module produced;
//   * we write ONE verdict line to fd 3: the JSON plus HMAC-SHA256(nonce, JSON).
//
// The module may write whatever it likes to fd 3, stdout, or the filesystem; it cannot produce a
// line whose HMAC verifies, because the nonce is gone from every reachable surface before it runs.
// The parent ignores exit status and stdout entirely. No signed verdict = no pass.
//
// THREAT MODEL. Out of scope: a module that scans this process's memory for the nonce (Node offers
// no in-process isolation against that, and defending it would need a separate privilege domain).
// Also out of scope: a module that detects it is being evaluated and returns correct values only
// then — that is indistinguishable from having implemented the behaviour, which is what we are
// asking for, and the diff-shape rule bounds where it could hide.

import { createHmac } from "node:crypto";
import fs from "node:fs";

// ── everything below is captured BEFORE any untrusted import ──────────────────────────────────
const writeSync = fs.writeSync;
const closeSync = fs.closeSync;
const readSync = fs.readSync;
const hmac = createHmac;
const stringify = JSON.stringify;
const parse = JSON.parse;
const isNaN_ = Number.isNaN;
const isArray = Array.isArray;
const getOwn = Object.prototype.hasOwnProperty;
const Encoder = TextEncoder;
const indexOf = String.prototype.indexOf;
const ERROR_CLASSES = { Error, TypeError, RangeError, SyntaxError, ReferenceError };
const addListener = process.on.bind(process);

/** Read fd 4 to EOF, then close it, so the nonce is unreachable from here on. */
function consumeSpecFd() {
	let out = "";
	const buf = Buffer.alloc(65536);
	for (;;) {
		let n = 0;
		try {
			n = readSync(4, buf, 0, buf.length, null);
		} catch {
			break;
		}
		if (!n) break;
		out += buf.toString("utf8", 0, n);
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

let sent = false;
function emit(verdict) {
	if (sent || !NONCE) return;
	sent = true;
	const json = stringify(verdict);
	const sig = hmac("sha256", NONCE).update(json).digest("hex");
	try {
		writeSync(3, `${json}\t${sig}\n`);
	} catch {
		/* the parent will see no signed verdict and fail closed */
	}
}

// If the module exits or crashes the process during import, still report — signed — so the parent
// distinguishes "did not finish" from "no evaluator at all".
const state = { probes: [], complete: false, importError: null, node: process.version };
addListener("exit", () => emit(state));

/** A value we are willing to put in a verdict without touching untrusted machinery. */
const safe = (v) => {
	const t = typeof v;
	if (v === null) return null;
	if (t === "string") return v.length > 200 ? `${v.slice(0, 200)}…` : v;
	if (t === "number" || t === "boolean" || t === "undefined") return t === "number" && isNaN_(v) ? "NaN" : v;
	return `<${t}>`;
};

const byteLength = (s) => (typeof s === "string" ? new Encoder().encode(s).length : -1);

/**
 * JSON cannot carry Infinity, NaN, undefined or a 5 KB filler string, so a probe may name one from
 * this CLOSED set. Nothing here is provided by the module.
 */
function materialise(arg) {
	if (!arg || typeof arg !== "object" || !getOwn.call(arg, "$")) return arg;
	switch (arg.$) {
		case "Infinity":
			return Number.POSITIVE_INFINITY;
		case "-Infinity":
			return Number.NEGATIVE_INFINITY;
		case "NaN":
			return Number.NaN;
		case "undefined":
			return undefined;
		case "longText":
			return "x".repeat(typeof arg.n === "number" ? arg.n : 5000);
		default:
			return arg;
	}
}

function classify(err) {
	for (const name of ["TypeError", "RangeError", "SyntaxError", "ReferenceError", "Error"]) {
		if (err instanceof ERROR_CLASSES[name]) return name;
	}
	return typeof err;
}

function runProbe(mod, p) {
	const out = { name: p.name ?? `${p.export}(…)`, pass: false, detail: "" };
	const fn = mod?.[p.export];
	if (typeof fn !== "function") {
		out.detail = `export ${p.export} is ${typeof fn}, not a function`;
		return out;
	}
	const args = (p.args ?? []).map(materialise);
	let value;
	let thrown = null;
	try {
		value = fn(...args);
	} catch (e) {
		thrown = e;
	}

	if (getOwn.call(p, "throws")) {
		if (!thrown) {
			out.detail = `expected a ${p.throws} but it returned ${safe(value)}`;
			return out;
		}
		const cls = classify(thrown);
		if (cls !== p.throws) {
			out.detail = `threw ${cls}, expected ${p.throws}`;
			return out;
		}
		out.pass = true;
		out.detail = `threw ${cls}, as required`;
		return out;
	}
	if (thrown) {
		out.detail = `threw ${classify(thrown)} unexpectedly`;
		return out;
	}
	if (getOwn.call(p, "equals")) {
		const want = p.equals;
		const hit = typeof want === "number" && isNaN_(want) ? typeof value === "number" && isNaN_(value) : value === want;
		out.pass = hit;
		out.detail = hit ? "equal" : `got ${safe(value)}, want ${safe(want)}`;
		return out;
	}
	if (getOwn.call(p, "byteLengthAtMost")) {
		const n = byteLength(value);
		out.pass = n >= 0 && n <= p.byteLengthAtMost;
		out.detail = out.pass ? `${n} bytes ≤ ${p.byteLengthAtMost}` : `${n} bytes, limit ${p.byteLengthAtMost}`;
		return out;
	}
	if (getOwn.call(p, "includes")) {
		const hit = typeof value === "string" && indexOf.call(value, p.includes) >= 0;
		out.pass = hit;
		out.detail = hit ? "substring present" : `does not contain ${safe(p.includes)}`;
		return out;
	}
	out.detail = "probe declares no assertion";
	return out;
}

const mod = await import(MODULE).catch((e) => {
	state.importError = `${e?.code ?? "import failed"}: ${String(e?.message ?? e).slice(0, 300)}`;
	return null;
});
if (mod) {
	for (const p of PROBES) state.probes.push(runProbe(mod, p));
	state.complete = true;
}
emit(state);
