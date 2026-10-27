import {pathToFileURL} from 'node:url';
import {api, runs, dispatch, controllerWorkflow, activeStatuses} from './github.mjs';
export async function handoff({currentRunId = process.env.GITHUB_RUN_ID, inspect = () => runs(controllerWorkflow), state = () => api('/actions/workflows/' + controllerWorkflow), trigger = () => dispatch(controllerWorkflow, {window_minutes: '26'}), log = console.log} = {}) {
  if ((await state()).state !== 'active') {log('CONTROLLER_DISABLED_NO_RESTART'); return {dispatched: false, disabled: true};}
  const next = (await inspect()).filter(run => String(run.id) !== String(currentRunId) && activeStatuses.has(run.status));
  if (next.length) {log(JSON.stringify({action: 'successor-already-active', runIds: next.map(run => run.id)})); return {dispatched: false, alreadyActive: true};}
  await trigger(); log('NEXT_CONTROLLER_DISPATCH_ACCEPTED'); return {dispatched: true};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await handoff();
