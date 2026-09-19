"""Publish the source-backed method index and preserve the document collections."""
from pathlib import Path
import html,json,re
R=Path(__file__).resolve().parents[1];h=html.escape
d=json.loads((R/'content/large-group-methods.json').read_text(encoding='utf-8'))
slug='large-group-processes';out=R/'library'/slug;out.mkdir(exist_ok=True)
base=(R/'library/preprints-and-working-papers/index.html').read_text(encoding='utf-8')
header=re.search(r'<header>.*?</header>',base,re.S).group();footer=re.search(r'<footer>.*?</footer>',base,re.S).group()
cards=[]
for i in d['methods']:
    refs=''.join('<li><a href="'+h(s['url'],quote=True)+'">'+h(s['title'])+'</a> <span>'+h(s['locator'])+'</span></li>' for s in i['sources'])
    tags=' · '.join([i['collection'],i['status']]+([i['complexity']+' complexity',i['focus']] if i['complexity']!='Not classified' else []))
    cards.append('<article class="method" id="'+i['id']+'" data-collection="'+h(i['collection'],quote=True)+'" data-complexity="'+h(i['complexity'],quote=True)+'" data-focus="'+h(i['focus'],quote=True)+'"><h3>'+h(i['title'])+'</h3><p class="method-meta">'+h(tags)+'</p><p>'+h(i['summary'])+'</p><details><summary>Source and page reference</summary><ul>'+refs+'</ul>'+('<p>'+h(i['credit'])+'</p>' if i.get('credit') else '')+'<a href="#'+i['id']+'">Link to this entry</a></details></article>')
def select(key,label,values):
    return '<label>'+label+'<select id="'+key+'"><option value="">All</option>'+''.join('<option>'+h(v)+'</option>' for v in values)+'</select></label>'
filters='<label class="query-label">Find a method or model<input id="method-query" type="search" placeholder="Try Future Search, boundary, or café"></label>'+select('method-collection','Collection',sorted({i['collection'] for i in d['methods']}))+select('method-complexity','Complexity',sorted({i['complexity'] for i in d['methods']}))+select('method-focus','Purpose',sorted({i['focus'] for i in d['methods']}))+'<button id="method-reset" type="button">Reset search</button>'
lead=f'{d["count"]} methods, models, and participation formats from my teaching material and shared collection.'
body=f'''<section class="hero"><div class="wrap"><div class="crumbs"><a href="/library/">Library</a> / Large-group processes</div><p class="eyebrow">Methods and teaching</p><h1>Large-group processes</h1><p class="lead">{lead}</p><p><a href="#method-directory">Browse the index</a> · <a href="/library/files/talks/large-group-processes.pdf">Read the teaching deck</a> · <a href="https://antlerboy.github.io/largegroupprocess/">Browse the 15 document collections</a></p></div></section>
<section class="section"><div class="wrap"><h2>Choosing and combining approaches</h2><p>Start with the situation, who needs to take part, the decisions they can make, and what can happen afterwards. A familiar method is not a reason to use it. The deck discusses preparation, power, inclusion, facilitation, and follow-through on <a href="/library/files/talks/large-group-processes.pdf#page=156">pages 156–172</a>.</p><p>{h(d['classification_note'])}</p><details class="coverage"><summary>What this index covers</summary><p>{h(d['source_note'])}</p><p>The overview slide says 71, but contains {d['overview_count']} named entries. The count here is calculated from the displayed records. Mention-only entries are pointers for further enquiry, not developed recommendations or endorsements. Related names and variants may overlap.</p><p>Summaries prepared with AI assistance from the cited teaching pages. No independent specialist review of these summaries is recorded. Source authors retain their own rights; inclusion does not imply an open licence for the original work.</p></details></div></section>
<section class="section alt" id="method-directory"><div class="wrap"><h2>Find an approach</h2><div class="method-filters">{filters}</div><p id="method-count" role="status" aria-live="polite">{d['count']} entries shown</p><p id="method-empty" hidden>No entries match. Try fewer words or reset the search.</p><div class="methods">{''.join(cards)}</div><noscript><p>Search filters need JavaScript. All entries and source links are available above without it.</p></noscript></div></section>
<section class="section"><div class="wrap"><h2>Work with the collection</h2><p><a href="https://link.redquadrant.com/ChatGPTlargegroupprocessmentor">Open the large-group-process mentor</a> to explore a live situation and possible approaches. Check its answers against the source material and your own judgement.</p><p><a href="https://transduction.systems/library/">Follow connections to concepts in The Necessary Tangle</a>.</p><p><a href="methods.json">Download the source index as JSON</a>.</p></div></section>'''
page='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Large-group processes | Benjamin P Taylor</title><meta name="description" content="'+h(lead,quote=True)+'"><link rel="canonical" href="https://antlerboy.com/library/large-group-processes/"><link rel="stylesheet" href="/library/style.css"><link rel="stylesheet" href="methods.css"></head><body><a class="method-skip" href="#method-directory">Skip to methods</a>'+header+'<main>'+body+'</main>'+footer+'<script src="methods.js"></script></body></html>\n'
(out/'index.html').write_text(page,encoding='utf-8',newline='\n');(out/'methods.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=R/'library/manifest.json';m=json.loads(p.read_text(encoding='utf-8'))
for page in m['pages']:
    if page['slug']==slug:page['description']=lead
prefix='/library/'+slug+'/#'
m['resources']=[x for x in m['resources'] if not x.get('url','').startswith(prefix)]
for i in d['methods']:
    m['resources'].append(dict(title=i['title'],year=2024,format='Method index',url=prefix+i['id'],description=i['summary']+' '+i['collection']+'. '+i['status']+'.',tags=['systems','practice','facilitation'],pages=[slug]))
m['updated']=d['updated'];p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Built',len(cards),'source-backed method entries')
