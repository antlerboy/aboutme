"""Keep the two public practice tools connected to the existing site and library."""
from pathlib import Path
from html import escape
import json
import re

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- practice-microsites:start -->'
END = '<!-- practice-microsites:end -->'
TOOLS = [
    ('four-dynamics', 'Four team dynamics',
     'Segment, blend, empower, and harmonise. Diagnose a pattern, examine its relationships, and design an intervention you can test.'),
    ('arms-lengthiness', 'The arms-lengthiness tool',
     'Compare delivery arrangements across 21 dimensions. Examine relative fit, mismatches, and the conditions a model would need to work.'),
]


def entry_section(items, title='Tools for working on a real situation'):
    cards = ''.join(
        '<article class="card"><h3><a href="/' + slug + '/">' + escape(name) +
        '</a></h3><p>' + escape(description) + '</p><p><a href="/' + slug +
        '/">Open the guide and tool →</a></p></article>'
        for slug, name, description in items)
    return (START + '<section class="section" id="practice-tools"><div class="wrap">'
            '<div class="section-head"><p class="eyebrow">Practice tools</p><h2>' + title +
            '</h2></div><div class="grid">' + cards + '</div></div></section>' + END)


def connect_page(relative, items=TOOLS, first=False):
    path = ROOT / relative
    if not path.exists():
        return
    text = path.read_text(encoding='utf-8')
    text = re.sub(re.escape(START) + r'.*?' + re.escape(END), '', text, flags=re.S)
    section = entry_section(items)
    if first:
        text = text.replace('</section>', '</section>' + section, 1)
    else:
        text = text.replace('</main>', section + '</main>', 1)
    path.write_text(text, encoding='utf-8')


for path in ['index.html', 'library/index.html', 'library/publications/index.html',
             'library/public-service-transformation/index.html',
             'library/redquadrant-psta-reference/index.html',
             'flawfulconsulting/related-practice/index.html']:
    connect_page(path)
connect_page('library/four-dynamics/index.html', TOOLS[:1], first=True)

landing = ROOT / 'library/arms-lengthiness/index.html'
landing.parent.mkdir(parents=True, exist_ok=True)
landing.write_text('''<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The arms-lengthiness tool | Benjamin P Taylor</title>
<meta name="description" content="Compare delivery arrangements across 21 dimensions, examine mismatches, and plan a useful options appraisal.">
<link rel="canonical" href="https://antlerboy.com/arms-lengthiness/">
<link rel="stylesheet" href="/library/style.css"></head><body>
<header><div class="wrap top"><a class="brand" href="/">Benjamin P Taylor, antlerboy</a><nav class="nav" aria-label="Library navigation"><a href="/library/">Library</a><a href="/library/search/">Search all</a><a href="/">Home</a></nav></div></header>
<main><section class="hero"><div class="wrap"><p class="eyebrow">Practice tool</p><h1>The arms-lengthiness tool</h1>
<p class="lead">Compare delivery arrangements across 21 dimensions. Examine relative fit, mismatches, and the conditions a model would need to work.</p>
<p><a class="button" href="/arms-lengthiness/">Open the guide and tool →</a></p></div></section></main>
<footer><div class="wrap">Benjamin P Taylor · <a href="/library/">Public work library</a></div></footer></body></html>
''', encoding='utf-8')

manifest_path = ROOT / 'library/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['updated'] = '2026-11-05'
for slug, title, description in TOOLS:
    record = {'slug': slug, 'title': title, 'type': 'body-of-work',
              'description': description, 'tags': ['systems', 'practice', 'organisation']}
    existing = next((p for p in manifest['pages'] if p['slug'] == slug), None)
    if existing:
        existing.update(record)
    else:
        manifest['pages'].append(record)

new_resources = []
for slug, title, description in TOOLS:
    folder = ROOT / slug
    for page in sorted(folder.rglob('index.html')):
        relative = page.parent.relative_to(ROOT).as_posix()
        html = page.read_text(encoding='utf-8')
        heading = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
        page_title = re.sub('<[^>]+>', '', heading.group(1)) if heading else title
        desc = re.search(r'<meta name="description" content="([^"]+)"', html)
        new_resources.append({'title': page_title, 'year': 2026, 'format': 'Practice guide and tool',
                              'url': '/' + relative + '/', 'description': desc.group(1) if desc else description,
                              'tags': ['systems', 'practice', 'organisation'], 'pages': [slug]})

new_resources.append({'title': 'Cadenced culture: the full StretchCon presentation', 'year': 2023,
                      'format': 'PDF · 101 slides',
                      'url': '/four-dynamics/materials/stretchcon-cadenced-culture.pdf',
                      'description': 'The long presentation, with diagnosis, prescription, rituals, practices, and theory annexes.',
                      'tags': ['systems', 'practice', 'organisation', 'stretchcon'], 'pages': ['four-dynamics', 'talks-and-sessions']})
for record in new_resources:
    existing = next((r for r in manifest['resources'] if r['url'] == record['url']), None)
    if existing:
        existing.update(record)
    else:
        manifest['resources'].append(record)
for record in manifest['resources']:
    if '82tjdU9d6YM' in record['url'] or '10000swampleaders.com/benjamin-taylor-differentiation' in record['url']:
        record['pages'] = list(dict.fromkeys(record.get('pages', []) + ['four-dynamics']))
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

sitemap_path = ROOT / 'sitemap.xml'
sitemap = sitemap_path.read_text(encoding='utf-8')
for record in new_resources:
    if not record['url'].endswith('/'):
        continue
    url = 'https://antlerboy.com' + record['url']
    if '<loc>' + url + '</loc>' not in sitemap:
        sitemap = sitemap.replace('</urlset>', '<url><loc>' + url + '</loc><lastmod>2026-11-05</lastmod></url>\n</urlset>')
sitemap_path.write_text(sitemap, encoding='utf-8')
print('Connected practice microsites, catalogue records, and sitemap.')
