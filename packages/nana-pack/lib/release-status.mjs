/**
 * @module packages/nana-pack/lib/release-status.mjs
 * @purpose Report local release lag and main divergence without changing Git state.
 * @inputs A repository path and an injectable `(cwd, args) => spawnSync-result` runner.
 * @outputs Release line, tag, template commit count, ahead/behind counts, and missing inputs.
 * @effects process (spawns read-only git)
 * @errors Missing or failed Git inputs become a status line and never escape as throws.
 */
import { spawnSync } from "node:child_process";

/** Copier source: root copier.yml, `_subdirectory: templates/{{ language }}/template`, shared seeds included from templates/_shared. */
export const RELEASE_SURFACE = ["templates", "copier.yml"];
/** R-740 says latest v* tag; Copier get_latest_tag skips prereleases and sorts by PEP 440, 2026-10-08. */
export const RELEASE_TAG_PATTERN = /^v\d+\.\d+\.\d+$/;
/** contract (R-585): compare the primary local branch main, 2026-10-08. */
export const RELEASE_BRANCH_REF = "refs/heads/main";
/** contract (R-585): compare its local origin/main tracking ref, 2026-10-08. */
export const RELEASE_REMOTE_REF = "refs/remotes/origin/main";

const defaultRunGit = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 1024 * 1024 });

/** Select the first plain release tag from Git's version-sorted tag names. */
export function selectReleaseTag(tags) {
	const numeric = tags.filter((tag) => RELEASE_TAG_PATTERN.test(tag));
	numeric.sort((left, right) => {
		const a = left.slice(1).split(".").map(Number);
		const b = right.slice(1).split(".").map(Number);
		for (let index = 0; index < a.length; index++) if (a[index] !== b[index]) return b[index] - a[index];
		return 0;
	});
	return numeric[0] ?? null;
}

/** Parse a successful Git commit count. */
export function countTemplateCommits(output) {
	const count = Number(String(output).trim());
	return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

function invoke(runGit, repo, args) {
	try {
		const result = runGit(repo, args);
		if (result?.error || result?.status !== 0) return { ok: false, text: (result?.stderr || result?.error?.message || "git command failed").trim() };
		return { ok: true, text: String(result.stdout ?? "").trim() };
	} catch (error) {
		return { ok: false, text: error?.message ?? "git command failed" };
	}
}

/** Read release facts from local refs only; failures are represented in `line` and `missing`. */
export function releaseStatus({ repo, runGit = defaultRunGit }) {
	const missing = [];
	let tag = null;
	let templateCommits = null;
	let ahead = null;
	let behind = null;
	let mainAvailable = false;
	let originAvailable = false;
	let copierAvailable = false;
	let originDetail = "";
	let templateDetail = "";

	try {
		const main = invoke(runGit, repo, ["rev-parse", "--verify", "--quiet", RELEASE_BRANCH_REF]);
		mainAvailable = main.ok && Boolean(main.text);
		if (!mainAvailable) {
			missing.push("main ref unavailable");
		} else {
			const copier = invoke(runGit, repo, ["cat-file", "-e", `${RELEASE_BRANCH_REF}:copier.yml`]);
			copierAvailable = copier.ok;
			if (!copierAvailable) {
				templateDetail = "repository is not a template source";
			} else {
				const refs = invoke(runGit, repo, ["for-each-ref", "--sort=-v:refname", "--format=%(refname:short)", "refs/tags/v*"]);
				if (!refs.ok) {
					missing.push(`release tags unavailable (${refs.text})`);
				} else {
					tag = selectReleaseTag(refs.text.split(/\r?\n/).filter(Boolean));
					if (!tag) missing.push("plain vX.Y.Z release tag unavailable");
					else {
						const count = invoke(runGit, repo, ["rev-list", "--count", `${tag}..${RELEASE_BRANCH_REF}`, "--", ...RELEASE_SURFACE]);
						templateCommits = count.ok ? countTemplateCommits(count.text) : null;
						if (templateCommits === null) missing.push(`template commit count unavailable${count.ok ? "" : ` (${count.text})`}`);
						else templateDetail = `${templateCommits} template commit${templateCommits === 1 ? "" : "s"} since ${tag}`;
					}
				}
			}
		}

		const remote = invoke(runGit, repo, ["rev-parse", "--verify", "--quiet", RELEASE_REMOTE_REF]);
		originAvailable = remote.ok && Boolean(remote.text);
		if (!originAvailable) missing.push("origin/main tracking ref unavailable");
		else if (mainAvailable) {
			const divergence = invoke(runGit, repo, ["rev-list", "--left-right", "--count", `${RELEASE_REMOTE_REF}...${RELEASE_BRANCH_REF}`]);
			const match = divergence.ok && /^(\d+)\s+(\d+)$/.exec(divergence.text);
			if (!match) missing.push(`origin/main ahead/behind counts unavailable${divergence.ok ? "" : ` (${divergence.text})`}`);
			else { behind = Number(match[1]); ahead = Number(match[2]); originDetail = `main ${ahead} ahead, ${behind} behind origin/main as of the last fetch`; }
		} else originDetail = "origin/main counts unavailable because main is unavailable";
	} catch (error) {
		missing.push(`git unavailable (${error?.message ?? "unknown error"})`);
	}

	const clauses = [];
	if (templateDetail) clauses.push(templateDetail);
	else if (copierAvailable) clauses.push("template release status unavailable");
	if (originDetail) clauses.push(originDetail);
	else if (!originAvailable) clauses.push("origin/main status unavailable");
	if (missing.length) clauses.push(`missing: ${missing.join("; ")}`);
	return { line: clauses.join("; ") || "release status unavailable", tag, templateCommits, ahead, behind, missing };
}
