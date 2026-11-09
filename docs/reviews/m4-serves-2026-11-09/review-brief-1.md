Feature: FEAT-031 · Run checks reliably and without contaminating work
Card: fix

# Review brief 1: m4-serves

Review the whole lane: `git diff main...HEAD` on branch feat/m4-serves.

Main is red on all three platforms (run 42549081547): the memory-run M4 case asserts its fixture brief passes `checkBriefForLaunch`. A later land made that check refuse briefs without a valid `Serves:` line. This urgent fix adds a Serves line to the fixture write and its byte-for-byte read-back assertion, keeping CRLF and the trailing `Card: fix \t` bytes. The refusal itself is unchanged.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Question: does M4 again protect what it was written to protect (records move keeps pending evidence and lane briefs intact), and does the change cause a harm the review standard lists?
