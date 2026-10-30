// Seat prototype of the plan's launch and path rules (map-spawn-edges plan, revision 2).
// Measurement grounding only: the builder implements the rules in scripts/code-map-launch.mjs and
// re-runs scan.mjs and replay.mjs against the built graph. Approximations are marked APPROX.
import { posix } from "node:path";

export const LAUNCH_CALLS = ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork", "boundedSpawnSync", "runHookProducer"];
// A bare call, or a member call on a child_process namespace; never a method such as RegExp exec.
export const LAUNCH_RE = new RegExp(`(?:(?<![.\\w$])|\\b(?:cp|childProcess|child_process)\\.)(${LAUNCH_CALLS.join("|")})\\s*\\(`, "g");
const PATH_CALL_RE = /\b(?:new\s+URL|(?:path\.|posix\.|win32\.)?(?:join|resolve)|(?:url\.)?fileURLToPath)\s*\(/g;
const MODULE_EXT = /\.(?:mjs|cjs|js|ts)$/;
const SHELLS = /^(?:bash|sh|cmd|cmd\.exe|powershell|powershell\.exe|pwsh)$/;
// Declared path-preserving one-argument functions (config in the build; realPath is packages/nana-setup/lib/paths.mjs's helper).
export const PATH_PRESERVING = ["fileURLToPath", "url.fileURLToPath", "realpathSync", "fs.realpathSync", "realpathSync.native", "fs.realpathSync.native", "realPath"];
const PI_PROGRAM = /^(?:pi|PI_BIN|piBin|piPath|PI_PATH)$/;

export function callEnd(s, start) {
	let depth = 1, quote = null;
	for (let i = start; i < s.length; i++) {
		const c = s[i];
		if (quote) { if (c === "\\") i++; else if (c === quote) quote = null; }
		else if (c === '"' || c === "'" || c === "`") quote = c;
		else if (c === "(" || c === "[" || c === "{") depth++;
		else if ((c === ")" || c === "]" || c === "}") && --depth === 0) return i;
	}
	return s.length;
}

export function splitArgs(s) {
	const out = []; let depth = 0, quote = null, cur = "";
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (quote) { cur += c; if (c === "\\") { cur += s[++i] ?? ""; } else if (c === quote) quote = null; continue; }
		if (c === '"' || c === "'" || c === "`") { quote = c; cur += c; continue; }
		if ("([{".includes(c)) depth++;
		if (")]}".includes(c)) depth--;
		if (c === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
		cur += c;
	}
	if (cur.trim()) out.push(cur.trim());
	return out;
}

/** Per-module facts: assignments (name -> expr, or null when assigned twice), named imports. */
export function moduleFacts(path, source, mods) {
	const assigns = new Map();
	for (const m of source.matchAll(/\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g)) {
		const start = m.index + m[0].length;
		let end = start, depth = 0, quote = null;
		for (; end < source.length; end++) {
			const c = source[end];
			if (quote) { if (c === "\\") end++; else if (c === quote) quote = null; continue; }
			if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
			if ("([{".includes(c)) depth++;
			else if (")]}".includes(c)) { if (depth === 0) break; depth--; }
			else if ((c === ";" || c === "\n") && depth === 0) break;
		}
		const expr = source.slice(start, end).trim();
		assigns.set(m[1], assigns.has(m[1]) && assigns.get(m[1]) !== expr ? null : expr);
	}
	const imports = new Map();
	for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["'](\.{1,2}\/[^"']+)["']/g)) {
		const from = posix.normalize(posix.join(posix.dirname(path), m[2]));
		if (!mods.has(from)) continue;
		for (const part of m[1].split(",")) {
			const [orig, alias] = part.trim().split(/\s+as\s+/);
			if (orig) imports.set((alias ?? orig).trim(), { from, name: orig.trim() });
		}
	}
	return { path, source, assigns, imports };
}

