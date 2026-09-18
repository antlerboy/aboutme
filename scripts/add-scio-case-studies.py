"""Index the public SCiO practitioner accounts, preserving their dates and scope."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'content/scio-case-studies.json').read_text(encoding='utf-8'))
items = data['items']
h = html.escape
slug = 'systems-practice-case-studies'
url = '/library/' + slug + '/'
title = 'Systems practice case studies'
description = 'Eight public SCiO accounts of systems work with organisations, communities, and public services.'
base = (ROOT / 'library/preprints-and-working-papers/index.html').read_text(encoding='utf-8')
header = re.search(r'<header>.*?</header>', base, re.S).group()
footer = re.search(r'<footer>.*?</footer>', base, re.S).group()

def card(item):
    return ('<article class="card"><p class="eyebrow">SCiO · ' + h(item['date']) + '</p>'
            '<h2>' + h(item['title']) + '</h2><p>' + h(item['description']) + '</p>'
            '<p><small>' + h(item['period']) + '</small></p><a class="go" href="' + h(item['url'])
            + '">Read the case study at SCiO →</a></article>')

page = ('<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title
        + ' | Benjamin P Taylor</title><meta name="description" content="' + h(description)
        + '"><link rel="canonical" href="https://antlerboy.com' + url
        + '"><link rel="stylesheet" href="/library/style.css?v=20260918-scio"></head><body>' + header
        + '<main class="case-studies"><section class="hero"><div class="wrap"><p class="eyebrow">Practice accounts</p><h1>'
        + title + '</h1><p class="lead">' + description + '</p></div></section>'
        '<section class="section"><div class="wrap"><p>These accounts are credited to Benjamin Taylor by '
        '<a href="' + h(data['source']) + '">SCiO</a>. They describe the work and the practitioner\'s observations; '
        'they are not independent evaluations of its results.</p><p>The dates below follow SCiO\'s catalogue. '
        'The work periods are shown separately, as stated in each account. The two Guernsey accounts overlap '
        'and should not be counted as separate projects.</p><div class="grid">'
        + ''.join(card(item) for item in items) + '</div></div></section></main>' + footer + '</body></html>\n')
destination = ROOT / 'library' / slug / 'index.html'
destination.parent.mkdir(exist_ok=True)
destination.write_text(page, encoding='utf-8')

# Keep the collection and its entries findable from the existing reading routes.
collections = {'', 'publications', 'articles-and-essays'}
collections.update(theme for item in items for theme in item['themes'])
start, end = '<!-- scio-case-studies -->', '<!-- /scio-case-studies -->'
for collection in sorted(collections):
    path = ROOT / 'library' / collection / 'index.html'
    content = path.read_text(encoding='utf-8')
    content = re.sub(re.escape(start) + r'.*?' + re.escape(end), '', content, flags=re.S)
    related = [item for item in items if collection in item['themes']]
    links = ''.join('<li><a href="' + h(item['url']) + '">' + h(item['title']) + '</a></li>' for item in related)
    block = (start + '<section class="section"><div class="wrap"><h2><a href="' + url + '">' + title
             + '</a></h2><p>' + description + '</p>' + ('<ul>' + links + '</ul>' if links else '')
             + '</div></section>' + end)
    content = content.replace('</main>', block + '</main>')
    path.write_text(content, encoding='utf-8')

path = ROOT / 'library/manifest.json'
manifest = json.loads(path.read_text(encoding='utf-8'))
manifest['updated'] = max(manifest.get('updated', ''), data['checked'])
manifest['pages'] = [p for p in manifest['pages'] if p['slug'] != slug]
manifest['pages'].append(dict(slug=slug, title=title, type='collection', description=description, tags=['systems', 'practice']))
new_urls = {item['url'] for item in items}
manifest['resources'] = [r for r in manifest['resources'] if r['url'] not in new_urls]
for item in items:
    manifest['resources'].append(dict(title=item['title'], year=item['year'], format='Case study', url=item['url'],
        description=item['description'] + ' SCiO; Benjamin Taylor. ' + item['period'] + '.',
        tags=['systems', 'practice'], pages=[slug, 'articles-and-essays', *item['themes']]))
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

path = ROOT / 'sitemap.xml'
content = path.read_text(encoding='utf-8')
if 'https://antlerboy.com' + url not in content:
    content = content.replace('</urlset>', '<url><loc>https://antlerboy.com' + url
        + '</loc><lastmod>' + data['checked'] + '</lastmod></url>\n</urlset>')
path.write_text(content, encoding='utf-8')
print('Indexed eight public SCiO accounts and their related reading routes.')
