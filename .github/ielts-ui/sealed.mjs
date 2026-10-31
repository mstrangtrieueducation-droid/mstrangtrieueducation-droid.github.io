// IELTS_SEALED_V1 for background exporters. Mirrors dashboard-ui/ielts-sealed-v1.js.
// Per-pupil data: AES-256-GCM under SHA-256("ielts-sealed-v1\n"+token).
// Class data: AES-256-GCM under a random class key, wrapped once per pupil hash.
import {createHash,createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
const LABEL='ielts-sealed-v1';
const pupilKey=token=>createHash('sha256').update(LABEL+'\n'+token).digest();
function seal(key,plain){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(Buffer.from(LABEL));const ct=Buffer.concat([c.update(plain),c.final(),c.getAuthTag()]);return {iv:iv.toString('base64'),ct:ct.toString('base64')};}
function open(key,box){const raw=Buffer.from(box.ct,'base64'),d=createDecipheriv('aes-256-gcm',key,Buffer.from(box.iv,'base64'));d.setAAD(Buffer.from(LABEL));d.setAuthTag(raw.subarray(-16));return Buffer.concat([d.update(raw.subarray(0,-16)),d.final()]);}

export const sealForPupil=(token,json)=>({sealed:LABEL,...seal(pupilKey(token),Buffer.from(json))});
export function openForPupil(token,value){return value?.sealed===LABEL?JSON.parse(open(pupilKey(token),value).toString()):value;}
export const isSealed=value=>typeof value?.sealed==='string'&&value.sealed.startsWith(LABEL);

// `visible` fields stay readable (e.g. sourceFingerprint for change detection); they must not hold pupil data.
export function sealForClass(tokens,json,visible={}){const classKey=randomBytes(32),wraps={};
 for(const t of tokens)wraps[createHash('sha256').update(t).digest('hex')]=seal(pupilKey(t),classKey);
 return {sealed:LABEL+'-class',...visible,...seal(classKey,Buffer.from(json)),wraps};}
