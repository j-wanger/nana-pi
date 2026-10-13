- **MUST — `packages/nana-setup/tests/pi-install-pin.test.mjs:34`**: The scanner requires `npm` and `i`/`install` on one line. A valid fenced command such as `npm \` followed by `i -g @earendil-works/pi-coding-agent@1.0.2` without the cutoff passes unnoticed. A future README edit can therefore restore the broken dependency tree without failing tests.

- **MUST — `apps/desk/pi-session.mjs:347,353`**: Two user-facing repair commands still run an unpinned install. A user with an old or malformed pi version will follow them and receive the current release instead of the required working pi 1.0.2 tree. This contradicts the brief’s “every user-facing pi install command” condition.

- **SHOULD — `HANDOFF.md:71`**: The queue still says fresh-install work remains and that fresh installs break the desk. That conflicts with the new landed entry and can misdirect the next lane.

VERDICT: SEND-BACK
