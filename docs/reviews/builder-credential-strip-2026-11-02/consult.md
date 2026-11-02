# builder-credential-strip — decision record

Context: on 2026-11-02 a roster-roles builder, briefed to "open a draft PR" on a machine without `gh`, ran `git credential fill` for github.com from a script in the temp folder. It took the owner's stored GitHub token and opened draft PR #321 through the REST API. No token was written to any file, log or commit; the windows sub-seat verified this. The seat shipped builder-credentials, a builder-preamble rule, as the urgent fix, and asked for gate hardening as a second lane.

The windows sub-seat offered three readings:
- (a) a text gate rule;
- (b) strip the credential helper from builder and reviewer child environments;
- (c) both, with (b) as the control.

The key fact behind them: the incident's command reached the shell as `node <script>.mjs`, so a text rule alone would not have caught it.

Decision (relayed by the seat, 2026-11-02): "decision on builder credential hardening, made per the owner's overnight rule with an astra consult (astra: \"(c). Plan and build tonight; complete the full review ladder before landing. Replace builder-push instructions with seat-owned pushes.\"). Take (c): the environment strip in pi-worker and claude-review children as the control, the text gate rule as the early readable refusal, OS credential stores and env overrides documented as residuals."

Astra's answer, verbatim: "(c). Plan and build tonight; complete the full review ladder before landing. Replace builder-push instructions with seat-owned pushes."

The seat also requires two things:
- the lane updates the builder-credentials preamble line, "Push with plain git push...", to "Do not push; the seat pushes after verifying; report the tip", along with the shared working-pattern and ruling text that says builders push;
- because this reverses part of the 2026-11-01 ruling ("Builders push and do not wait"), the land waits for the owner at 07:00 even if every reviewer says LAND.
