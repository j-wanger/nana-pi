#!/usr/bin/env node
/**
 * @module packages/nana-setup/claude/hooks/nana-roster-notice.mjs
 * @purpose Print the roster notice as SessionStart context and, on a session-start-like source
 *  or a source the hook could not read, also as the Claude Code user message.
 * @inputs Claude Code SessionStart hook JSON stdin (optional), pi's active agent dir and the
 *  user-scope nana-pack.json there
 * @outputs one JSON object on stdout: {systemMessage?, hookSpecificOutput: {hookEventName:
 *  "SessionStart", additionalContext}}; on a module load failure, or a throw other than while
 *  reading input, the unavailable notice in both fields with no path
 * @effects disk (reads the user-scope nana-pack.json), process (reads stdin)
 * @errors never throws; a load or other failure becomes the unavailable notice, and the hook
 *  always exits 0
 */
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** R-1207: the module error message can hold an absolute path, so the fail-open path never
 *  reads one — this one constant lives in the hook, since it cannot rely on an import. */
function unavailablePayload(code) {
	const notice = `nana active · roster notice unavailable (${code})`;
	return { systemMessage: notice, hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notice } };
}

/**
 * Run the hook from an injected input stream (default process.stdin) and write sink (default
 * process.stdout.write), so a test can feed a stream that fails on read (R-1206, H2) without a
 * real child process. Never throws; never calls process.exit — the CLI entry below does that.
 */
export async function runRosterNoticeHook({ input = process.stdin, write = (text) => process.stdout.write(text) } = {}) {
	try {
		const [{ resolveRoster }, { rosterNotice }, { piAgentDir, piAgentDirIsCwdRelative }, { SHOW_SOURCES }] = await Promise.all([
			import('../../../nana-pack/bin/nana-roster.mjs'),
			import('../../../nana-pack/lib/roster-notice.mjs'),
			import('../../../nana-pack/lib/agent-dir.mjs'),
			import('../../../nana-pack/lib/roster-notice-config.mjs'),
		]);
		const { readHookInput } = await import('../../lib/shared-memory-input.mjs');
		const path = await import('node:path');
		// R-1206: an input read error counts as no source, the same as a missing or
		// unreadable one — read inside its OWN try, not the module-load try above, so a read
		// failure never prints the unavailable notice (pair 65).
		let source = null;
		try {
			const text = await readHookInput(input);
			if (text) {
				const parsed = JSON.parse(text);
				if (typeof parsed?.source === 'string') source = parsed.source;
			}
		} catch {
			source = null;
		}
		const agentDir = piAgentDir();
		const relative = piAgentDirIsCwdRelative();
		const result = resolveRoster(agentDir);
		const file = path.join(agentDir, 'nana-pack.json');
		const notice = rosterNotice(result, file, relative);
		const showAsMessage = source === null || SHOW_SOURCES.includes(source);
		const payload = {
			...(showAsMessage ? { systemMessage: notice } : {}),
			hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notice },
		};
		write(`${JSON.stringify(payload)}\n`);
	} catch (error) {
		write(`${JSON.stringify(unavailablePayload(error?.code ?? error?.name ?? 'Error'))}\n`);
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	await runRosterNoticeHook();
	process.exit(0);
}
