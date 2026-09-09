/**
 * Check receipts — content-bound evidence for post-edit checks.
 *
 * A receipt records that a configured check RAN over specific file CONTENTS and
 * what it concluded. It is the foundation atom a later `/nana-verify` reads to
 * tell "this check passed for these contents" from a stale or failed result.
 *
 * Two properties make a receipt trustworthy:
 *  - status is a DISTINCT value (checks_passed | checks_failed | error |
 *    timeout | not_run) — a checker that could not run is never folded into
 *    "passed".
 *  - the binding is a sha256 over the checker's DECLARED INPUTS' bytes, not
 *    their paths. Re-editing an already-dirty file changes contents but not the
 *    filename, so a path/filename binding would wrongly still read "current";
 *    a content digest goes stale, which is the whole point.
 *
 * Claim scope (hard): a receipt claims at most "this check passed for these
 * contents". The status vocabulary is exactly the enum above plus `stale`
 * (a read-side determination). No `verified` / `done` / `complete`.
 *
 * Storage: receipts live OUTSIDE any source tree, best-effort (never crash the
 * agent), keyed by repo + checker so the latest receipt for a checker is
 * findable. Default: ~/.pi/agent/receipts/<repoHash>/<checkerHash>.json.
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { NanaPackConfig } from "./config.ts";

/** Exit classification — error/timeout/not_run are NEVER folded into passed. */
export type CheckStatus = "checks_passed" | "checks_failed" | "error" | "timeout" | "not_run";
/** Read-side freshness — orthogonal to the pass/fail verdict. */
export type ReceiptState = "current" | "stale";

const STATUSES = new Set<CheckStatus>(["checks_passed", "checks_failed", "error", "timeout", "not_run"]);

export interface ReceiptInput {
	/** Repo-relative when inside the workspace, absolute otherwise. */
	path: string;
	/** sha256 of the file's bytes (contents, not path). */
	sha256: string;
}

export interface CheckReceipt {
	v: 1;
	ts: string;
	/** Workspace root the check ran in (repo key). */
	repoRoot: string;
	/** Checker identity: the resolved command TEMPLATE (stable across files). */
	checker: string;
	/** Exact invocation as run (post-substitution). */
	command: string;
	cwd: string;
	/** Distinct exit classification — see CheckStatus. */
	status: CheckStatus;
	/** Raw process exit code when the checker actually exited, else null. */
	exitCode: number | null;
	/** Declared inputs hashed AFTER the check completed. */
	inputs: ReceiptInput[];
	/** Combined digest over `inputs` (AFTER the check — reflects in-place formatting). */
	digest: string;
	/** Combined digest over the same inputs BEFORE the check ran, or null. */
	digestBefore: string | null;
	/**
	 * false when a checker mutated its declared inputs mid-run (digest before !=
	 * after — e.g. a formatter). The result is inconclusive: the check saw
	 * contents it then overwrote, so the receipt is not cleanly current.
	 */
	inputsStableDuringCheck: boolean;
}

function sha256(buf: Buffer | string): string {
	return crypto.createHash("sha256").update(buf).digest("hex");
}

/** Store a path repo-relative when inside cwd, absolute otherwise (mirrors nana-handoff). */
function storePath(abs: string, cwd: string): string {
	const rel = path.relative(cwd, abs);
	return rel && !rel.startsWith("..") && !path.isAbsolute(rel) ? rel : abs;
}

function resolveInput(p: string, cwd: string): string {
	return path.isAbsolute(p) ? p : path.join(cwd, p);
}

/**
 * Best-effort realpath: resolve symlinks when the path exists so a symlink or
 * case-variant path into the receipt store is still excluded. Falls back to the
 * lexical resolve when the path does not exist yet or realpath fails. Advisory
 * only — nana-pi is not a security boundary — so this is belt-and-suspenders,
 * not a canonicalization guarantee.
 */
function realResolve(p: string): string {
	const resolved = path.resolve(p);
	try {
		return fs.realpathSync(resolved);
	} catch {
		return resolved;
	}
}

