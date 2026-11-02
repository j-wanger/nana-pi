/**
 * @module packages/nana-pack/lib/roster-roles.mjs
 * @purpose Resolve role fallbacks and diagnose the two roster lineage pairs for seats and launchers.
 * @inputs Validated roster, requested role and seat runtime.
 * @outputs Resolved role/slot/entry and shared or unverified lineage diagnostics.
 * @effects none
 * @errors none
 */
import { CLAUDE_CODE_RUNTIME, LINEAGE_ALIASES, ROLE_FALLBACKS } from '../bin/worker-config.mjs';

export function resolveRole(roster, role) {
  const slot = roster[role] == null ? ROLE_FALLBACKS[role] : role;
  return { role, slot, entry: roster[slot] ?? null };
}

export function lineageWarnings(roster, seatRuntime = 'pi') {
  const lineage = entry => {
    const provider = entry?.runtime ?? entry?.provider;
    return Object.hasOwn(LINEAGE_ALIASES, provider) ? LINEAGE_ALIASES[provider] : null;
  };
  const planner = resolveRole(roster, 'planner');
  const pairs = [
    ['adversary', 'planner', lineage(resolveRole(roster, 'adversary').entry), planner.slot === 'seat' ? lineage({ runtime: seatRuntime }) : lineage(planner.entry)],
    ['checker', 'reviewer', lineage(resolveRole(roster, 'checker').entry), lineage(roster.reviewer)],
  ];
  return pairs.flatMap(([role, other, left, right]) => !left || !right
    ? [`lineage: ${role} versus ${other} unverified`]
    : left === right ? [`lineage: ${role} shares ${left} with ${other}`] : []);
}
