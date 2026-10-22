# Approved IELTS dashboard rollout

Scope: IELTS 45–52. Each class retains its native assignments, schedule, student hashes, edge transport and submission pipeline. Only the approved IELTS 48 presentation modules are adapted to the class name and route.

The outer banner counts every assigned, unfinished task, including older overdue tasks, future deadlines and tasks without a published deadline. The weekly planner and three normal homework filters keep their existing date scope. Clicking the banner opens the full missing-task list.

All five skills use the shared detail view. Native lesson identity is retained invisibly for asynchronous Writing matching. Speaking history rendering is scoped to the selected task so older lessons open the correct body. Unchanged refreshes preserve DOM nodes and scroll position.

## Data refresh

`.github/workflows/ielts-ui-data.yml` prepares class summaries and existing Writing feedback hourly. Summaries read prepared edge packets. Writing export is a background Google read, never triggered by a parent visit. Parents read the saved manifest and versioned JSON assets. Unsupported features stay empty; transient failures retain confirmed previous data or a clear synchronization message, and never fabricate a score or missing submission.

The existing encrypted Actions secret `IELTS_UI_PARENT_ROSTER` supplies the roster to the background exporter. Raw parent tokens are excluded from public files. Provisioning a changed roster must update this secret. Existing edge onboarding remains separate.

The two pilot IELTS 48 schedules are retired in favor of the consolidated schedule; manual dispatch remains available. Data publication merges onto the newest main branch without replacing concurrent HTML edits or forcing the branch.

## W35 source correction

The current Form response tab is sheet ID `1421328521`, now titled `IELTS WRITING - W35`. Historical ID `1761245873` is retained as `IELTS WRITING - W35 (cũ)`. The direct source reader maps both IDs to `IELTS-WRITING-W35` and recognizes the current outline-based typed essay header as submitted content. Source identity and pupil/class checks are unchanged.

Eleven actual response rows, 74–84, were replayed through the existing signed native receipt pipeline for the nine IELTS 46 pupils. No response, grade or teacher comment was edited. Receipt IDs and timestamps come from the original parser; retries remain idempotent.

## Verification and release

Local `private/`, `generated/` and `candidate/` contain private captures or staging output and are excluded from repository publication. Publication is restricted to eight class HTML files, prepared data and the shared support/workflow files. Revoked or unavailable pupil manifests and unreferenced assets are excluded from the initial release.

Checks cover all readable pupil profiles, desktop/mobile layout, shared detail views, unchanged DOM/scroll, class identity, original hash and assignment preservation, Writing JSON assets and absence of Apps Script requests in parent views. Public JSON is scanned for credentials; validated raster data URIs are treated as binary image bytes, not text API keys.

One pre-existing IELTS 52 source exception (incomplete Shadowing coverage) remains separate from the UI rollout. The previous confirmed profile and integrity checks are retained; this pupil is not falsely marked as missing work or silently included in a complete ranking.

Actual load time depends on the connection and cache state. This release does not claim a universal subsecond first visit.
