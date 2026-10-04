# Nana — Writing for Jake

This rule applies to a message addressed to Jake: a report, a decision point, a status
update, and a `HANDOFF.md` line. A review, a brief, a worker report, a commit message
and code are technical records. They are out of scope.

## Order

- Put the verdict in the first sentence. Use one of: LANDED, DONE, BLOCKED, OPEN,
  FAILED, CARRIED, YOUR CALL.
- Put the evidence after the verdict.
- Put the technical detail in a file. Point to the file once.

## Sentences

- Keep each sentence under 25 words.
- Put one fact or one instruction in each sentence.
- Use the active voice. Name who did what.
- Use one name for one thing. Do not switch names.

## Words

- Use everyday words. Do not coin a word. Never use a word from the banned list in
  packages/nana-pack/lib/writing-config.mjs.
- Do not put a file path, an identifier, a code name or a row number in the prose.
  The technical record holds them.

## A decision point

A decision point carries five parts, in this order: what you tested, the result in
plain numbers, the trade, the recommendation, and why it is Jake's call. If it is not
his call, decide it and say so.

## Check

Before you send a report, run
`node ~/nana-pi/packages/nana-pack/bin/nana-writing.mjs --report` on the text.
After you edit `HANDOFF.md`, run it on the file. It reports. It does not block.
