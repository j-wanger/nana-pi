/**
 * @module packages/nana-pack/extensions/nana-adoption.ts
 * @purpose Journal unadopted repository roots for the seat's adoption reader.
 * @inputs Fresh session starts, cwd, user-scope adoption settings and root state.
 * @outputs directory_unadopted and test-override journal records; no prompt content.
 * @effects disk (root inspection, bounded journal reads and best-effort appends).
 * @errors Never throws; adoption observability cannot interrupt a session.
 */
import * as fs from 'node:fs';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { EVENT, adoptionSettings, canonicalCwd, isAdopted, printable, recentReports, repoRootOf, rootState, tailLines } from '../lib/adoption.mjs';

let overrideJournaled = false;
// Adoption evidence includes a regular HANDOFF.md together with AGENTS.md and docs/sessions/.
// The real OS temporary directories (including canonical /tmp on POSIX) are skipped.
export default function (pi: ExtensionAPI) {
  pi.on('session_start', async (event, ctx) => {
    if (event.reason !== 'startup' && event.reason !== 'new') return;
    try {
      const { journal, objectiveFile } = adoptionSettings();
      if (!journal) return;
      if (!overrideJournaled && process.env.NANA_TEST_TEMP_ROOTS !== undefined) {
        fs.appendFileSync(journal, `${JSON.stringify({ ts: new Date().toISOString(), event: 'adoption_test_temp_roots_override', value: process.env.NANA_TEST_TEMP_ROOTS })}\n`);
        overrideJournaled = true;
      }
      if (process.env.NANA_HANDOFF === 'off') return;
      const root = repoRootOf(canonicalCwd(ctx.cwd));
      if (!root || !printable(root)) return;
      const state = rootState(root, objectiveFile);
      if (isAdopted(state) || recentReports(tailLines(journal), Date.now() - 86_400_000).some(r => r.root === root)) return;
      fs.appendFileSync(journal, `${JSON.stringify({ ts: new Date().toISOString(), event: EVENT, cwd: root, has: { handoff: false, objective: false, agents: state.agents, sessions: state.sessions } })}\n`);
    } catch {
      // Best-effort user-scope report, never a prompt or session failure.
    }
  });
}
