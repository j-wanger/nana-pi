# pi-seat-guide · seat wrong-code pairs

18 pairs, each applied alone in a scratch clone, with the lane's 17 test files run, then reverted.

## At build 1 (da190156)

14 red, 4 green: P2 (reviewer role), P6 (unavailable prefix in config), P12 (stale Windows copy, test ran only on win32), P15 (heading drift between the extension and the install check). Build brief 2 named all four.

## At build 2 (4bb3f463)

18 of 18 red. P16 was retargeted to the guide's reworded pi sentence.

```
{"id":"P1","row":"R-3022","desc":"guide injected for NANA_ROLE=worker (only reviewer excluded)","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 108.7s"}
{"id":"P2","row":"R-3022","desc":"guide injected for NANA_ROLE=reviewer (only worker excluded)","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 105.9s"}
{"id":"P3","row":"R-3021/R-3022","desc":"role check reads process.env instead of the injected env","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 102.9s"}
{"id":"P4","row":"R-3023","desc":"oversized guide truncated to the cap instead of refused","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 104.3s"}
{"id":"P5","row":"R-3023","desc":"marker reuses the rulings prefix (code)","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 103.0s"}
{"id":"P6","row":"R-3023","desc":"marker reuses the rulings prefix (config value)","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 104.3s"}
{"id":"P7","row":"R-3022","desc":"rulings section changed: guide appended into it for seat sessions","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 560 pass, 2 fail, 0 skip · 103.4s"}
{"id":"P8","row":"R-3022","desc":"rulings section dropped for launcher roles","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 105.2s"}
{"id":"P9","row":"R-3020","desc":"install copies the guide instead of linking on macOS","verdict":"RED","fails":"doctor-fix-line.test.mjs, doctor-memory-links.test.mjs, rulings-install.test.mjs, uninstall.test.mjs","summary":"17 files: 13 PASS, 4 FAIL, 0 SKIP, 0 WARN · checks: 553 pass, 9 fail, 0 skip · 105.2s"}
{"id":"P10","row":"R-3020","desc":"uninstall leaves the guide (manifest row removed)","verdict":"RED","fails":"rulings-install.test.mjs, state-manifest.test.mjs, uninstall.test.mjs","summary":"17 files: 14 PASS, 3 FAIL, 0 SKIP, 0 WARN · checks: 556 pass, 6 fail, 0 skip · 102.9s"}
{"id":"P11","row":"R-3024","desc":"doctor reports OK for a byte-equal POSIX copy","verdict":"RED","fails":"rulings-install.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 104.2s"}
{"id":"P12","row":"R-3024","desc":"doctor reports OK for a stale Windows copy","verdict":"RED","fails":"rulings-install.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 105.6s"}
{"id":"P13","row":"R-3024","desc":"stale-install notice omits the guide","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 105.3s"}
{"id":"P14","row":"R-3025","desc":"install-check does not check the guide heading","verdict":"RED","fails":"install-check.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 560 pass, 2 fail, 0 skip · 104.3s"}
{"id":"P15","row":"R-3021/R-3025","desc":"extension heading drifts from the heading install-check looks for","verdict":"RED","fails":"rulings-install.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 102.9s"}
{"id":"P17","row":"R-3026","desc":"AGENTS.md seat-guide bullet not updated (region drifts from template)","verdict":"RED","fails":"templates-render.test.mjs, seat-rule.test.mjs","summary":"17 files: 15 PASS, 2 FAIL, 0 SKIP, 0 WARN · checks: 559 pass, 3 fail, 0 skip · 105.5s"}
{"id":"P18","row":"R-3023","desc":"read cap retuned without the seal","verdict":"RED","fails":"rulings.test.mjs","summary":"17 files: 16 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 561 pass, 1 fail, 0 skip · 106.8s"}
```
