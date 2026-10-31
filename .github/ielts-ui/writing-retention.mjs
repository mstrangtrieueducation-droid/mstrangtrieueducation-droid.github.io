// Carry forward the native finalized feedback object when a source transport
// drops its final-publication marker. Never infer a receipt, grade or verdict.
export function retainFinalNotebookFeedback(fresh, previous) {
  if (!fresh || !previous || fresh.className !== previous.className ||
      fresh.parentName !== previous.parentName || fresh.studentName !== previous.studentName ||
      !Array.isArray(fresh.notebookStates) || !Array.isArray(previous.notebookStates)) return fresh;
  const fields = ['assignmentCode','className','studentName','submittedAt','reviewSubmittedAt',
    'checkedAt','overall','essayGradingLocked','notebookUrls','issues','nextSteps',
    'handwriting','reviewMode','totalPages','pagesViewed'];
  const old = new Map(previous.notebookStates.filter(x => x.publicationFinal === true &&
    x.checkedAt && x.reviewSubmittedAt && x.publishedAt).map(x => [x.assignmentCode,x]));
  return {...fresh, notebookStates: fresh.notebookStates.map(item => {
    const saved = old.get(item.assignmentCode);
    if (!saved || item.publicationFinal === true ||
        (item.publishedAt && item.publishedAt !== saved.publishedAt) ||
        fields.some(k => JSON.stringify(item[k]) !== JSON.stringify(saved[k]))) return item;
    return saved;
  })};
}
