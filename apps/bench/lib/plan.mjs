// What to run, in what order, and whether an existing results file belongs to THIS experiment.
//
// Three jobs, all of them about not silently mixing measurements:
//   1. FINGERPRINT — a sha over everything that decides what a run means (study, tasks, fixture,
//      extension contents, pi version, pinned settings). Every record carries it; resume refuses
//      to append to a results file written under a different one.
//   2. SCHEDULE — a seeded, randomized block schedule, persisted once, so the order is
//      reproducible and is not a fixed rotation that hands one profile the cold-cache slot.
//   3. RESUME — read completed tuples, and quarantine a torn tail so the next append cannot be
//      concatenated onto half a JSON object.

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { settingsFingerprintInput } from "./agentdir.mjs";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
export const tupleKey = (r) => `${r.task}|${r.profile}|${r.rep}`;

/** Deterministic 32-bit PRNG (mulberry32) — seeded, reproducible, no dependency. */
export function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** In-place Fisher-Yates with a seeded source. */
export function shuffle(items, rand) {
	const a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export const profilesFor = (study, task) => study.profiles.filter((p) => !p.families || p.families.includes(task.family));

/**
 * A seeded, randomized BLOCK schedule.
 * One block = one (task, rep): every eligible profile, in a shuffled order. Blocks within a rep
 * are shuffled too. Keeping a comparison inside one block is what lets a single snapshotted
 * live key grade both arms, and what keeps cache state roughly comparable between arms.
 */
export function buildSchedule(study, tasks, { reps = study.repeats ?? 3, seed = study.seed ?? 1 } = {}) {
	const rand = rng(seed);
	const plan = [];
	for (let rep = 0; rep < reps; rep++) {
		const blocks = tasks.map((task) => ({
			block: `${task.id}|${rep}`,
			task: task.id,
			rep,
			profiles: shuffle(profilesFor(study, task).map((p) => p.name), rand),
		}));
		for (const b of shuffle(blocks, rand)) for (const profile of b.profiles) plan.push({ task: b.task, profile, rep, block: b.block });
	}
	return { seed, reps, runs: plan };
}

export const filterPlan = (runs, f = {}) =>
	runs.filter((r) => (!f.task || r.task === f.task) && (!f.profile || r.profile === f.profile) && (f.rep == null || r.rep === f.rep));

/**
 * Persist the schedule once, and EXTEND it in place when the study adds repetitions.
 *
 * `repeats` is deliberately not part of the fingerprint (see studyFingerprint): going from N=3 to
 * N=5 adds runs, it does not change what any existing run meant. Because the seeded generator
 * draws in rep order, regenerating with more reps reproduces the earlier reps exactly — asserted
 * here rather than assumed, so an extension can never silently reorder work already done.
 */
export async function loadOrCreateSchedule(studyDir, study, tasks, fingerprint, opts = {}) {
	const file = path.join(studyDir, "schedule.json");
	const reps = opts.reps ?? study.repeats ?? 3;
	let prev = null;
	try {
		prev = JSON.parse(await fs.readFile(file, "utf8"));
	} catch (e) {
		if (e.code !== "ENOENT") throw e;
	}
	if (prev) {
		if (prev.fingerprint !== fingerprint) {
			throw new Error(`schedule.json was built for fingerprint ${prev.fingerprint.slice(0, 12)}… but the study now hashes to ${fingerprint.slice(0, 12)}…\n` + `Something that changes what a run means was edited. Start a new study directory, or delete schedule.json AND results.jsonl.`);
		}
		if (reps <= prev.reps) return prev;
		const extended = buildSchedule(study, tasks, { ...opts, reps });
		const head = extended.runs.slice(0, prev.runs.length);
		if (JSON.stringify(head) !== JSON.stringify(prev.runs)) {
			throw new Error(`extending to ${reps} repeats would reorder the ${prev.runs.length} runs already scheduled. Refusing: the completed part of a study must keep its order.`);
		}
		const next = { ...prev, reps, extendedAt: new Date().toISOString(), added: extended.runs.length - prev.runs.length, runs: extended.runs };
		await fs.writeFile(file, `${JSON.stringify(next, null, 1)}\n`);
		return next;
	}
	const sched = { fingerprint, createdAt: new Date().toISOString(), ...buildSchedule(study, tasks, { ...opts, reps }) };
	await fs.writeFile(file, `${JSON.stringify(sched, null, 1)}\n`);
	return sched;
}

/**
 * Keys that change how MUCH is run or where it runs, never what a run MEANS. Excluded from the
 * fingerprint so that adding repetitions extends a study instead of invalidating it.
 */
export const OPERATIONAL_KEYS = ["repeats", "maxTotalTokens", "maxWallMs", "agentDir", "smokeTask", "smokeProfile", "piEntry", "pinnedPiVersion", "amendedAt"];

/**
 * Everything that changes what a run MEANS. Deliberately excludes credentials, wall-clock,
 * machine paths and the operational keys above — the same study on another machine, run for more
 * repetitions, must still fingerprint the same.
 */
export async function studyFingerprint({ studyDir, study, tasks, piVersion, extraSha = {} }) {
	const parts = [];
	const studyForHash = { ...study };
	for (const k of OPERATIONAL_KEYS) delete studyForHash[k];
	parts.push(`study:${sha256(JSON.stringify(studyForHash))}`);
	for (const t of [...tasks].sort((a, b) => a.id.localeCompare(b.id))) parts.push(`task:${t.id}:${sha256(JSON.stringify(t))}`);
	parts.push(`fixture:${study.fixture?.sha256 ?? "none"}`);
	parts.push(`pi:${piVersion}`);
	parts.push(`settings:${sha256(settingsFingerprintInput(study.pinnedSettings))}`);
	for (const [k, v] of Object.entries(extraSha).sort()) parts.push(`${k}:${v}`);
	const manifest = `${parts.join("\n")}\n`;
	return { fingerprint: sha256(manifest), manifest, studyDir };
}

/** sha256 of one file, or null if absent. Used to pin extension contents (never credentials). */
export async function fileSha(p) {
	try {
		return sha256(await fs.readFile(p));
	} catch {
		return null;
	}
}

/**
 * Read completed tuples AND repair a torn tail.
 * A kill mid-append leaves half a JSON object with no trailing newline; appending onto that
 * produces a line no parser can read and, worse, destroys the NEXT record too. We move the torn
 * bytes to results.quarantine.jsonl and truncate back to the last newline before anyone appends.
 */
export async function readResults(resultsPath, { repair = true } = {}) {
	let raw;
	try {
		raw = await fs.readFile(resultsPath, "utf8");
	} catch {
		return { records: [], done: new Set(), quarantined: 0, fingerprints: new Set() };
	}
	let body = raw;
	let torn = "";
	if (body.length && !body.endsWith("\n")) {
		const cut = body.lastIndexOf("\n");
		torn = cut < 0 ? body : body.slice(cut + 1);
		try {
			JSON.parse(torn); // a complete object that merely lacks its newline: keep it, add the newline
			body = `${body}\n`;
			torn = "";
		} catch {
			body = cut < 0 ? "" : body.slice(0, cut + 1);
		}
	}
	if (repair && (torn || body !== raw)) {
		if (torn) await fs.appendFile(`${resultsPath}.quarantine`, `${new Date().toISOString()} torn-tail ${JSON.stringify(torn)}\n`);
		await fs.writeFile(resultsPath, body);
	}
	const records = [];
	const done = new Set();
	const fingerprints = new Set();
	for (const line of body.split("\n")) {
		if (!line.trim()) continue;
		let r;
		try {
			r = JSON.parse(line);
		} catch {
			continue;
		}
		records.push(r);
		done.add(tupleKey(r));
		if (r.fingerprint) fingerprints.add(r.fingerprint);
	}
	return { records, done, quarantined: torn ? 1 : 0, fingerprints };
}

/** Refuse to extend a results file that belongs to a different experiment. */
export function assertFingerprint(fingerprints, current) {
	const foreign = [...fingerprints].filter((f) => f !== current);
	if (foreign.length) {
		throw new Error(`results.jsonl holds runs from a different experiment (${foreign.map((f) => f.slice(0, 12)).join(", ")}…), current is ${current.slice(0, 12)}….\n` + `Mixing them would average two studies. Start a new study directory, or archive the old results.`);
	}
}
