#!/usr/bin/env node
// Wrong-code pairs for the seven must-meets and each new sealed value.
// Technical evidence only; no suite test runs this script.
import { runMutations } from '../../../packages/nana-pack/lib/mutation-runner.mjs';
const R = 'packages/nana-pack/bin/nana-roster.mjs';
const W = 'packages/nana-pack/bin/worker-config.mjs';
const N = 'packages/nana-pack/lib/roster-notice.mjs';
const C = 'packages/nana-pack/lib/roster-notice-config.mjs';
const T = 'packages/nana-pack/tests/nana-roster.test.mjs';
const NT = 'packages/nana-pack/tests/roster-notice.test.mjs';
const titles = {
  default: 'R-3520: absent and null lane limits default, and lanes without a roster retain default source',
  written: 'R-3521: a written lane limit prints exactly, set agrees, and JSON stays slots only',
  malformed: 'R-3522: malformed lane values keep the roster and default limit with one warning',
  notice: 'R-3523: notice shows lane limit after land, marks fallback, and omits it when unknown',
  set: 'R-3524: lanes stays outside roster, set keeps a written limit and never adds an absent one',
  ruling: 'R-3525: the final ruling points each machine to its roster limit and replaces the fixed cap',
  guide: "seat guide carries: no more lanes building than the roster command's lanes line, two in planning, each slot defined",
};
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const pair = (n, name, edits, tests, expectRed, alsoRed = []) => ({ n, name, edits, tests, expectRed, alsoRed });
const ruling = "- 2026-11-01: Each machine sets how many lanes build there in its roster file; the roster command's lanes line prints the limit, default included. At most two more lanes are planned.";
const guide = '- Keep no more lanes building than the lanes line of this machine\'s roster command allows, `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"`, and at most two more in planning.';
const pairs = [
  pair('1', 'use a wrong lane limit for an absent file', [one(R, 'lanes: resolveLaneLimit()', 'lanes: { limit: LANE_LIMIT_DEFAULT + 1, warning: null }')], [T], [titles.default], ['roster command prints one line per slot and the source']),
  pair('2', 'ignore the written machine limit', [one(R, 'const lanes = resolveLaneLimit(raw.lanes);', 'const lanes = resolveLaneLimit();')], [T], [titles.default, titles.written, titles.malformed]),
  pair('3', 'accept any numeric lane value', [one(R, 'Number.isSafeInteger(value) && value >= 1', "typeof value === 'number'")], [T], [titles.malformed]),
  pair('4', 'omit the lane segment from notices', [one(N, "\tparts.push(`${LANES_LABEL} ${lanes?.limit ?? LANE_LIMIT_DEFAULT}${lanes?.warning ? ` ${LANES_IGNORED_MARK}` : ''}`);", '')], [NT], [titles.notice]),
  pair('5', 'drop the top-level limit on slot writes', [one('packages/nana-pack/lib/pack-config-write.mjs', 'raw[member] = value;', 'delete raw.lanes; raw[member] = value;')], ['packages/nana-pack/tests/nana-roster-set.test.mjs'], [titles.set]),
  pair('6', 'restore the fixed ruling', [one('packages/nana-pack/rules/nana-rulings.md', ruling, '- 2026-10-31: At most four lanes build and two more are planned.')], ['packages/nana-pack/tests/rulings.test.mjs'], [titles.ruling]),
  pair('7', 'restore the fixed seat-guide cap', [one('packages/nana-setup/claude/rules/nana-seat.md', guide, '- Keep at most four lanes building and two more in planning, a nana default.')], ['packages/nana-setup/tests/seat-rule.test.mjs'], [titles.guide], ['seat guide holds no bullet beyond its sixteen rules']),
  pair('set-print', 'set forgets the resolved limit when printing', [one(R, 'formatRosterLines(result.roster, result.file, result.lanes)', 'formatRosterLines(result.roster, result.file)')], [T], [titles.written]),
  pair('warning', 'suppress the malformed-value warning', [one(R, "if (result.lanes.warning) process.stderr.write(`nana-roster: ${result.lanes.warning}\\n`);\n  for", 'for')], [T], [titles.malformed]),
  pair('seal-default', 'retune the sealed build limit', [one(W, 'LANE_LIMIT_DEFAULT = 4;', 'LANE_LIMIT_DEFAULT = 5;')], [T], ['seal: LANE_LIMIT_DEFAULT is 4']),
  pair('seal-label', 'retune the notice label', [one(C, "LANES_LABEL = 'lanes';", "LANES_LABEL = 'builds';")], [NT], ['seal: lane notice label is lanes']),
  pair('seal-mark', 'retune the ignored-value mark', [one(C, "LANES_IGNORED_MARK = '(file value ignored)';", "LANES_IGNORED_MARK = '(ignored)';")], [NT], ['seal: ignored lane notice mark is (file value ignored)']),
];
process.exitCode = await runMutations({ lane: 'machine-lane-limits', self: import.meta.url, tip: 'HEAD', pairs });
