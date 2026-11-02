## 2026-11-02 — Reviewed clean merges

The land helper now merges moved main into an accepted tip when git finds no conflict.
The tip must have passing CI that proves its suite.
Conflicts, unsupported attributes, changed proof paths and observed races refuse the land.
The merge needs no new CI or review.
Main's push run checks the result after the push.
A clean textual merge can still break the build; that is the accepted policy limit.
