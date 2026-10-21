"""Remove exam narration from practice transcripts and repair reviewed OCR/gaps.

Only operates on the legacy Tests 1-10 data format. Keeps question keys and audio
unchanged. The missing-audio gaps were in narration outside the trimmed recording.
"""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[2]
REPLACEMENTS={
 (2,1):{0:'Tauber Insurance Company'},
 (6,1):{0:"volunteer for the Children’s Section",1:'spoke to you on the phone yesterday'},
 (7,3):{0:'What are we going to do about this assignment'},
 (8,1):{0:"I'd like to join the club"},
 (9,1):{0:'How can I help you'},
}
OCR={'no means ts first eruption':'no means its first eruption','Ishould':'I should',
 'Idon':'I don','Iwas':'I was','Ive':'I’ve','ltis':'It is','justa':'just a',
 'Ibought':'I bought','andis':'and is','thata':'that a','Marhrutor':'MathTutor',
 'quasiexperimental':'quasi-experimental','clouds ability':'cloud’s ability',"I'help":'I help'}
def fix(text):
 for a,b in OCR.items():text=text.replace(a,b)
 return text
def pattern(value):
 return ''.join(r'\s+' if c==' ' else "['’]" if c in "'’" else re.escape(c) for c in value)
changes=[]
for p in (ROOT/'ielts-nghe').glob('*.html'):
 text=p.read_bytes().decode('utf-8');m=re.search(r'const DATA\s*=\s*',text)
 if not m:continue
 data,size=json.JSONDecoder().raw_decode(text[m.end():])
 if int(data['test'])>10:continue
 original=json.dumps(data,ensure_ascii=False)
 for section in data['sections']:
  old=section['dictationAnswers'];tr=section['transcript']
  for i,a in enumerate(old):tr=tr.replace('[[%d]]'%i,a)
  # The recording starts with the actual dialogue/lecture after this instruction.
  lead=re.search(r'Listen\s+carefully\s+and\s+answer\s+questions?\s*[^.]+\.',tr,re.I)
  if lead:tr=tr[lead.end():].lstrip()
  tr=re.sub(r'Before you hear the rest.*?Now listen and answer questions?\s+\d+\s+to\s+\d+\s*\.', '',tr,flags=re.I|re.S)
  tr=re.split(r'That is the end of section\s+\d+',tr,flags=re.I)[0].rstrip()
  tr=fix(tr)
  # TFN (tax file number) was misread as TEN in the old scan.
  if (data['test'],section['number'])==(7,1):tr=re.sub(r'\bTEN\b','TFN',tr)
  answers=[fix(a) for a in old]
  for i,a in REPLACEMENTS.get((data['test'],section['number']),{}).items():answers[i]=a
  spans=[]
  for i,a in enumerate(answers):
   matches=list(re.finditer(pattern(a),tr,re.I))
   available=[x for x in matches if not any(x.start()<b and x.end()>a0 for a0,b,_ in spans)]
   if not available:raise ValueError(f'{p.name} S{section["number"]} gap{i+1}: missing {a!r}')
   match=available[0];answers[i]=tr[match.start():match.end()];spans.append((match.start(),match.end(),i))
  for a,b,i in sorted(spans,reverse=True):tr=tr[:a]+'[[%d]]'%i+tr[b:]
  section['transcript']=tr;section['dictationAnswers']=answers;section['dictationContentRevision']='20261022'
  section.setdefault('dictationPreviousAnswers',old)
  changes.append({'test':data['test'],'section':section['number'],'changedGapIndexes':[i for i,(a,b) in enumerate(zip(old,answers)) if a!=b]})
 if json.dumps(data,ensure_ascii=False)!=original:
  p.write_bytes((text[:m.end()]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+text[m.end()+size:]).encode('utf-8'))
print(json.dumps(changes))

# Migrate unfinished drafts by answer identity, preserving all unchanged responses.
# Submitted/pending submissions retain their frozen payload and receipt.
migration='''
    if(saved.dictationRevision!=="20261022"&&!finalRequested()){
      const previous={...answers};
      for(const s of DATA.sections){
        const old=s.dictationPreviousAnswers||s.dictationAnswers;
        s.dictationAnswers.forEach((answer,i)=>{
          const index=old.findIndex(value=>norm(value)===norm(answer)),key=`s${s.number}d${i}`;
          if(index>=0&&Object.hasOwn(previous,`s${s.number}d${index}`))answers[key]=previous[`s${s.number}d${index}`];
          else delete answers[key];
        });
      }
      saved.answers=answers;saved.dictationRevision="20261022";
      listeningWrite(studentStoreKey(studentKey),JSON.stringify(saved));
    }
'''
for p in (ROOT/'ielts-nghe').glob('*.html'):
 text=p.read_bytes().decode('utf-8')
 if 'dictationContentRevision' not in text:continue
 if 'saved.dictationRevision!==' not in text:
  start=text.index('function loadStudentState(');end=text.index('function handleIdentityChange',start)
  block=text[start:end].replace('  }catch{}',migration+'  }catch{}',1)
  text=text[:start]+block+text[end:]
 text=text.replace('schemaVersion:SCHEMA_VERSION,answers,scores,submission,finalIntent,finalLocked}',
                   'schemaVersion:SCHEMA_VERSION,dictationRevision:"20261022",answers,scores,submission,finalIntent,finalLocked}')
 p.write_bytes(text.encode('utf-8'))