/**
 * Evaluate a path expression to { kind: "file" | "dir", p } (repo-relative) or { kind: "lit", s }.
 * Anchors resolve only through import.meta.url / import.meta.dirname, local constants and imported
 * constants of mapped modules. No suffix or basename matching.
 */
export function makeEvaluator(factsByPath) {
	function evalIn(facts, expr, depth = 0) {
		if (depth > 12 || expr == null) return null;
		let e = expr.trim().replace(/\s+/g, " ");
		while (/^\(.*\)$/.test(e) && callEnd(e, 1) === e.length - 1) e = e.slice(1, -1).trim();
		e = e.replace(/\s*\.\s*(?:href|pathname)$/, "");
		let m;
		if ((m = e.match(/^(["'])((?:\\.|(?!\1).)*)\1$/))) return { kind: "lit", s: m[2] };
		if (e === "import.meta.url") return { kind: "file", p: facts.path };
		if (e === "import.meta.dirname") return { kind: "dir", p: posix.dirname(facts.path) };
		if ((m = e.match(new RegExp(`^(?:${PATH_PRESERVING.map((n) => n.replace(/\./g, "\\.")).join("|")})\\s*\\(`)))) {
			const inner = e.slice(m[0].length, callEnd(e, m[0].length));
			const a = splitArgs(inner);
			return a.length === 1 ? evalIn(facts, a[0], depth + 1) : null;
		}
		if ((m = e.match(/^(?:path\.|posix\.)?dirname\s*\(/))) {
			const a = splitArgs(e.slice(m[0].length, callEnd(e, m[0].length)));
			const v = a.length === 1 ? evalIn(facts, a[0], depth + 1) : null;
			return v && v.kind !== "lit" ? { kind: "dir", p: posix.dirname(v.p) } : null;
		}
		if ((m = e.match(/^new URL\s*\(/))) {
			const a = splitArgs(e.slice(m[0].length, callEnd(e, m[0].length)));
			if (a.length !== 2) return null;
			const rel = evalIn(facts, a[0], depth + 1), base = evalIn(facts, a[1], depth + 1);
			if (!rel || rel.kind !== "lit" || !base || base.kind === "lit") return null;
			const dir = base.kind === "file" ? posix.dirname(base.p) : base.p;
			const p = posix.normalize(posix.join(dir, rel.s));
			return { kind: /\/$|^\.\.?$/.test(rel.s) ? "dir" : "file", p: p.replace(/\/$/, "") };
		}
		if ((m = e.match(/^(?:path\.|posix\.|win32\.)?(?:join|resolve)\s*\(/))) {
			const a = splitArgs(e.slice(m[0].length, callEnd(e, m[0].length)));
			if (!a.length) return null;
			const head = evalIn(facts, a[0], depth + 1);
			if (!head) return null; // an anchor that does not trace (tmp, cwd, a parameter): no path
			if (head.kind === "lit") {
				// All-literal join: a repo-root-relative literal path, matched exactly or not at all.
				const parts = a.map((x) => evalIn(facts, x, depth + 1));
				return parts.every((v) => v && v.kind === "lit") ? { kind: "lit", s: posix.normalize(parts.map((v) => v.s).join("/")) } : null;
			}
			let p = head.p;
			for (const part of a.slice(1)) {
				const v = evalIn(facts, part, depth + 1);
				if (!v || v.kind !== "lit" || v.s.startsWith("/")) return null;
				p = posix.join(p, v.s);
			}
			p = posix.normalize(p);
			if (p.startsWith("..")) return null;
			return { kind: MODULE_EXT.test(p) ? "file" : "dir", p };
		}
		if ((m = e.match(/^[A-Za-z_$][\w$]*$/))) {
			if (facts.assigns.has(e)) return evalIn(facts, facts.assigns.get(e), depth + 1);
			const imp = facts.imports.get(e);
			if (imp && factsByPath.has(imp.from)) { const f = factsByPath.get(imp.from); return f.assigns.has(imp.name) ? evalIn(f, f.assigns.get(imp.name), depth + 1) : null; }
		}
		return null;
	}
	return evalIn;
}

/** Every resolved path expression in a module's source that names a mapped module. */
export function pathTargets(facts, evalIn, mods) {
	const out = new Set();
	for (const m of facts.source.matchAll(PATH_CALL_RE)) {
		const start = m.index;
		const end = callEnd(facts.source, m.index + m[0].length);
		const v = evalIn(facts, facts.source.slice(start, end + 1));
		if (v && v.kind === "file" && mods.has(v.p) && v.p !== facts.path) out.add(v.p);
		if (v && v.kind === "lit" && mods.has(v.s) && v.s !== facts.path) out.add(v.s);
	}
	// A string literal that is exactly a mapped module's repo-root path (or ./, ../ relative to this file).
	for (const m of facts.source.matchAll(/(["'`])((?:\.{1,2}\/)?[\w@.\/-]+\.(?:mjs|cjs|js|ts))\1/g)) {
		const lit = m[2];
		const c = lit.startsWith(".") ? posix.normalize(posix.join(posix.dirname(facts.path), lit)) : lit;
		if (mods.has(c) && c !== facts.path) out.add(c);
	}
	return out;
}

/**
 * Classify each launch call site. APPROX: one helper parameter is followed by finding call sites of
 * the enclosing named function in the same module and evaluating the bound argument.
 */
export function launchSites(facts, evalIn, mods) {
	const sites = [];
	const src = facts.source;
	const lineOf = (i) => src.slice(0, i).split("\n").length;
	for (const call of src.matchAll(LAUNCH_RE)) {
		const start = call.index + call[0].length;
		const argsText = src.slice(start, callEnd(src, start));
		const args = splitArgs(argsText);
		const program = (args[0] ?? "").replace(/^["'`]|["'`]$/g, "");
		const isFork = call[1] === "fork";
		const isNode = isFork || /process\.execPath/.test(args[0] ?? "") || program === "node" || MODULE_EXT.test(program);
		const resolvedTargets = new Set();
		const tryExpr = (expr) => {
			const v = evalIn(facts, expr);
			if (v && v.kind === "file" && mods.has(v.p)) { resolvedTargets.add(v.p); return true; }
			if (v && v.kind === "lit" && MODULE_EXT.test(v.s)) {
				// R-3000 kept behaviour: a launch-argument literal resolves from the file's folder or the repo root, exactly.
				for (const c of [posix.normalize(posix.join(posix.dirname(facts.path), v.s)), posix.normalize(v.s.replace(/^\.\//, ""))]) if (mods.has(c)) { resolvedTargets.add(c); return true; }
			}
			return false;
		};
		const pieces = [];
		for (const a of args.slice(isFork ? 0 : 1)) {
			if (a.startsWith("[")) pieces.push(...splitArgs(a.slice(1, -1)));
			else pieces.push(a);
		}
		for (const p of pieces) {
			const bare = p.replace(/^\.\.\./, "");
			if (tryExpr(bare)) continue;
			// Path calls nested inside the piece.
			for (const m of bare.matchAll(PATH_CALL_RE)) { const e = callEnd(bare, m.index + m[0].length); tryExpr(bare.slice(m.index, e + 1)); }
			// One helper parameter (APPROX).
			if (/^[A-Za-z_$][\w$]*$/.test(bare) && !facts.assigns.has(bare)) {
				const before = src.slice(0, call.index);
				const fm = [...before.matchAll(/(?:function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>)/g)].pop();
				if (fm) {
					const name = fm[1] ?? fm[3];
					const params = (fm[2] ?? fm[4]).split(",").map((x) => x.trim().replace(/\s*=.*$/, "").replace(/^\.\.\./, ""));
					const idx = params.indexOf(bare);
					if (idx >= 0) for (const c of src.matchAll(new RegExp(`\\b${name}\\s*\\(`, "g"))) {
						if (c.index === fm.index || src.slice(c.index - 9, c.index).includes("function")) continue;
						const ca = splitArgs(src.slice(c.index + c[0].length, callEnd(src, c.index + c[0].length)));
						if (ca[idx]) tryExpr(ca[idx]);
					}
				}
			}
		}
		const inline = pieces.some((p) => /^["'`]-(?:e|p|-eval|-print|-input-type(?:=module)?)["'`]$/.test(p));
		// Program through a local constant or one helper parameter (APPROX), like the arguments.
		let programs = null, wrapper = null;
		const p0 = (args[0] ?? "").trim();
		if (!isFork && /^[A-Za-z_$][\w$.]*$/.test(p0) && p0 !== "process.execPath") {
			const v = facts.assigns.has(p0) ? facts.assigns.get(p0) : null;
			if (v != null) programs = [v.trim()];
			else {
				const fm = [...src.slice(0, call.index).matchAll(/(?:function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>)/g)].pop();
				const params = fm ? (fm[2] ?? fm[4]).split(",").map((x) => x.trim().replace(/\s*=.*$/, "").replace(/^\.\.\./, "")) : [];
				const idx = params.indexOf(p0);
				if (idx >= 0) {
					wrapper = fm[1] ?? fm[3];
					programs = [];
					for (const c of src.matchAll(new RegExp(`\\b${wrapper}\\s*\\(`, "g"))) {
						if (c.index === fm.index || src.slice(Math.max(0, c.index - 9), c.index).includes("function")) continue;
						const ca = splitArgs(src.slice(c.index + c[0].length, callEnd(src, c.index + c[0].length)));
						if (ca[idx]) programs.push(ca[idx].trim());
					}
				}
			}
		}
		const lit = (x) => x.replace(/^["'`]|["'`]$/g, "");
		const nodeish = (x) => /process\.execPath/.test(x) || lit(x) === "node";
		let kind;
		if (programs && !isNode) {
			if (!programs.length) kind = wrapper ? "wrapper-passthrough" : "program-unknown";
			else if (programs.some(nodeish)) kind = resolvedTargets.size ? "resolved" : "unresolved";
			else if (programs.some((x) => PI_PROGRAM.test(lit(x)) || SHELLS.test(lit(x)))) kind = "other-program";
			else if (programs.every((x) => /^["'`]/.test(x))) kind = "external";
			else kind = "program-unknown";
		} else if (isNode) kind = resolvedTargets.size ? "resolved" : inline && !/\bimport\b|\brequire\b/.test(argsText) ? "inline-no-repo" : "unresolved";
		else if (PI_PROGRAM.test(program) || SHELLS.test(program)) kind = "other-program";
		else if (/^["'`]/.test(args[0] ?? "")) kind = "external";
		else kind = "program-unknown";
		sites.push({ line: lineOf(call.index), call: call[1], kind, wrapper, program: program.slice(0, 40), targets: [...resolvedTargets] });
	}
	return sites;
}

/** Build prototype edges onto a template graph (mutates it) and return per-module site lists. */
export function addPrototypeEdges(graph, sources) {
	const mods = new Set(graph.order);
	const factsByPath = new Map();
	for (const { path, source } of sources) if (!factsByPath.has(path)) factsByPath.set(path, moduleFacts(path, source, mods));
	const evalIn = makeEvaluator(factsByPath);
	const sitesByModule = new Map();
	for (const facts of factsByPath.values()) {
		LAUNCH_RE.lastIndex = 0;
		if (!LAUNCH_RE.test(facts.source)) continue;
		LAUNCH_RE.lastIndex = 0;
		const sites = launchSites(facts, evalIn, mods);
		sitesByModule.set(facts.path, sites);
		const targets = new Set([...pathTargets(facts, evalIn, mods), ...sites.flatMap((s) => s.targets)]);
		const from = graph.modules.get(facts.path);
		if (!from) continue;
		for (const t of targets) {
			const to = graph.modules.get(t);
			if (!to) continue;
			from.callees = [...new Set([...from.callees, t])].sort();
			to.callers = [...new Set([...to.callers, facts.path])].sort();
		}
	}
	return { graph, sitesByModule };
}
