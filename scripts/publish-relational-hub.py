"""Publish the relational work as a topic hub, retaining legacy links and assets.

Run after the visual and catalogue builders, before final site checks. Source
workshop files remain an input; the published topic page lives at /relational/.
GitHub Pages serves static files, so the old page uses a browser redirect with
a no-JavaScript fallback. Query strings and section fragments survive in JS.
"""
from pathlib import Path
import json
import re
import shutil
import sys

OLD = '/sysprac26/relational/'
NEW = '/relational/'
CANONICAL = 'https://antlerboy.com' + NEW
DESCRIPTION = (
    'Practical tools, papers, and teaching on relational public services, demand, '
    'place-based working, and the conditions that let useful practice endure.'
)


def replace_required(text, before, after):
    if before in text:
        return text.replace(before, after, 1)
    if after in text:
        return text
    raise ValueError('Expected page content has changed: ' + before[:100])


def build(root):
    legacy = root / OLD.strip('/')
    topic = root / NEW.strip('/')
    source = legacy / 'index.html'
    if not source.is_file():
        raise FileNotFoundError('Missing relational source page')
    source_text = source.read_text(encoding='utf-8')
    if 'data-relational-redirect' not in source_text:
        shutil.copytree(legacy, topic, dirs_exist_ok=True)
    elif not (topic / 'index.html').is_file():
        raise FileNotFoundError('Redirect exists without its destination')

    page = topic / 'index.html'
    text = page.read_text(encoding='utf-8')
    text = text.replace(OLD, NEW)
    text = re.sub(r'<title>[^<]*</title>',
                  '<title>Relational public services | Benjamin P Taylor</title>', text, count=1)
    for attribute in ['name="description"', 'property="og:description"']:
        pattern = r'<meta ' + re.escape(attribute) + r' content="[^"]*">'
        text = re.sub(pattern, '<meta ' + attribute + ' content="' + DESCRIPTION + '">', text, count=1)
    text = text.replace('property="og:title" content="Making relational public services ordinary"',
                        'property="og:title" content="Relational public services | Benjamin P Taylor"')
    if 'property="og:url"' not in text:
        text = text.replace('</head>', '<meta property="og:url" content="' + CANONICAL + '">\n</head>', 1)
    text = replace_required(text,
        'Workshop &amp; practical tool &middot; 8 October 2026',
        'Relational public services &middot; tools, writing, and practice')
    text = replace_required(text,
        '<p class="lead">Follow a person\'s situation into organisational decisions. Find what gets lost, who can act, and what must change for useful practice to last.</p>',
        '<p class="lead">' + DESCRIPTION + '</p>')
    text = replace_required(text,
        '<a class="button secondary" href="#case">Start with Asha\'s story</a>',
        '<a class="button secondary" href="#resources">Browse papers and practical resources</a>')
    text = text.replace("The workshop's two jobs", 'Two linked tasks')
    text = text.replace('This exercise follows the work into the rules, resources, measures, and authority around it.',
                        'This work follows practice into the rules, resources, measures, and authority around it.')
    text = text.replace('<a href="https://antlerboy.com/sysprac26/">SysPrac26 sessions</a>',
                        '<a href="#resources">Tools and papers</a>')
    text = text.replace('<a href="/sysprac26/">SysPrac26 sessions</a>',
                        '<a href="/relational/">Relational public services</a>')
    text = text.replace('<a href="#session">The discussion</a>',
                        '<a href="#session">Workshop discussion</a>')
    text = text.replace('<a href="#resources">Related tools</a>',
                        '<a href="#resources">Tools and papers</a>')
    text = text.replace('Updated: 8 October 2026 &middot; v0.02',
                        'Updated: 8 October 2026 &middot; v0.03')
    page.write_text(text, encoding='utf-8')

    # Update published navigation and catalogue URLs, without changing archive
    # titles, source attribution, or the underlying papers and illustrations.
    changed = []
    for filename in root.rglob('*'):
        if not filename.is_file() or filename.suffix not in {'.html', '.json', '.xml'}:
            continue
        original = filename.read_text(encoding='utf-8')
        revised = original.replace(OLD, NEW)
        if revised != original:
            filename.write_text(revised, encoding='utf-8')
            changed.append(str(filename.relative_to(root)))
    sessions = root / 'sysprac26' / 'index.html'
    if sessions.is_file():
        text = sessions.read_text(encoding='utf-8')
        text = text.replace('href="relational/style.css"', 'href="/relational/style.css"')
        sessions.write_text(text, encoding='utf-8')

    sitemap = root / 'sitemap.xml'
    text = sitemap.read_text(encoding='utf-8')
    if '<loc>' + CANONICAL + '</loc>' not in text:
        text = text.replace('</urlset>', '<url><loc>' + CANONICAL + '</loc>'
                            '<lastmod>2026-10-08</lastmod></url>\n</urlset>')
    sitemap.write_text(text, encoding='utf-8')

    manifest_path = topic / 'publication.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest.update({'edition': 'v0.03', 'canonical_url': CANONICAL,
                     'redirect_from': OLD, 'scope': 'relational-public-services'})
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')

    # Keep all legacy download files in place. Replace only the old HTML page.
    redirect = '''<!doctype html>
<html lang="en-GB" data-relational-redirect="true">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relational public services has moved | Benjamin P Taylor</title>
<link rel="canonical" href="https://antlerboy.com/relational/">
<!-- No analytics.js on this redirect. Do not read or transmit working records. -->
<script>window.location.replace('/relational/' + window.location.search + window.location.hash);</script>
<noscript><meta http-equiv="refresh" content="0; url=/relational/"></noscript>
</head>
<body><main><h1>Relational public services</h1>
<p>The tools, papers, and teaching now have their own address.</p>
<p><a href="/relational/">Continue to relational public services</a></p>
</main></body></html>
'''
    source.write_text(redirect, encoding='utf-8')
    # Existing index.html, slash, and fragment links all use the same redirect.
    if not (topic / 'tool.js').is_file() or not (topic / 'ordinary-map.svg').is_file():
        raise FileNotFoundError('The new page is missing its tool or infographic')
    print(json.dumps({'canonical_url': CANONICAL, 'redirect_from': OLD,
                      'updated_link_files': changed, 'legacy_assets_preserved': True}, indent=2))


if __name__ == '__main__':
    build(Path(sys.argv[1] if len(sys.argv) > 1 else '_site'))
