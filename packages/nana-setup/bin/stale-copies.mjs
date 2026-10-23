#!/usr/bin/env node
/**
 * @module packages/nana-setup/bin/stale-copies.mjs
 * @purpose Report an outdated session project's working section and unhealthy installed Claude Code hooks, rules, skills or settings.
 * @inputs argv (`--cwd <dir>`), the default active-home layout, its Claude settings, shared hook-health rows, managed rule and skill lists, filesystem state and NANA_SETUP_PLATFORM.
 * @outputs an optional project-stale line before one optional installed-copy notice, including blocked skill paths to move.
 * @effects disk (reads installed and source files; runs install's skill step in dry-run mode), process (writes stdout).
 * @errors unexpected failures reach the launcher, which emits the unavailable marker.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { skillLinkState } from "../lib/doctor.mjs";
import { hookLinkRows, hookSettingsRows } from "../lib/hook-health.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { hasAdoptionInstallRecord, linkOk, projectStaleLine, staleNotice } from "../lib/stale-copies.mjs";
import { CLAUDE_RULES, CLAUDE_SKILLS, PACK_SKILLS_DIR, linkedSkillFolder, ruleSource, stepSkills } from "../lib/steps.mjs";

const layout = resolveLayout();
const cwdIndex = process.argv.indexOf("--cwd");
const sessionDir = cwdIndex >= 0 ? process.argv[cwdIndex + 1] : undefined;
const projectNotice = projectStaleLine(sessionDir);
if (projectNotice) process.stdout.write(`${projectNotice}\n`);

function existingPath(candidate) {
	try {
		fs.lstatSync(candidate);
		return candidate;
	} catch {
		return null;
	}
}

let settings = null;
let parseError = null;
try {
	const raw = fs.readFileSync(layout.claudeSettings, "utf8");
	settings = raw.trim() === "" ? {} : JSON.parse(raw);
} catch (error) {
	parseError = error.code === "ENOENT" ? "missing" : `unreadable (${error.message})`;
}

if (hasAdoptionInstallRecord(layout, settings)) {
	const labels = [];
	for (const row of hookLinkRows(layout)) {
		if (!row.ok) labels.push(row.label);
	}
	for (const name of CLAUDE_RULES) {
		if (!linkOk(path.join(layout.rulesDir, name), ruleSource(name))) labels.push(`rule ${name}`);
	}
	const failedSkills = new Set();
	for (const name of CLAUDE_SKILLS) {
		if (!skillLinkState(path.join(layout.skillsDir, name), path.join(PACK_SKILLS_DIR, name)).ok) {
			labels.push(`skill ${name}`);
			failedSkills.add(name);
		}
	}
	for (const row of hookSettingsRows(layout, settings, parseError)) {
		if (!row.ok) labels.push(row.label);
	}
	const movePaths = [];
	if (labels.length) {
		for (const row of stepSkills(layout, { dryRun: true })) {
			const name = row.label.startsWith("skill ") ? row.label.slice("skill ".length) : "";
			if (row.status === "problem" && failedSkills.has(name)) {
				const movePath = linkedSkillFolder(layout) ?? existingPath(path.join(layout.skillsDir, name));
				if (movePath && !movePaths.includes(movePath)) movePaths.push(movePath);
			}
		}
	}
	const notice = staleNotice(labels, movePaths);
	if (notice) process.stdout.write(`${notice}\n`);
}
