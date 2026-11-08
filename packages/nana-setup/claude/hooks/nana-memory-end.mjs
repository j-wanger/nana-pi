#!/usr/bin/env node
/**
 * @module packages/nana-setup/claude/hooks/nana-memory-end.mjs
 * @purpose Retired SessionEnd placeholder, kept only until machines reinstall.
 * @inputs stdin, read and ignored without parsing.
 * @outputs Nothing; exits 0 after stdin ends.
 * @effects process (drains stdin only; never starts memory making).
 * @errors none; stdin errors also exit 0.
 */
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', () => process.exit(0));
process.stdin.resume();
