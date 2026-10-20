/**
 * @module packages/nana-pack/tests/pipe-guard.test.mjs
 * @purpose Pins verifier-pipe classification and pi gate composition.
 * @inputs the pure pipe guard and nana-gate tool_call handler.
 * @outputs PASS/FAIL lines and a nonzero exit when any check fails.
 * @effects none
 * @errors an assertion failure exits nonzero.
 */
import { verifierPipeReason } from "../lib/pipe-guard.mjs";
import gateExtension from "../extensions/nana-gate.ts";
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

let failures = 0;
const check = (title, pass) => {
	console.log(pass ? "PASS" : "FAIL", title);
	if (!pass) failures++;
};

const discardedStatusCases = [
	["bash semicolon", "npm test | tail -5; git commit -m x"],
	["bash LF", "npm test | tail -5 \t\ngit commit -m x"],
	["bash intervening git add", "npm test | tail -5; git add -A && git commit -m x"],
	["bash background", "npm test | tail -5 & git commit -m x"],
	["bash background followed by another command", "npm test | tail -5 & echo started && git commit -m x"],
	["bash set -e after pipeline", "npm test | tail -5; set -e; git commit -m x"],
	["bash set +e disables errexit before pipeline", "set -e; set +e; npm test | tail -5; git commit -m x"],
	["bash command substitution", 'echo "$(git log | head)"; git commit -m x'],
	["bash backslash-quoted heredoc body is inactive", "cat <<\\EOF\nnpm test | tail && git commit\nEOF\ngit commit -m x"],
	["bash question mark after an intervening command", "npm test | tail -5; x; echo $?; git commit -m x"],
	["bash quoted question mark after an intervening command", 'npm test | tail -5; pnpm check >/dev/null 2>&1; echo "check $?"; git commit -m x'],
	["bash completed loop", "for f in a b; do npm test | tail -5; done; git commit -m x"],
	["bash completed pipeline after a continued line", "git log |\n head -3\ngit commit -m x"],
	["PowerShell semicolon", "npm test | Select-Object -Last 5; git commit -m x", "powershell"],
	["PowerShell LF", "npm test | Select-Object -Last 5  \ngit commit -m x", "powershell"],
	["PowerShell CRLF", "npm test | Select-Object -Last 5\r\ngit commit -m x", "powershell"],
	["PowerShell LASTEXITCODE after Select-Object", "npm test | Select-Object -Last 5; if ($LASTEXITCODE -eq 0) { git commit -m x }", "powershell"],
	["PowerShell LASTEXITCODE after case-insensitive Where-Object", "npm test | wHeRe-ObJeCt { $_ }; if ($LASTEXITCODE -eq 0) { git commit -m x }", "powershell"],
	["PowerShell single-quoted question mark stays literal", "npm test | Select-Object -Last 5; if ('$?' -eq 'True') { git commit -m x }", "powershell"],
	["PowerShell backtick-escaped question mark stays literal", 'npm test | Select-Object -Last 5; if ("`$?" -eq "True") { git commit -m x }', "powershell"],
	["PowerShell backtick-escaped question mark in an expandable here-string after the pipeline stays literal", 'npm test | Select-Object -Last 5\n@"\n`$?\n"@\ngit commit -m x', "powershell"],
];
for (const [name, command, dialect] of discardedStatusCases) {
	// req: R-2350
	check(`discarded status: ${name}`, verifierPipeReason(command, dialect) === null);
}

