/**
 * @module packages/nana-pack/lib/claude-settings-carry.mjs
 * @purpose Build role-scoped Claude settings with connection carry, ancestor memory exclusions and configured effort.
 * @inputs Sealed environment, launcher name, model, reviewed tree and user settings file.
 * @outputs Settings object, source, effort and value-free carry diagnostic; private flag settings file.
 * @effects disk (reads user settings and writes mode-0600 flag settings)
 * @errors Read and parse failures become carry diagnostics; writes throw.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { CLAUDE_ANCESTOR_MEMORY_PATHS, CLAUDE_CARRY_KEYS, CLAUDE_CARRY_ENV_NAMES } from '../bin/worker-config.mjs';
import { parseJsonBytes, jsonErrorPlace } from './json-text.mjs';
export function readClaudeBuilderSettings(sealed, launcher = 'pi-worker', model = null, tree = process.cwd()) {
	const configured = process.env.CLAUDE_CONFIG_DIR;
	const source = path.join(configured !== undefined && configured !== '' ? configured : path.join(homedir(), '.claude'), 'settings.json');
	let parsed;
	let fullChars = 0;
	let reason = null;
	try {
		const bytes = readFileSync(source);
		fullChars = bytes.toString('utf8').length;
		try { parsed = parseJsonBytes(bytes); }
		catch (error) {
			const place = jsonErrorPlace(error);
			reason = `not valid JSON${place ? ` at line ${place.line}, column ${place.column}` : ''}`;
		}
	} catch (error) {
		reason = error?.code === 'ENOENT' ? 'not found' : `cannot read (${error?.code ?? 'unknown'})`;
	}
	if (!reason && (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))) reason = 'not a JSON object';
	const claudeMdExcludes = [];
	for (let ancestor = path.dirname(path.resolve(tree));; ancestor = path.dirname(ancestor)) {
		const prefix = ancestor.split(path.sep).join('/').replace(/[?*()[\]{}!+@]/g, char => `[${char}]`);
		for (const suffix of CLAUDE_ANCESTOR_MEMORY_PATHS) claudeMdExcludes.push(`${prefix.replace(/\/$/, '')}/${suffix}`);
		if (ancestor === path.dirname(ancestor)) break;
	}
	const settings = { claudeMdExcludes };
	const carriedKeys = [];
	const carriedEnvNames = [];
	if (!reason) {
		for (const key of CLAUDE_CARRY_KEYS) if (Object.hasOwn(parsed, key)) {
			settings[key] = parsed[key];
			carriedKeys.push(key);
		}
		const sourceEnv = parsed.env;
		if (sourceEnv !== null && typeof sourceEnv === 'object' && !Array.isArray(sourceEnv)) {
			const allowed = new Set(CLAUDE_CARRY_ENV_NAMES.map((name) => name.toLowerCase()));
			settings.env = {};
			for (const [name, value] of Object.entries(sourceEnv)) if (allowed.has(name.toLowerCase())) {
				settings.env[name] = value;
				carriedEnvNames.push(name);
			}
		}
	}
	settings.env = { ...(settings.env ?? {}), ...sealed };
	let detail;
	if (reason) detail = `none; ${reason}`;
	else {
		const names = [...carriedKeys.sort(), ...(carriedEnvNames.length ? [`env ${carriedEnvNames.sort().join(', ')}`] : [])];
		detail = names.length ? names.join(', ') : 'none';
	}
	const level = !reason ? (parsed.modelSettings?.[model]?.effortLevel ?? parsed.effortLevel) : null;
	const effort = typeof level === 'string' && level.length ? level : null;
	return { settings, source, fullChars, effort, line: `${launcher}: claude settings carry: ${detail}; source: ${source}` };
}
export function writeClaudeBuilderSettings(settingsFile, carry) {
	writeFileSync(settingsFile, JSON.stringify(carry.settings), { mode: 0o600 });
}
