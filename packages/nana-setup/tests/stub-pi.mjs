/**
 * @module packages/nana-setup/tests/stub-pi.mjs
 * @purpose Put a harmless scratch pi executable first on PATH for tests that run doctor.
 * @inputs the shared temporary-directory helper and process PATH.
 * @outputs withPiStub, which runs one synchronous callback with a pi version stub on PATH.
 * @effects disk (creates a temporary executable), process environment (temporarily sets PATH).
 * @errors propagates temporary-directory and file creation errors.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const bin = tmpDir(path.join(os.tmpdir(), "nana-doctor-pi-stub-"));
const file = path.join(bin, process.platform === "win32" ? "pi.cmd" : "pi");
fs.writeFileSync(file, process.platform === "win32"
	? "@echo off\nif \"%~1\"==\"--version\" (echo 1.0.2& exit /b 0)\necho pi stub rejects %1 1>&2\nexit /b 1\n"
	: "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then printf '1.0.2\\n'; exit 0; fi\nprintf 'pi stub rejects %s\\n' \"$1\" >&2\nexit 1\n");
if (process.platform !== "win32") fs.chmodSync(file, 0o755);

export function withPiStub(callback) {
	const savedPath = process.env.PATH;
	process.env.PATH = `${bin}${path.delimiter}${savedPath || ""}`;
	try {
		return callback();
	} finally {
		if (savedPath === undefined) delete process.env.PATH;
		else process.env.PATH = savedPath;
	}
}
