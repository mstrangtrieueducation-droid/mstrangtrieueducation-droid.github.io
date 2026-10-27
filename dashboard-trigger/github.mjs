const repository = process.env.GITHUB_REPOSITORY || 'mstrangtrieueducation-droid/mstrangtrieueducation-droid.github.io';
if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw Error('INVALID_REPOSITORY');
export const coreWorkflow = 'dashboard-core-cloud.yml';
export const controllerWorkflow = 'dashboard-dispatch-keepalive.yml';
export const activeStatuses = new Set(['queued', 'in_progress', 'pending', 'waiting', 'requested']);
export async function api(path, {method = 'GET', body, token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN} = {}) {
  if (!token) throw Error('GITHUB_TOKEN_REQUIRED');
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const freshPath = method === 'GET' ? path + (path.includes('?') ? '&' : '?') + '_trigger_check=' + Date.now() : path;
      const response = await fetch('https://api.github.com/repos/' + repository + freshPath, {
        method, headers: {Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', 'Cache-Control': 'no-cache'},
        ...(body ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) throw Error('GITHUB_HTTP_' + response.status);
      return response.status === 204 ? {} : response.json();
    } catch (error) {last = error; if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1)));}
  }
  throw last;
}
export async function runs(workflow, options = {}) {
  return (await api('/actions/workflows/' + workflow + '/runs?per_page=20', options)).workflow_runs;
}
export async function dispatch(workflow, inputs, options = {}) {
  await api('/actions/workflows/' + workflow + '/dispatches', {...options, method: 'POST', body: {ref: 'main', ...(inputs ? {inputs} : {})}});
}
