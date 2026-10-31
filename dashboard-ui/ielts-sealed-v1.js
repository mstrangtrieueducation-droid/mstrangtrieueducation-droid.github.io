/* IELTS_SEALED_V1: opens pupil-sealed static data (Writing manifests/assets, class leaderboard).
   Keys derive from the pupil token in the link (#p=…), so the public JSON is unreadable without it.
   Plain (unsealed) JSON passes through unchanged. Mirrors .github/ielts-ui/sealed.mjs. */
(function(root){'use strict';
 const LABEL='ielts-sealed-v1',enc=new TextEncoder,dec=new TextDecoder;
 const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
 let pupil=null;
 function token(){const t=new URLSearchParams(location.hash.slice(1)).get('p');if(!/^[\w-]{22}$/.test(t||''))throw Error('INVALID_LINK');return t;}
 async function keys(){const t=token();if(pupil?.token===t)return pupil;
  const raw=await crypto.subtle.digest('SHA-256',enc.encode(LABEL+'\n'+t));
  pupil={token:t,hash:hex(await crypto.subtle.digest('SHA-256',enc.encode(t))),key:await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt'])};return pupil;}
 const open=(key,box)=>crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(box.iv),additionalData:enc.encode(LABEL)},key,bytes(box.ct));
 root.IeltsSealedV1={async open(value){
  if(value?.sealed===LABEL){const p=await keys();return JSON.parse(dec.decode(await open(p.key,value)));}
  if(value?.sealed===LABEL+'-class'){const p=await keys(),wrap=value.wraps?.[p.hash];if(!wrap)throw Error('SEALED_NOT_FOR_THIS_PUPIL');
   const classKey=await crypto.subtle.importKey('raw',await open(p.key,wrap),'AES-GCM',false,['decrypt']);
   return JSON.parse(dec.decode(await open(classKey,value)));}
  return value;}};
})(window);
