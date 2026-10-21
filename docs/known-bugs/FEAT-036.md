# FEAT-036 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Study stop: the run that stopped the study stays a grader-error record, so a resume skips it. Delete its results line to run it again.
- Study stop: a run whose asset copy fails after its child still leaves no evidence on disk. The study now stops there, but nothing writes that run's evidence.
- Study stop: no test drives the exit code through the runner's entry, which needs a real pi install for pricing. The tests pin only the plan's stop.
- Study stop: no test pins the stop for a failed diff read, a part-written evidence folder, a read-only folder or a full disk. A model that leaves its workspace unreadable may now stop the study too (inferred).
- Study stop: the error names the run's spend, but no check pins that part of it. No check catches a stop that comes before the runner releases the in-flight run; the runner exits at once, so this does no harm.
- Study stop (review): when a run's asset copy fails, the stop message says its evidence could not be written, though the asset source was missing. Node's own message, appended, names the real path.
