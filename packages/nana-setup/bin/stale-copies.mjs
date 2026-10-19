#!/usr/bin/env node
/**
 * @module packages/nana-setup/bin/stale-copies.mjs
 * @purpose Report stale Claude Code rules and skills only for a home with a nana-setup adoption-hook install record.
 * @inputs the default active-home layout, its Claude settings, managed rule and skill lists, filesystem state and NANA_SETUP_PLATFORM.
 * @outputs one stale-copy notice on stdout, or no output when no install is recorded or every applicable item is current.
 * @effects disk (reads installed and source files), process (writes stdout).
 * @errors unexpected failures reach the launcher, which emits the unavailable marker.
 */
import * as path from "node:path";
import { skillLinkState } from "../lib/doctor.mjs";
import { platform, resolveLayout } from "../lib/paths.mjs";
import { hasAdoptionInstallRecord, linkOk, staleNotice } from "../lib/stale-copies.mjs";
import { CLAUDE_RULES, CLAUDE_SKILLS, NEW_CLAUDE_SKILLS, PACK_SKILLS_DIR, ruleSource } from "../lib/steps.mjs";

const layout = resolveLayout();
if (hasAdoptionInstallRecord(layout)) {
	const labels = [];
	for (const name of CLAUDE_RULES) {
		if (!linkOk(path.join(layout.rulesDir, name), ruleSource(name))) labels.push(`rule ${name}`);
	}
	for (const name of CLAUDE_SKILLS) {
		if (platform() === "win32" && NEW_CLAUDE_SKILLS.includes(name)) continue;
		if (!skillLinkState(path.join(layout.skillsDir, name), path.join(PACK_SKILLS_DIR, name)).ok) labels.push(`skill ${name}`);
	}
	const notice = staleNotice(labels);
	if (notice) process.stdout.write(`${notice}\n`);
}