const consumedStatusCases = [
	["bash && after redirected pipeline", "npm test 2>&1 | tail -5 && git commit -m x"],
	["bash escaped letter in git", "npm test | tail -5 && \\git commit -m x"],
	["bash ||", "npm test | tail -5 || exit 1; git commit -m x"],
	["bash pipeline continued after LF", "npm test 2>&1 |\n  tail -20 && git commit -m x"],
	["bash pipeline continued after CRLF", "npm test 2>&1 |\r\n  tail -20 && git commit -m x"],
	["bash pipeline continued after comment", "npm test 2>&1 | # keep reading\n  tail -20 && git commit -m x"],
	["bash three-stage pipeline continued after both pipes", "npm test 2>&1 |\n grep -v DEBUG |\n tail -20 && git commit -m x"],
	["bash later pipeline stage continued after LF", "npm test | grep -v DEBUG |\n tail -20 && git commit -m x"],
	["bash pipe ampersand and later stage continued after LF", "npm test |&\n grep -v x |\n tail -5 && git commit -m x"],
	["bash pipe ampersand after a later stage", "npm test | grep x |& tail -5 && git commit -m x"],
	["bash later pipeline stage continued after comment and CRLF", "npm test | grep -v DEBUG | # keep reading\t\r\n tail -20 && git commit -m x"],
	["bash backslash-LF continuations", "npm test 2>&1 | \\\n  tail -30 && \\\n  git add -A && \\\n  git commit -m x"],
	["bash backslash-CRLF continuation", "npm test 2>&1 | \\\r\n  tail -30 && git commit -m x"],
	["bash argument continued after backslash-LF", "npm test | tail -n \\\n  20 && git commit -m x"],
	["bash backslash-LF inside double quotes", "npm test | grep \"FAIL\\\nERROR\" && git commit -m x"],
	["bash pipe ampersand continued after backslash-LF", "npm test |& \\\n  tail -5 && git commit -m x"],
	["bash if then", "if npm test | tail -5; then echo ok; fi; git commit -m x"],
	["bash while do", "while npm test | tail -5; do break; done; git commit -m x"],
	["bash until do", "until npm test | tail -5; do break; done; git commit -m x"],
	["bash set -e", "set -e; npm test | tail -5; git commit -m x"],
	["bash set -o errexit", "set -o errexit; npm test | tail -5; git commit -m x"],
	["bash errexit set inside brace group", "{ set -e; npm test | tail -5; }; git commit -m x"],
	["bash errexit set inside subshell", "(set -e; npm test | tail -5; git commit -m x)"],
	["bash outer errexit survives set +e inside a subshell", "set -e; (set +e; make lint); npm test | tail -5; git commit -m x"],
	["bash outer errexit survives set +e inside command substitution", "set -e; echo \"$(set +e; make lint)\"; npm test | tail -5; git commit -m x"],
	["bash outer errexit survives set +e inside backtick substitution", "set -e; `set +e`; npm test | tail -5; git commit -m x"],
	["bash outer errexit survives a later set +e inside backtick substitution", "set -e; `echo a; set +e`; npm test | tail -5; git commit -m x"],
	["bash outer errexit survives set +e inside process substitution", "set -e; cat <(set +e; true); npm test | tail -5; git commit -m x"],
	["bash outer errexit survives set +o errexit inside a subshell", "set -e; ( set +o errexit; make lint); npm test | tail -5; git commit -m x"],
	["bash outer errexit survives a later set +e inside a subshell", "set -e; (echo preparing; set +e; true); npm test | tail -5; git commit -m checked"],
	["bash outer errexit survives a later set +e inside a command substitution", "set -e; $(echo a; set +e); npm test | tail -5; git commit -m x"],
	["bash outer errexit survives a later set +o errexit inside a subshell", "set -e; (true; set +o errexit); npm test | tail -5; git commit -m x"],
	["bash even backslashes close double quotes", 'echo "a\\\\"; echo "b\\\\"; npm test | tail -5 && git commit -m x'],
	["bash errexit set after then", "if true; then set -e; npm test | tail -5; fi; git commit -m x"],
	["bash errexit set after do", "while true; do set -e; npm test | tail -5; break; done; git commit -m x"],
	["bash question mark in if", "npm test | tail -5; if [ $? -eq 0 ]; then echo ok; fi; git commit -m x"],
	["bash braced question mark", "npm test | tail -5; [ ${?} -eq 0 ] && git commit -m x"],
	["bash braced question mark inside double quotes", 'npm test | tail -5; [ "${?}" -eq 0 ] && git commit -m x'],
	["bash wait reads background pipeline status", "npm test | tail -5 & wait $! && git commit -m x"],
	["bash wait job reads background pipeline status", "npm test | tail -5 & wait %1 && git commit -m x"],
	["bash assigned pid wait reads background pipeline status", "npm test | tail -5 & pid=$!; wait $pid && git commit -m x"],
	["bash quoted question mark", 'npm test | tail -5; [ "$?" = 0 ] && echo ok; git commit -m x'],
	["bash question mark assignment", "npm test | tail -5; rc=$?; git commit -m x"],
	["bash brace group", "{ npm test | tail -5; } && git commit -m x"],
	["bash redirected brace group", "{ npm test | tail -5; } 2>&1 && git commit -m x"],
	["bash subshell", "(npm test | tail -5) && git commit -m x"],
	["bash output assignment", "out=$(npm test | tail -5) && git commit -m x"],
	["bash pipe ampersand", "npm test |& tail -5 && git commit -m x"],
	["bash escaped ampersand is a literal stage argument", "npm test | sed s/a/\\&/ && git commit -m x"],
	["bash single-quoted multiline jq argument", "npm test --json | jq '\n .numFailedTests\n' > /dev/null && git commit -m x"],
	["bash single-quoted multiline sed argument", "npm test | sed -e 's/a/b/\ns/c/d/' -e 's/x/y/' && git commit -m x"],
	["bash double-quoted multiline grep argument", "npm test | grep -E \"FAIL|\nERROR\" --color=never && git commit -m x"],
	["bash ANSI-C-quoted multiline grep argument", "npm test | grep -E $'FAIL|\nERROR' --color=never && git commit -m x"],
	["bash comment ends despite a line-final backslash", "echo hi # note \\\nnpm test | tail -5 && git commit -m x"],
	["bash backslash-quoted heredoc body is hidden", "cat <<\\EOF\ndon't\nEOF\nnpm test | tail -5 && git commit -m x"],
	["bash loop closer", "for f in a b; do npm test | tail -5; done && git commit -m x"],
	["bash if closer", "if true; then npm test | tail -5; fi && git commit -m x"],
	["bash case closer", "case x in x) npm test | tail -5;; esac && git commit -m x"],
	["PowerShell &&", "npm test | Select-Object -Last 5 && git commit -m x", "powershell"],
	["PowerShell pipeline continued after LF", "npm test |\n Select-Object -Last 5 && git commit -m x", "powershell"],
	["PowerShell pipeline continued after CRLF", "npm test |\r\n Select-Object -Last 5 && git commit -m x", "powershell"],
	["PowerShell three-stage pipeline continued after both pipes", "npm test |\n Where-Object { $_ } |\n Select-Object -Last 5 && git commit -m x", "powershell"],
	["PowerShell later pipeline stage continued after comment", "npm test | Where-Object { $_ } | # keep reading\t\r\n Select-Object -Last 5 && git commit -m x", "powershell"],
	["PowerShell backtick-LF continuation", "npm test | Select-Object `\n -Last 5 && git commit -m x", "powershell"],
	["PowerShell backtick-CRLF continuation", "npm test | Select-Object `\r\n -Last 5 && git commit -m x", "powershell"],
	["PowerShell backtick-LF inside double quotes", "npm test | Select-String -Pattern \"FAIL`\nERROR\" -Quiet && git commit -m x", "powershell"],
	["PowerShell call operator in pipeline", "npm test | & tail -5 && git commit -m x", "powershell"],
	["PowerShell question mark", "npm test | Select-Object -Last 5; if ($?) { Write-Output ok }; git commit -m x", "powershell"],
	["PowerShell double-quoted question mark", 'npm test | Select-Object -Last 5; if ("$?" -eq "True") { git commit -m checked }', "powershell"],
	["PowerShell question mark in an expandable here-string", 'npm test | Select-Object -Last 5;\n@"\n$?\n"@\ngit commit -m x', "powershell"],
	["PowerShell question mark in a string subexpression", 'npm test | Select-Object -Last 5; "$($?)"; git commit -m x', "powershell"],
	["PowerShell ||", "npm test | Select-Object -Last 5 || exit 1; git commit -m x", "powershell"],
	["PowerShell double-quoted multiline pattern", "npm test | Select-String -Pattern \"FAIL\nERROR\" -Quiet && git commit -m x", "powershell"],
	["PowerShell single-quoted multiline pattern", "npm test | Select-String -Pattern 'FAIL\nERROR' -Quiet && git commit -m x", "powershell"],
	["PowerShell single-quoted multiline here-string pattern", "npm test | Select-String -Pattern @'\nFAIL\nERROR\n'@ -Quiet && git commit -m x", "powershell"],
	["PowerShell double-quoted multiline here-string pattern", "npm test | Select-String -Pattern @\"\nFAIL\nERROR\n\"@ -Quiet && git commit -m x", "powershell"],
	["PowerShell LASTEXITCODE after native command", "npm test | findstr PASS; if ($LASTEXITCODE -eq 0) { git commit -m x }", "powershell"],
	["PowerShell LASTEXITCODE after cmdlet then native command", "npm test | Select-Object -Last 5 | findstr PASS; if ($LASTEXITCODE -eq 0) { git commit }", "powershell"],
	["PowerShell LASTEXITCODE after native-looking alias", "npm test | select PASS; if ($LASTEXITCODE -eq 0) { git commit -m x }", "powershell"],
];
for (const [name, command, dialect] of consumedStatusCases) {
	// req: R-2351
	check(`consumed status: ${name}`, verifierPipeReason(command, dialect) !== null);
}

