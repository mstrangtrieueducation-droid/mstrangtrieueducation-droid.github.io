# Acceptance record — stable-20261026

Scope: 44 dashboard classes. Frozen public commit: `d8e8bfb377907bc60261050cb722c7ead30a963c`. Annotated tag: `stable-20261026`, verified to resolve to that commit. Local private restore commit: `fbb5f7d69368e6e036609ccb5029752df9f25073`, also tagged `stable-20261026` in its separate restore repository.

## Passed

- Live availability: **44/44** class endpoints, zero missing prior receipt IDs and zero lost checked positive fields in the representative comparison.
- Runtime: **13/13** receipt services enabled, **13/13** source scans healthy. The audited central queue contained 2,343 published events, no pending/stored events, and 36 isolated unmatched events. Those unmatched rows are not counted as confirmed student submissions; this audit does not certify every historical row.
- Hosted maintenance run **40369039848** succeeded on GitHub-hosted Node: **44/44** Schedule authorities and **28/28** KIDS class summaries. The desktop Schedule task was disabled beforehand and no local Schedule/source runner was active. All 44 live authority timestamps advanced after the hosted run started; oldest verified time was `2026-10-26T17:29:17.373Z`.
- Name normalization: **44/44** native factories and **20/20** receipt-fixture variations passed. Existing declared-name matching already met the requested trim/case/whitespace behavior; it was verified and frozen without introducing another classifier or relaxing identity safeguards.
- Shared core: **28/28** regression tests passed, including source failover, per-source isolation, native factory parity, identity/enrollment protection, historical retention, zero scores and teacher corrections.
- Freeze boundaries: **171** maintained local core files locked. Published check preserves all 44 pages' existing script contracts and referenced in-repository assets. CSS-only change accepted; altered inline core and shared JavaScript rejected in negative tests.
- Encrypted backend restore package: **13** actual Worker module/settings/version captures plus **44** deployed Google source project captures. Encryption/decryption round-trip verified. No student database rows exported. Restore assets are encrypted; no plaintext credentials or pupil packets were published.
- Main-branch hosted freeze verification **40372177749** passed against the immutable tag. The two bootstrap checks before/during tag creation failed in tag setup (tag absent, then checkout's local tag representation); neither was a receipt/runtime failure. The subsequent main-branch check passed without changing frozen application code or moving the stable tag.

## Operational boundary

Cloud receipt intake and hosted Schedule maintenance require no Codex process or personal computer. The hosted workflow is active and configured every five minutes. Acceptance exercised the hosted job through workflow dispatch; an automatic cron invocation had not yet been observed at the time of this record. GitHub can delay scheduled jobs. This is not a five-minute maximum-latency or zero-outage guarantee.

Daily health commits and normal data refreshes remain allowed. Core code stays frozen until the owner explicitly requests **“sửa lõi nhận bài”**. Subsequent UI work must consume native results through separate presentation modules/styles.
