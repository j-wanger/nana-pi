Feature: FEAT-013 · Install and connect harness runtimes
Card: fix

# Review brief 1: setup-tail-win — fix for red main

Main's Windows run 42517200227 failed two cases. setup-tail M3 failed in copier update with an 8.3 short temp root against git's long path. credential-strip M2 failed its bounded check. Review `git diff main...HEAD`. The setup-tail fixture root is canonicalized. credential-strip is classified as timing, with no credential path changed by a recent lane, and joins the runner's run-alone list with no deadline changed. Question: does each fix address its cause without hiding a real failure? Is the run-alone classification supported by the log and history? Main's Windows run after the land is the proof. Threat model: honest runner and path variation; forgery out.
