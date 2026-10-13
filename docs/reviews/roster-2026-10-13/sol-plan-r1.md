Score: 6/10

### MUST

1. **Windows seats cannot follow the newly mandatory pattern.**  
   **Evidence:** `shared-text.proposed.md:1` requires the pattern for code changes. `AGENTS.md:5` says Windows builder and reviewer launchers are unavailable. `CHANGE.md:94-96,158` explicitly excludes the Windows spawn fix. A Windows seat handling a tested code change cannot launch the required worker or independent reviewer. The workflow therefore stops or gets bypassed.  
   **Smallest fix:** Make the Windows launcher fix a prerequisite and add Windows acceptance for both launchers, or include command resolution for `pi.cmd` in this lane.

2. **A valid model typo can silently select the wrong worker.**  
   **Evidence:** `CHANGE.md:21-24` puts roster typos in scope, but `CHANGE.md:63-66` passes any syntactically valid model without reporting the resolved roster. `CHANGE.md:163` acknowledges pi accepts an unknown model as a custom ID. A realistic edit setting the builder to another valid model, such as the reviewer model, passes validation and runs successfully. The operator sees only generic worker success and may act on work produced by the wrong model.  
   **Smallest fix:** Print the selected builder provider, model, thinking level, and roster source on every lane launch. Add a requirement, direct test, and mutation pair for that diagnostic.

### NOTE

- The land rule remains intact. `CHANGE.md:68-70` places the seat review before the final independent round, so the independent reviewer covers the exact tip.
- Every proposed row contains one `shall`, and §5 names coverage for each changed or added row.
- No additional build-blocking defect appears in the declaration.

VERDICT: SEND-BACK
