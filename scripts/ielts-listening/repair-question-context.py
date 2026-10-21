"""Restore source word limits and supplied context found by the full review."""
from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[2]
for p in (ROOT/'ielts-nghe').glob('*.html'):
 text=p.read_bytes().decode('utf-8');m=re.search(r'const DATA\s*=\s*',text)
 if not m:continue
 d,n=json.JSONDecoder().raw_decode(text[m.end():]);before=json.dumps(d)
 for s in d['sections']:
  key=(d['test'],s['number']);groups=s.get('groups',[])
  if key==(1,2):
   for g in groups:g['instruction']=g['instruction'].replace('ONE WORD AND/OR A NUMBER','ONE WORD')
  if key==(1,3):groups[0]['instruction']='Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.'
  if key==(5,1):groups[0]['instruction']='Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.'
  if key==(6,1):
   groups[1]['intro']={'type':'table','columns':['Length of service','Employer / place','Position'],'rows':[['2 years','[Q4]','babysitter'],['1 year','Senior High School','[Q5]'],['3 months','Ace Sports Academy','[Q6]'],['ongoing','Northwood Hospital',"official visitor: Children’s ward"]]}
  if key==(7,4):
   groups[0]['leadIn']=['Charles Willson Peale','1741 — Born in Maryland, USA','Became a saddler','Began to paint','1766 — London to study with B. West']
   groups[0]['intro']['rows'][3][1]='1795'
  if key==(9,3):
   for q in s['questions']:
    if q['number']==25:q['prompt']='What is it that teachers have that allows them to respond to individual student requirements? Many different _____.'
 if json.dumps(d)!=before:p.write_bytes((text[:m.end()]+json.dumps(d,ensure_ascii=False,separators=(',',':'))+text[m.end()+n:]).encode('utf-8'))
