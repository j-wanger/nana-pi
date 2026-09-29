// catch-judge.mjs — the ONLY place a model is used: classification, disposition lookup and
// semantic matching. Fail-closed: no mock, no fallback. Any judge failure throws; the CLI exits 1.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

export const MODELS = { a: "claude-opus-5-5", b: "claude-sonnet-5", c: "claude-sonnet-5" };
export const TOP = ["functional", "evolvability", "false_positive", "not_a_finding"];
export const SUB = ["interface", "logic", "resource", "check", "timing", "support", "larger_defect", "documentation", "visual_representation", "structure", "none"];
export const DISP = ["accepted", "overridden", "carried", "unmatched", "n/a"];
export const ORIGIN = ["seat_spec", "worker_impl", "pre_existing", "unclear", "n/a"];
export const RELATION = ["fold_defect", "new_scope", "restates_prior", "n/a"];
export const SURFACE = ["security_gate", "contract_api", "docs_consumer", "test_adequacy", "scope_process", "robustness_other", "none"];
export const VALIDITY = ["CONFIRMED", "PLAUSIBLE", "FABRICATED", "n/a"];

export const GUIDE = `You label code-review findings for a measurement study. You are a classifier, not a reviewer: do not re-review the code, judge only from the texts given. Be literal and conservative.

For EACH row id given, output one label object:
- is_finding: true if the row claims a defect or asks for a change in the patch/docs/tests/process. false if it is an evidence note, a probe that passed, a "no defect found" statement, or a pure description.
- top (Mäntylä & Lassenius two-level taxonomy, plus two extra values):
  functional = the defect affects behaviour: wrong logic, missing/incorrect check or validation, interface/API/contract break, resource/lifecycle leak, timing/race, security or gate bypass, wrong runtime output (including wrong text the program itself emits at runtime).
  evolvability = the defect affects only understanding/maintenance: documentation, README/AGENTS/templates/comments/consumer declarations, naming, structure, test-suite adequacy that does not change shipped behaviour, scope/process complaints.
  false_positive = the claim is factually wrong or describes intended behaviour as a defect (evidence: the answering fix brief or a later text says so).
  not_a_finding = is_finding is false.
- sub: functional → interface|logic|resource|check|timing|support|larger_defect ; evolvability → documentation|visual_representation|structure ; otherwise none. (check = missing/incorrect validation or guard; support = build/test/tooling/environment support; larger_defect = missing functionality.)
- surface: security_gate|contract_api|docs_consumer|test_adequacy|scope_process|robustness_other|none.
- validity (SWE-PRBench): CONFIRMED = the row cites an executed probe/test result demonstrating it; PLAUSIBLE = source-derived or asserted, not executed; FABRICATED = contradicted by the provided texts; n/a for non-findings.
- disposition — ONLY from the ANSWERING FIX BRIEF text (the seat's own ruling), never from your opinion:
  accepted = the brief turns it (or a remedy for it) into a MUST / fix / "also fix" item, or a seat ruling that changes the patch to close it, or says the seat itself handled it.
  overridden = the brief explicitly rejects it, rules against it, or keeps the behaviour it objects to.
  carried = the brief explicitly defers it / names it as a residual / says document-not-fix.
  unmatched = the brief does not address it, or there is no answering brief.
  n/a = non-findings.
- fix_quote: when disposition is accepted/overridden/carried, copy an EXACT contiguous span (10–200 characters) from the answering fix brief that shows it. Copy characters exactly, including punctuation and backticks. Otherwise "".
- origin (where the defect came from): seat_spec = the lane brief or an earlier seat ruling/fix brief specified the wrong/contradictory/incomplete thing and the worker followed it (or the fix brief admits the seat's instruction was wrong); worker_impl = the worker's implementation fails a specification that was right; pre_existing = the defect is in code or docs the lane did not create or change; unclear. n/a for non-findings.
- relation (to EARLIER rungs on this lane, listed under PRIOR ROWS): fold_defect = a new defect in, or caused by, the fix for an earlier finding; new_scope = a defect in behaviour no earlier finding or its fix touched; restates_prior = the same defect an earlier row already raised; n/a = no prior rows given or non-finding.
- rationale: one short sentence.`;

export const labelSchema = {
	type: "object",
	additionalProperties: false,
	required: ["labels"],
	properties: {
		labels: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				required: ["id", "is_finding", "top", "sub", "surface", "validity", "disposition", "fix_quote", "origin", "relation", "rationale"],
				properties: {
					id: { type: "string" },
					is_finding: { type: "boolean" },
					top: { enum: TOP },
					sub: { enum: SUB },
					surface: { enum: SURFACE },
					validity: { enum: VALIDITY },
					disposition: { enum: DISP },
					fix_quote: { type: "string" },
					origin: { enum: ORIGIN },
					relation: { enum: RELATION },
					rationale: { type: "string" },
				},
			},
		},
	},
};

export const matchSchema = {
	type: "object",
	additionalProperties: false,
	required: ["matches"],
	properties: {
		matches: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				required: ["id", "same_as", "covers"],
				properties: { id: { type: "string" }, same_as: { type: "array", items: { type: "string" } }, covers: { type: "array", items: { type: "string" } } },
			},
		},
	},
};

