/* Confirmed submission transport: retain the caller's immutable attempt on retry. */
(function(root){
  'use strict';
  const endpoint='https://script.google.com/macros/s/AKfycbz4oph00IB6X9SlUYrK65Vsjrnd_mfm2wUg-BKZCLQnBpT6kKA-sTmFIHK1HY3ZURI/exec';
  const inflight=new Map();
  function error(code,message){return Object.assign(new Error(message),{code,retryable:true});}
  async function once(payload){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
    try{
      const requestId=crypto.randomUUID(),nonce=crypto.randomUUID();
      const body=new URLSearchParams({transport:'json-v1',payload:JSON.stringify({...payload,callbackOrigin:location.origin,requestId,nonce})});
      const response=await fetch(endpoint,{method:'POST',body,signal:controller.signal,credentials:'omit',redirect:'follow'});
      if(!response.ok)throw error('NETWORK_ERROR','Kết nối ghi điểm đang gián đoạn. Bài đã được giữ lại; em hãy thử gửi lại.');
      let result;try{result=await response.json();}catch(_){throw error('INVALID_RECEIPT','Chưa nhận được xác nhận lưu điểm. Bài vẫn được giữ lại.');}
      if(result.requestId!==requestId||result.nonce!==nonce)throw error('INVALID_RECEIPT','Mã xác nhận không khớp. Bài vẫn được giữ lại.');
      if(!result.ok)throw Object.assign(new Error(result.error?.message||'Chưa lưu được điểm.'),result.error||{code:'BACKEND_ERROR'});
      return result.data;
    }catch(e){if(e.name==='AbortError')throw error('NETWORK_TIMEOUT','Chưa nhận được xác nhận lưu điểm. Bài vẫn được giữ lại để gửi tiếp.');throw e;}
    finally{clearTimeout(timer);}
  }
  function send(payload){
    const key=JSON.stringify(payload);if(inflight.has(key))return inflight.get(key);
    const pending=(async()=>{for(let attempt=0;attempt<3;attempt++){try{return await once(payload);}catch(e){const transient=e instanceof TypeError||['NETWORK_TIMEOUT','NETWORK_ERROR','INVALID_RECEIPT','ATTEMPT_BUSY','ATTEMPT_IN_PROGRESS','SCORE_SAVE_UNCONFIRMED'].includes(e.code);if(!transient||attempt===2)throw e;await new Promise(r=>setTimeout(r,1500*(attempt+1)));}}})();
    inflight.set(key,pending);pending.then(()=>inflight.delete(key),()=>inflight.delete(key));return pending;
  }
  root.IELTSSubmission={send,async listening(params,submissionId){
    const p=new URLSearchParams(params);
    const payload={source:'ielts-listening-submit',version:1,action:'submitListening',submissionId,student:{name:p.get('entry.442430322'),className:p.get('entry.55126249')},week:p.get('entry.1893665426'),scores:['entry.1101074174','entry.1320743073','entry.838708618','entry.950878529'].map(k=>Number(p.get(k)))};
    const result=await send(payload);
    if(!result||result.persisted!==true||result.submitted!==true||result.submissionId!==submissionId||result.score!==payload.scores.reduce((a,b)=>a+b,0)||result.total!==60)throw error('INVALID_RECEIPT','Chưa xác nhận được điểm. Bài vẫn được giữ lại.');
    return result;
  }};
})(window);
