"""Check published practice-tool files, internal links, and disclosure boundaries."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
errors = []
pages = []


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.h1 = 0
        self.canonical = ''
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'h1':
            self.h1 += 1
        if attrs.get('href'):
            self.links.append(attrs['href'])
        if tag in {'script', 'img'} and attrs.get('src'):
            self.links.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href', '')


for slug in ['four-dynamics', 'arms-lengthiness']:
    folder = root / slug
    assert folder.is_dir(), f'Missing microsite: {slug}'
    for path in folder.rglob('index.html'):
        pages.append(path)
        text = path.read_text(encoding='utf-8')
        doc = Page(text)
        rel = path.relative_to(root)
        if doc.h1 != 1:
            errors.append(f'{rel}: expected one h1, got {doc.h1}')
        if len(doc.ids) != len(set(doc.ids)):
            errors.append(f'{rel}: duplicate IDs')
        expected = 'https://antlerboy.com/' + path.parent.relative_to(root).as_posix() + '/'
        if doc.canonical != expected:
            errors.append(f'{rel}: canonical {doc.canonical!r}, expected {expected!r}')
        if 'analytics.js' in text:
            errors.append(f'{rel}: tool pages should have no visit beacon')
        for link in doc.links:
            parts = urlsplit(link)
            if parts.scheme or parts.netloc:
                continue
            target = root / unquote(parts.path.lstrip('/')) if parts.path.startswith('/') else path.parent / unquote(parts.path)
            if target.is_dir():
                target /= 'index.html'
            if not target.is_file():
                errors.append(f'{rel}: missing local target {link}')
                continue
            if parts.fragment and target.suffix == '.html':
                ids = Page(target.read_text(encoding='utf-8')).ids
                if unquote(parts.fragment) not in ids:
                    errors.append(f'{rel}: missing fragment {link}')
    for path in folder.rglob('*'):
        if path.suffix in {'.html', '.js', '.css', '.json', '.csv', '.txt'}:
            text = path.read_text(encoding='utf-8')
            if re.search(r'https?://[^\s<>\"]*(?:sharepoint\.com|graph\.microsoft\.com)', text, re.I):
                errors.append(f'{path.relative_to(root)}: private source link found')

pdf = root / 'four-dynamics/materials/stretchcon-cadenced-culture.pdf'
if not pdf.is_file() or not pdf.read_bytes().startswith(b'%PDF'):
    errors.append('Missing full StretchCon PDF')
for path in [root / 'index.html', root / 'library/index.html']:
    text = path.read_text(encoding='utf-8')
    for slug in ['four-dynamics', 'arms-lengthiness']:
        if f'href="/{slug}/"' not in text:
            errors.append(f'{path.relative_to(root)}: missing entry to {slug}')
report = {'pages': len(pages), 'errors': errors, 'status': 'failed' if errors else 'passed'}
print(json.dumps(report, indent=2))
if errors:
    sys.exit(1)