// Two relations, never one (sol r2 HIGH): `same_as` is equivalence and is the ONLY relation the
// stats take components over; `covers` is directed containment (a bundle/summary over narrower rows)
// and never merges. A single "restatement, summary, or subset" relation welded distinct defects.
export const MATCH_GUIDE = `You relate code-review findings for a measurement study. Rows come from different reviewers/rounds on one lane (and sometimes restate each other inside one report). For EVERY row id output two lists:

same_as = EQUIVALENCE ONLY. The ids of OTHER rows that describe the SAME single defect as this row: fixing either one fixes the other completely, in both directions. A restatement of the same single defect (e.g. a CARRY line that repeats exactly one earlier finding) is same_as. Symmetric: if you list B under A, list A under B.

covers = CONTAINMENT, DIRECTED. The ids of OTHER rows whose defect is only PART of what this row claims: this row bundles two or more distinct defects (e.g. a CARRY or summary bullet naming several findings), or is strictly broader and the other row is one instance of it. List only rows NARROWER than this row. Do not list the reverse here: the narrower row lists nothing under covers for the broader one, and does not list it under same_as either.

Rules: an id must never appear in both same_as and covers for the same row. If two rows are about different defects in the same file, they are neither. When a row bundles defects X and Y, it covers X and covers Y; X and Y are NOT same_as each other unless they are the same single defect. STAGE HINTS list pairs that share a cited file (and lines within ±5); they are hints, not decisions. Use only ids from the ROWS list. Lists may be empty.`;

export const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

/** One judge call. Throws on ANY failure: no mock, no fallback. */
export function callJudge({ model, system, prompt, schema, budgetUsd = 2 }) {
	const bin = process.env.CATCH_JUDGE_BIN || "claude";
	const args = ["-p", "--model", model, "--output-format", "json", "--json-schema", JSON.stringify(schema), "--tools", "", "--strict-mcp-config", "--no-session-persistence", "--setting-sources", "", "--system-prompt", system, "--max-budget-usd", String(budgetUsd)];
	const r = spawnSync(bin, args, { input: prompt, encoding: "utf8", maxBuffer: 64 << 20, timeout: 15 * 60 * 1000, cwd: "/tmp" });
	if (r.error) throw new Error(`judge unavailable: ${r.error.code || r.error.message}`);
	if (r.status !== 0) throw new Error(`judge exited ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 300)}`);
	let j;
	try {
		j = JSON.parse(r.stdout);
	} catch {
		throw new Error(`judge returned non-JSON: ${r.stdout.slice(0, 200)}`);
	}
	if (j.is_error || !j.structured_output) throw new Error(`judge error/no structured output: ${String(j.result).slice(0, 200)}`);
	const used = Object.keys(j.modelUsage || {});
	if (!used.some((m) => m.startsWith(model))) throw new Error(`judge used ${used.join(",")}, expected ${model}`);
	return { out: j.structured_output, cost: j.total_cost_usd ?? null };
}

export function labelPrompt({ report, rows, laneBrief, fixBriefs, priorRows, allFixHeads }) {
	const fb = fixBriefs.length ? fixBriefs.map((f) => `--- ${f.file} ---\n${f.text}`).join("\n\n") : "NONE — no fix brief answers this report (disposition must be unmatched).";
	const prior = priorRows.length ? priorRows.map((r) => `${r.id} [${r.rung} ${r.kind} ${r.severity ?? "-"}] ${r.claim}`).join("\n") : "NONE (first rung on this lane).";
	const rs = rows.map((r) => `### ${r.id}\nkind=${r.kind} severity=${r.severity ?? "-"} section=${r.section} surface=${r.surface ?? "-"}\n${r.body.slice(0, 2500)}`).join("\n\n");
	return `REPORT: ${report.name} (reviewer ${report.model}, round ${report.round}, verdict ${report.verdict})

== LANE BRIEF (the seat's specification; truncated) ==
${laneBrief.slice(0, 9000)}

== ALL FIX-BRIEF HEADLINES ON THIS LANE (context for origin) ==
${allFixHeads}

== ANSWERING FIX BRIEF(S) (the seat's ruling on THIS report — the only source for disposition) ==
${fb}

== PRIOR ROWS (earlier rungs on this lane; for relation) ==
${prior}

== ROWS TO LABEL (${rows.length}) ==
${rs}

Label every row id above exactly once.`;
}

export function validateLabels(out, ids, fixText) {
	const got = new Map((out.labels || []).map((l) => [l.id, l]));
	const missing = ids.filter((i) => !got.has(i));
	const extra = [...got.keys()].filter((k) => !ids.includes(k));
	if (missing.length || extra.length) throw new Error(`judge label set mismatch: missing ${missing.join(",")} extra ${extra.join(",")}`);
	return ids.map((id) => {
		const l = { ...got.get(id) };
		// Structural verification of the seat's ground truth: the quote must exist verbatim.
		const norm = (s) => s.replace(/\s+/g, " ").trim();
		l.quote_verified = l.fix_quote ? norm(fixText).includes(norm(l.fix_quote)) : false;
		if (["accepted", "overridden", "carried"].includes(l.disposition) && !l.quote_verified) {
			l.disposition_raw = l.disposition;
			l.disposition = "unmatched";
		}
		if (!l.is_finding) l.top = "not_a_finding";
		return l;
	});
}
