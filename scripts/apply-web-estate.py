"""Maintain practical routes and their entries without rebuilding unrelated pages."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
h = lambda value: html.escape(str(value), quote=True)
data = json.loads((ROOT / 'content/practical-routes.json').read_text(encoding='utf-8'))
routes = data['routes']

def replace_section(path, marker, body, before):
    text = path.read_text(encoding='utf-8')
    block = f'<!-- {marker}:start -->{body}<!-- {marker}:end -->'
    pattern = rf'<!-- {re.escape(marker)}:start -->[\s\S]*?<!-- {re.escape(marker)}:end -->'
    if re.search(pattern, text):
        text = re.sub(pattern, lambda _: block, text)
    else:
        assert before in text, (path, before)
        text = text.replace(before, block + before, 1)
    path.write_text(text, encoding='utf-8')

nav = '<header><div class="wrap top"><a class="brand" href="/">Benjamin P Taylor, antlerboy</a><nav class="nav" aria-label="Library navigation"><a href="/library/use/">Start with your situation</a><a href="/library/">Library</a><a href="/library/search/">Search</a><a href="/toolshed/">Supported practice</a></nav></div></header>'
intro = '<section class="hero"><div class="wrap"><p class="eyebrow">Work on a live situation</p><h1>What do you need to work through?</h1><p class="lead">Choose a question, use the material that helps, and leave with a next step you can discuss or test.</p><p>These routes bring my writing, practical tools, and teaching into a piece of work. You can use them freely. Each also has a route to facilitated support.</p><ul class="route-index">' + ''.join(f'<li><a href="#{h(r["id"])}">{h(r["title"])}</a></li>' for r in routes) + '</ul></div></section>'
sections = []
for route in routes:
    resources = ''.join(f'<li><a href="{h(item["url"])}">{h(item["title"])}</a></li>' for item in route['resources'])
    prompts = ''.join(f'<li>{h(prompt)}</li>' for prompt in route['prompts'])
    sections.append(f'''<section class="section route" id="{h(route['id'])}" data-route="{h(route['id'])}"><div class="wrap"><p class="eyebrow">{h(route['time'])}</p><h2>{h(route['title'])}</h2><p class="lead">{h(route['intro'])}</p><ol>{prompts}</ol><p><strong>Leave with:</strong> {h(route['output'])}</p><h3>Use what helps</h3><ul>{resources}</ul><details class="working-note"><summary>Make a working note</summary><label for="note-{h(route['id'])}">Your account, decisions, and next step</label><textarea id="note-{h(route['id'])}" rows="16">{h(route['note'])}</textarea><p>Your notes stay in this tab. They aren't submitted or saved automatically. Download a copy before closing the page.</p><button class="button" type="button" data-download-note>Download your note</button><p role="status" aria-live="polite"></p></details><p><a href="{h(route['support']['url'])}">{h(route['support']['title'])} →</a></p><p><a href="#top">Choose another situation ↑</a></p></div></section>''')

roles = '''<section class="section alt" id="where-things-live"><div class="wrap"><h2>Where the different parts fit</h2><dl class="site-roles"><dt><a href="/">Antlerboy</a></dt><dd>My public work, practical guides, and ways to work with me.</dd><dt><a href="https://chosen-path.org/">Chosen Path</a></dt><dd>My essays, arguments, working notes, and writing archive.</dd><dt><a href="https://stream.syscoi.com/">Systems Community of Inquiry</a></dt><dd>A broad stream of material from many authors. Follow the original source; inclusion is not endorsement.</dd><dt><a href="https://transduction.systems/">The Necessary Tangle</a></dt><dd>An evidence-backed atlas of systems, cybernetics, and complexity, with sources, connections, reading routes, and events.</dd><dt><a href="https://redquadrant.com/">RedQuadrant</a></dt><dd>Consulting and practical support for public-service and organisational change.</dd><dt><a href="https://publicservicetransformation.org/">PSTA</a></dt><dd>Learning and development that builds public services' own transformation capability.</dd></dl><p><a href="https://greebling.com/">Browse the full directory on Greebling</a>, or <a href="/library/search/">search the library, Chosen Path, and SysCoI</a>.</p><p><a href="mailto:benjamin.taylor@redquadrant.com?subject=A%20correction%20to%20a%20practical%20route">Suggest a correction by email</a> · <a href="https://github.com/antlerboy/aboutme/issues/1">Public corrections and discussion</a></p></div></section>'''
page = f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Start with your situation | Benjamin P Taylor</title><meta name="description" content="Six practical routes through a live issue: useful prompts, sources, tools, a working note, and facilitated support."><link rel="canonical" href="https://antlerboy.com/library/use/"><link rel="stylesheet" href="/library/style.css"><meta property="og:title" content="Start with your situation | Benjamin P Taylor"><meta property="og:description" content="Use the public work to make a next step you can discuss or test."><meta property="og:url" content="https://antlerboy.com/library/use/"></head><body id="top">{nav}<main>{intro}{''.join(sections)}{roles}</main><footer><div class="wrap">Benjamin P Taylor · <a href="/library/">Public work library</a> · Routes updated {h(data['updated'])}</div></footer><script src="/library/practical-routes.js"></script></body></html>'''
target = ROOT / 'library/use/index.html'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(page, encoding='utf-8')

home = '<section id="start-here" class="alt"><div class="wrap"><div class="section-head"><p class="eyebrow">Start with the work</p><h2 class="section-title">What do you need to work through?</h2></div><div class="grid"><article class="card third"><h3>A live issue</h3><p>A recurring barrier, a difficult conversation, a team pattern, or a choice of intervention. Use a practical route and make a next step.</p><p><a href="/library/use/">Choose your situation →</a></p></article><article class="card third"><h3>Developing your practice</h3><p>Bring live work into a small practitioner cohort, supported learning, mentoring, and challenge.</p><p><a href="/toolshed/">The Tool Shed and Leading Transformation →</a></p></article><article class="card third"><h3>An idea or source</h3><p>Find my writing and public work, or follow the wider systems field through the library and source records.</p><p><a href="/library/search/">Search the public work →</a></p></article></div><p><a href="/library/use/#where-things-live">Where the different sites fit</a></p></div></section>'
replace_section(ROOT / 'index.html', 'estate-start', home, '    <section id="work">')
home_path = ROOT / 'index.html'
home_text = home_path.read_text(encoding='utf-8')
home_text = re.sub(r'<article><p class="latest-source">The PSTA · webinar · 4 November 2026</p>[\s\S]*?</article>', '<article><p class="latest-source">PSTA · revised 2026 curriculum</p><h3><a href="/toolshed/">Leading Transformation: the 24-module route</a></h3><p>Connect leadership, citizens, services, management, and learning through live work, with supported modules or a small practitioner cohort.</p><a class="latest-read" href="/toolshed/">Explore the learning and support ↗</a></article>', home_text)
home_path.write_text(home_text, encoding='utf-8')
library = '<section class="section alt" id="start-here"><div class="wrap"><p class="eyebrow">Use the work</p><h2>Start with your situation</h2><p>Work through a recurring barrier, a difficult agreement, a group-process choice, a team pattern, a delivery arrangement, or a method you want to develop.</p><div class="actions"><a class="button primary" href="/library/use/">Choose a practical route</a><a class="button" href="/library/use/#where-things-live">Where the sites fit</a></div></div></section>'
replace_section(ROOT / 'library/index.html', 'estate-start', library, '<section class="section">')

controls = '<label class="field"><span>Match</span><select id="catalogue-match"><option value="all">All words</option><option value="any">Any word</option></select></label>'
help_text = '<p class="search-help">Search titles, descriptions, and themes. Common joining words are ignored. Choose ‘Any word’ for a wider search. A community link record can point to another author’s work; the original source remains decisive.</p><p><a href="/library/use/">Start with a practical question instead</a></p>'
for slug in ['chosen-path', 'syscoi', 'catalogue', 'search']:
    path = ROOT / 'library' / slug / 'index.html'
    text = path.read_text(encoding='utf-8').replace('/library/chosen-path/catalogue.js', '/library/catalogue-search.js')
    text = text.replace('Ask in keywords', 'Search in keywords')
    if 'id="catalogue-match"' not in text:
        text = text.replace('<label class="field"><span>Year</span>', controls + '<label class="field"><span>Year</span>')
    if 'class="search-help"' not in text:
        text = text.replace('<div class="catalogue-controls">', help_text + '<div class="catalogue-controls">')
    if 'id="catalogue-link"' not in text:
        text = text.replace('<button id="catalogue-clear"', '<a class="button" id="catalogue-link" href="?">Link to this search</a><button id="catalogue-clear"')
    if '<noscript>' not in text:
        text = text.replace('<div id="catalogue-results"', '<noscript><p>Search needs JavaScript. You can browse the <a href="/library/">library</a>, <a href="https://chosen-path.org/">Chosen Path</a>, and <a href="https://stream.syscoi.com/">SysCoI</a> directly.</p></noscript><div id="catalogue-results"')
    path.write_text(text, encoding='utf-8')

manifest_path = ROOT / 'library/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['pages'] = [p for p in manifest['pages'] if p['slug'] != 'use'] + [{'slug': 'use', 'title': 'Start with your situation', 'type': 'practical-routes', 'description': 'Six routes from a live question to a working note and next step, using the public writing, tools, and facilitated support.', 'tags': ['practice', 'public-services', 'systems']}]
manifest['resources'] = [r for r in manifest['resources'] if not r.get('url', '').startswith('/library/use/#')]
manifest['resources'] += [{'title': route['title'], 'url': '/library/use/#' + route['id'], 'description': route['intro'] + ' ' + route['output'], 'format': 'Practical route and downloadable working note', 'year': '2026', 'tags': ['practice', 'public-services']} for route in routes]
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

sitemap_path = ROOT / 'sitemap.xml'
sitemap = sitemap_path.read_text(encoding='utf-8')
if 'https://antlerboy.com/library/use/' not in sitemap:
    sitemap = sitemap.replace('</urlset>', '<url><loc>https://antlerboy.com/library/use/</loc></url>\n</urlset>')
sitemap_path.write_text(sitemap, encoding='utf-8')
print('Maintained six practical routes, home and library entries, search controls, catalogue records, and sitemap.')
