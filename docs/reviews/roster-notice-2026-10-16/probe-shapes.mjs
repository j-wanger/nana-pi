// Read-only probe: how today's roster resolver (main 2dbc817, i.e. any "older checkout" once a
// new shape lands) treats each candidate lineup shape. Writes only temp files under this folder.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.join(process.env.NANA_PI ?? path.join(os.homedir(), 'nana-pi'), 'packages/nana-pack/bin');
const { resolveRoster, validateRosterShape, formatRosterLines } = await import(`${repo}/nana-roster.mjs`);

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(here, 'probe-'));
const pi = (provider, model, thinking) => ({ provider, model, thinking });
const base = () => ({ scout: null, builder: pi('example-provider', 'gpt-6-luna', 'high'), reviewer: pi('example-provider', 'gpt-5.6-sol', null), land: null });

const shapes = {
  'today (four slots)': { roster: base() },
  'A: optional claudeBuilder string': { roster: { ...base(), claudeBuilder: 'sonnet' } },
  'B: largeBuilder, Claude entry with runtime': { roster: { ...base(), largeBuilder: { runtime: 'claude-code', model: 'sonnet' } } },
  'B: largeBuilder, pi entry': { roster: { ...base(), largeBuilder: pi('example-provider', 'gpt-6-sol', 'high') } },
  'B2: runtime field on the existing builder entry': { roster: { ...base(), builder: { runtime: 'pi', ...pi('example-provider', 'gpt-6-luna', 'high') } } },
  'C: builder as a lane-size map': { roster: { ...base(), builder: { small: pi('example-provider', 'gpt-6-luna', 'high'), large: { runtime: 'claude-code', model: 'sonnet' } } } },
  'D: sibling top-level key beside roster': { roster: base(), builders: { large: { runtime: 'claude-code', model: 'sonnet' } } },
};

for (const [label, doc] of Object.entries(shapes)) {
  const dir = fs.mkdtempSync(path.join(tmp, 'agent-'));
  fs.writeFileSync(path.join(dir, 'nana-pack.json'), JSON.stringify(doc));
  const r = resolveRoster(dir);
  const out = r.ok ? `ok; builder line tokens: ${formatRosterLines(r.roster, 'file')[1]}` : `REFUSED: ${r.problem}`;
  console.log(`${label} -> ${out}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
