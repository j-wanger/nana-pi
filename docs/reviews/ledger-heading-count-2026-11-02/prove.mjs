import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Hand-run evidence only; not collected by the suite. Each child has a time limit.
const folder = 'docs/reviews/ledger-heading-count-2026-11-02/';
const parserPath = 'scripts/requirements-tree.mjs';
const test = 'packages/nana-pack/tests/requirements-tree.test.mjs';
const parser = readFileSync(parserPath, 'utf8');
const ledger = readFileSync('REQUIREMENTS.md', 'utf8').replace(/\r\n/g, '\n');
const scratch = mkdtempSync(join(tmpdir(), 'heading-proof-'));
const m1 = [`platform: ${process.platform}`, 'Each case: node packages/nana-pack/tests/requirements-tree.test.mjs; timeout 120000 ms.'];
const m2 = [...m1];
const headingTitle = 'R-288: all real headings have non-empty purposes';
const structuralTitle = 'R-288: real ledger has no structural problems';
const crlfTitle = 'R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy';
function run(log, label, text, mutation, expected, titles) {
  const path = join(scratch, 'ledger.md');
  writeFileSync(path, text);
  const source = mutation ? parser.replace(mutation[0], mutation[1]) : parser;
  if (mutation && source === parser) throw Error('mutation anchor absent');
  log.push(`\n${label}`, 'REQ_TREE_LEDGER_PATH=<OS-temp>/ledger.md');
  if (mutation) log.push('Exact parser replacement diff:', `- ${mutation[0]}`, `+ ${mutation[1]}`);
  let result;
  try {
    if (mutation) writeFileSync(parserPath, source);
    result = spawnSync(process.execPath, [test], { encoding: 'utf8', timeout: 120000, env: { ...process.env, REQ_TREE_LEDGER_PATH: path } });
  } finally { if (mutation) writeFileSync(parserPath, parser); }
  const output = (result.stdout ?? '').split(/\r?\n/);
  log.push(`file exit: ${result.status}; signal: ${result.signal}; error: ${result.error?.code ?? 'none'}`);
  for (const title of titles) {
    const line = output.find((line) => line.startsWith(`${expected} ${title}`));
    if (!line) throw Error(`${label}: missing ${expected} ${title}; ${output.find((line) => line.startsWith('FAIL ' + title)) ?? result.stderr}`);
    log.push(line.trimEnd());
  }
  if (label === 'added feature: no test edit') {
    log.push('Outline assertions are expected to fail: the committed outline does not contain the temporary feature.');
    log.push(...output.filter((line) => line.startsWith('FAIL R-291: committed outline')).map((line) => line.trimEnd()));
  }
}
try {
  const returned = 'return { lines, headings, tables, allHeadings, opaque, headingsByLine, rowsInTables };';
  run(m1, 'wrong parser: drops exactly one FEAT; all levels remain', ledger,
    [returned, 'headings.splice(headings.findIndex((h) => h.id.startsWith("FEAT-")), 1);\n  ' + returned], 'FAIL', [headingTitle]);
  run(m1, 'wrong parser: first heading line +1; count unchanged', ledger,
    [returned, 'headings[0].line++;\n  ' + returned], 'FAIL', [headingTitle]);
  m1.push('\nExact ledger replacement diff:', '- ' + ledger.match(/^# CAP-01[^\n]*\n(Purpose:.*)$/m)[1], '+ Purpose:');
  run(m1, 'blank purpose', ledger.replace(/^(# CAP-01[^\n]*\n)Purpose:.*$/m, '$1Purpose:'), null, 'FAIL', [headingTitle, structuralTitle]);
  run(m2, 'wrong parser: CR retained in first heading label only', ledger,
    [returned, 'if (text.includes("\\r\\n")) headings[0].label += "\\r";\n  ' + returned], 'FAIL', [crlfTitle]);
  const feature = '\n## FEAT-899 · Temporary proof\nPurpose: added heading proof\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-9998 | The proof shall work. | untested | — |\n\n';
  if (ledger.includes('FEAT-899') || ledger.includes('| R-9998 |')) throw Error('fixture IDs already used');
  m1.push('Ledger diff: insert the following before the second capability (under the first capability):', feature);
  const secondCap = [...ledger.matchAll(/^# CAP-\d+/gm)][1].index;
  run(m1, 'added feature: no test edit', ledger.slice(0, secondCap) + feature + ledger.slice(secondCap), null, 'PASS', [headingTitle, structuralTitle]);
  for (const [label, text] of [
    ['LF input', ledger], ['CRLF input', ledger.replace(/\n/g, '\r\n')],
    ['heading trailing space and tab', ledger.replace(/^(#{1,3} (?:CAP|FEAT|SUB)-.*)$/gm, '$1 \t')],
    ['no final newline', ledger.replace(/\n$/, '')],
  ]) {
    run(m1, label, text, null, 'PASS', [headingTitle, structuralTitle]);
    run(m2, label, text, null, 'PASS', [crlfTitle]);
  }
} finally {
  writeFileSync(folder + 'm1-win32.txt', m1.join('\n') + '\n');
  writeFileSync(folder + 'm2-win32.txt', m2.join('\n') + '\n');
}
console.log('M1 and M2 evidence recorded; parser restored.');
