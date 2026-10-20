/**
 * @module packages/nana-setup/lib/hook-health.mjs
 * @purpose Judge Claude Code hook links and settings once for doctor and the session-start stale-copy producer.
 * @inputs a nana-setup layout, parsed Claude settings or its read error, the active platform, and checkout hook sources.
 * @outputs hookLinkRows() and hookSettingsRows(), ordered labelled rows with ok and detail fields.
 * @effects disk (reads links, hook targets and knowledge-hook targets).
 * @errors filesystem comparison failures become unhealthy rows; a settings read error makes every settings row unhealthy.
 */
import * as path from "node:path";
import { realPath } from "../../nana-pack/lib/real-path.mjs";
import { pkgRoot, platform, repoRoot } from "./paths.mjs";
import { desiredHooks, hasHook, hookTargets, knowledgeHookHealthy } from "./settings.mjs";
import { HOOKS } from "./steps.mjs";
import { linkOk } from "./stale-copies.mjs";

export function hookLinkRows(layout) {
	if (platform() === "win32") return [];
	const rows = [];
	for (const h of HOOKS) {
		const src = path.join(pkgRoot, "claude", "hooks", h);
		rows.push({ label: `hook ${h}`, ok: linkOk(path.join(layout.hooksDir, h), src), detail: `-> ${src}` });
	}
	return rows;
}

export function hookSettingsRows(layout, settings, parseError = null) {
	const win = platform() === "win32";
	const rows = [];
	const platformValue = win ? "win32" : undefined;
	for (const w of desiredHooks({ hooksDir: layout.hooksDir, repoRoot, platform: platformValue })) {
		if (parseError) { rows.push({ label: `settings ${w.label}`, ok: false, detail: `settings.json ${parseError}` }); continue; }
		if (win) {
			const present = hasHook(settings, w.event, w.spec, w.matcher, platformValue);
			const targets = hookTargets(settings, w.event, w.spec, platformValue);
			// win32.isAbsolute, not the platform-dependent path.isAbsolute: an exec-form
			// target is a win32 path even when this check is forced on a POSIX host.
			const resolves = targets.length > 0 && targets.every((target) => {
				try {
					const real = realPath(target, { mustExist: true });
					const root = realPath(repoRoot, { mustExist: true });
					return path.win32.isAbsolute(target) && (real === root || real.startsWith(root + path.sep));
				} catch { return false; }
			});
			const healthy = present && resolves;
			rows.push({ label: `settings ${w.label}`, ok: healthy, detail: healthy ? w.marker : `${w.marker} — target is missing or does not resolve inside ${repoRoot}` });
			continue;
		}
		const healthy = w.label === "UserPromptSubmit knowledge pull"
			? knowledgeHookHealthy(settings, repoRoot)
			: hasHook(settings, w.event, w.spec, w.matcher);
		rows.push({
			label: `settings ${w.label}`,
			ok: healthy,
			detail: w.label === "UserPromptSubmit knowledge pull" && !healthy
				? `${w.marker} — target is missing or does not resolve inside ${repoRoot}`
				: w.marker,
		});
	}
	return rows;
}
