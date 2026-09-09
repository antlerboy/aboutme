"""Publish the September additions without replacing existing library collections."""
from pathlib import Path
import html,json,re
root=Path(__file__).resolve().parents[1]
h=html.escape
items=json.loads((root/'content/public-updates-2026-09.json').read_text())
base=(root/'library/preprints-and-working-papers/index.html').read_text()
header=re.search(r'<header>.*?</header>',base,re.S).group()
footer=re.search(r'<footer>.*?</footer>',base,re.S).group()
for item in items:
    slug=item['slug'];title=item['title']
    note='This is a working redraft, version 3, dated 26 August 2026. It may change and is not a peer-reviewed final article.' if item.get('draft') else 'The author’s supplied version of the article published in The MJ as “One-way only won’t work”.'
    body=(root/'content'/item['bodyFile']).read_text() if item.get('bodyFile') else '<p>'+h(item['description'])+'</p>'
    if item.get('download'): body+='<p><a class="button" href="'+h(item['download'])+'">Read the working paper (PDF)</a></p>'
    if item.get('source'): body+='<p><a href="'+h(item['source'])+'">Published article at The MJ</a> (subscription may be required).</p>'
    page='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+h(title)+' | Benjamin P Taylor</title><meta name="description" content="'+h(item['description'])+'"><link rel="canonical" href="https://antlerboy.com/library/'+slug+'/"><link rel="stylesheet" href="/library/style.css"></head><body>'+header+'<main><section class="hero"><div class="wrap"><p class="eyebrow">'+h(item['kicker'])+'</p><h1>'+h(title)+'</h1><p class="lead">'+h(item['subtitle'])+'</p></div></section><section class="section"><div class="wrap" style="max-width:780px"><p class="note">'+h(note)+'</p>'+body+'</div></section></main>'+footer+'</body></html>\n'
    dest=root/'library'/slug/'index.html';dest.parent.mkdir(exist_ok=True);dest.write_text(page)
    card='<article class="card"><p class="eyebrow">'+h(item['kicker'])+'</p><h3>'+h(title)+'</h3><p>'+h(item['description'])+'</p><a class="go" href="'+h(item['url'])+'">Read more →</a></article>'
    for collection in item['pages']:
        path=root/'library'/collection/'index.html';text=path.read_text()
        a='<!-- september-update-'+slug+' -->';b='<!-- /september-update-'+slug+' -->'
        text=re.sub(re.escape(a)+r'.*?'+re.escape(b),'',text,flags=re.S)
        if '<div class="grid">' in text: text=text.replace('<div class="grid">','<div class="grid">'+a+card+b,1)
        else: text=text.replace('<ul class="resource-list">','<ul class="resource-list">'+a+'<li><strong><a href="'+h(item['url'])+'">'+h(title)+'</a></strong><small>'+h(item['kicker'])+'</small><p>'+h(item['description'])+'</p></li>'+b,1)
        path.write_text(text)
manifest=root/'library/manifest.json';m=json.loads(manifest.read_text());m['updated']='2026-09-09'
for item in items:
    m['resources']=[x for x in m['resources'] if x['url']!=item['url']]
    m['resources'].insert(0,dict(title=item['title'],year=2026,format='Working paper' if item.get('draft') else 'Article',url=item['url'],description=item['description'],tags=item['tags'],pages=item['pages']))
    m['pages']=[x for x in m['pages'] if x['slug']!=item['slug']]
    m['pages'].append(dict(slug=item['slug'],title=item['title'],type='writing',description=item['description'],tags=item['tags']))
manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
sitemap=root/'sitemap.xml';text=sitemap.read_text()
for item in items:
    url='https://antlerboy.com'+item['url']
    if url not in text: text=text.replace('</urlset>','<url><loc>'+url+'</loc><lastmod>2026-09-09</lastmod></url>\n</urlset>')
sitemap.write_text(text)
print('Published two September library additions and updated collection/search records')
