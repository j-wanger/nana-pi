#!/usr/bin/env node
/**
 * @module packages/nana-setup/bin/stale-copies.mjs
 * @purpose Report unhealthy Claude Code hook links, rules, skills and hook settings for a home with a nana-setup adoption-hook install record.
 * @inputs the default active-home layout, its Claude settings, shared hook-health rows, managed rule and skill lists, filesystem state and NANA_SETUP_PLATFORM.
 * @outputs one stale-copy notice on stdout, including blocked skill paths to move, or no output when no install is recorded or every applicable item is current.
 * @effects disk (reads installed and source files; runs install's skill step in dry-run mode), process (writes stdout).
 * @errors unexpected failures reach the launcher, which emits the unavailable marker.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { skillLinkState } from "../lib/doctor.mjs";
import { hookLinkRows, hookSettingsRows } from "../lib/hook-health.mjs";
import { platform, resolveLayout } from "../lib/paths.mjs";
import { hasAdoptionInstallRecord, linkOk, staleNotice } from "../lib/stale-copies.mjs";
import { CLAUDE_RULES, CLAUDE_SKILLS, NEW_CLAUDE_SKILLS, PACK_SKILLS_DIR, ruleSource, stepSkills } from "../lib/steps.mjs";

const layout = resolveLayout();
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
		if (!row.ok && !row.skipped) labels.push(row.label);
	}
	for (const name of CLAUDE_RULES) {
		if (!linkOk(path.join(layout.rulesDir, name), ruleSource(name))) labels.push(`rule ${name}`);
	}
	const failedSkills = new Set();
	for (const name of CLAUDE_SKILLS) {
		if (platform() === "win32" && NEW_CLAUDE_SKILLS.includes(name)) continue;
		if (!skillLinkState(path.join(layout.skillsDir, name), path.join(PACK_SKILLS_DIR, name)).ok) {
			labels.push(`skill ${name}`);
			failedSkills.add(name);
		}
	}
	for (const row of hookSettingsRows(layout, settings, parseError)) {
		if (!row.ok && !row.skipped) labels.push(row.label);
	}
	const movePaths = [];
	if (failedSkills.size) {
		for (const row of stepSkills(layout, { dryRun: true })) {
			const name = row.label.startsWith("skill ") ? row.label.slice("skill ".length) : "";
			if (row.status === "problem" && failedSkills.has(name)) movePaths.push(path.join(layout.skillsDir, name));
		}
	}
	const notice = staleNotice(labels, movePaths);
	if (notice) process.stdout.write(`${notice}\n`);
}
