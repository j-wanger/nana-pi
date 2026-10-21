# FEAT-009 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Trust command (trust-finds-pi): the command looks for pi only in npm's global folder. So it misses a pi installed by pnpm, bun, volta or yarn. Its line names where it looked. Under volta, an npm global install may land in volta's own store; nobody has probed this.
- Trust command (trust-finds-pi): in a mixed setup, such as Homebrew Node plus a node manager, pi can work while the command misses it. Its line then tells the owner to install a second pi.
- Trust command (trust-finds-pi): when the trust module's own dependency is missing, the line blames the trust module's path. The install command still repairs it.
- Trust command (trust-finds-pi): when npm itself is missing or fails, the command keeps its older line. That line gives no install command.
- Trust command (trust-finds-pi): no check tells the load guard from the store guard. A build that swallows a failed load still passes both new checks, because the store guard then refuses. Its line then names no error code.
- Trust command (trust-finds-pi): a load of pi's trust module can throw something that is not an error object. The line can then print undefined as the cause, or the command can crash. Such a throw is unlikely.
