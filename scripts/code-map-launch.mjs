/**
 * @module scripts/code-map-launch.mjs
 * @purpose Enrich nana-pi's import graph with exact anchored launch paths and explicit blind launch sites.
 * @inputs A code graph and its source records.
 * @outputs Reciprocal sorted edges and per-module launch sites on the same graph.
 * @effects none
 * @errors Untraceable launches remain named rather than guessed.
 */
import { posix } from "node:path";
import { LAUNCH_CALLS, PATH_PRESERVING, REPO_CODE_PROGRAMS, INLINE_FLAGS } from "./code-map-launch-config.mjs";

// A small lexical reader, not a JS evaluator: calls in comments, strings and regexes are not sites.
// Import parsing remains the template's raw-source parser, deliberately unchanged.
function quotedEnd(source, start) {
	const quote = source[start];
	let i = start + 1;
	while (i < source.length) {
		if (source[i] === "\\") { i += 2; continue; }
		if (source[i] === quote) return i + 1;
		if (quote === "`" && source.startsWith("${", i)) {
			i += 2; let depth = 1;
			while (i < source.length && depth) {
				if (["'", '"', "`"].includes(source[i])) i = quotedEnd(source, i);
				else if (source[i] === "{") { depth++; i++; }
				else if (source[i] === "}") { depth--; i++; }
				else i++;
			}
		} else i++;
	}
	return i;
}

function tokens(source) {
	const out = [];
	for (let i = 0; i < source.length;) {
		const c = source[i], start = i;
		if (/\s/.test(c)) { i++; continue; }
		if (source.startsWith("//", i)) { while (i < source.length && !/[\r\n\u2028\u2029]/.test(source[i])) i++; continue; }
		if (source.startsWith("/*", i)) { const end = source.indexOf("*/", i + 2); i = end < 0 ? source.length : end + 2; continue; }
		if (c === '"' || c === "'" || c === "`") {
			i = quotedEnd(source, i);
			out.push({ v: source.slice(start, i), kind: c === "`" ? "template" : "string", start, end: i }); continue;
		}
		const prev = out.at(-1)?.v;
		if (c === "/" && (!prev || /^(?:[=(:,;!&|?\[{}]|=>|return|yield|case)$/.test(prev))) {
			i++; let bracket = false;
			while (i < source.length) {
				const ch = source[i++];
				if (ch === "\\") i++;
				else if (ch === "[") bracket = true;
				else if (ch === "]") bracket = false;
				else if (ch === "/" && !bracket) break;
				else if (/[\r\n]/.test(ch)) break;
			}
			while (/[a-z]/i.test(source[i] ?? "") && i < source.length) i++;
			out.push({ v: source.slice(start, i), kind: "regex", start, end: i }); continue;
		}
		const word = /^[A-Za-z_$][\w$]*/.exec(source.slice(i));
		if (word) { i += word[0].length; out.push({ v: word[0], kind: "name", start, end: i }); continue; }
		const op = ["...", "=>", "?.", "===", "!==", "==", "!=", "++", "--", "&&", "||", "??"].find((s) => source.startsWith(s, i));
		i += op?.length ?? 1;
		out.push({ v: op ?? c, kind: "punct", start, end: i });
	}
	const stack = [];
	for (let i = 0; i < out.length; i++) {
		if ("([{".includes(out[i].v)) stack.push(i);
		else if (")]}".includes(out[i].v)) {
			const open = stack.pop();
			if (open !== undefined) { out[open].close = i; out[i].open = open; }
		}
	}
	return out;
}

// Balanced argument reading retains token slices, avoiding regex matches inside quoted arguments.
function callEnd(ts, start) { return ts[start]?.close ?? ts.length - 1; }
function splitArgs(ts, start, end) {
	const out = []; let from = start;
	for (let i = start; i < end; i++) {
		if (ts[i].v === ",") { out.push(ts.slice(from, i)); from = i + 1; }
		else if (ts[i].close !== undefined) i = ts[i].close;
	}
	if (from < end) out.push(ts.slice(from, end));
	return out;
}
const spelling = (ts) => ts.map((t) => t.v).join("");
const identifier = (ts) => ts.length === 1 && ts[0].kind === "name";
function literal(token) {
	if (token?.kind !== "string") return null;
	// Decode path separators and ordinary JS escapes without executing source.
	return token.v.slice(1, -1).replace(/\\(?:u([0-9a-f]{4})|x([0-9a-f]{2})|([\s\S]))/gi, (_, u, x, c) => u || x ? String.fromCharCode(parseInt(u ?? x, 16)) : ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "\n": "", "\r": "" }[c] ?? c));
}
const portable = (p) => p.replace(/\\/g, "/");
const inside = (p) => p !== ".." && !p.startsWith("../") && !posix.isAbsolute(p) && !/^[A-Za-z]:/.test(p);

