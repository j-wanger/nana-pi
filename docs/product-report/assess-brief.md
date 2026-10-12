# Refresh product assessments

Run this loop from the repository root. Any seat can use any model.

1. Generate the refresh packets:

   ```sh
   node scripts/product-report.mjs --packets docs/product-report/out/packets
   ```

   The command creates the directory when needed. It refuses a directory that already contains files.
2. For each packet, write one candidate object using that feature's prose fields. Copy `packet.feature.id` into the candidate's `id`; use `what_it_does`, `maturity`, `maturity_reason`, `gaps`, `risks`, `decisions`, `next_step`, `written_by`, `checked_by`, and `date`. Judge the prose from the packet's rows; do not invent coverage. Copy the packet's `stamp` exactly into the candidate's `stamp` field.

   Complete candidate example (copy the actual packet stamp in place of the representative values below):

   ```json
   {
     "id": "FEAT-001",
     "what_it_does": "Keeps its checks together.",
     "maturity": "partial",
     "maturity_reason": "Some checks remain open.",
     "gaps": ["A missing check."],
     "risks": ["A stale result."],
     "decisions": ["A future choice."],
     "next_step": "Run the full suite.",
     "written_by": "seat",
     "checked_by": "reviewer",
     "date": "2026-10-11",
     "stamp": {
       "commit": "0123456789abcdef0123456789abcdef01234567",
       "purpose": "Rebuild a product report from the requirements.",
       "status": "active",
       "rows": [
         { "id": "R-1000", "mark": "own", "status": "implemented", "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" }
       ]
     }
   }
   ```
3. If `features` already contains an entry with this `id`, replace that entry with the candidate. Otherwise append the candidate to `features`. Keep the store's top-level `version` and `features` shape.
4. Run the report test:

   ```sh
   node packages/nana-pack/tests/product-report.test.mjs
   ```

   Fix every problem it names, then run the test again.
5. When a second model is available, ask it to check each candidate against its packet's rows, feature purpose and status, then resolve its findings and rerun the test.

The suite enforces prose without ASCII digits or requirement IDs, forbids `solid` when an own row is planned, untested or violated, and checks the store's closed schema at every level. It also checks stamps against the ledger at their recorded commit. Assessment staleness is shown by the report; it is not itself a test failure. Packet generation refuses when the working `REQUIREMENTS.md` differs from `HEAD`; commit REQUIREMENTS.md first so packets describe the same ledger the report will assess.
