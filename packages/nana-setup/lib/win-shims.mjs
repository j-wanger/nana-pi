/**
 * @module packages/nana-setup/lib/win-shims.mjs
 * @purpose Render extensionless sh and `.cmd` launchers for Windows PATH commands.
 * @inputs An absolute Node bin file and the directory that will hold its shims.
 * @outputs renderWinShims() returns byte-exact { sh, cmd } text; sealed suffix, line-ending and layout values.
 * @effects none
 * @errors Non-string or non-absolute inputs throw TypeError; path operations may throw their native errors.
 */
import * as path from "node:path";

// Contract: the two names Windows shell lookup needs (design §Design, R-1610), chosen 2026-10-19.
export const WIN_SHIM_SUFFIXES = Object.freeze({ sh: "", cmd: ".cmd" });
// Contract: Git Bash reads LF and cmd-shim emits CRLF (design §Design, R-1611/R-1612), npm cmd-shim 7.0.0 read 2026-10-19.
export const WIN_SHIM_LINE_ENDINGS = Object.freeze({ sh: "\n", cmd: "\r\n" });
// Contract provenance for the find_dp0/SETLOCAL/endLocal-goto template (design §Design, R-1612/R-1614).
export const WIN_CMD_SHIM_LAYOUT = "npm cmd-shim 7.0.0";

const shellQuote = (value) => `'${value.replaceAll("'", `'\\''`)}'`;
const batchPath = (value) => value.replaceAll("/", "\\").replaceAll("%", "%%");

function sameWindowsDrive(left, right) {
	const a = path.win32.parse(path.win32.resolve(left)).root;
	const b = path.win32.parse(path.win32.resolve(right)).root;
	return a.toLowerCase() === b.toLowerCase();
}

/** Render both launchers without touching disk. */
export function renderWinShims(binFile, shimDir) {
	if (typeof binFile !== "string" || typeof shimDir !== "string") throw new TypeError("binFile and shimDir must be strings");
	if (!path.isAbsolute(binFile) && !path.win32.isAbsolute(binFile)) throw new TypeError("binFile must be absolute");
	if (!path.isAbsolute(shimDir) && !path.win32.isAbsolute(shimDir)) throw new TypeError("shimDir must be absolute");

	const sh = ["#!/bin/sh", `exec node ${shellQuote(binFile)} "$@"`, ""].join(WIN_SHIM_LINE_ENDINGS.sh);
	const target = sameWindowsDrive(binFile, shimDir)
		? `"%dp0%\\${batchPath(path.win32.relative(shimDir, binFile))}"`
		: `"${batchPath(path.win32.resolve(binFile))}"`;
	const cmdLines = [
		"@ECHO off",
		"GOTO start",
		":find_dp0",
		'SET "dp0=%~dp0"',
		"EXIT /b",
		":start",
		"SETLOCAL",
		"CALL :find_dp0",
		"",
		'SET "_prog="',
		'FOR %%I IN (node.exe) DO SET "_prog=%%~$PATH:I"',
		"IF NOT DEFINED _prog (",
		"  ECHO nana PATH shim: node.exe was not found on PATH 1^>^&2",
		"  EXIT /b 1",
		")",
		"",
		`endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  ${target} %*`,
		"",
	];
	return { sh, cmd: cmdLines.join(WIN_SHIM_LINE_ENDINGS.cmd) };
}
