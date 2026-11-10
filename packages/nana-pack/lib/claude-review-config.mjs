/**
 * @module packages/nana-pack/lib/claude-review-config.mjs
 * @purpose Define the sealed Claude Code reviewer command, tool lists, roster slot and prompt framing.
 * @inputs none
 * @outputs Claude command flags, reviewer tool lists, REVIEW_SLOT, STANDARD_HEADING, REVIEWER_SENTENCE and renderReviewerSentence().
 * @effects none
 * @errors none
 */
// contract: Claude Code 2.1.299 `claude --help`, read 2026-10-22.
export const CLAUDE_BIN = 'claude';
export const CLAUDE_PRINT_FLAG = '-p';
export const CLAUDE_MODEL_FLAG = '--model';
export const CLAUDE_ALLOW_FLAG = '--allowedTools';
export const CLAUDE_DENY_FLAG = '--disallowedTools';
// contract: Claude Code --help, checked 2026-11-09; resume the exact review, never the latest session.
export const CLAUDE_SESSION_FLAG = '--session-id';
export const CLAUDE_RESUME_FLAG = '--resume';
// chosen: confirmation is a continuation without tools or another review.
export const VERDICT_CONFIRMATION_PROMPT = 'Do not review again or use tools. From your completed review, reply with only one line: VERDICT: LAND or VERDICT: SEND-BACK. No Markdown or explanation.';

// chosen: parity with the seat wrapper behind 232 recorded rounds, audited 2026-10-22 (R-2560).
export const REVIEWER_ALLOWED_TOOLS = 'Read,Grep,Glob,Bash';
export const REVIEWER_DENIED_TOOLS = 'Edit,Write,NotebookEdit';

// contract: the owner's fleet ruling, 2026-10-22 (R-2560, R-2562).
export const REVIEW_SLOT = 'reviewer';

// chosen: the seat wrapper's prompt framing, minus its base clause and pi-review aside (R-2561).
export const STANDARD_HEADING = '## Review standard';
export const REVIEWER_SENTENCE = 'Review item {item} in {tree}. Work read-only: do not edit files. The last line of your answer must be exactly VERDICT: LAND or VERDICT: SEND-BACK, with no Markdown formatting; write no other verdict line.';

export function renderReviewerSentence(item, tree) {
  return REVIEWER_SENTENCE.replace('{item}', item).replace('{tree}', tree);
}
