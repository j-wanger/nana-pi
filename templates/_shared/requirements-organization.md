## How this file is organized

Rows are grouped into a tree: capability → feature → subgroup. A capability heading reads
`# CAP-nn · <label>`, a feature heading `## FEAT-nnn · <label>` and a subgroup heading
`### SUB-nnn · <label>`. Each heading is followed by a `Purpose:` line saying why that part of
the product exists; a capability also carries an `Outcome:` line, and a feature a `Status:`
line. Every row lives in exactly one table, its home. Add each new row to the table of the
feature it serves. A new feature goes under the capability it serves, never under CAP-90;
product headings start at CAP-01, FEAT-001 and SUB-001. CAP-90, FEAT-900 and SUB-900 to
SUB-904 are reserved for the general-engineering feature below. A new heading takes an
unused ID and a `Purpose:` line. No row sits in a `proposed` or `retired` feature. The
project owner decides every change to the tree. Check it with
`node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .`.
