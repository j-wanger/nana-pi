// TRUSTED TEST HARNESS SENTINEL. Loaded with `node --require`, so it runs BEFORE the test file and
// before anything the test imports.
//
// The problem it solves: a task that lets the model edit a source file lets that file print 112
// fabricated `PASS` lines and exit 0. Counting stdout is then meaningless, because the code being
// graded produced the evidence. Exit status is meaningless for the same reason.
//
// So this sentinel, copied in from OUTSIDE the fixture at check time and therefore not editable by
// the model:
//   1. makes `process.exit` / `process.reallyExit` / `process.abort` THROW, so no code can force a
//      status or cut the run short;
//   2. attributes every stdout/stderr write to the file that made it, by reading the call stack at
//      write time, and counts `PASS`/`FAIL` lines only from a TRUSTED file list given by the
//      checker — a PASS printed by the source under test is counted as forgery, not as a pass;
//   3. writes its own completion marker in an `exit` handler. No marker means the run did not
//      finish, whatever its exit code said.
//
// Config comes from the environment, not from anything inside the fixture:
//   BENCH_SENTINEL_OUT    absolute path for the marker JSON
//   BENCH_SENTINEL_TRUST  JSON array of absolute file paths whose output is trusted

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const OUT = process.env.BENCH_SENTINEL_OUT;
// Compare REAL paths: on macOS os.tmpdir() is /var/folders/... while a stack trace reports the
// resolved /private/var/folders/..., and a trusted file that fails to match reads as forgery.
const real = (p) => {
	try {
		return fs.realpathSync(p);
	} catch {
		return path.resolve(p);
	}
};
let TRUST = [];
try {
	TRUST = JSON.parse(process.env.BENCH_SENTINEL_TRUST || "[]").map(real);
} catch {
	TRUST = [];
}

const state = { trustedPass: 0, untrustedPass: 0, fail: 0, forgedBy: [], exitAttempts: [], trustedExit: null, finished: false, exitCode: null };

/** The first stack frame that is neither this sentinel nor a node internal. */
function attribute() {
	const stack = new Error().stack || "";
	for (const raw of stack.split("\n").slice(1)) {
		const m = /\(?((?:\/|[A-Za-z]:\\)[^):]+|file:\/\/[^):]+)/.exec(raw);
		if (!m) continue;
		let file = m[1];
		if (file.startsWith("file://")) {
			try {
				file = require("node:url").fileURLToPath(file);
			} catch {
				/* leave as-is */
			}
		}
		if (file === __filename) continue;
		if (file.startsWith("node:") || raw.includes("node:internal")) continue;
		return real(file);
	}
	return null;
}

const isTrusted = (file) => Boolean(file) && TRUST.includes(file);

function countLines(chunk, source) {
	const text = typeof chunk === "string" ? chunk : Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
	for (const line of text.split("\n")) {
		if (/^PASS\b/.test(line)) {
			if (isTrusted(source)) state.trustedPass++;
			else {
				state.untrustedPass++;
				const label = source ? path.basename(source) : "unknown";
				if (!state.forgedBy.includes(label)) state.forgedBy.push(label);
			}
		} else if (/^FAIL\b/.test(line)) state.fail++;
	}
}

for (const stream of [process.stdout, process.stderr]) {
	const original = stream.write.bind(stream);
	stream.write = function benchSentinelWrite(chunk, ...rest) {
		try {
			countLines(chunk, attribute());
		} catch {
			/* accounting must never break the process it is watching */
		}
		return original(chunk, ...rest);
	};
}

// A TRUSTED test file may set its own status — that is the repo's test convention
// (`process.exit(fails ? 1 : 0)`). Nothing else may: the code under test deciding the exit status
// is precisely the forgery this sentinel exists to stop.
const guard = (name) => {
	const fn = process[name];
	if (typeof fn !== "function") return;
	process[name] = function benchSentinelGuarded(code) {
		const from = attribute();
		if (isTrusted(from)) {
			state.trustedExit = { name, code: code ?? 0, from };
			return fn.call(process, code);
		}
		state.exitAttempts.push({ name, code: code ?? null, from });
		throw new Error(`bench sentinel: ${name}(${code ?? ""}) from ${from ? path.basename(from) : "untrusted code"} is not permitted inside a graded suite`);
	};
	process[name].__benchOriginal = fn;
};
for (const name of ["exit", "reallyExit", "abort"]) guard(name);

process.on("exit", (code) => {
	state.finished = true;
	state.exitCode = code;
	if (!OUT) return;
	try {
		fs.mkdirSync(path.dirname(OUT), { recursive: true });
		fs.writeFileSync(OUT, JSON.stringify(state));
	} catch {
		/* nothing further we can do from an exit handler */
	}
});
