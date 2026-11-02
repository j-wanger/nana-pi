PASS — land-clean-merge independent check. No MUST findings.

1. **Clean divergence:** tip landed a helper-made merge whose tree matched an independent `git merge --no-ff`. Main refused.
2. **Textual conflict:** both refused. Refs, indexes and checkout file bytes stayed unchanged.
3. **Proof paths:** tip refused main’s workflow and test-runner changes. Main refused divergence.
4. **Custom merge driver:** tip refused unsupported semantics. Main refused divergence. Neither changed refs or checkout bytes.
5. **Concurrent landing:** a second lane landed during the first CI read. Tip refused without further changes. Main refused before CI.
6. **Mutation replay:** all ten recorded pairs failed exactly their named tests. Baselines passed; no mutation survived.

**MUST findings:** none.  
**SHOULD findings:** none.

Checked `ba9fcba44cdd4ca44c0d62cd18316b1b5183ca84` using scratch repositories, scratch HOME and canned `gh` on PATH, without network. Original worktree remained unchanged.

This check supports the shared-toolkit objective. The writing checker flagged only the brief-required PASS heading; retained as required.
