# UI build brief template

The seat tested u1–u7 on 2026-11-04 and 2026-11-05.
Judge-model taste and written audience text did not move build quality; looked-at reference images did.
In u7, the template transferred to a new page with a fresh picker, and the owner rated the builds good.

## Steps at brief time (seat)

1. **Audience and use:** describe who uses the page and what they do with it, in two or three sentences. Use no style words. The reference picker needs this text; the builder does not.
2. **References:** use one of two modes.
   - **Seat picks (default):** the seat picks one or two references by looking at captures, not names or descriptions.
   - **Owner picks (when the owner wants a say):** the owner's starred references replace the seat's picks.

   Use the [reference library](https://claude.ai/artifact/TqVYBrbms8gRvnS5sqtzce), a private artifact that the owner shares with chosen people.
   Read stars from the library's `picks` collection.
   At the next round, the seat captures URLs the owner adds as `suggested`.
   The seat adds their metadata to the file kept by the project that maintains the library.
   Keep reference images local and out of git; only metadata goes in git.

   For either mode:
   - Mix an in-domain page with an award-level page from outside the domain that fits the audience's character.
   - The in-domain page serves the same job and audience.
   - The award must be for the captured page itself, not another entry by the same maker.
   - Capture each at 1440 pixels wide, scrolled to its densest relevant view, with cookie dialogs dismissed.
   - Reject photo-led pages and cookie walls. Reject minimal-SaaS looks when the audience is not SaaS.
   - Expect the builder to copy the reference palette almost literally. Pick knowing that.
3. **Kit (recommended):** offer local fonts and icons to avoid fallback fonts. Offer the kit as a preference, not a requirement.

## The brief the builder gets

- The functional spec: content, fields, interactions, widths and contrast.
- Local paths to the reference images, with this instruction:

  > Design references: `ref-1.jpg`, `ref-2.jpg`. Open both and look carefully before you design.
  > Match their character and energy for this audience.
  > Do not copy their content, brand or photos.
  > Carry the energy with type, colour and layout.

- The kit paths, offered rather than required.
- Effort: low was enough for an acceptable build in the experiments. The owner preferred high effort with the kit.

## Gates before a human sees the build

- Defect gate: pass the lane's spec checks, plus no horizontal scroll at phone width and no contrast violations.
- Check phone width at 390 pixels unless the lane's spec names another width.
- Require no network only where the lane's spec asks for an offline page.
- Check interactions and required local files against the lane's spec.
- Show only builds that pass these defect checks.
- Recommend an anchored owner rating, using one known-cheap build and one known-acceptable build as anchors.
- That rating is a recommendation, not a land requirement.
