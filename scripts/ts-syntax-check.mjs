#!/usr/bin/env node
/**
 * @module scripts/ts-syntax-check.mjs
 * @purpose Compile a TypeScript file as a module without evaluating its code.
 * @inputs One TypeScript file path.
 * @outputs Exit 0 for valid syntax or exit 1 with a filename-qualified error.
 * @effects disk (reads the source file only).
 * @errors Exits 1 for a missing argument, read failure, or syntax error.
 */
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";

const file = process.argv[2];
if (!file) {
	console.error("usage: ts-syntax-check.mjs <file.ts>");
	process.exit(1);
}

try {
	const source = readFileSync(file, "utf8");
	const javascript = stripTypeScriptTypes(source, { mode: "strip" });
	new vm.SourceTextModule(javascript, { identifier: file });
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	const code = error && typeof error === "object" && "code" in error ? `${error.code}: ` : "";
	console.error(`${file}: ${code}${message}`);
	process.exit(1);
}
