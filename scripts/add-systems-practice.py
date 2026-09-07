#!/usr/bin/env python3
"""Publish an alpha practice collection and index all its constituent resources."""
from pathlib import Path
import html
import json
import re

ROOT=Path(__file__).resolve().parents[1]
LIB=ROOT/'library'
META=json.loads((ROOT/'content/systems-methods-practice.json').read_text())
URL=META['url']
SLUG='systems-methods-practice'
LOCAL='/library/'+SLUG+'/'
TITLE=META['title']
DESCRIPTION='Alpha practice pack by Benjamin P Taylor (2026): free systems-method dry runs with worked examples and answers. Technical learning supports, but does not replace, real-world systems practice.'
esc=lambda x:html.escape(str(x),quote=True)
extras=[
 ('','Open the complete practice pack','26 free practice pages: all 13 core approaches and three theory rows in the public SCiO framework, plus ten supporting areas.'),
 ('coverage/','Standards coverage and limits','Editorial mapping to the public SCiO framework and ST0787. Each approach has an explicit scope; this is not an assessment decision.'),
 ('resources/','Free and paid resource register','42 annotated routes, distinguishing exercises from explanations, recordings, tools and paid study. Uncertain access is labelled.'),
 ('worksheets/','Task sheets without answers','A printable collection for an independent attempt or work with a practice partner.'),
 ('answers/','Worked comparisons and answer keys','102 worked steps and 69 check questions. Open judgements can have more than one defensible answer.'),
 ('tutor-notes/','Learner and tutor guidance','How to use attempts, feedback, revisions and transfer to real situations.'),
 ('downloads/systems-methods-practice.zip','Download the offline pack','The complete HTML pack for use without an internet connection. External resources still require access.')
]

def card(title,url,description):
 return '<article class="card" data-tags="systems practice learning"><h3><a href="'+esc(url)+'">'+esc(title)+'</a></h3><p>'+esc(description)+'</p><div class="tags"><span class="tag">systems</span><span class="tag">practice</span><span class="tag">alpha</span></div></article>'

body='<section class="hero"><div class="wrap"><p class="eyebrow">Benjamin P Taylor | 2026 | Alpha version</p><h1>'+esc(TITLE)+'</h1><p class="lead">Free exercises, worked examples and answers for technical dry runs of systems methods.</p><p class="alpha-notice">Alpha version. The original teaching material has not had independent specialist pedagogical review. These exercises do not establish professional competence or accreditation.</p><p><a class="go" href="'+URL+'">Open the practice pack</a></p></div></section>'
body+='''<section class="section"><div class="wrap"><h2>Dry runs for learning a craft</h2><p>This resource grew from repeated requests by apprentices during my teaching with <a href="https://www.systemspractice.org/">SCiO</a> on the level 7 Systems Thinking Practitioner apprenticeship. They wanted simple exercises, worked examples and answers so they could try out methods and check their understanding.</p><p>Systems practice is learned through application in the real world, supported by teaching, workshop exercises, examples and work with others. A dry run can develop technical skills and reveal a misunderstanding. It does not reproduce the purposes, relationships, uncertainty or consequences of working in a real situation.</p><p>Use these exercises as preparation for practice, or to revisit a technical point. Getting a model or answer right is useful. It must not become the purpose of systems practice, or be mistaken for the practice itself.</p></div></section>'''
body+='<section class="section alt"><div class="wrap"><h2>Use the pack</h2><p>Each practice page offers a fictional case, modelling or analysis tasks, worked comparisons, checks with explanations, a defective model to repair and a changed case to attempt again. Notes can be saved in the browser and exported. No sign-in is required.</p><div class="grid">'+''.join(card(t,URL+p,d) for p,t,d in extras)+'</div></div></section>'
body+='<section class="section"><div class="wrap"><h2>All 26 practice areas</h2><p>Choose the approach and depth appropriate to your learning. The apprenticeship does not require completion of every page. Some exercises rehearse a defined part of a fuller methodology.</p>'
for section in ['Foundations','Core methods','Systemic intervention']:
 body+='<h3>'+section+'</h3><ul class="practice-directory">'+''.join('<li><a href="'+URL+lab['id']+'/">'+esc(lab['title'])+'</a></li>' for lab in META['labs'] if lab['section']==section)+'</ul>'
