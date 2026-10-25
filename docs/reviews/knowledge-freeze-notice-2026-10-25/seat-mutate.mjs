#!/usr/bin/env node
// Seat wrong-code pairs for lane knowledge-freeze-notice (hook), written by the seat 2026-10-25 after build 1 at 9ceaad8a.
// They follow the must-meet rows' red cases (R-2860 to R-2863) and the seal; the plan names no separate pairs list.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/knowledge-freeze-notice-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const HK = "packages/nana-knowledge/lib/hook.ts";
const SF = "packages/nana-knowledge/lib/sources-file.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const TS = "packages/nana-knowledge/tests/sources-file.test.mjs";
const TD = "packages/nana-setup/tests/doctor-knowledge.test.mjs";
const R_2860 = /^R-2860: /; // R-2860
const R_2861 = /^R-2861: /; // R-2861
const R_2862 = /^R-2862: /; // R-2862
const R_2863 = /^R-2863: /; // R-2863
const SEAL = /^seal: the frozen-index clause/; // R-2860 R-2862
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// Anchors used by more than one pair.
const FINISH = "return { output: notice ? `${notice}${output ? `\\n${output}` : \"\"}` : output, reason, hits };";
const READ = "const sourceFile = readSourcesFile(paths.sources);";
const NOTICE = "if (sourceFile.status === \"problem\") notice = `[nana:knowledge] sources.json ${frozenNotice(sourceFile.problem)}`;";
const EARLY = "\tconst early = readSourcesFile(paths.sources);\n\tif (early.status === \"problem\") notice = `[nana:knowledge] sources.json ${frozenNotice(early.problem)}`;\n";
const ROLE = "\tif (process.env.NANA_ROLE === \"reviewer\") return none(\"reviewer-role\");";
const PARSE = "\ttry { input = JSON.parse(raw); parsed = true; } catch { return none(\"bad-json\"); }";
const SKIP = "\tif (skip) return none(skip);";
const D_READ = "const result = readSourcesFile(file);";
const D_FAIL = "\treturn { status: FAIL, detail: `${file} — ${frozenNotice(result.problem)} Rescan with \\`${rescan}\\`.` };";
const D_ADD = "add(sources.status, \"knowledge sources\", sources.detail);";
const D_AGE_IF = "if (Number.isFinite(built) && built > 0 && built <= now)";
const CLAUSE = "export const SOURCES_FROZEN_CLAUSE = \"The knowledge index is frozen until the user repairs sources.json; the next build after the repair rescans it.\";";

const DECLARED = [
	"(seat) pairs 1 to 14 follow R-2860's red cases; 15 to 19 R-2861's; 20 to 31 R-2862's; 32 to 38 R-2863's; 39 and 40 the seal",
	"(seat) packages/nana-knowledge/tests/hook.test.mjs holds no R-2860 to R-2863 row, so no pair runs it",
	"(seat) declared non-pair: an unquoted rescan path; R-2862's check expects quotes only when KNOWLEDGE_CLI holds a space, so on a checkout path without one no edit can turn it red",
];

