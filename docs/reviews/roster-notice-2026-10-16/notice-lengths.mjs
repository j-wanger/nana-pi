// Scratch: lengths of the planned roster notice forms (strings only; reads and writes nothing).
const ptr = ' · change: "roster" in ~/.pi/agent/nana-pack.json';
const lines = {
  defaultSplit: 'nana active · roster (default): builders sonnet (Claude Code only) for larger lanes and gpt-6-luna high for small lanes, reviewer gpt-5.6-sol, land gpt-6-astra · open lanes: regroup' + ptr,
  defaultNoSplit: 'nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra · open lanes: regroup' + ptr,
  fileThreeLanes: 'nana active · roster: scout gpt-6-luna medium, builders gpt-6-sol high for larger lanes and gpt-6-luna high for small lanes, reviewer gpt-5.6-sol, land seat · open lanes: alpha, beta, gamma, +2 more' + ptr,
  refusedShape: 'nana active · roster refused: roster.builder.provider must be a non-empty string with no whitespace or control character · open lanes: regroup' + ptr,
  refusedJson: 'nana active · roster refused: invalid JSON · open lanes: unknown' + ptr,
  unavailable: 'nana active · roster notice unavailable (ERR_MODULE_NOT_FOUND)',
};
for (const [k, v] of Object.entries(lines)) console.log(String(v.length).padStart(4), k);

// Seat revision 3 (2026-10-16): the open-lanes segment is cut; the pointer may gain the --json command.
const json = '; print it: node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs" --json';
const r3 = {
  r3DefaultNull: 'nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra' + ptr,
  r3DefaultSonnet: 'nana active · roster (default): builders sonnet (Claude Code only) for larger lanes and gpt-6-luna high for small lanes, reviewer gpt-5.6-sol, land gpt-6-astra' + ptr,
  r3FileFiveSlots: 'nana active · roster: scout gpt-6-luna medium, builders gpt-6-sol high for larger lanes and gpt-6-luna high for small lanes, reviewer gpt-5.6-sol, land seat' + ptr,
  r3RefusedShape: 'nana active · roster refused: roster.builder.provider must be a non-empty string with no whitespace or control character' + ptr,
  r3RefusedJson: 'nana active · roster refused: invalid JSON' + ptr,
  r3DefaultNullJson: 'nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra' + ptr + json,
  r3FileFiveSlotsJson: 'nana active · roster: scout gpt-6-luna medium, builders gpt-6-sol high for larger lanes and gpt-6-luna high for small lanes, reviewer gpt-5.6-sol, land seat' + ptr + json,
  r3RefusedShapeJson: 'nana active · roster refused: roster.builder.provider must be a non-empty string with no whitespace or control character' + ptr + json,
};
console.log('-- seat revision 3');
for (const [k, v] of Object.entries(r3)) console.log(String(v.length).padStart(4), k);
console.log('json pointer addition', json.length);
