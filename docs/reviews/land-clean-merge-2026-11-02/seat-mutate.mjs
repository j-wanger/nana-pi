import { runMutations } from '../../../packages/nana-pack/lib/mutation-runner.mjs';
const code='packages/nana-pack/bin/nana-land.mjs';
const clean='packages/nana-pack/tests/land-clean-merge.test.mjs';
const race='packages/nana-pack/tests/land-clean-merge-race.test.mjs';
const edit=(anchor,replacement,times=1)=>({file:code,anchor,replacement,times});
const pairs=[
 {n:'1',name:'treat a conflict as clean',tests:[clean],expectRed:[/^M4:/],edits:[edit('if (result.status === 1) throw mergeRefusal("conflict",','if (false) throw mergeRefusal("conflict",')]},
 {n:'2',name:'accept malformed merge-tree output',tests:[clean],expectRed:[/^M3:/],edits:[edit('if (result.error || ![0, 1].includes(result.status) || !objectId(lines[0] ?? "") ||\n\t\t(result.status === 0 ? lines.length !== 1 : lines.length < 2 || lines.slice(1).some((line) => !line))) {','if (false) {')]},
 {n:'3',name:'skip merge attribute check',tests:[clean],expectRed:[/^M3:/],edits:[edit('if (shared.length && fields[i + 2] !== "unspecified")','if (false)')]},
 {n:'4',name:'check proof paths only on lane side',tests:[clean],expectRed:[/^M5:/],edits:[edit('if (!mainProof.ok) throw mergeRefusal("proof", "main contribution");','if (false) throw mergeRefusal("proof", "main contribution");')]},
 {n:'5',name:'skip the CI re-read',tests:[race],expectRed:[/^M7:/],edits:[edit('const latest = readRuns();','const latest = { runs: judgedRuns };')]},
 {n:'6',name:'exempt lane-authored merge commits',tests:[clean],expectRed:[/^M6:/],edits:[edit('"rev-list", tip, "--not", capturedMain, ...reviewRefs','"rev-list", "--no-merges", tip, "--not", capturedMain, ...reviewRefs')]},
 {n:'7',name:'fast-forward to tip instead of merge',tests:[clean],expectRed:[/^M1:/,/^M2:/,/^M3:/,/^M8:/],edits:[edit('"merge", "--ff-only", landedTip','"merge", "--ff-only", tip')]},
 {n:'8',name:'drop captured-main recheck inside lock',tests:[race],expectRed:[/^M7:/],edits:[edit('if (git(runGit, main, "rev-parse", "HEAD") !== capturedMain) throw new Error("main checkout HEAD changed during suite");','// Wrong: captured main is not checked.')]},
 {n:'9',name:'read merge CI instead of accepted-tip CI at re-read',tests:[clean],expectRed:[/^M1:/],edits:[edit('head_sha=${tip}&per_page=${CI_RUNS_PAGE_SIZE}','head_sha=${landedTip}&per_page=${CI_RUNS_PAGE_SIZE}')]},
 {n:'10',name:'honor a custom default driver and disabled rename detection',tests:[clean],expectRed:[/^M2:/],edits:[edit('[...CLEAN_MERGE_GIT_CONFIG.flatMap((setting) => ["-c", setting]), "merge-tree",','["-c", "merge.renormalize=false", "merge-tree",')]},
];
process.exitCode=await runMutations({lane:'land-clean-merge',self:import.meta.url,tip:'HEAD',branch:'feat/land-clean-merge',pairs});
