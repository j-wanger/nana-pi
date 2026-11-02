import { runMutations } from '../../../packages/nana-pack/lib/mutation-runner.mjs';
const config = 'packages/nana-pack/bin/worker-config.mjs';
const worker = 'packages/nana-pack/bin/pi-worker.mjs';
const notice = 'packages/nana-pack/lib/roster-notice.mjs';
const tests = name => `packages/nana-pack/tests/${name}.test.mjs`;
const pair = (n, name, file, anchor, replacement, testFiles, expectRed, alsoRed = []) => ({
  n, name, edits: [{ file, anchor, replacement, times: 1 }], tests: testFiles, expectRed, alsoRed,
});
process.exitCode = await runMutations({
  lane: 'roster-roles', self: import.meta.url, tip: 'HEAD', branch: 'feat/roster-roles',
  // Chosen: one shard avoids overlapping Windows process-lifecycle fixtures on this shared machine.
  config: { SHARDS_DEFAULT: 1 },
  pairs: [
    pair('MM1', 'wrong planner fallback token', config,
      "scout: 'none', planner: 'seat', adversary: 'builder', checker: 'builder'",
      "scout: 'none', planner: 'none', adversary: 'builder', checker: 'builder'",
      [tests('nana-roster')], ['MM1: old machine and whole-written rosters print role null tokens after land'],
      ['seal: role fallbacks are none seat builder builder', 'roster command prints one line per slot and the source']),
    pair('MM2', 'reject Claude scout', config,
      "['largerBuilder', 'reviewer', 'scout', 'planner', 'adversary', 'checker']",
      "['largerBuilder', 'reviewer', 'planner', 'adversary', 'checker']",
      [tests('nana-roster-set')], ['MM2: role slots and scout accept pi Claude and null tokens and name malformed slots']),
    pair('MM3', 'persist normalized unnamed slots', 'packages/nana-pack/lib/roster-set.mjs',
      '.filter(([key]) => writeSlots.has(key))', '.filter(() => true)',
      [tests('nana-roster-set')], ['MM3: set preserves four old shapes without adding unnamed role slots']),
    pair('MM4', 'scout loses research tools', worker,
      "role === 'scout' ? CLAUDE_SCOUT_TOOLS : CLAUDE_BUILDER_TOOLS", 'CLAUDE_BUILDER_TOOLS',
      [tests('worker-claude')], ['MM4: role slots launch exact models tools brief and worker env or refuse before side effects']),
    pair('MM5', 'log before spawn outcome', worker,
      "child.once('spawn', () => appendContextLoad(contextLoad));", 'appendContextLoad(contextLoad);',
      [tests('worker-claude')], ['MM5: role logs once on spawn including failed children and skips absent or unsafe delivery']),
    pair('MM6', 'omit Windows role cleanup watcher', worker,
      "if (process.platform === 'win32') startLaneWatcher({ folder, lock: path.join(folder, 'unused-role.lock')",
      "if (false) startLaneWatcher({ folder, lock: path.join(folder, 'unused-role.lock')",
      [tests('worker-claude')], ['MM6: Windows role cmd launch cleans normal ceiling and forced stops without lane state']),
    pair('MM7', 'omit set scout notice', notice,
      'if (roster.scout != null) parts.push', 'if (false) parts.push',
      [tests('roster-notice')], ['MM7: roster notice shows a set scout and omits a null scout']),
    pair('MM8', 'drop resolved lineage diagnostics', 'packages/nana-pack/lib/roster-roles.mjs',
      'return pairs.flatMap', 'return [].flatMap',
      [tests('roster-notice'), tests('worker-claude')],
      ['MM8: resolved lineage pairs warn on shared and unknown sides in both seats', 'MM8: role launch lines report resolved pair lineage without swapping entries']),
    pair('MM9', 'guide loses slot command', 'packages/nana-setup/claude/rules/nana-seat.md',
      'pi-worker --slot', 'pi-worker --missing-slot',
      ['packages/nana-setup/tests/seat-rule.test.mjs'], ['MM9: role launch guidance names commands slots seat exceptions scheduling and ruling']),
  ],
});
