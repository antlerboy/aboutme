"""Maintain the explicitly labelled external AI experiment and its public links."""
from pathlib import Path
from urllib.parse import urlencode, quote
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'content/delphi-experiment.json').read_text(encoding='utf-8'))
h = lambda value: html.escape(str(value), quote=True)
feedback = 'mailto:' + data['feedbackEmail'] + '?' + urlencode({'subject': data['feedbackSubject'], 'body': data['feedbackBody']}, quote_via=quote)
page = f'''<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{h(data['title'])} | Benjamin P Taylor</title>
<meta name="description" content="{h(data['description'])}">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'none'; script-src 'none'; base-uri 'none'; form-action 'none'">
<link rel="canonical" href="https://antlerboy.com/delphi/"><link rel="stylesheet" href="/library/style.css">
<meta property="og:type" content="website"><meta property="og:title" content="{h(data['title'])}"><meta property="og:description" content="{h(data['description'])}"><meta property="og:url" content="https://antlerboy.com/delphi/"></head>
<body><header><div class="wrap top"><a class="brand" href="/">Benjamin P Taylor, antlerboy</a><nav class="nav" aria-label="Navigation"><a href="/">Home</a><a href="/library/">Public work</a><a href="/library/use/">Practical routes</a></nav></div></header>
<main><section class="hero"><div class="wrap"><p class="eyebrow">AI experiment</p><h1>{h(data['title'])}</h1><p class="lead">{h(data['intro'])}</p></div></section>
<section class="section"><div class="wrap"><h2>Try a question</h2><p>{h(data['howToTry'])}</p><p>{h(data['externalService'])}</p><p><a class="button primary" data-delphi-link href="{h(data['url'])}" rel="external noopener noreferrer">Open the AI version on Delphi</a></p><p>{h(data['accessNote'])}</p><p><a href="/library/search/">Find the writing and sources in the public library</a>.</p></div></section>
<section class="section alt"><div class="wrap"><h2>{h(data['feedbackHeading'])}</h2><p>{h(data['feedback'])}</p><p><a class="button" data-delphi-feedback href="{h(feedback)}">Tell me how it went</a></p><p>This opens an email for you to edit and send.</p></div></section></main>
<footer><div class="wrap">Benjamin P Taylor · <a href="/">Antlerboy</a> · Experiment page updated {h(data['updated'])}</div></footer></body></html>
'''
target = ROOT / 'delphi/index.html'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(page, encoding='utf-8')

home = (ROOT / 'index.html').read_text(encoding='utf-8')
callout = f'''<!-- delphi-experiment:start --><section id="delphi-experiment" class="alt"><div class="wrap"><div class="section-head"><p class="eyebrow">AI experiment</p><h2 class="section-title">{h(data['title'])}</h2><p>{h(data['homeIntro'])}</p></div><p><a class="button secondary" href="/delphi/">Try the experiment and give me feedback</a></p></div></section><!-- delphi-experiment:end -->'''
pattern = r'<!-- delphi-experiment:start -->[\s\S]*?<!-- delphi-experiment:end -->'
if re.search(pattern, home):
    home = re.sub(pattern, lambda _: callout, home)
else:
    anchor = '    <section id="groups">'
    assert anchor in home
    home = home.replace(anchor, callout + '\n' + anchor, 1)
(ROOT / 'index.html').write_text(home, encoding='utf-8')

manifest_path = ROOT / 'library/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['resources'] = [r for r in manifest['resources'] if r.get('url') != '/delphi/'] + [{
    'title': 'Benjamin on Delphi (AI experiment)', 'url': '/delphi/',
    'description': data['description'], 'format': 'AI experiment on an external service',
    'year': '2026', 'tags': ['AI', 'experiment', 'feedback']
}]
manifest['updated'] = max(manifest.get('updated', ''), data['updated'])
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
sitemap_path = ROOT / 'sitemap.xml'
sitemap = sitemap_path.read_text(encoding='utf-8')
if '<loc>https://antlerboy.com/delphi/</loc>' not in sitemap:
    sitemap = sitemap.replace('</urlset>', '<url><loc>https://antlerboy.com/delphi/</loc></url>\n</urlset>')
sitemap_path.write_text(sitemap, encoding='utf-8')
print('Maintained the AI experiment page, homepage invitation, catalogue entry, and sitemap.')
