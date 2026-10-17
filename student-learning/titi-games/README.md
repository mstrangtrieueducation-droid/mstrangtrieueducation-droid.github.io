# Classroom-scoped Titi games

Shared adapter for the 43 current private dashboards in `classes.json`. Older public lookup pages are deliberately not used to authorize game entry.

Each page exposes `TitiDashboardSnapshot()` only after its existing identity checks pass. It returns the current student, class, canonical return route and completed classroom lesson evidence. No new profile request, grading write or messaging action is introduced. The private access clients are unchanged.

- KIDS: existing `sessions()` completion filter plus the matching lesson assignment. Requires the complete class payload and visible authorized profile.
- TA, Fighter, IELTS: the authorized, enrollment-filtered classroom model. `ClassroomProgress.completedAssignments()` excludes cancelled, future and self-study assignments and uses the confirmed Bangkok end time. Without an end time it waits until the end of that date.
- Game eligibility is an exact set of lesson IDs, derived from all required source groups in the game repository's `vu-tru/teaching-map.json`. Never divide a global session counter by two or assume a prefix from the highest matched game.
- TA theory is read ahead one session before being taught. The evidence mapping uses the subsequent classroom explanation/redo assignment, not the earlier theory link or Saturday self-study release.
- Fighter book tracks progress independently. Untaught books remain locked. IELTS currently has no matching course in the game catalogue and shows the closed, waiting state.

Clicking a game creates a one-use, two-minute handoff. The game consumes it and establishes a tab-local visit. A direct or copied game link in another tab cannot start a visit, even when local progress exists. Navigation and reload within an admitted visit remain usable; visits expire after 24 hours. Missing storage, missing evidence and invalid identity fail closed.

Question files and scoring are unchanged. Progress is browser-local and namespaced by course and pupil token. Classroom identity, allowed IDs and return route are stored locally; private assignment records are not copied into the game context. This static-site gate guides ordinary browser navigation. It is not cryptographic authorization against someone editing browser storage or source code, and does not make public question assets confidential.

To add a private class, add its canonical route here and to `StudentContext.ROUTES`, expose its existing guarded identity callback and completed lesson model, then run the adapter tests and game context tests. Never authorize from a public name lookup or query-string limit.

Validation: `node --test student-learning/titi-games/dashboard.test.cjs`. The tests compile every private page and execute each actual identity callback and snapshot hook with synthetic identities, including rejection cases.