const gitSpellingCases = [
	["bash git.exe", "npm test | tail -5 && git.exe commit -m x"],
	["bash GIT.EXE", "npm test | tail -5 && GIT.EXE commit -m x"],
	["bash Git.Exe", "npm test | tail -5 && Git.Exe commit -m x"],
	["bash path", "npm test | tail -5 && /mingw64/bin/git.exe commit -m x"],
	["bash quoted bare", 'npm test | tail -5 && "git" commit -m x'],
	["bash single-quoted path", "npm test | tail -5 && '/c/Program Files/Git/cmd/git.exe' commit -m x"],
	["bash double-quoted path with option", 'npm test | tail -5 && "/c/Program Files/Git/cmd/git.exe" -C repo commit -m x'],
	["bash backtick substitution", "npm test | tail -5 && echo `git commit -m x`"],
	["PowerShell git.exe", "npm test | Select-Object -Last 5 && git.exe commit -m x", "powershell"],
	["PowerShell GIT.exe", "npm test | Select-Object -Last 5 && GIT.exe commit -m x", "powershell"],
	["PowerShell call double-quoted path", 'npm test | Select-Object -Last 5 && & "C:\\Program Files\\Git\\cmd\\git.exe" commit -m x', "powershell"],
	["PowerShell call single-quoted path", "npm test | Select-Object -Last 5 && & 'C:\\Program Files\\Git\\cmd\\git.exe' commit -m x", "powershell"],
	["PowerShell expandable path", 'npm test | Select-Object -Last 5 && & "$env:ProgramFiles\\Git\\cmd\\git.exe" commit -m x', "powershell"],
	["PowerShell bare path", "npm test | Select-Object -Last 5 && C:\\Git\\cmd\\git.exe commit -m x", "powershell"],
];
for (const [name, command, dialect] of gitSpellingCases) {
	// req: R-2352
	check(`git spelling: ${name}`, verifierPipeReason(command, dialect) !== null);
}

