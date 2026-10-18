#!/usr/bin/env python3
"""Maintain the systems-leadership topic and canonical catalogue records."""
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'content/systems-leadership.json').read_text())
SLUG = DATA['slug']
ITEMS = [item for group in DATA['groups'] for item in group['items']]
START = '<!-- systems-leadership-material -->'
END = '<!-- /systems-leadership-material -->'
h = html.escape


def url_key(value):
    """Normalise only origin and trailing slash; retain query and fragment data."""
    parts = urlsplit(urljoin('https://antlerboy.com/', value))
    return urlunsplit((parts.scheme, parts.netloc, parts.path.rstrip('/'), parts.query, parts.fragment))


def item_urls(item):
    return [item['url'], *item.get('aliases', []), *[link['url'] for link in item.get('links', [])]]


owners = {}
for item in ITEMS:
    for url in item_urls(item):
        key = url_key(url)
        if key in owners and owners[key] != item['url']:
            raise ValueError('A source is assigned to two works: ' + url)
        owners[key] = item['url']
assert len({url_key(item['url']) for item in ITEMS}) == len(ITEMS)


def render_item(item):
    links = item.get('links', [])
    related = ('<p>' + ' · '.join('<a href="' + h(link['url'], quote=True) + '">'
               + h(link['label']) + '</a>' for link in links) + '</p>') if links else ''
    return ('<li><strong><a href="' + h(item['url'], quote=True) + '">' + h(item['title'])
            + '</a></strong><small>' + h(item['meta']) + '</small><p>'
            + h(item['description']) + '</p>' + related + '</li>')


sections = []
for index, group in enumerate(DATA['groups']):
    description = '<p>' + h(group['description']) + '</p>' if group.get('description') else ''
    sections.append('<section class="section' + (' alt' if index % 2 else '')
                    + '"><div class="wrap"><div class="section-head"><h2>' + h(group['title'])
                    + '</h2>' + description + '</div><ul class="resource-list">\n'
                    + '\n'.join(render_item(item) for item in group['items'])
                    + '\n</ul></div></section>')
block = START + '\n' + '\n'.join(sections) + '\n' + END

path = ROOT / 'library' / SLUG / 'index.html'
page = path.read_text()
if START in page:
    page, count = re.subn(re.escape(START) + r'.*?' + re.escape(END), lambda _: block, page, flags=re.S)
else:
    # The original generator owns exactly one Material section on this page.
    legacy = r'<section class="section"><div class="wrap"><div class="section-head"><h2>Material</h2></div><ul class="resource-list">.*?</ul></div></section>'
    page, count = re.subn(legacy, lambda _: block, page, flags=re.S)
if count != 1:
    raise ValueError('Expected exactly one topic material block; found ' + str(count))
for pattern in [r'(<meta name="description" content=")[^"]*(">)',
                r'(<meta property="og:description" content=")[^"]*(">)',
                r'(<p class="lead">).*?(</p>)']:
    page = re.sub(pattern, lambda match: match[1] + h(DATA['description'], quote=True) + match[2], page, count=1)
path.write_text(page)

path = ROOT / 'library/manifest.json'
manifest = json.loads(path.read_text())
for entry in manifest['pages']:
    if entry['slug'] == SLUG:
        entry.update(title=DATA['title'], description=DATA['description'])
        break
else:
    raise ValueError('Topic page missing from the library manifest')

old_resources = manifest['resources']
resources = [entry for entry in old_resources if url_key(entry['url']) not in owners]
for item in ITEMS:
    matched = [entry for entry in old_resources if owners.get(url_key(entry['url'])) == item['url']]
    pages = {SLUG, *item.get('pages', [])}
    tags = set(item.get('tags', []))
    if 'writing' in tags:
        pages.add('articles-and-essays')
    for entry in matched:
        pages.update(entry.get('pages', []))
        tags.update(entry.get('tags', []))
    record = {key: item[key] for key in ['title', 'year', 'format', 'url', 'description']}
    if item.get('date'):
        record['date'] = item['date']
    record.update(tags=sorted(tags), pages=sorted(pages))
    if item.get('links'):
        record['relatedLinks'] = item['links']
    resources.append(record)
manifest['resources'] = resources
manifest['updated'] = max(manifest.get('updated', ''), DATA['checked'])
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

path = ROOT / 'sitemap.xml'
sitemap = path.read_text()
location = 'https://antlerboy.com/library/' + SLUG + '/'
replacement = '<url><loc>' + location + '</loc><lastmod>' + DATA['checked'] + '</lastmod></url>'
sitemap, count = re.subn(r'<url><loc>' + re.escape(location) + r'</loc>(?:<lastmod>[^<]*</lastmod>)?</url>', replacement, sitemap)
if count != 1:
    raise ValueError('Expected one systems-leadership sitemap entry')
path.write_text(sitemap)
print(f'Updated systems leadership: {len(ITEMS)} distinct works; canonical catalogue records consolidated.')
