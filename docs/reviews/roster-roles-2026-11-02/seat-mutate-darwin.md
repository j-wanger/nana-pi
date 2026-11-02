# Seat wrong-code pairs on macOS (2026-11-03)

The seat ran `seat-mutate.mjs` on macOS at dad4756f. The runner refused before judging: pair MM6's title is a Windows-only check (SKIP on darwin), so the baseline is not green there and the runner judges nothing. The Windows run (`seat-mutate-win32.txt`, 9/9 red, every named title) is the pair evidence. Known gap: the runner has no per-platform pair filter.

```
[1/1] BASELINE MISSING title for pair MM6: MM6: Windows role cmd launch cleans normal ceiling and forced stops without lane state is not a PASS line in packages/nana-pack/tests/worker-claude.test.mjs
[1/1] seat-mutate: baseline not green — refusing to judge mutations
[1/1] RESULT: 0/0 red (0 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived
[1/1] seat-mutate: shard exited 2
MISSING MM1 wrong planner fallback token — shard 1/1 printed no line for it
MISSING MM2 reject Claude scout — shard 1/1 printed no line for it
MISSING MM3 persist normalized unnamed slots — shard 1/1 printed no line for it
MISSING MM4 scout loses research tools — shard 1/1 printed no line for it
MISSING MM5 log before spawn outcome — shard 1/1 printed no line for it
MISSING MM6 omit Windows role cleanup watcher — shard 1/1 printed no line for it
MISSING MM7 omit set scout notice — shard 1/1 printed no line for it
MISSING MM8 drop resolved lineage diagnostics — shard 1/1 printed no line for it
MISSING MM9 guide loses slot command — shard 1/1 printed no line for it
RESULT: 0/0 red (0 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, 9 MISSING, across 1 shards
seat-mutate: merged output <SCRATCH>
```
