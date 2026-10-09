/**
 * @module packages/nana-setup/tests/stub-pi.mjs
 * @purpose Put a harmless scratch pi executable first on PATH for tests that run doctor.
 * @inputs the shared temporary-directory helper and process PATH.
 * @outputs a PATH entry containing a pi version stub.
 * @effects disk (creates a temporary executable), process environment (sets PATH until exit).
 * @errors propagates temporary-directory and file creation errors.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const bin = tmpDir(path.join(os.tmpdir(), "nana-doctor-pi-stub-"));
const file = path.join(bin, process.platform === "win32" ? "pi.cmd" : "pi");
fs.writeFileSync(file, process.platform === "win32" ? "@echo off\necho pi 1.0.2\n" : "#!/bin/sh\necho pi 1.0.2\n");
if (process.platform !== "win32") fs.chmodSync(file, 0o755);
process.env.PATH = `${bin}${path.delimiter}${process.env.PATH || ""}`;
