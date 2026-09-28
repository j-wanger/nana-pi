1. **HIGH — FIXED by ruling** — `research/pi-landscape-2026-09-01.md:363`: AGENTS.md’s dated-addendum rule governs; the hunk is intentional despite the erroneous original NOT-list.

2. **MEDIUM — FIXED** — `packages/nana-pack/README.md:59`, `apps/desk/README.md:17,65`, `README.md:49,55`: tested host is now 0.87.1, while the 0.84.4 floor and skill-specific verification are accurately distinguished.

3. **LOW wording — PARTIAL** — `apps/desk/README.md:513` correctly documents default-TUI parity, the setting gate, and deliberate unconditional hiding. However, `apps/desk/server.mjs:1065-1068` still opens with “never renders” before contradicting that with the `showCacheMissNotices` exception; `apps/desk/test/pi-087-entries.test.mjs:2-4` has the same absolute wording. Documentation-only residual.

4. **LOW test — FIXED** — `apps/desk/test/pi-087-entries.test.mjs:52-58,83-84`: the fixture now ends at a real `context_edit` leaf after `usage`, and verifies the resulting branch.

**New fold defects:** none.

**Land residuals:** clean up the two remaining absolute TUI comments; restart the live desk service; document the old-study reproduction versus fork/re-pin path.

VERDICT: LAND