/** True when `abs` lives inside `dir` (used to keep the receipt file out of any digest). */
export function isInside(abs: string, dir: string): boolean {
	if (typeof abs !== "string" || typeof dir !== "string") return false; // malformed config → not inside
	const a = realResolve(abs);
	const d = realResolve(dir);
	return a === d || a.startsWith(d + path.sep);
}

/** sha256 over the SORTED "storedPath\0sha256" lines of the given input strings. */
function combine(inputs: ReceiptInput[]): string {
	const sorted = [...inputs].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
	return sha256(sorted.map((i) => `${i.path}\0${i.sha256}`).join("\n"));
}

/**
 * Digest the declared inputs (by their byte contents). Returns null if any
 * declared input is unreadable — a missing input means we cannot form a clean
 * binding, and callers treat that as inconclusive rather than "matching".
 */
export function computeInputsDigest(
	absPaths: string[],
	cwd: string,
): { digest: string; inputs: ReceiptInput[] } | null {
	try {
		const inputs: ReceiptInput[] = [];
		for (const abs of absPaths) {
			inputs.push({ path: storePath(abs, cwd), sha256: sha256(fs.readFileSync(abs)) });
		}
		inputs.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
		return { digest: combine(inputs), inputs };
	} catch {
		return null;
	}
}

export function receiptsDir(cfg: NanaPackConfig): string {
	// A non-string `dir` (malformed config) is treated as unset → default, so no
	// config shape can feed a non-string into path APIs downstream.
	return typeof cfg.receipts.dir === "string"
		? cfg.receipts.dir
		: path.join(os.homedir(), ".pi", "agent", "receipts");
}

/** One file per (repo, checker) so the latest receipt for a checker is findable. */
export function receiptPath(cfg: NanaPackConfig, repoRoot: string, checker: string): string {
	return path.join(receiptsDir(cfg), sha256(repoRoot).slice(0, 16), `${sha256(checker).slice(0, 16)}.json`);
}

/** Best-effort write; observability must never break the agent (mirrors appendJournal). */
export function writeReceipt(cfg: NanaPackConfig, receipt: CheckReceipt): void {
	if (!cfg.receipts.enabled) return;
	if (!STATUSES.has(receipt.status)) receipt = { ...receipt, status: "not_run" }; // enforce the status enum in code
	try {
		const p = receiptPath(cfg, receipt.repoRoot, receipt.checker);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, JSON.stringify(receipt, null, 2));
	} catch {
		// best-effort by design
	}
}

export function readLatestReceipt(cfg: NanaPackConfig, repoRoot: string, checker: string): CheckReceipt | null {
	try {
		return JSON.parse(fs.readFileSync(receiptPath(cfg, repoRoot, checker), "utf-8")) as CheckReceipt;
	} catch {
		return null;
	}
}

/**
 * Read-side staleness check (this is what /nana-verify will call). Recomputes
 * the declared-inputs digest from the CURRENT workspace and compares it to the
 * receipt. Returns `stale` when the inputs changed since the receipt was
 * written, when a declared input has vanished, or when the checker mutated its
 * inputs mid-run (inconclusive). Purely a freshness signal — it does NOT judge
 * pass/fail; a reader combines it with `receipt.status`.
 */
export function receiptState(receipt: CheckReceipt, cwd: string): ReceiptState {
	if (!receipt.inputsStableDuringCheck) return "stale"; // formatter mutated inputs mid-check → inconclusive
	if (!Array.isArray(receipt.inputs) || receipt.inputs.length === 0) return "stale";
	try {
		const now: ReceiptInput[] = receipt.inputs.map((inp) => ({
			path: inp.path,
			sha256: sha256(fs.readFileSync(resolveInput(inp.path, cwd))),
		}));
		return combine(now) === receipt.digest ? "current" : "stale";
	} catch {
		return "stale"; // a declared input vanished or is unreadable → cannot confirm current
	}
}
