/**
 * @module packages/nana-pack/tests/skill-claims.test.mjs
 * @purpose Pin the surface inventory and checkout-only skill claim judgements.
 * @inputs Skill and shared-section text plus the current repository tree.
 * @outputs PASS/FAIL lines and claim accounting on stdout.
 * @effects disk (reads checkout files and creates isolated temporary fixtures), process (exits non-zero on failed checks)
 * @errors A failed contract check increments the failure count and exits 1.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { EXEMPTIONS, SURFACES, judgeClaims, staleExemptions, surfaceCoverage } from "./skill-claims.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let failures = 0;
const check = (title, ok, detail = "") => {
  console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
  if (!ok) failures++;
};
const read = (p) => fs.readFileSync(path.join(REPO, p), "utf8");
const skillsDir = path.join(REPO, "packages/nana-pack/skills");
const actualSkills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `${e.name}/SKILL.md`).sort();
const actualShared = "templates/_shared/working-under-nana-pi.md";
// req: R-598
check("surface table covers every skill and the shared working section", surfaceCoverage(SURFACES, actualSkills, actualShared), `${actualSkills}`);
const missingSurface = { ...SURFACES };
delete missingSurface.spec;
// req: R-598
check("surface table coverage detects a dropped entry", !surfaceCoverage(missingSurface, actualSkills, actualShared));
// req: R-598
check("every documented claim exemption has a reason", EXEMPTIONS.every((entry) => entry.reason.trim().length > 0));

const cwdTargets = [{ name: "checkout", root: REPO }];
const working = read(actualShared);
// req: R-598
check("checkout shared-section paths resolve", judgeClaims({ surface: actualShared, root: REPO, targets: cwdTargets, text: working }).pathProblems.length === 0);
// req: R-599
check("checkout shared-section package-script claims use valid runner spelling", judgeClaims({ surface: actualShared, root: REPO, targets: cwdTargets, text: working }).commandProblems.length === 0);
// req: R-629
check("checkout shared-section script flags and nana subcommands exist in source", judgeClaims({ surface: actualShared, root: REPO, targets: cwdTargets, text: working }).flagProblems.length === 0);

const requirements = read("packages/nana-pack/skills/requirements/SKILL.md");
const baseTarget = [{ name: "checkout", root: REPO }];
const mapFenceMutation = requirements.replace("pnpm map:impact <files>", "pnpm map:impact -- <files>");
// req: R-599
check("pnpm separator after a declared script is rejected", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: mapFenceMutation }).commandProblems.some((p) => p.includes("separator")));
// req: R-599
check("npm separator remains valid", !judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: "```sh\nnpm run map:impact -- <files>\n```" }).commandProblems.some((p) => p.includes("separator")));
// req: R-599
check("unmodified requirements commands remain valid", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: requirements }).commandProblems.length === 0);
// req: R-599
check("inline pnpm separator after a declared script is rejected", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: `${requirements}\\nUse ` + "`pnpm map:impact -- <files>`." }).commandProblems.some((p) => p.includes("separator")));
// req: R-599
check("runner-less script names are rejected", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: "```sh\nmap:impact -- <changed-files>\n```" }).commandProblems.some((p) => p.includes("spell it with its runner")));

const checkoutSurfaces = [
  { surface: "requirements", text: requirements },
  { surface: actualShared, text: working },
];
const checkoutJudgements = checkoutSurfaces.map(({ surface, text }) => judgeClaims({ surface, root: REPO, targets: cwdTargets, text }));
const errors = checkoutJudgements.flatMap((r) => [...r.commandProblems, ...r.flagProblems]);
for (const { surface, text } of checkoutSurfaces) {
  for (const entry of staleExemptions(surface, text)) console.log(`STALE exemption ${entry.surface} ${entry.kind} '${entry.text}'`);
}
// req: R-598 R-599 R-629
check("checkout-only script, runner and flag claims are consistent", errors.length === 0, errors.join("\n"));
const fixtureRoot = tmpDir(path.join(os.tmpdir(), "skill-claim-fixture-"));
fs.writeFileSync(path.join(fixtureRoot, "package.json"), JSON.stringify({ scripts: { map: "node map.mjs" } }));
// req: R-599
check("runner spelling uses the declared target script inventory", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "```sh\nmap\n```" }).commandProblems.some((p) => p.includes("spell it with its runner")));
// req: R-599
check("literal pnpm argument separator is rejected by the command judge", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "```sh\npnpm map -- <files>\n```" }).commandProblems.some((p) => p.includes("separator")));
fs.mkdirSync(path.join(fixtureRoot, "scripts"));
fs.writeFileSync(path.join(fixtureRoot, "scripts/map.mjs"), "export const usage = '--impact';\\n");
// req: R-598
check("a removed claimed path is rejected", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "`scripts/gone.mjs`" }).pathProblems.length > 0);
// req: R-629
check("a missing script flag is rejected by the reused flag judge", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "`node scripts/map.mjs --impakt`" }).flagProblems.some((p) => p.includes("--impakt")));
// req: R-629
check("a missing nana-command flag is rejected", judgeClaims({ surface: actualShared, root: REPO, targets: cwdTargets, text: working.replace("--brief <file>", "--brieff <file>") }).flagProblems.some((p) => p.includes("--brieff")));
// req: R-629
check("a declared nana subcommand absent from its source is rejected", judgeClaims({ surface: "requirements", root: REPO, targets: cwdTargets, text: "`review-ledger reports`" }).flagProblems.some((p) => p.includes("reports")));
const claimCount = checkoutJudgements.reduce((n, r) => n + r.claims, 0);
const unjudged = checkoutJudgements.flatMap((r) => r.unjudgedCommands);
console.log(`claims: ${claimCount} judged, ${unjudged.length} unjudged command claims (heads: ${[...new Set(unjudged)].join(", ") || "none"})`);

if (failures) console.log(`${failures} FAILED`);
else console.log("all passed");
process.exit(failures ? 1 : 0);