const notCommitCases = [
	["bash git.exe status", "npm test | tail -5 && git.exe status"],
	["PowerShell git.exe status", "npm test | Select-Object -Last 5 && git.exe status", "powershell"],
	["legit", "npm test | tail -5 && legit commit -m x"],
	["my-git", "npm test | tail -5 && my-git commit -m x"],
	["echo", "npm test | tail -5 && echo commit"],
	["git-lfs", "npm test | tail -5 && git-lfs commit -m x"],
	["quoted git status argument", 'npm test | tail -5 && echo "git status" commit'],
	["quoted git path glued to other text", 'npm test | tail -5 && x"/usr/bin/git" commit -m x'],
];
for (const [name, command, dialect] of notCommitCases) {
	// req: R-2353
	check(`not a commit: ${name}`, verifierPipeReason(command, dialect) === null);
}

const cases = [
	["audit slip before commit", "npm test 2>&1 | tail -5 && git commit -am 'done'", true],
	["git -C target commit", "git log | head && git -C dir commit -m ok", true],
	["git equals-valued global option", "git log | head && git --work-tree=/tmp commit -m ok", true],
	["env-prefixed commit", "git log | head && env X=1 git commit -m ok", true],
	["commit in command substitution", "git log | head && echo $(git commit -m ok)", true],
	["quoted command substitution remains executable", "echo \"$(git log | head && true)\"; git commit -m ok", true],
	["pipe inside subshell", "(git log | head) && git commit -m ok", true],
	["pipefail enabled as the exact first command", "set -o pipefail; npm test | tail && git commit -m ok", false],
	["pipefail enabled in background is inactive", "set -o pipefail & npm test | tail && git commit", true],
	["conditional pipefail enable is inactive", "false && set -o pipefail; npm test | tail && git commit", true],
	["set errexit without pipefail is not an exemption", "set -e pipefail; npm test | tail && git commit", true],
	["pipefail enabled only in pipeline is not an exemption", "set -o pipefail | cat && npm test | tail && git commit", true],
	["nested disable cancels pipefail exemption", "set -o pipefail; (set +o pipefail; npm test | tail) && git commit", true],
	["pipefail only in subshell is inactive", "(echo start; set -o pipefail); npm test | tail && git commit -m ok", true],
	["PowerShell Bash syntax does not enable pipefail", "set -o pipefail; npm test | tail && git commit -m ok", true, "powershell"],
	["double-quoted backtick substitution pipeline", 'echo "`npm test | tail && true`"; git commit -m ok', true],
	["double-quoted backtick substitution commit", 'echo "`git log | head && git commit -m ok`"', true],
	["combined pipefail enabled first", "set -euo pipefail; npm test | tail && git commit -m ok", false],
	["pipefail disabled later", "set -o pipefail; set +o pipefail; npm test | tail && git commit -m ok", true],
	["set eo pipefail first", "set -eo pipefail; npm test | tail && git commit -m ok", false],
	["pipeline after commit", "git commit -m ok; git log | head", false],
	["status read after last commit", "git commit -m x && npm test | tail -5 && echo ok", false],
	["no commit", "npm test | tail", false],
	["logical OR is not a pipeline before &&", "npm test || true && git commit -m ok", false],
	["logical OR is not a pipeline before semicolon", "npm test || true; git commit -m ok", false],
	["second pipeline status reaches commit", "npm test | tail -5; npm run lint | tail -5 && git commit -m ok", true],
	["quoted pipe and commit text", "echo 'a | git commit' && git commit -m ok", false],
	["commented pipeline", "echo okay # npm test | tail && git commit\ngit commit -m ok", false],
	["quoted here-doc text is not executed", "cat <<'END'\nnpm test | tail && git commit\nEND\ngit commit -m ok", false],
	["unquoted here-doc command substitution executes", "cat <<EOF\n$(npm test | tail && git commit)\nEOF", true],
	["here-string does not hide following pipeline", "cat <<< marker\nnpm test | tail && git commit -m ok", true],
	["eval-built command is not inspected", "eval \"npm test | tail && git commit\"", false],
	["variable-built command is not inspected", "cmd='npm test | tail && git commit'; $cmd", false],
	["alias-built command is not inspected", "alias verify='npm test | tail && true'; verify && git commit -m ok", false],
	["literal function body with pipeline and commit", "f() { npm test | tail && git commit; }", true],
	["literal function keyword body with pipeline and commit", "function f { npm test | tail && git commit; }", true],
	["runtime-built function command is not inspected", "verify() { eval \"$cmd\"; }; verify", false],
	["script command is not inspected", "./verify-and-commit.sh", false],
	["xargs-built command is not inspected", "printf x | xargs -I{} sh -c 'npm test | tail && git commit'", false],
	["interpreter-string command is not inspected", "node -e 'run(\"npm test | tail && git commit\")'", false],
	["PowerShell pipeline", "npm test | Select-Object -First 1 && git commit -m ok", true],
];
for (const [name, command, expected, dialect] of cases) {
	// req: R-2354
	check(`predicate table: ${name}`, Boolean(verifierPipeReason(command, dialect)) === expected);
}

