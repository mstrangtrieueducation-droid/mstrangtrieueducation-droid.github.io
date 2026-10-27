import {pathToFileURL} from 'node:url';
import {runs, dispatch, coreWorkflow, activeStatuses} from './github.mjs';

export async function keepRhythm({minutes = 26, intervalMs = 300000, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), inspect = () => runs(coreWorkflow), trigger = () => dispatch(coreWorkflow), log = console.log} = {}) {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 30) throw Error('INVALID_WINDOW');
  const start = now(), end = start + minutes * 60000;
  let tick = 0, dispatched = 0, skipped = 0, failures = 0;
  while (true) {
    const due = start + tick * intervalMs;
    if (due >= end) {if (now() < end) await sleep(end - now()); break;}
    if (now() < due) await sleep(due - now());
    if (now() >= end) break;
    try {
      const active = (await inspect()).filter(run => activeStatuses.has(run.status));
      if (active.length) {skipped++; log(JSON.stringify({tick, action: 'core-already-active', runIds: active.map(run => run.id)}));}
      else {await trigger(); dispatched++; log(JSON.stringify({tick, action: 'core-dispatched', at: new Date(now()).toISOString()}));}
    } catch (error) {failures++; log(JSON.stringify({tick, action: 'retry-next-tick', error: error.message}));}
    tick++;
    // Skip elapsed slots after a slow API call; never burst multiple old ticks.
    if (now() > start + tick * intervalMs) tick = Math.floor((now() - start) / intervalMs) + 1;
  }
  const result = {ticks: dispatched + skipped + failures, dispatched, skipped, failures, minutes};
  log(JSON.stringify(result));
  if (!dispatched && !skipped) throw Error('NO_CORE_TRIGGER_SUCCEEDED');
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await keepRhythm({minutes: Number(process.env.WINDOW_MINUTES || 26)});
}
