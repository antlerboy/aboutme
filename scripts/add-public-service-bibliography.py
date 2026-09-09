"""Add publisher-identified articles and interviews as linked bibliography records."""
from pathlib import Path
import json,html,re
R=Path(__file__).resolve().parents[1];h=html.escape
d=json.loads((R/'content/public-service-bibliography.json').read_text());items=d['items']
base=(R/'library/preprints-and-working-papers/index.html').read_text();header=re.search(r'<header>.*?</header>',base,re.S).group();footer=re.search(r'<footer>.*?</footer>',base,re.S).group()
slug='public-service-writing';title='Public-service articles and interviews';url='/library/'+slug+'/'
rows=''.join('<tr><td>'+h(i['date'])+'</td><td><a href="'+h(i['url'])+'">'+h(i['title'])+'</a><br><small>'+h(i['authors'])+'</small></td><td>'+h(i['publisher'])+'<br>'+h(i['format'])+'</td></tr>' for i in items)
body='<p>A growing index of writing and interviews in the public-service press. Publisher links identify the published editions and their access conditions. This is not yet an exhaustive bibliography.</p><p><a href="/library/one-way-only-wont-work/">Read the supplied author version of One-way only won’t work</a>.</p><table><thead><tr><th>Date</th><th>Work and credit</th><th>Publication</th></tr></thead><tbody>'+rows+'</tbody></table><p>Follow the maintained author indexes at <a href="'+d['sources'][0]+'">The MJ</a> and <a href="'+d['sources'][1]+'">Public Finance</a>. An interview is credited as an interview, rather than as an authored article.</p>'
page='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+' | Benjamin P Taylor</title><link rel="canonical" href="https://antlerboy.com'+url+'"><link rel="stylesheet" href="/library/style.css"><style>table{border-collapse:collapse;width:100%}td,th{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #ccc}a{overflow-wrap:anywhere}@media(max-width:650px){table,tbody,tr,td{display:block}thead{display:none}tr{margin-bottom:15px}}</style></head><body>'+header+'<main><section class="hero"><div class="wrap"><p class="eyebrow">Writing and conversation</p><h1>'+title+'</h1></div></section><section class="section"><div class="wrap">'+body+'</div></section></main>'+footer+'</body></html>'
p=R/'library'/slug/'index.html';p.parent.mkdir(exist_ok=True);p.write_text(page)
p=R/'library/manifest.json';m=json.loads(p.read_text())
for i in items:
 if i['url'].endswith('/one-way-only-won-t-work'):continue
 m['resources']=[x for x in m['resources'] if x['url']!=i['url']]
 m['resources'].append(dict(title=i['title'],year=i['year'],format=i['format'],url=i['url'],description=i['authors']+'; '+i['publisher']+'. '+i['access']+'.',tags=['public-services','writing'],pages=['articles-and-essays','public-service-transformation',slug]))
m['pages']=[x for x in m['pages'] if x['slug']!=slug];m['pages'].append(dict(slug=slug,title=title,type='collection',description='Publisher-identified writing and interviews in the public-service press.',tags=['public-services','writing']));p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
for collection in ['articles-and-essays','public-service-transformation']:
 p=R/'library'/collection/'index.html';s=p.read_text();a='<!-- publisher-bibliography -->';b='<!-- /publisher-bibliography -->';s=re.sub(a+'.*?'+b,'',s,flags=re.S);s=s.replace('</main>',a+'<section class="section"><div class="wrap"><h2><a href="'+url+'">'+title+'</a></h2><p>Browse the publisher-linked index of articles and interviews.</p></div></section>'+b+'</main>');p.write_text(s)
p=R/'sitemap.xml';s=p.read_text()
if 'https://antlerboy.com'+url not in s:s=s.replace('</urlset>','<url><loc>https://antlerboy.com'+url+'</loc><lastmod>2026-09-09</lastmod></url></urlset>')
p.write_text(s)
print('Updated bibliography:',len(items),'publisher-identified records')