// R-1062 (sol plan r1 MUST 1, r2 MUST 1): the PowerShell lexer in liveText. Every negative case
// carries a live `git commit` outside the construct (sol r2 MUST 1), so a lexer that exposes the
// pipe turns the case into an ask.
const psCases = [
	["PS: unquoted pipe masks a trailing commit", "npm test | Select-Object -Last 5 && git commit -m x", true],
	["PS: a $(...) subexpression inside a double-quoted string is live", '"$(npm test | Select-Object -Last 1 && true)"; git commit -m x', true],
	["PS: a $(...) subexpression inside an expandable here-string is live", '@"\n$(npm test | Select-Object -Last 1 && true)\n"@\ngit commit -m x', true],
	["PS: recovery after a backtick-escaped double quote", 'Write-Output "a`"b"; npm test | Select-Object -Last 1 && git commit -m x', true],
	["PS: recovery after a doubled double quote", 'Write-Output "a""b"; npm test | Select-Object -Last 1 && git commit -m x', true],
	["PS: mirror — the pipe stays inside a string closed only after it (backtick form)", 'Write-Output "a`" | b && true"; git commit -m x', false],
	["PS: mirror — the pipe stays inside a string closed only after it (doubled form)", 'Write-Output "a"" | b && true"; git commit -m x', false],
	["PS: a single-quoted string hides its pipe", "'npm test | x && true'; git commit -m x", false],
	["PS: a double-quoted string hides its pipe", '"npm test | x && true"; git commit -m x', false],
	["PS: a backtick escapes a pipe outside any string", "npm test `| x && git commit -m x", false],
	["PS: a line comment hides its pipe", "# npm test | x &&\ngit commit -m x", false],
	["PS: a block comment hides its pipe", "<# npm test | x && #> git commit -m x", false],
	["PS: a single-quoted here-string hides its pipe", "@'\nnpm test | x &&\n'@\ngit commit -m x", false],
	["PS: an expandable here-string with no subexpression hides its pipe", '@"\nnpm test | x &&\n"@\ngit commit -m x', false],
	["PS: a doubled single quote does not end the string early", "'it''s | x && true'; git commit -m x", false],
	// final review r1 MUST 1 (R-1062, astra's repro): a `#` mid-word, or inside a URL, is literal
	// — only a `#` at a token boundary starts a comment — so neither hides the live pipe before it.
	["PS: an embedded # inside a word does not start a comment", "npm test | Select-Object -Last 5 && Write-Output issue#123; git commit -m x", true],
	["PS: a URL fragment's # does not start a comment", "npm test | Select-Object -Last 5 && Write-Output https://host/a#summary; git commit -m x", true],
	// final review r2 MUST 1 (R-1062, sol's repro): `<#` starts a comment only at the SAME token
	// boundary as `#` — `issue<#123` is one bare token, so it never hides the live pipe before it.
	["PS: an embedded <# inside a word does not start a block comment (sol r2 repro)", "npm test | Select-Object -Last 1 && Write-Output issue<#123; git commit -m x", true],
	// the same embedded-<# repro, now inside a $(...) subexpression: matchPowerShellParen must
	// apply the identical boundary rule when it hunts for the close paren, not only the top-level
	// scan — otherwise it reads "<#123...)" as an unterminated block comment, never finds the real
	// close, and the whole subexpression (including its live pipe) is masked as literal text.
	['PS: an embedded <# inside a word inside $(...) does not start a block comment', '"$(Write-Output issue<#123; npm test | Select-Object -Last 1 && true)"; git commit -m x', true],
	// negative, regression guard: a genuine block comment at a non-initial token boundary (after
	// "; ") still hides its body — the new shared predicate must not stop recognizing real ones.
	["PS: a genuine block comment at a non-initial boundary still hides its pipe", "Write-Output x; <#npm test | y && #> git commit -m x", false],
	// final review r1 MUST 1 (R-1062, sol's repro): the $(...) subexpression bound is found with
	// the same lexical rules as the top-level scan, so a ")" inside a nested comment, block
	// comment or backtick escape never closes the subexpression early.
	["PS: a line comment inside $(...) does not end it early", '"$(Write-Output hi # )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	["PS: a block comment inside $(...) does not end it early", '"$(Write-Output hi <# ) #> npm test | Select-Object -Last 1 && true)"; git commit -m x', true],
	["PS: a backtick-escaped ) inside $(...) does not end it early", '"$(Write-Output hi `) npm test | Select-Object -Last 1 && true)"; git commit -m x', true],
	// a genuine comment — preceded by whitespace, a token boundary either way — still hides its pipe.
	["PS: a genuine comment after a command stays inactive", "git status # | x &&\ngit commit -m x", false],
	// final review r3 MUST 1 (R-1062, sol's repro): the boundary set is the UNION §2.2.3 and
	// §2.3.3 name, not the prior subset (whitespace and `; | & ( ) { }`). Each case nests its
	// boundary character inside a $(...), directly before "# )", so a scanner that fails to
	// recognise the boundary lets that stray ")" close the subexpression early — exactly sol's
	// repro — instead of the real ")" at the end of the npm test line. Whitespace itself is
	// already pinned above ("a line comment inside $(...) does not end it early").
	["PS: a comment after a closing single quote hides a ) that would close early (sol r3 repro; §2.2.3 example, §2.3.3 single-quote-character)", "\"$(Write-Output 'hi'# )\nnpm test | Select-Object -Last 1 && true\n)\"; git commit -m x", true],
	['PS: a comment after a closing double quote hides a ) that would close early (§2.2.3 example, §2.3.3 double-quote-character)', '"$(Write-Output "hi"# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: a comment after a semicolon hides a ) that would close early (§2.2.3 example, §2.3.3)', '"$(Write-Output 1;# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: a comment after a closing bracket hides a ) that would close early (§2.2.3 example only)', '"$(Write-Output $a[0]# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: a comment after a closing brace hides a ) that would close early (§2.3.3 only)', '"$(Write-Output {}# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: a comment after an opening brace hides a ) that would close early (§2.3.3 only)', '"$(Write-Output {# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: a comment after a closing paren hides a ) that would close early (§2.2.3 example, §2.3.3)', '"$(Write-Output (1)# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: a comment after an opening paren hides a ) that would close early (§2.3.3 only)', '"$(Write-Output (# )\nnpm test | Select-Object -Last 1 && true\n))"; git commit -m x', true],
	['PS: a comment after a comma hides a ) that would close early (§2.3.3 only)', '"$(Write-Output 1,# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: a comment after a pipe hides a ) that would close early (§2.3.3 only)', '"$(Write-Output 1|# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: a comment after an ampersand hides a ) that would close early (§2.3.3 only)', '"$(Write-Output 1&# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', true],
	['PS: $# is one bare word, so its ) closes the subexpression', '"$(Write-Output $# )\nnpm test | Select-Object -Last 1 && true\n)"; git commit -m x', false],
	// The tokenizer reports `$#` as one Generic token, so `#` starts no comment and the first `)`
	// closes the subexpression; the later pipe therefore stays inside the outer string.
	// backtick (§2.3.3) can never actually sit right before a LIVE "#": the backtick-escape rule
	// (matching real PowerShell) always consumes the very next character first, so "`#" is an
	// escaped, literal "#", never a comment start — this is the reachable half of that claim;
	// no positive "backtick starts a comment" case can be constructed, because the boundary
	// check is never reached at that position.
	["PS: a backtick escapes a following # instead of starting a comment", "Write-Output `# npm test | Select-Object -Last 1 &&\ngit commit -m x", true],
	// a word character (letter, digit, underscore) never starts a comment: none is named by
	// either cited section, so "#" stays mid-word and swallows nothing. The letter case already
	// exists above ("an embedded # inside a word does not start a comment"); these add the other
	// two word-character classes the same way — if "#" were wrongly treated as a boundary here,
	// it would swallow the rest of the line, including "git commit", flipping this to false.
	["PS: a digit before # does not start a comment", "npm test | Select-Object -Last 5 && Write-Output issue1#123; git commit -m x", true],
	["PS: an underscore before # does not start a comment", "npm test | Select-Object -Last 5 && Write-Output issue_#123; git commit -m x", true],
];
for (const [name, command, expected] of psCases) {
	// req: R-1062
	check(`predicate table: ${name}`, Boolean(verifierPipeReason(command, "powershell")) === expected);
}

let handler;
gateExtension({ on: (event, fn) => { if (event === "tool_call") handler = fn; } });
const ctx = { cwd: process.cwd(), hasUI: false, isProjectTrusted: () => false };
const risky = "npm test 2>&1 | tail -5 && git commit -am done";
const pipeHit = await handler({ toolName: "bash", input: { command: risky } }, ctx);
// req: R-983
check("pi headless gate blocks with verifier-pipe reason", pipeHit?.block === true && /pipefail/.test(pipeHit.reason));
const dialogPrompts = [];
const interactiveCtx = { ...ctx, hasUI: true, ui: { setStatus() {}, theme: { fg: (_tone, text) => text }, select: async (prompt) => { dialogPrompts.push(prompt); return "Block"; } } };
const interactive = await handler({ toolName: "bash", input: { command: risky } }, interactiveCtx);
// req: R-983
check("pi interactive gate prompts with verifier-pipe reason", interactive?.block === true && dialogPrompts.some((prompt) => /pipefail/.test(prompt)));
const powershell = await handler({ toolName: "powershell", input: { command: "set -o pipefail; npm test | tail && git commit -m done" } }, ctx);
// req: R-983
check("pi PowerShell gate does not treat Bash pipefail syntax as active", powershell?.block === true && /pipefail/.test(powershell.reason));
const discardedBash = await handler({ toolName: "bash", input: { command: "git status --short | head -3; git commit -m done" } }, ctx);
const discardedPowerShell = await handler({ toolName: "powershell", input: { command: "git status --short | Select-Object -First 3; git commit -m done" } }, ctx);
// req: R-2357
check("pi headless gate lets a discarded pipeline status reach git commit", discardedBash === undefined && discardedPowerShell === undefined);
const ordinary = await handler({ toolName: "bash", input: { command: "git commit -m done" } }, ctx);
// req: R-983
check("pi gate allows a bare commit", ordinary === undefined);
const existing = await handler({ toolName: "bash", input: { command: "rm -rf /tmp/x | cat && git commit -m done" } }, ctx);
// req: R-983
check("existing gate hit keeps precedence over the pipe reason", existing?.block === true && /dangerous command/.test(existing.reason) && !/pipefail/.test(existing.reason));
const unrelated = await handler({ toolName: "read", input: { path: "x" } }, ctx);
// req: R-983
check("other tool calls remain outside the gate", unrelated === undefined);

const home = tmpDir(path.join(os.tmpdir(), "nana-pipe-gate-"));
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.PI_CODING_AGENT_DIR = path.join(home, ".pi", "agent");
fs.mkdirSync(process.env.PI_CODING_AGENT_DIR, { recursive: true });
fs.writeFileSync(path.join(process.env.PI_CODING_AGENT_DIR, "nana-pack.json"), JSON.stringify({ journal: { enabled: false }, gate: { allowPatterns: ["^npm test"] } }));
let allowHandler;
gateExtension({ on: (event, fn) => { if (event === "tool_call") allowHandler = fn; } });
const allowCtx = { cwd: process.cwd(), hasUI: false, isProjectTrusted: () => false };
const allowHit = await allowHandler({ toolName: "bash", input: { command: risky } }, allowCtx);
// req: R-983
check("allowPatterns cannot exempt the verifier-pipe floor", allowHit?.block === true && /pipefail/.test(allowHit.reason));

if (failures) process.exitCode = 1;
