#!/usr/bin/env python3
"""Add the practice resource to the current Greebling source, never an old backup."""
from pathlib import Path
from html.parser import HTMLParser
import argparse,html,json,re
HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('page',type=Path,help='Current Greebling dist/index.html')
p.add_argument('--output',type=Path,help='Write a separate candidate instead of replacing the source')
a=p.parse_args()
text=a.page.read_text(encoding='utf-8')
if 'greebling.com' not in text or 'id="web-surfaces"' not in text:
 raise SystemExit('Not the expected current Greebling page. No file changed.')
meta=json.loads((HERE/'practice-manifest.json').read_text())
base=meta['url'];esc=lambda s:html.escape(str(s),quote=True)
resources=[('',meta['title'],'Free alpha dry runs with worked examples and answers, by Benjamin P Taylor (2026).'),('coverage/','Standards coverage and limits','Mapping to SCiO and ST0787, with scope and limits for each approach.'),('resources/','Free and paid resource register','42 annotated resource routes; access and review limits remain explicit.'),('worksheets/','Task sheets without answers','Make an independent attempt before opening the worked comparison.'),('answers/','Worked comparisons and answer keys','102 worked steps and 69 check questions.'),('tutor-notes/','Learner and tutor guidance','Use attempts, revisions and transfer to real situations.'),('downloads/systems-methods-practice.zip','Offline practice pack','Download the complete HTML pack; no sign-in is required.')]
resources += [(x['id']+'/',x['title'],'Free alpha case, worked comparison, checks, repair task and changed case.') for x in meta['labs']]
def item(title,url,description):
 return '<li><h4><a href="'+esc(url)+'">'+esc(title)+'</a></h4><p class="surface-url"><a href="'+esc(url)+'">'+esc(url.removeprefix('https://').rstrip('/'))+'</a></p><p>'+esc(description)+'</p></li>'
block='''<!-- SYSTEMS_PRACTICE_START --><section class="surface-group" id="systems-practice" aria-labelledby="systems-practice-title"><h3 id="systems-practice-title">Systems methods practice <span class="count">33</span></h3><p>Benjamin P Taylor (2026). Alpha version.</p><p>Technical dry runs developed in response to apprentice requests during teaching with SCiO. Work through a fictional case, make a model, compare the reasoning, repair it and try a changed case.</p><p>These exercises support learning a craft. They do not replace real-world systems practice. The original teaching material has not had independent specialist pedagogical review, and the checks do not establish professional competence or accreditation.</p><ul class="directory surface-directory">'''+''.join(item(t,base+s,d) for s,t,d in resources)+'''</ul></section><!-- SYSTEMS_PRACTICE_END -->'''
text=re.sub(r'<!-- SYSTEMS_PRACTICE_START -->.*?<!-- SYSTEMS_PRACTICE_END -->','',text,flags=re.S)
pattern=r'(<section\b[^>]*\bid="publishing"[^>]*>)'
if not re.search(pattern,text):raise SystemExit('Publishing section not found. No file changed.')
text=re.sub(pattern,lambda m:block+m.group(0),text,count=1)
nav='<a href="#systems-practice">Systems methods practice</a>'
if nav not in text:
 text=re.sub(r'(<nav\b[^>]*aria-label="Directory sections"[^>]*>)',lambda m:m.group(0)+nav,text,count=1)
library_url='https://antlerboy.com/library/systems-methods-practice/'
def add_library(match):
 section=match.group(0)
 if library_url not in section:section=section.replace('</ul>',item('Systems methods practice: alpha resource',library_url,'All 26 practice areas, source routes, worksheets, answers and the offline pack in the Antlerboy library.')+'</ul>',1)
 return section
pattern=r'<section\b[^>]*\bid="library"[^>]*>.*?</section>'
if not re.search(pattern,text,flags=re.S):raise SystemExit('Library section not found. No file changed.')
text=re.sub(pattern,add_library,text,count=1,flags=re.S)
def count_group(match):
 section=match.group(0)
 ul=re.search(r'<ul class="directory surface-directory">(.*?)</ul>',section,flags=re.S)
 if ul:section=re.sub(r'(<span class="count">)\s*\d+\s*(</span>)',lambda m:m.group(1)+str(len(re.findall(r'<li\b',ul.group(1))))+m.group(2),section,count=1)
 return section
text=re.sub(r'<section\b[^>]*class="surface-group"[^>]*>.*?</section>',count_group,text,flags=re.S)
total=sum(len(re.findall(r'<li\b',m)) for m in re.findall(r'<ul class="directory surface-directory">(.*?)</ul>',text,flags=re.S))
text=re.sub(r'\b\d+ destinations across',str(total)+' destinations across',text,count=1)
class Links(HTMLParser):
 def __init__(self,s):super().__init__();self.urls=set();self.ids=[];self.feed(s)
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='a' and 'href' in d:self.urls.add(d['href'])
  if 'id' in d:self.ids.append(d['id'])
before=Links(a.page.read_text());after=Links(text)
assert before.urls<=after.urls,'An existing link was removed'
assert len(after.ids)==len(set(after.ids)),'Duplicate page identifiers'
assert all(base+x['id']+'/' in after.urls for x in meta['labs'])
assert library_url in after.urls
assert len(resources)==33
out=a.output or a.page
out.write_text(text,encoding='utf-8')
print(json.dumps({'status':'prepared_not_published','practice_routes':33,'case_routes':26,'library_entry':True,'directory_destinations':total,'existing_links_preserved':True,'output':str(out)},indent=2))