function moduleFacts(path, source, mods) {
	const ts = tokens(source), assigns = new Map(), imports = new Map(), functions = [];
	for (let i = 0; i < ts.length; i++) {
		if (["const", "let", "var"].includes(ts[i].v) && ts[i + 1]?.kind === "name" && ts[i + 2]?.v === "=") {
			const name = ts[i + 1].v, start = i + 3;
			let end = start;
			while (end < ts.length) {
				if ([";", ",", "}"].includes(ts[end].v)) break;
				if (end > start && /[\r\n]/.test(source.slice(ts[end - 1].end, ts[end].start))) break;
				end = ts[end].close !== undefined ? ts[end].close + 1 : end + 1;
			}
			const expr = ts.slice(start, end), prior = assigns.get(name);
			assigns.set(name, assigns.has(name) && spelling(prior ?? []) !== spelling(expr) ? null : expr);
		}
		if (ts[i].v === "import" && ts[i + 1]?.v === "{") {
			const end = ts[i + 1].close, spec = literal(ts[end + 2]);
			if (ts[end + 1]?.v !== "from" || !spec?.startsWith(".")) continue;
			const from = posix.normalize(posix.join(posix.dirname(path), spec));
			if (mods.has(from)) for (const part of splitArgs(ts, i + 2, end)) imports.set(part.at(-1).v, { from, name: part[0].v });
		}
		let name, paren, body;
		if (ts[i].v === "function" && ts[i + 1]?.kind === "name" && ts[i + 2]?.v === "(") {
			name = ts[i + 1].v; paren = i + 2; body = ts[paren].close + 1;
		} else if (["const", "let", "var"].includes(ts[i].v) && ts[i + 1]?.kind === "name" && ts[i + 2]?.v === "=") {
			name = ts[i + 1].v; paren = i + (ts[i + 3]?.v === "async" ? 4 : 3);
			const after = ts[paren]?.v === "(" ? ts[paren].close + 1 : paren + 1;
			if (ts[after]?.v !== "=>") continue;
			body = after + 1;
		} else continue;
		const params = ts[paren]?.v === "(" ? splitArgs(ts, paren + 1, ts[paren].close) : [[ts[paren]]];
		const end = ts[body]?.close ?? (() => { let e = body; while (e < ts.length && ts[e].v !== ";" && !/[\r\n]/.test(source.slice(ts[e - 1]?.end ?? 0, ts[e].start))) e++; return e; })();
		functions.push({ name, params: params.map((p) => p[0]?.v === "..." ? p[1]?.v : p[0]?.v), body, end, declaration: ts[i].v === "function" ? i + 1 : i + 1, exported: ts[i - 1]?.v === "export" || (ts[i - 1]?.v === "async" && ts[i - 2]?.v === "export") });
	}
	return { path, source, ts, assigns, imports, functions };
}

