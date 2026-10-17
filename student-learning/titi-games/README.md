# Classroom-scoped Titi games

Shared adapter for the 43 current private dashboards in `classes.json`. Older public lookup pages are deliberately not used to authorize game entry.

Each page exposes `TitiDashboardSnapshot()` only after its existing identity checks pass. It returns the current student, class, canonical return route and completed classroom lesson evidence. No new profile request, grading write or messaging action is introduced. The private access clients are unchanged.

- KIDS: existing `sessions()` completion filter plus the matching lesson assignment. Requires the complete class payload and visible authorized profile.
- TA, Fighter, IELTS: the authorized, enrollment-filtered classroom model. `ClassroomProgress.completedAssignments()` excludes cancelled, future and self-study assignments and uses the confirmed Bangkok end time. Without an end time it waits until the end of that date.
- Game eligibility is an exact set of lesson IDs, derived from all required source groups in the game repository's `vu-tru/teaching-map.json`. Never divide a global session counter by two or assume a prefix from the highest matched game.
- TA theory is read ahead one session before being taught. The evidence mapping uses the subsequent classroom explanation/redo assignment, not the earlier theory link or Saturday self-study release.
- Fighter book tracks progress independently. Untaught books remain locked. IELTS currently has no matching course in the game catalogue and shows the closed, waiting state.

The UI is a small SVG planet launcher in the bottom corner. Its panel is collapsed by default, shows only the current textbook and next challenge, and uses “Chơi cùng Titi”, “Chơi tiếp cùng Titi” or “Săn thêm sao”. It closes on Escape/outside tap, respects reduced motion and moves above the existing homework reminder. No external image, library or font is loaded.

`ClassroomProgress.currentBooks()` selects the current textbook from the latest dated, completed classroom evidence, independent of input order and catalogue level. Fighter chooses the latest Reading and Vocabulary books independently so concurrent subjects remain available. Matching program names take precedence over old reference links. A newly started book may have zero eligible games until all source groups have been taught; it must not fall back to the completed old book. Unsupported new books and missing dates fail closed. Existing stars and scores for old books are preserved, but those books disappear from course/track selectors and cannot be entered.

Context schema 3 includes the current `books` map as well as exact `allowed` lesson IDs. Older schema 2 grants are rejected until the student reopens the dashboard. Curriculum source records and private assignment data remain on the dashboard; only minimal book/lesson grants cross into the game.

Clicking a game creates a one-use, two-minute handoff. The game consumes it and establishes a tab-local visit. A direct or copied game link in another tab cannot start a visit, even when local progress exists. Navigation and reload within an admitted visit remain usable; visits expire after 24 hours. Missing storage, missing evidence and invalid identity fail closed.

Question files and scoring are unchanged. Progress is browser-local and namespaced by course and pupil token. Classroom identity, allowed IDs and return route are stored locally; private assignment records are not copied into the game context. This static-site gate guides ordinary browser navigation. It is not cryptographic authorization against someone editing browser storage or source code, and does not make public question assets confidential.

To add a private class, add its canonical route here and to `StudentContext.ROUTES`, expose its existing guarded identity callback and completed lesson model, then run the adapter tests and game context tests. Never authorize from a public name lookup or query-string limit.

Validation: `node --test student-learning/titi-games/dashboard.test.cjs`. The tests compile every private page and execute each actual identity callback and snapshot hook with synthetic identities, including rejection cases.

Game identity is automatic: the existing authorized pupil dashboard supplies the name, class and current-book grants. No extra signup or manual profile save is required. StudentContext's shared storage adapter tries persistent storage first, then tab-scoped session storage if persistent writes fail. This fallback is used for admission, game answers, stars and the return journey, without deleting any existing dashboard caches. The UI explains that temporary progress lasts in the current tab; it does not promise cloud synchronization. If neither store works, entry stays closed with an actionable retry message, rather than attributing the failure to an unverified browser setting.
