/**
 * @module packages/nana-pack/lib/claude-launch-config.mjs
 * @purpose Define the supported npm Claude package identity and named Windows launch refusals.
 * @inputs Windows Claude command resolution.
 * @outputs Frozen package and bin names plus refusal messages.
 * @effects none
 * @errors none
 */
// contract: npm's @anthropic-ai/claude-code package layout, observed 2026-11-01.
export const CLAUDE_PACKAGE = "@anthropic-ai/claude-code";
export const CLAUDE_BIN_NAME = "claude";
export const CLAUDE_NPM_REFUSAL = "Claude shim is not an npm global or local install (pnpm, Yarn classic and Volta 2 layouts are unsupported)";
export const CLAUDE_BIN_EXTENSION_REFUSAL = "Claude npm bin must name a .exe entry";
