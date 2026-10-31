# System freeze and handover

Requested restore tag: **stable-20261026**. Acceptance completed on 27 October 2026 (Asia/Bangkok). Scope: 28 KIDS, 8 IELTS, 6 FIGHTER, TA6 and TA7.

Current CI baseline: **stable-20261031b**, taken the same evening after the owner authorized (“sửa lõi nhận bài”) the lesson-entry Back fix: each tab now remembers its 12 most recent dashboard-issued lesson passes in all four entry modules. Copied links in other tabs or browsers stay blocked.

Previous CI baseline: **stable-20261031**, taken on 31 October 2026 with the owner's explicit approval. It locks the same files as stable-20261026 at their state after the owner's 26–31 October dashboard changes (Kids exam notices and video history, Fighter writing reviews, IELTS token guard and sealed Writing/leaderboard data). stable-20261026 remains intact as the earlier restore point; its backend restore package (`system-restore/`) is unchanged and does not include the 31 October IELTS Worker token guard, whose pre-change Worker code is backed up privately outside the repository.

## Operations without this computer

The 13 existing Cloudflare receivers retain native receipt intake, per-row isolation, positive-history preservation and the central one-minute rotating catch-up. Direct Google Sheets readers use primary and backup service accounts. The existing Google-hosted full-model exporters remain cloud services.

`dashboard-core-cloud.yml` runs the maintained native Schedule and class-summary producer on a GitHub-hosted Node 24 runner, on a five-minute schedule and through manual workflow dispatch. Secrets stay in GitHub's encrypted secret store. Source/configuration is AES-256-GCM encrypted in the repository; pupil snapshots, Form rows and credentials are excluded from the runtime package. No AI grading or tracker writes are part of this maintenance.

The desktop task `TrangTrieu-Dashboard-Direct-Schedule` was disabled before the hosted acceptance run. No local source-reader/publisher process was running. Hosted run 40369039848 succeeded, publishing all 44 Schedule authorities and 28 KIDS class summaries. Live authority readback confirmed all 44 timestamps advanced after that hosted run began. Closing Codex or turning off this computer does not stop these services.

The scheduler interval is a configuration, not a maximum latency guarantee: GitHub may delay scheduled runs. Use Actions run status and live `verified_at` timestamps to diagnose freshness. The public daily heartbeat is an operational record, not a five-minute health monitor. Existing Cloudflare receipt intake operates independently of this scheduled job.

## Frozen data contract and separate presentation changes

Only an explicit human request containing **“sửa lõi nhận bài”** authorizes modifying receipt recognition, declared-name matching, Schedule/release readers, submission history, canonical counters, identity/entry checks or their runtime configuration. No automatic repair, UI request or newly added practice content may silently bypass this boundary.

The server core, native factories, browser receipt/projector/cache modules and canonical count modules are hash-locked in `local-core-lock.json`. All existing inline scripts and referenced in-repository JavaScript for the 44 deployed dashboards are locked by `system-core/freeze-lock.json`. Legacy bundles contain both renderer and data code; they are frozen intact to avoid a risky rewrite during handover. New UI/CSS lives separately under `dashboard-ui/`, using native public model APIs. Styling and semantic markup can change without rewriting the locked data code. New UI must not implement another receipt or counter classifier.

Checks:

```
node system-freeze-20261026/check-local-core.mjs
node system-core/check-freeze.mjs . system-core/freeze-lock.json
```

The public CI check reads its checker and baseline from the immutable restore tag. A changed lock file in an ordinary UI commit cannot redefine that baseline. A failed check requires restoring the changed core or obtaining the user's explicit authorization; never move the stable tag.

## Verification and limits

- 44/44 live class data endpoints available; representative native snapshots retained all previously observed receipt IDs and checked submission times, file links, scores and comments.
- 13/13 receiver configurations enabled; 13/13 source scans healthy at audit. No pending/stored rows in the audited central queue. Unmatched rows remain quarantined separately; availability does not certify every historical Form row.
- Native name tests passed across all 44 factories and 20 actual-receipt fixture variations: leading/trailing/repeated spaces, case, Unicode and declared English/Vietnamese names where provided. Identity must resolve uniquely within its existing class/enrollment scope. No new fuzzy-name classifier or pupil-specific exception was added.
- Prior first-open/counter, zero-score, source-failover, native release and identity/entry regressions remain in `kids-schedule-refresh-20261026/` and `unified-receipt-core-20261026/`. Earlier browser checks are representative, not every pupil's history.

## Restore without losing student work

The GitHub tag preserves all published frontend files, encrypted cloud runtime, frozen-boundary checks and encrypted backend source restore package. The backend package contains the actual 13 Worker modules/settings/version metadata and 44 deployed Google source projects/version metadata captured read-only. It contains no D1 student rows. Private local evidence and the local Git restore point are under ignored `private/` / `restore-point/`.

Restore code from the tag into an isolated checkout. Verify package hashes; decrypt only in a private directory with the existing `DASHBOARD_CORE_KEY` and the documented AAD. Keep current Cloudflare secret bindings, D1 databases, native pupil identities/tokens and Google deployments/URLs. A code rollback must never overwrite live student databases or erase newer submissions. Compare current Worker bindings and the captured metadata, deploy the selected captured code through the existing guarded release process, then rerun native preservation and live endpoint checks. Source/version metadata is a restore reference, not permission to reactivate an old restricted account.

After this handover, stop core work. Daily health commits and scheduled data updates do not change the frozen code.