body+='</div></section><section class="section alt"><div class="wrap"><h2>Status and attribution</h2><p>Technical checks can distinguish a calculation or modelling error from a defensible alternative. They cannot establish competence in working with people. The original exercises were prepared with AI assistance and remain an alpha resource without independent specialist pedagogical review.</p><p>Taylor, B. P. (2026). Systemic systems methods practice for systems practice. Alpha version. The Necessary Tangle.</p><p>The pack is an independent learning resource. SCiO and the authors and providers of linked materials are not represented as endorsing it. See the <a href="'+URL+'resources/">source register</a> for the access and review status of each link.</p></div></section>'
shell='''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'''+esc(TITLE)+''' (alpha) | Benjamin P Taylor</title><meta name="description" content="'''+esc(DESCRIPTION)+'''"><link rel="canonical" href="https://antlerboy.com'''+LOCAL+'''"><meta property="og:title" content="'''+esc(TITLE)+''' (alpha)"><meta property="og:description" content="'''+esc(DESCRIPTION)+'''"><meta property="og:url" content="https://antlerboy.com'''+LOCAL+'''"><meta property="og:type" content="website"><link rel="stylesheet" href="/library/style.css"><style>.alpha-notice{border:1px solid currentColor;border-left-width:4px;padding:12px 16px;max-width:78ch}.practice-directory{padding-left:22px;max-width:85ch}.practice-directory li{margin:12px 0}.practice-directory a{overflow-wrap:anywhere}.practice-skip{position:absolute;left:-9999px}.practice-skip:focus{left:12px;top:12px;z-index:100;background:white;padding:12px}.card a{overflow-wrap:anywhere}</style></head><body><a class="practice-skip" href="#main">Skip to content</a><header><div class="wrap top"><a class="brand" href="/">Benjamin P Taylor, antlerboy</a><nav class="nav" aria-label="Library navigation"><a href="/library/">Library</a><a href="/library/publications/">Browse</a><a href="/library/search/">Search all</a><a href="/">Home</a></nav></div></header><main id="main">'''+body+'''</main><footer><div class="wrap">Benjamin P Taylor, <a href="/library/">working public library</a> | <a href="https://github.com/antlerboy/aboutme/issues/1">Suggest a correction or addition</a></div></footer><script src="/library/app.js"></script><a class="discussion-pixel" href="https://github.com/antlerboy/aboutme/issues/1" aria-label="Antlerboy.com updates and discussion"></a></body></html>'''
page=LIB/SLUG/'index.html';page.parent.mkdir(parents=True,exist_ok=True);page.write_text(shell)
manifest_path=LIB/'manifest.json';manifest=json.loads(manifest_path.read_text())
newpage={'slug':SLUG,'title':TITLE+' (alpha)','type':'body-of-work','description':DESCRIPTION,'tags':['systems','practice','learning']}
manifest['pages']=[p for p in manifest['pages'] if p['slug']!=SLUG]+[newpage]
records=[{'title':t+' (alpha practice resource)','year':2026,'format':'Free online learning resource','url':URL+p,'description':d+' Alpha; no independent specialist pedagogical review.','tags':['systems','practice','learning'],'pages':[SLUG]} for p,t,d in extras]
records.extend({'title':lab['title']+' (alpha practice case)','year':2026,'format':'Free practice case with worked answers','url':URL+lab['id']+'/','description':lab.get('description','An original fictional case, worked comparison, repair task and changed case.')+' Technical rehearsal, not accreditation.','tags':['systems','practice','learning'],'pages':[SLUG]} for lab in META['labs'])
urls={r['url'] for r in records}
manifest['resources']=[r for r in manifest['resources'] if r['url'] not in urls]+records
manifest['updated']='2026-09-07'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
callout='<section id="systems-methods-practice" class="section"><div class="wrap"><h2>Systems methods practice: alpha version</h2><div class="grid">'+card('Technical dry runs with worked examples and answers',LOCAL,DESCRIPTION)+'</div></div></section>'
for relative in ['index.html','publications/index.html','talks-and-sessions/index.html','systems-leadership-change-practice/index.html','viable-system-model/index.html','facilitation-and-systems-consulting/index.html','visual-models/index.html']:
 path=LIB/relative
 if not path.exists():continue
 text=path.read_text()
 text=re.sub(r'<section id="systems-methods-practice".*?</section>','',text,flags=re.S)
 text=text.replace('</main>',callout+'</main>',1)
 path.write_text(text)
sitemap=ROOT/'sitemap.xml';text=sitemap.read_text();loc='https://antlerboy.com'+LOCAL
if '<loc>'+loc+'</loc>' not in text:text=text.replace('</urlset>','<url><loc>'+loc+'</loc><lastmod>2026-09-07</lastmod></url></urlset>')
sitemap.write_text(text)
assert len(META['labs'])==26
assert len({x['id'] for x in META['labs']})==26
assert len(records)==33
assert all(URL+x['id']+'/' in shell for x in META['labs'])
assert all('id="systems-methods-practice"' in (LIB/p).read_text() for p in ['index.html','publications/index.html','viable-system-model/index.html'])
print('Added the alpha library collection, all 26 case routes and seven pack resources; existing catalogue records preserved.')
