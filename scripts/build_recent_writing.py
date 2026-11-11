#!/usr/bin/env python3
"""Render the reviewed original-writing list and current newsletter links."""
from pathlib import Path
from html import escape as h
import json
import re
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'content/recent-writing.json').read_text())
cards=[]
for work in DATA['works']:
    cards.append('<article class="card" data-tags="'+h(' '.join(work.get('tags',[])))+'"><p class="eyebrow">'+h(work['date']+' · '+work['source'])+'</p><h3><a href="'+h(work['url'],quote=True)+'">'+h(work['title'])+'</a></h3><p>'+h(work['description'])+'</p></article>')
issues=''.join('<li><a href="'+h(issue['url'],quote=True)+'">'+h(issue['title'])+'</a> · '+h(issue['date'])+'</li>' for issue in DATA['newsletter_issues'])
section='<section class="section alt" id="recent-writing"><div class="wrap"><div class="section-head"><h2>Recent writing</h2><p>Essays and working arguments from Chosen Path, alongside my original writing on the Systems Community of Inquiry. Reviewed '+DATA['checked']+'.</p></div><div class="grid">'+''.join(cards)+'</div><h3>Recent newsletters</h3><ul>'+issues+'</ul></div></section>'
for relative in ['library/articles-and-essays/index.html','library/index.html']:
    path=ROOT/relative
    text=path.read_text()
    text,count=re.subn(r'<section[^>]*id="recent-writing"[^>]*>.*?</section>',lambda _:section,text,count=1,flags=re.S)
    if not count:
        text=text.replace('</main>',section+'</main>',1)
    path.write_text(text)
print('Maintained',len(cards),'reviewed original works and',len(DATA['newsletter_issues']),'newsletter issues')

