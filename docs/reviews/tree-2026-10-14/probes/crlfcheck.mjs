import { readFileSync } from "node:fs";
import { checkTree } from "/Users/example/nana-pi/scripts/requirements-tree.mjs";
const lf = readFileSync("/Users/example/nana-pi/REQUIREMENTS.md", "utf8");
const crlf = lf.replace(/\n/g, "\r\n");
for (const [n, t] of [["lf", lf], ["crlf", crlf]]) { const r = checkTree(t); console.log(n, "headings", r.parsed.headings.length, "problems", r.problems.length); }
