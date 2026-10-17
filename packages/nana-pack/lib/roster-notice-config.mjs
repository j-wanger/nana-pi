/**
 * @module packages/nana-pack/lib/roster-notice-config.mjs
 * @purpose Define the sealed literals the roster notice composes from and the sources that show it.
 * @inputs none
 * @outputs NOTICE_PREFIX, DEFAULT_MARK, REFUSED_HEAD, REFUSAL_CUT, SIZE_LABELS, CLAUDE_CODE_MARK,
 *  WIDGET_KEY, CHANGE_POINTER, RELATIVE_DIR_TEXT, SHOW_SOURCES
 * @effects none
 * @errors none
 */
// contract: R-1194 — the word the user edits and the command prints is "roster"; "fleet" stays a
// lane nickname (seat decision S3, CHANGE.md).
export const NOTICE_PREFIX = 'nana active · roster';
// contract: R-1201 — carried exactly when the resolver returned the default roster.
export const DEFAULT_MARK = '(default)';
// contract: R-1202 — the head of a refused notice.
export const REFUSED_HEAD = 'refused:';
// contract: R-1202 — the resolver's own validator always echoes a value after this marker
// (nana-roster.mjs's "(got ...)" and "(...)" tails); cutting before it drops every echoed value
// and quoted file text a refusal would otherwise repeat into a prompt or a UI line.
export const REFUSAL_CUT = ' (';
// contract: R-1196 — "larger or riskier" is the bullet's and the README's words; the notice's
// own labels stay short so the five-slot line fits a terminal width (chosen, seat revision 3).
export const SIZE_LABELS = Object.freeze({ larger: 'for larger lanes', small: 'for small lanes' });
// contract: R-1197 — follows a Claude Code entry's model.
export const CLAUDE_CODE_MARK = '(Claude Code only)';
// contract: R-1210 — one key, so a later show replaces the earlier one rather than stacking a
// second widget above the editor (chosen).
export const WIDGET_KEY = 'nana-roster';
// contract: R-1194, R-1196, R-1197, R-1201 to R-1203 — the owner's stated purpose for the
// notice: the user alters the lineup. Names the file only; a runnable `--json` form would push
// the longest line past the one draft 2 accepted (measured, notice-lengths.mjs).
export const CHANGE_POINTER = 'change: "roster" in';
// contract: R-1215 — chosen words: names the variable to fix and why, as doctor's warn row does
// (doctor.mjs:439-440).
export const RELATIVE_DIR_TEXT = 'unknown: PI_CODING_AGENT_DIR is relative, so each folder may read a different roster file';
// contract: R-1206, R-1210 — chosen: a new session is a session start, so Claude Code's `clear`
// and pi's `new` show the notice too; `compact` and `reload` continue a session that has already
// seen it. Each seat meets only its own names among these.
export const SHOW_SOURCES = Object.freeze(['startup', 'resume', 'fork', 'clear', 'new']);
