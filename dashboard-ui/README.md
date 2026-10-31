Presentation-only changes live here. Reuse the existing native model; never add receipt/status/count logic.

# Frozen dashboard core

Restore point: `stable-20261031b` (earlier: `stable-20261031`, `stable-20261026`, kept intact). All 44 class dashboards share the frozen native data contract.

Only the human owner explicitly saying **“sửa lõi nhận bài”** authorizes changing receipt recognition, Schedule reading/release, history preservation, canonical counters or identity/entry protection. A UI/CSS request or new practice content does not authorize core changes. Never move or delete the stable tag or silently regenerate its baseline.

Existing inline scripts and native bundles remain frozen intact. New presentation modules/styles belong under `dashboard-ui/`, consume the existing native model, and must not reclassify submissions or count tasks independently. Preserve pupil links, enrollment boundaries, timestamps, marks and comments. Private pupil data and plaintext credentials must never be committed.

Before publication run `node system-core/check-freeze.mjs . system-core/freeze-lock.json`; CI additionally reads the immutable tag baseline. See `system-core/HANDOVER.md` for hosted operation and restore instructions.
