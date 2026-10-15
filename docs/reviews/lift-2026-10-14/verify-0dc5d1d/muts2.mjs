const P = "scripts/requirements-lift-proof.mjs", L = "scripts/requirements-lift.mjs";
export default [
 ["V6b val G subgroup (clean)", [[L, 'else if (level === 3 ? id !== wantSub : (node.subgroups ?? []).length === 0 && wantSub) problems.push(', 'else if (false) problems.push(']]],
 ["W3 main bypasses writeLedgerAtomic", [[L, 'const written = writeLedgerAtomic(ledgerPath, buf, output);', 'writeFileSync(ledgerPath, output); const written = { ok: true };']]],
 ["W4 main proves against a fresh re-read", [[L, 'const written = writeLedgerAtomic(ledgerPath, buf, output);', 'const written = writeLedgerAtomic(ledgerPath, readFileSync(ledgerPath), output);']]],
 ["P0+V1 head.through (both)", [[P, 'if (earliest !== Infinity && headThrough !== earliest - 1) problems.push(`head.through', 'if (false) problems.push(`head.through'], [L, 'if (earliest !== Infinity && headThrough !== earliest - 1) problems.push(`head.through', 'if (false) problems.push(`head.through']]],
 ["P15+P16+P17+P18 whole tail accounting", [[P, 'if (!matchProse(tailExpected, tailProse)) problems.push', 'if (!matchProse(tailExpected, tailProse) && false) problems.push'], [P, 'if (JSON.stringify(actualSpan) !== JSON.stringify(expectedSpan)) problems.push', 'if (false) problems.push'], [P, 'if (!found) { problems.push(`tail: kept section', 'if (!found) { continue; problems.push(`tail: kept section'], [P, 'problems.push(`tail: the closing heading', 'void (`tail: the closing heading']]],
 ["V2+G4 not-named and write gate", [[L, 'if (n === 0) problems.push(', 'if (false) problems.push('], [L, 'if (proof.problems.length) { for (const p of capProblems(proof.problems)) console.error(p); return 1; }', '']]],
];
