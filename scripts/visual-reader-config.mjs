/**
 * @module scripts/visual-reader-config.mjs
 * @purpose Seal the visual reader's prompt, Claude Code launch and bounded attempt values.
 * @inputs First-look reference limits and outside-reader watchdog values.
 * @outputs Prompt, instruction, Claude flags and imported run limits.
 * @effects none
 * @errors None.
 */
import { MAX_SPEC_LINES, REFERENCE_FRAME_CAP } from "./first-look-config.mjs";
import { MAX_SECS, POLL_SECS, RETRIES } from "./outside-reader-config.mjs";
export { MAX_SPEC_LINES, REFERENCE_FRAME_CAP, MAX_SECS, POLL_SECS, RETRIES };
// chosen (R-3148): the visual prompt is tracked beside the outside-reader prompt.
export const PROMPT_PATH = "packages/nana-pack/prompts/visual-reader.md";
// chosen (R-3148): a direct instruction avoids stdin because runWatchdog closes child stdin.
export const INSTRUCTION = "Read prompt.md in this folder and answer it.";
// contract: Claude Code 2.1.310 `claude --help`, read 2026-10-29.
export const CLAUDE_RESTRICTED_FLAG = "--restricted";
export const CLAUDE_DISABLE_SLASH_FLAG = "--disable-slash-commands";
export const CLAUDE_NO_SESSION_FLAG = "--no-session-persistence";
