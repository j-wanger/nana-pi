#!/usr/bin/env node
/**
 * @module packages/nana-pack/tests/real-path.test.mjs
 * @purpose Prove realPath uses typed realpath after non-missing native failures without hiding a failure of both resolvers.
 * @inputs realPath, mutable fs.realpathSync.native, and temporary paths containing a symlink loop and directory alias.
 * @outputs PASS/FAIL lines and a summary; a nonzero exit when either requirement check fails.
 * @effects disk (temporary paths only).
 * @errors Fixture, precondition or assertion failures fail their check; the native realpath function is restored in finally.
 */
import fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { realPath } from "../lib/real-path.mjs";
import { tmpDirUnmanaged } from "./tmp-dir.mjs";

let passes = 0;
let fails = 0;
function check(title, body) {
	try {
		body();
		console.log("PASS", title);
		passes++;
	} catch (error) {
		console.log("FAIL", title, error?.message ?? String(error));
		fails++;
	}
}
function assert(condition, detail) { if (!condition) throw new Error(detail); }
function thrownBy(body, name) {
	try { body(); } catch (error) { return error; }
	throw new Error(`${name} did not throw`);
}

const originalNative = fs.realpathSync.native;
try {
	// req: R-2180
	check("R-2180: typed realpath is used for every sampled non-missing native error with and without mustExist", () => {
		const root = tmpDirUnmanaged(path.join(os.tmpdir(), "nana-real-path-fallback-"));
		const target = path.join(root, "target");
		const alias = path.join(root, "alias");
		fs.mkdirSync(target);
		try {
			fs.symlinkSync(target, alias, process.platform === "win32" ? "junction" : "dir");
			const expected = fs.realpathSync(alias);
			assert(expected !== alias, `fixture did not change the input path: ${alias}`);
			for (const code of ["EISDIR", "EIO", "EPERM", "UNKNOWN"]) {
				fs.realpathSync.native = () => { throw Object.assign(new Error(`injected ${code}`), { code }); };
				assert(realPath(alias) === expected, `${code}: without mustExist did not return typed realpath`);
				assert(realPath(alias, { mustExist: true }) === expected, `${code}: with mustExist did not return typed realpath`);
			}
		} finally {
			try { fs.unlinkSync(alias); } catch {}
			fs.rmSync(root, { recursive: true, force: true });
		}
	});
	fs.realpathSync.native = originalNative;

	// req: R-2181
	check("R-2181: when native and typed realpath both fail on an aliased symlink loop mustExist throws the native code and the default returns the input", () => {
		const root = tmpDirUnmanaged(path.join(os.tmpdir(), "nana-real-path-"));
		const real = path.join(root, "real");
		const loopdir = path.join(real, "loopdir");
		const alias = path.join(root, "alias");
		const a = path.join(loopdir, "a");
		const b = path.join(loopdir, "b");
		fs.mkdirSync(loopdir, { recursive: true });
		try {
			fs.symlinkSync("b", a, process.platform === "win32" ? "file" : undefined);
			fs.symlinkSync("a", b, process.platform === "win32" ? "file" : undefined);
			fs.symlinkSync(real, alias, process.platform === "win32" ? "junction" : "dir");
			const subject = path.join(alias, "loopdir", "a");
			const nativeError = thrownBy(() => originalNative(subject), "original native lookup");
			thrownBy(() => fs.realpathSync(subject), "typed lookup");
			const actualError = thrownBy(() => realPath(subject, { mustExist: true }), "realPath with mustExist");
			assert(actualError.code === nativeError.code, `expected native code ${nativeError.code}, got ${actualError.code}`);
			assert(realPath(subject) === subject, `expected unchanged ${subject}, got ${realPath(subject)}`);
		} finally {
			for (const entry of [alias, a, b]) {
				try { fs.unlinkSync(entry); } catch {}
			}
			fs.rmSync(root, { recursive: true, force: true });
		}
	});
} finally {
	fs.realpathSync.native = originalNative;
}

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=0`);
if (fails) process.exitCode = 1;