const PAIRS = [
	{ n: "1", name: "the notice prints only when hits exist", edits: [one(HK, FINISH, "return { output: notice && output ? `${notice}\\n${output}` : output, reason, hits };")], tests: [TS], expectRed: [R_2860] },
	{ n: "2", name: "the notice prints after the block", edits: [one(HK, FINISH, "return { output: notice ? `${output ? `${output}\\n` : \"\"}${notice}` : output, reason, hits };")], tests: [TS], expectRed: [R_2860] },
	{ n: "3", name: "the notice counts inside the block budget", edits: [one(HK, FINISH, "return { output: notice ? `${notice}${output ? `\\n${output}` : \"\"}`.slice(0, BLOCK_MAX_CHARS) : output, reason, hits };")], tests: [TS], expectRed: [R_2860] },
	{ n: "4", name: "a budget return drops the notice", edits: [one(HK, "\tif (!fs.existsSync(paths.db)) return none(`no-index(${freshness})`);\n\tif (over()) return none(\"budget\");", "\tif (!fs.existsSync(paths.db)) return none(`no-index(${freshness})`);\n\tif (over()) { notice = null; return none(\"budget\"); }")], tests: [TS], expectRed: [R_2860] },
	{ n: "5", name: "the pull's marker drops the place", edits: [one(HK, "${frozenNotice(sourceFile.problem)}`", "${frozenNotice({ ...sourceFile.problem, line: undefined })}`")], tests: [TS], expectRed: [R_2860] },
	{ n: "6", name: "the pull's marker gives the manual advice", edits: [one(HK, "${frozenNotice(sourceFile.problem)}`", "${frozenNotice({ ...sourceFile.problem, repair: \"manual\" })}`")], tests: [TS], expectRed: [R_2860] },
	{ n: "7", name: "the parser's message joins the notice", edits: [one(HK, NOTICE, "if (sourceFile.status === \"problem\") notice = `[nana:knowledge] sources.json ${frozenNotice(sourceFile.problem)}${(() => { try { JSON.parse(fs.readFileSync(paths.sources, \"utf8\")); return \"\"; } catch (error) { return ` (${error.message})`; } })()}`;")], tests: [TS], expectRed: [R_2860] },
	{ n: "8", name: "the notice prints for a reviewer or worker role", edits: [one(HK, ROLE, `${EARLY}${ROLE}`)], tests: [TS], expectRed: [R_2860] },
	{ n: "9", name: "the notice prints for bad input", edits: [one(HK, PARSE, `${EARLY}${PARSE}`)], tests: [TS], expectRed: [R_2860] },
	{ n: "10", name: "the notice prints for a skipped prompt", edits: [one(HK, SKIP, `${EARLY}${SKIP}`)], tests: [TS], expectRed: [R_2860] },
	{ n: "11", name: "pull.log gains a frozen field", edits: [one(HK, "\t\t\t\tms: clock() - t0,\n", "\t\t\t\tms: clock() - t0,\n\t\t\t\tfrozen: notice !== null,\n")], tests: [TS], expectRed: [R_2860] },
	{ n: "12", name: "pull.log logs a new frozen reason", edits: [one(HK, "\t\t\t\treason,\n", "\t\t\t\treason: notice ? `${reason}:frozen` : reason,\n")], tests: [TS], expectRed: [R_2860] },
	{ n: "13", name: "the notice line prints twice", edits: [one(HK, FINISH, "return { output: notice ? `${notice}\\n${notice}${output ? `\\n${output}` : \"\"}` : output, reason, hits };")], tests: [TS], expectRed: [R_2860] },
	{ n: "14", name: "a read error throws out of the reader", edits: [one(SF, "\t\treturn { status: \"problem\", problem: { kind: \"unreadable\" } };", "\t\tthrow error;")], tests: [TS, TD], expectRed: [R_2860, R_2862] },
	{ n: "15", name: "the pull reads through loadSources, which seeds an absent file", edits: [one(HK, READ, "const sourceFile = await import(\"./sources.ts\").then(({ loadSources }) => loadSources()).then((loaded) => loaded.problem ? { status: \"problem\", problem: loaded.problem } : { status: \"parsed\" });")], tests: [TS], expectRed: [R_2861] },
	{ n: "16", name: "the pull rewrites a parsing file", edits: [one(HK, NOTICE, `${NOTICE}\n\tif (sourceFile.status === "parsed") fs.writeFileSync(paths.sources, JSON.stringify(sourceFile.value, null, "\\t") + "\\n");`)], tests: [TS], expectRed: [R_2861] },
	{ n: "17", name: "the reader parses text with JSON.parse", edits: [one(SF, "return { status: \"parsed\", value: parseJsonBytes(bytes) };", "return { status: \"parsed\", value: JSON.parse(bytes.toString(\"utf8\")) };")], tests: [TS, TD], expectRed: [R_2861, R_2862] },
	{ n: "18", name: "the notice keys on no roots", edits: [one(HK, NOTICE, "if (sourceFile.status === \"problem\" || (sourceFile.status === \"parsed\" && !Array.isArray(sourceFile.value?.roots))) notice = `[nana:knowledge] sources.json ${frozenNotice(sourceFile.problem ?? { kind: \"unparseable\" })}`;")], tests: [TS], expectRed: [R_2861] },
	{ n: "19", name: "an absent file prints the notice", edits: [one(HK, NOTICE, "if (sourceFile.status !== \"parsed\") notice = `[nana:knowledge] sources.json ${frozenNotice(sourceFile.problem ?? { kind: \"unreadable\" })}`;")], tests: [TS], expectRed: [R_2861] },
	{ n: "20", name: "doctor seeds an absent file", edits: [one(DR, "\tif (result.status === \"absent\") return { status: NOTE, detail: `${file} — not present; the next build seeds it` };", "\tif (result.status === \"absent\") { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, \"{}\\n\"); return { status: NOTE, detail: `${file} — not present; the next build seeds it` }; }")], tests: [TD], expectRed: [R_2862] },
	{ n: "21", name: "doctor parses text, so a UTF-16 file fails", edits: [one(DR, D_READ, "const result = (() => { try { return { status: \"parsed\", value: JSON.parse(fs.readFileSync(file, \"utf8\")) }; } catch (error) { return error?.code === \"ENOENT\" ? { status: \"absent\" } : { status: \"problem\", problem: error?.code ? { kind: \"unreadable\" } : { kind: \"unparseable\", ...jsonParseFailure(error) } }; } })();")], tests: [TD], expectRed: [R_2862] },
	{ n: "22", name: "doctor fails a wrong-shape file", edits: [one(DR, "\tif (result.status === \"parsed\") return { status: OK, detail: `${file} — parses` };", "\tif (result.status === \"parsed\") return Array.isArray(result.value?.roots) ? { status: OK, detail: `${file} — parses` } : { status: FAIL, detail: `${file} — parses but lists no roots` };")], tests: [TD], expectRed: [R_2862] },
	{ n: "23", name: "a broken file is a note", edits: [one(DR, "return { status: FAIL, detail: `${file} — ${frozenNotice(result.problem)}", "return { status: NOTE, detail: `${file} — ${frozenNotice(result.problem)}")], tests: [TD], expectRed: [R_2862] },
	{ n: "24", name: "the parser's message joins doctor's detail", edits: [one(DR, "${frozenNotice(result.problem)} Rescan with", "${frozenNotice(result.problem)}${(() => { try { parseJsonBytes(fs.readFileSync(file)); return \"\"; } catch (error) { return ` (${error.message})`; } })()} Rescan with")], tests: [TD], expectRed: [R_2862] },
	{ n: "25", name: "doctor's marker drops the place", edits: [one(DR, "${frozenNotice(result.problem)}", "${frozenNotice({ ...result.problem, line: undefined })}")], tests: [TD], expectRed: [R_2862] },
	{ n: "26", name: "the rescan command names nana-knowledge build", edits: [one(DR, "const rescan = `node ${commandPath} build`;", "const rescan = \"nana-knowledge build\";")], tests: [TD], expectRed: [R_2862] },
	{ n: "27", name: "the rescan command is missing", edits: [one(DR, " Rescan with \\`${rescan}\\`.", "")], tests: [TD], expectRed: [R_2862] },
	{ n: "28", name: "the fail detail is not led by the path", edits: [one(DR, D_FAIL, "\treturn { status: FAIL, detail: `${frozenNotice(result.problem)} Rescan with \\`${rescan}\\`. (${file})` };")], tests: [TD], expectRed: [R_2862] },
	{ n: "29", name: "the row reuses the knowledge index label", edits: [one(DR, D_ADD, "add(sources.status, \"knowledge index\", sources.detail);")], tests: [TD], expectRed: [R_2862] },
	{ n: "30", name: "the row is missing without an index", edits: [one(DR, D_ADD, `if (index.ok) ${D_ADD}`)], tests: [TD], expectRed: [R_2862] },
	{ n: "31", name: "an absent file throws out of the doctor row", edits: [one(DR, D_READ, "const result = { ...readSourcesFile(file), size: fs.statSync(file).size };")], tests: [TD], expectRed: [R_2862] },
	{ n: "32", name: "the age comes from the file's mtime", edits: [one(DR, "const built = Number(db.prepare(\"SELECT value FROM meta WHERE key = 'built_at'\").get()?.value);", "const built = fs.statSync(dbPath).mtimeMs;")], tests: [TD], expectRed: [R_2863] },
	{ n: "33", name: "a missing meta table turns the row to fail", edits: [one(DR, "} catch { /* older or docs-only index has no meta table */ }", "} finally { /* older or docs-only index has no meta table */ }")], tests: [TD], expectRed: [R_2863] },
	{ n: "34", name: "the age is worded in minutes", edits: [one(DR, "age = `built ${((now - built) / 3600000).toFixed(1)}h ago`;", "age = `built ${Math.round((now - built) / 60000)}m ago`;")], tests: [TD], expectRed: [R_2863] },
	{ n: "35", name: "a non-number built_at prints NaN", edits: [one(DR, D_AGE_IF, "if (!(built <= 0) && !(built > now))")], tests: [TD], expectRed: [R_2863] },
	{ n: "36", name: "a zero built_at prints a huge age", edits: [one(DR, D_AGE_IF, "if (Number.isFinite(built) && built <= now)")], tests: [TD], expectRed: [R_2863] },
	{ n: "37", name: "a future built_at prints a negative age", edits: [one(DR, D_AGE_IF, "if (Number.isFinite(built) && built > 0)")], tests: [TD], expectRed: [R_2863] },
	{ n: "38", name: "the docs count is dropped from the detail", edits: [one(DR, "detail: `read-only docs count: ${row?.n}; ${age}` }", "detail: age }")], tests: [TD], expectRed: [R_2863] },
	{ n: "39", name: "the clause names no actor", edits: [one(SF, CLAUSE, "export const SOURCES_FROZEN_CLAUSE = \"The knowledge index is frozen until sources.json is repaired; the next build after the repair rescans it.\";")], tests: [TS, TD], expectRed: [SEAL] },
	{ n: "40", name: "the clause names nana-knowledge build", edits: [one(SF, CLAUSE, "export const SOURCES_FROZEN_CLAUSE = \"The knowledge index is frozen until the user repairs sources.json; then run nana-knowledge build.\";")], tests: [TS, TD], expectRed: [SEAL] },
];

process.exitCode = await runMutations({ lane: "knowledge-freeze-notice", self: import.meta.url, tip: "9ceaad8a", declared: DECLARED, pairs: PAIRS });