// No suffix inference: only the plan's anchored forms and literal values compose.
function makeEvaluator(factsByPath) {
	function evaluate(facts, ts, bindings = new Map(), seen = new Set()) {
		if (!ts?.length) return null;
		// Pair indexes are module-global; slices retain token identity.
		const enclosed = (open, close) => ts[0]?.v === open && ts.at(-1)?.v === close && facts.ts[ts[0].close] === ts.at(-1);
		if (enclosed("(", ")")) return evaluate(facts, ts.slice(1, -1), bindings, seen);
		if (enclosed("[", "]")) return { kind: "array", values: parts(ts.slice(1, -1)).map((p) => evaluate(facts, p, bindings, seen)) };
		if (ts.length === 1 && ts[0].kind === "string") return { kind: "lit", s: literal(ts[0]) };
		const e = spelling(ts);
		if (e === "import.meta.url") return { kind: "file", p: facts.path };
		if (e === "import.meta.dirname") return { kind: "dir", p: posix.dirname(facts.path) };
		if (e === "process.execPath") return { kind: "program", s: e };
		if (["href", "pathname"].includes(ts.at(-1)?.v) && ts.at(-2)?.v === ".") return evaluate(facts, ts.slice(0, -2), bindings, seen);
		if (identifier(ts)) {
			const name = ts[0].v, key = `${facts.path}:${name}`;
			if (seen.has(key)) return null;
			const next = new Set([...seen, key]);
			if (bindings.has(name)) return evaluate(facts, bindings.get(name), new Map(), next);
			if (facts.assigns.has(name)) return evaluate(facts, facts.assigns.get(name), bindings, next);
			const imp = facts.imports.get(name), other = factsByPath.get(imp?.from);
			if (other) return evaluate(other, other.assigns.get(imp.name), new Map(), next);
			if (REPO_CODE_PROGRAMS.includes(name)) return { kind: "program", s: name };
			return null;
		}
		const open = ts.findIndex((t) => t.v === "(");
		if (open < 0 || facts.ts[ts[open].close] !== ts.at(-1)) return null;
		const call = spelling(ts.slice(0, open)), args = parts(ts.slice(open + 1, -1));
		const vs = args.map((a) => evaluate(facts, a, bindings, seen));
		if (PATH_PRESERVING.includes(call)) return vs.length === 1 ? vs[0] : null;
		if (/^(?:path\.|posix\.|win32\.)?dirname$/.test(call)) return vs.length === 1 && vs[0]?.p ? { kind: "dir", p: posix.dirname(vs[0].p) } : null;
		if (call === "newURL") {
			const [rel, base] = vs;
			if (vs.length !== 2 || rel?.kind !== "lit" || !base?.p) return null;
			// URL semantics, with a synthetic origin that cannot leak a machine path.
			try {
				const url = new URL(rel.s, `file:///repo/${base.p}${base.kind === "dir" ? "/" : ""}`);
				if (url.protocol !== "file:" || url.host || !url.pathname.startsWith("/repo/")) return null;
				const p = decodeURIComponent(url.pathname.slice("/repo/".length)).replace(/\/$/, "") || ".";
				return inside(p) ? { kind: url.pathname.endsWith("/") ? "dir" : "file", p } : null;
			} catch { return null; }
		}
		if (/^(?:path\.|posix\.|win32\.)?(?:join|resolve)$/.test(call)) {
			if (!vs.length || !vs[0] || vs.slice(1).some((v) => v?.kind !== "lit")) return null;
			const head = vs[0];
			if (head.kind !== "lit" && !head.p) return null;
			const segments = vs.slice(1).map((v) => portable(v.s));
			if (segments.some((s) => posix.isAbsolute(s) || /^[A-Za-z]:/.test(s))) return null;
			const p = posix.normalize(posix.join(portable(head.p ?? head.s), ...segments));
			return head.kind === "lit" ? { kind: "lit", s: p } : inside(p) ? { kind: /\.(?:mjs|cjs|js|ts)$/.test(p) ? "file" : "dir", p } : null;
		}
		return null;
	}
	return evaluate;
}

