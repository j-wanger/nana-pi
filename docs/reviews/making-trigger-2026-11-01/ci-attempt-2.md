# Second finished hosted run — native synthetic paths

Run: https://github.com/j-wanger/nana-pi/actions/runs/41277508638
Tip: `6015411ba52d0e9cabefd3d0187162ae5fc2ca2d`
Finished result read once: failure; watch exit 1, finished-read exit 0.

| Job | Result |
|---|---|
| Four install checks | success |
| Linux suite | success |
| macOS suite | unrelated `worker-claude.test.mjs` SIGKILL |
| Windows suite | three automatic-memory cases passed; five transcript-discovery cases failed |

The Windows explicit-session and land-starter cases passed. The synthetic transcript writer now keys its temporary repository through `fs.realpathSync.native`, matching the production default repository resolver rather than the fixture's non-native spelling. No production source selector changed. Two existing new must-meet cases now explicitly assert that their model callback ran and that the extracted-first record exists before a seat save, preventing vacuous passes.

Local full runs after that fixture change encountered the untouched R-2726 worker-process test during the repeated daylight-saving hour: `full-suite-native.txt` and `full-suite-native-rerun.txt`, exit 1, each 8862 pass and one fail. A targeted worker recheck failed in the machine timezone and passed with `TZ=UTC`, without editing that test or implementation.

Foreground `TZ=UTC npm run test:locked`: exit 0 (`full-suite-native-utc.txt`), 249 files, 247 PASS, 0 FAIL, 2 SKIP, 0 WARN, 8863 passing checks and 44 skips. The suite still takes the normal single machine lock and does not skip the worker test. This lane does not fix the unrelated daylight-saving behavior.

R-3104 passed in Windows, so its special retry instruction did not apply. The next tip carries only fixture hardening and these records; no product behavior changed.
