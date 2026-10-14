import { readFileSync, writeFileSync } from "node:fs";
const f = process.argv[2];
let t = readFileSync(f, "utf8");
t = t.replace("## 1. The product\n", "# CAP-01 · Ship the package\nPurpose: Example capability.\nOutcome: Example outcome.\n\n## FEAT-001 · Expose the package version\nPurpose: Example feature.\nStatus: active\n");
t = t.replace(/^# Part G\. .*$/m, "# CAP-02 · Keep code and promises checkable\nPurpose: Example.\nOutcome: Example.\n\n## FEAT-002 · Adopt explicit engineering standards\nPurpose: Example.\nStatus: active");
let n = 0;
t = t.replace(/^## G(\d)\. (.*)$/gm, (_, d, label) => `### SUB-00${++n} · ${label}\nPurpose: Example.`);
t = t.replace("## Open questions", "# Open questions and deliberate omissions\n\n## Open questions");
writeFileSync(f, t);
