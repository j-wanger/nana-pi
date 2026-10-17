/**
 * @module packages/nana-pack/lib/roster-notice.mjs
 * @purpose Compose the one-line session-start roster notice from a roster result and the roster file.
 * @inputs a roster resolver result ({ok:true, roster, source} | {ok:false, file, problem}), the
 *  roster file's path, and whether PI_CODING_AGENT_DIR stays cwd-relative for this process
 * @outputs rosterNotice(result, file, relative) -> one line of display text
 * @effects none
 * @errors none — every branch returns a string; rosterNotice never throws
 */
import { CLAUDE_CODE_RUNTIME } from '../bin/worker-config.mjs';
import { displayText } from './display.mjs';
import { tildeify } from '../../nana-setup/lib/paths.mjs';
import {
	NOTICE_PREFIX,
	DEFAULT_MARK,
	REFUSED_HEAD,
	REFUSAL_CUT,
	SIZE_LABELS,
	CLAUDE_CODE_MARK,
	CHANGE_POINTER,
	RELATIVE_DIR_TEXT,
} from './roster-notice-config.mjs';

// A sentinel the roster path never collides with (it is not a path the resolver would ever
// produce), used to set the path aside before the refusal text is cut and bounded, so the cut
// marker inside a path (an agent dir named "My (old)") is never mistaken for the refusal's own
// ' (' and so the path survives whole, never elided by displayText's cap.
const PATH_PLACEHOLDER = '￼-nana-roster-path-￼';

/** One roster entry's text: model and thinking only (R-1195), never the provider field. */
function entryText(entry) {
	if (entry.runtime === CLAUDE_CODE_RUNTIME) return `${entry.model} ${CLAUDE_CODE_MARK}`;
	return entry.thinking ? `${entry.model} ${entry.thinking}` : entry.model;
}

/** The resolved roster as the notice's lineup segment (R-1194, R-1196 to R-1201). */
function rosterSegment({ roster, source }) {
	const parts = [];
	parts.push(roster.largerBuilder !== null
		? `builders ${entryText(roster.largerBuilder)} ${SIZE_LABELS.larger} and ${entryText(roster.builder)} ${SIZE_LABELS.small}`
		: `builder ${entryText(roster.builder)}`);
	parts.push(`reviewer ${entryText(roster.reviewer)}`);
	parts.push(`land ${roster.land === null ? 'seat' : entryText(roster.land)}`);
	const mark = source === 'default' ? ` ${DEFAULT_MARK}` : '';
	return `${NOTICE_PREFIX}${mark}: ${parts.join(', ')}`;
}

/**
 * The resolver's refusal as the notice's segment (R-1202): the roster path is set aside first
 * (a placeholder holding no ' (' takes its place), the result is cut at the first REFUSAL_CUT,
 * every control character and line break is replaced by a space, and only then does the path
 * come back — as `tildeify(file)` — in the placeholder's place, whole.
 */
function refusalSegment(problem, file) {
	const withPlaceholder = file ? String(problem).split(file).join(PATH_PLACEHOLDER) : String(problem);
	const cutAt = withPlaceholder.indexOf(REFUSAL_CUT);
	const cut = cutAt === -1 ? withPlaceholder : withPlaceholder.slice(0, cutAt);
	const bounded = displayText(cut);
	return `${NOTICE_PREFIX} ${REFUSED_HEAD} ${bounded.split(PATH_PLACEHOLDER).join(tildeify(file))}`;
}

/**
 * Compose the one-line roster notice (R-1194). `result` is a roster resolver result; `file` is
 * the roster file path this process resolved (named by the change pointer regardless of
 * outcome); `relative` is true when PI_CODING_AGENT_DIR stays cwd-relative for this process
 * (R-1215) — the notice then names no lineup, whatever `result` holds, because this process's
 * folder and a lane worktree could each resolve a different file.
 */
export function rosterNotice(result, file, relative) {
	const pointer = `${CHANGE_POINTER} ${tildeify(file)}`;
	const head = relative
		? `${NOTICE_PREFIX} ${RELATIVE_DIR_TEXT}`
		: result.ok
			? rosterSegment(result)
			: refusalSegment(result.problem, file);
	return `${head} · ${pointer}`;
}
