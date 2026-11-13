// Refresh the parents' prepared Writing data as soon as the writing runner has put new results on the dash.
// Signal: the runner's public dash-stamp.json (a time and counts only, no pupil data). Stateless: dispatch the
// prepared-data job when the stamp is newer than that job's latest run and no run of it is active.
import {pathToFileURL} from 'node:url';
import {runs, dispatch, activeStatuses} from './github.mjs';

export const dataWorkflow = 'ielts-ui-data.yml';
export const followWorkflow = 'writing-dash-follow.yml';
const STAMP = 'https://raw.githubusercontent.com/mstrangtrieueducation-droid/ielts-grader-runner/writing-dashboard/dash-stamp.json';

export async function stampTime(get = url => fetch(url + '?t=' + Date.now(), {signal: AbortSignal.timeout(20000), headers: {'Cache-Control': 'no-cache'}})) {
  const response = await get(STAMP);
  if (response.status === 404) return 0;
  if (!response.ok) throw Error('STAMP_HTTP_' + response.status);
  const at = Date.parse((await response.json()).at);
  if (!Number.isFinite(at)) throw Error('STAMP_INVALID');
  return at;
}

export async function check({stamp = stampTime, inspect = () => runs(dataWorkflow), trigger = () => dispatch(dataWorkflow), log = console.log} = {}) {
  const at = await stamp();
  const list = await inspect();
  const active = list.filter(run => activeStatuses.has(run.status));
  if (active.length) { log(JSON.stringify({action: 'data-job-active', runIds: active.map(run => run.id)})); return 'active'; }
  const last = Math.max(0, ...list.map(run => Date.parse(run.created_at) || 0));
  if (at > last) { await trigger(); log(JSON.stringify({action: 'data-job-dispatched', stamp: new Date(at).toISOString()})); return 'dispatched'; }
  log(JSON.stringify({action: 'up-to-date', stamp: at ? new Date(at).toISOString() : null}));
  return 'up-to-date';
}

export async function follow({minutes = 26, intervalMs = 300000, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), once = check, log = console.log} = {}) {
  const end = now() + minutes * 60000;
  let ok = 0;
  while (now() < end) {
    try { await once(); ok++; } catch (error) { log(JSON.stringify({action: 'retry-next-tick', error: error.message})); }
    const wait = Math.min(intervalMs, end - now());
    if (wait <= 0) break;
    await sleep(wait);
  }
  if (!ok) throw Error('NO_CHECK_SUCCEEDED');
  return ok;
}

export async function handoff({currentRunId = process.env.GITHUB_RUN_ID, inspect = () => runs(followWorkflow), trigger = () => dispatch(followWorkflow), log = console.log} = {}) {
  const next = (await inspect()).filter(run => String(run.id) !== String(currentRunId) && activeStatuses.has(run.status));
  if (next.length) { log('SUCCESSOR_ALREADY_ACTIVE'); return false; }
  await trigger(); log('NEXT_FOLLOWER_DISPATCHED'); return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === 'handoff') await handoff();
  else await follow({minutes: Number(process.env.WINDOW_MINUTES || 26)});
}
