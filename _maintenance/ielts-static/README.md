# IELTS static dashboards

Applies to IELTS 45–52. Parent links and renderers are unchanged. Parent browsers
read only `data/<p-token>.json` on the same GitHub Pages origin. Selected Writing
reviews and source pages use immutable JSON files in that pupil's subdirectory.
Cloudflare and Apps Script are not on the parent dashboard's data-reading path.

Google Forms and Sheets remain the source of truth. The `Update IELTS static data`
GitHub Actions workflow runs at minutes 07, 22, 37 and 52 each hour. It calls eight
read-only, signed Apps Script exporters directly, validates each class, commits
complete JSON packages and explicitly requests a Pages build. It also has a
manual **Run workflow** button. `IELTS_STATIC_ROUTES` is an encrypted Actions
secret; do not place its contents in this repository or workflow logs.

Publication is periodic, not instantaneous. A new Form response becomes visible
after the next successful export and Pages deployment; Actions scheduling can be
delayed. Open dashboards recheck their JSON every 60 seconds and on returning to
the tab, using the existing scroll-preserving render path. The data timestamp is
visible. After 30 minutes, confirmed submissions remain visible but stale source
coverage cannot prove that homework is missing. Packages older than 24 hours are
rejected. A failed class export keeps that class's previous confirmed package
and fails the workflow so the failure is visible in Actions.

Validation preserves original class/pupil identities, roster revision, joining
date, assignment authority, grades, teacher feedback, submission timestamps and
review hashes. No artificial submissions are inserted. Changed review versions
get new filenames. Earlier immutable review versions are kept for active pupils
so an already-open page can still open its referenced file. Removed pupils are
removed from the current published tree after a successful export; old public
Git history is not access control.

## Acceptance checks

1. Open an existing `#p=...` link. In Network, dashboard data must come from the
   same site's `/data/` JSON; no Worker or Apps Script data request is expected.
2. Compare all skills, teacher comments and submission timestamps with Sheets.
   Open a detailed Writing review and its original pages as well.
3. After a real Form submission, run **Update IELTS static data** manually or
   wait for the scheduled run. Confirm that Actions and the Pages build succeed,
   then reload the pupil link and check the new response and data timestamp.
4. Leave the page scrolled into an expanded lesson through a refresh. Its view
   and scroll position should remain stable.
5. If the data timestamp stops advancing, inspect the workflow's failed class
   code. Fix the Google source/authorization and rerun; do not label incomplete
   source data as no submissions, or silently replace it with an empty array.

Measure cold-page rendering in the actual parent's browser and network. Local
render timings and CDN download timings do not guarantee a sub-second load for
every connection. The full initial export is slower than regular updates because
existing immutable review files are reused on subsequent runs.