// Split slices using token identity rather than recomputing balanced quote rules.
function parts(ts) {
	const out = []; let start = 0, depth = 0;
	for (let i = 0; i < ts.length; i++) {
		if (ts[i].v === "," && depth === 0) { out.push(ts.slice(start, i)); start = i + 1; }
		else if ("([{".includes(ts[i].v)) depth++;
		else if (")]}".includes(ts[i].v)) depth--;
	}
	if (start < ts.length) out.push(ts.slice(start));
	return out;
}
const flatten = (v) => v?.kind === "array" ? v.values.flatMap(flatten) : [v];
function targetOf(value, path, mods, launch = false) {
	if (value?.p) return inside(value.p) && mods.has(value.p) ? value.p : null;
	if (value?.kind !== "lit") return null;
	const lit = portable(value.s);
	if (!inside(lit) && !/^\.\.?\//.test(lit)) return null;
	const options = launch ? [posix.join(posix.dirname(path), lit), lit] : [lit.startsWith(".") ? posix.join(posix.dirname(path), lit) : lit];
	return options.map((p) => posix.normalize(p)).find((p) => inside(p) && mods.has(p)) ?? null;
}
function callsIn(facts) {
	const out = [], ts = facts.ts;
	for (let i = 0; i < ts.length - 1; i++) {
		if (ts[i].kind !== "name" || ts[i + 1].v !== "(" || ts[i + 1].close === undefined) continue;
		if (facts.functions.some((f) => f.declaration === i)) continue;
		// A colon can end a ternary branch as well as introduce a signature's return type.
		// Walk only this expression level, pairing nested ternaries and skipping balanced groups.
		let ternary = false, colons = 0;
		if (ts[ts[i + 1].close + 1]?.v === ":") for (let j = i - 1; j >= 0; j--) {
			if (ts[j].open !== undefined) { j = ts[j].open; continue; }
			if ([";", ",", "(", "[", "{", "}", "=", "=>"].includes(ts[j].v)) break;
			if (ts[j].v === ":") colons++;
			if (ts[j].v === "?") {
				if (colons === 0) { ternary = true; break; }
				colons--;
			}
		}
		// Object methods and real TypeScript signatures remain definitions, not bare calls.
		const after = ts[ts[i + 1].close + 1]?.v;
		if (after === "{" || (after === ":" && !ternary)) continue;
		const member = ts[i - 1]?.v === "." || ts[i - 1]?.v === "?.";
		const namespace = member && ["cp", "childProcess", "child_process"].includes(ts[i - 2]?.v) && ts[i - 3]?.v !== ".";
		out.push({ name: ts[i].v, index: i, args: splitArgs(ts, i + 2, callEnd(ts, i + 1)), launch: LAUNCH_CALLS.includes(ts[i].v) && (!member || namespace), bare: !member });
	}
	return out;
}
function launchSites(facts, evaluate, mods, calls) {
	const lineOf = (token) => facts.source.slice(0, token.start).split(/\r\n|[\r\n\u2028\u2029]/).length;
	const sites = [];
	for (const call of calls.filter((c) => c.launch)) {
		const enclosing = facts.functions.filter((f) => f.body < call.index && call.index < f.end).sort((a, b) => b.body - a.body)[0];
		const actuals = enclosing ? calls.filter((c) => c.bare && c.name === enclosing.name && !(enclosing.body < c.index && c.index < enclosing.end)) : [];
		const usesParameter = enclosing?.params.some((p) => call.args.some((a) => a.some((t) => t.kind === "name" && t.v === p)));
		const contexts = usesParameter && actuals.length ? actuals.map((c) => ({ bindings: new Map(enclosing.params.map((p, i) => [p, c.args[i]])), line: lineOf(facts.ts[c.index]) })) : [{ bindings: new Map(), line: null }];
		const targets = new Set(), failures = [], kinds = [];
		for (const context of contexts) {
			const values = call.args.map((arg) => evaluate(facts, arg, context.bindings));
			const program = values[0], p = program?.s ?? program?.p;
			const vals = values.flatMap(flatten);
			const found = vals.map((v) => targetOf(v, facts.path, mods, true)).filter(Boolean);
			for (const target of found) targets.add(target);
			const node = call.name === "fork" || p === "process.execPath" || p === "node" || /\.(?:mjs|cjs|js|ts)$/.test(p ?? "");
			// Only node's option prefix can select inline execution; later flags belong to the script.
			// Keep the code's lexical form: following a constant is not proof of plain literal code.
			const argv = values[1]?.kind === "array" ? values[1].values : [];
			const rawArgv = call.args[1]?.[0]?.v === "[" ? parts(call.args[1].slice(1, -1)) : [];
			let inline = false, code = null;
			if (call.name !== "fork") for (let i = 0; i < argv.length; i++) {
				const arg = argv[i];
				if (arg?.kind !== "lit" || !arg.s.startsWith("-") || arg.s === "--") break;
				const flag = arg.s.split("=")[0];
				if (!INLINE_FLAGS.includes(flag)) continue;
				inline = true;
				if (flag === "--input-type") { if (arg.s === flag) i++; continue; }
				const raw = rawArgv[i + (arg.s === flag ? 1 : 0)];
				if (raw?.length === 1 && raw[0].kind === "string") {
					code = literal(raw[0]);
					if (arg.s !== flag) code = code.slice(code.indexOf("=") + 1);
				}
				break;
			}
			let kind;
			if (node) kind = inline && code === null ? "unresolved" : found.length ? "resolved" : inline && !/\b(?:import|require)\b/.test(code) ? "inline-no-repo" : "unresolved";
			else if (p && REPO_CODE_PROGRAMS.includes(posix.basename(portable(p)))) kind = "other-program";
			else if (program?.kind === "lit") kind = "external";
			else if (usesParameter && !actuals.length && enclosing?.exported && LAUNCH_CALLS.includes(enclosing.name)) kind = "wrapper-passthrough";
			else kind = "program-unknown";
			kinds.push(kind);
			if (["unresolved", "program-unknown", "other-program"].includes(kind) && context.line !== null) failures.push(context.line);
		}
		// A single good binding cannot hide a bad one.
		const kind = ["program-unknown", "other-program", "unresolved"].find((k) => kinds.includes(k)) ?? kinds[0];
		sites.push({ line: lineOf(facts.ts[call.index]), call: call.name, kind, targets: [...targets].sort(), bindingLines: [...new Set(failures)].sort((a, b) => a - b) });
	}
	return sites;
}

/** Mutate only the enriched graph; repoGraph() deliberately stays import-only. */
export function addLaunchLinks(graph, sources) {
	const mods = new Set(graph.order), factsByPath = new Map();
	for (const { path, source } of sources) if (!factsByPath.has(path)) factsByPath.set(path, moduleFacts(path, source, mods));
	const evaluate = makeEvaluator(factsByPath);
	graph.sitesByModule = new Map();
	for (const facts of factsByPath.values()) {
		const calls = callsIn(facts);
		if (!calls.some((c) => c.launch)) continue;
		const sites = launchSites(facts, evaluate, mods, calls);
		graph.sitesByModule.set(facts.path, sites);
		const from = graph.modules.get(facts.path), targets = new Set(sites.flatMap((s) => s.targets));
		// Every path in a launching module counts, not just the arguments of one launch.
		for (let i = 0; i < facts.ts.length; i++) {
			const t = facts.ts[i];
			let expr;
			if (t.kind === "string" || t.kind === "name") expr = [t];
			if (t.kind === "name") {
				let j = i;
				while (facts.ts[j + 1]?.v === "." && facts.ts[j + 2]?.kind === "name") j += 2;
				if (facts.ts[j + 1]?.v === "(" && facts.ts[j + 1].close !== undefined) expr = facts.ts.slice(i, facts.ts[j + 1].close + 1);
				if (t.v === "new" && facts.ts[i + 1]?.v === "URL" && facts.ts[i + 2]?.close !== undefined) expr = facts.ts.slice(i, facts.ts[i + 2].close + 1);
			}
			const target = expr && targetOf(evaluate(facts, expr), facts.path, mods);
			if (target) targets.add(target);
		}
		for (const target of targets) {
			if (target === facts.path) continue;
			const to = graph.modules.get(target);
			from.callees = [...new Set([...from.callees, target])].sort();
			to.callers = [...new Set([...to.callers, facts.path])].sort();
		}
	}
	return graph;
}
