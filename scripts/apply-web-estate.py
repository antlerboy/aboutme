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
intro = '<section class="hero"><div class="wrap"><p class="eyebrow">Practical routes</p><h1>Start with your situation</h1><p class="lead">Prepare a decision, conversation, or practical test using the questions, sources, and tools below.</p><p>Use these questions with colleagues or on your own. Each route includes a working note you can fill in and download, and a way to ask for support.</p><ul class="route-index">' + ''.join(f'<li><a href="#{h(r["id"])}">{h(r["title"])}</a></li>' for r in routes) + '</ul></div></section>'
sections = []
for route in routes:
    resources = ''.join(f'<li><a href="{h(item["url"])}">{h(item["title"])}</a></li>' for item in route['resources'])
    prompts = ''.join(f'<li>{h(prompt)}</li>' for prompt in route['prompts'])
    sections.append(f'''<section class="section route" id="{h(route['id'])}" data-route="{h(route['id'])}"><div class="wrap"><p class="eyebrow">{h(route['time'])}</p><h2>{h(route['title'])}</h2><p class="lead">{h(route['intro'])}</p><ol>{prompts}</ol><p><strong>Leave with:</strong> {h(route['output'])}</p><h3>Use what helps</h3><ul>{resources}</ul><details class="working-note"><summary>Make a working note</summary><label for="note-{h(route['id'])}">Your account, decisions, and next step</label><textarea id="note-{h(route['id'])}" rows="16">{h(route['note'])}</textarea><p>Your notes stay in this tab. They aren't submitted or saved automatically. Download a copy before closing the page.</p><button class="button" type="button" data-download-note>Download your note</button><p role="status" aria-live="polite"></p></details><p><a href="{h(route['support']['url'])}">{h(route['support']['title'])} →</a></p><p><a href="#top">Choose another situation ↑</a></p></div></section>''')

roles = '''<section class="section alt" id="where-things-live"><div class="wrap"><h2>Where the different parts fit</h2><dl class="site-roles"><dt><a href="/">Antlerboy</a></dt><dd>My public work, practical guides, and ways to work with me.</dd><dt><a href="https://chosen-path.org/">Chosen Path</a></dt><dd>My essays, arguments, working notes, and writing archive.</dd><dt><a href="https://stream.syscoi.com/">Systems Community of Inquiry</a></dt><dd>A broad stream of material from many authors. Follow the original source; inclusion is not endorsement.</dd><dt><a href="https://transduction.systems/">The Necessary Tangle</a></dt><dd>An evidence-backed atlas of systems, cybernetics, and complexity, with sources, connections, reading routes, and events.</dd><dt><a href="https://redquadrant.com/">RedQuadrant</a></dt><dd>Consulting and practical support for public-service and organisational change.</dd><dt><a href="https://publicservicetransformation.org/">The PSTA</a></dt><dd>Learning and development that builds public services' own transformation capability.</dd></dl><p><a href="https://greebling.com/">Browse the full directory on Greebling</a>, or <a href="/library/search/">search the library, Chosen Path, and SysCoI</a>.</p><p><a href="mailto:benjamin.taylor@redquadrant.com?subject=A%20correction%20to%20a%20practical%20route">Suggest a correction by email</a> · <a href="https://github.com/antlerboy/aboutme/issues/1">Public corrections and discussion</a></p></div></section>'''
page = f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Start with your situation | Benjamin P Taylor</title><meta name="description" content="Questions, sources, tools, and working notes for six public service and systems practice situations."><link rel="canonical" href="https://antlerboy.com/library/use/"><link rel="stylesheet" href="/library/style.css"><meta property="og:title" content="Start with your situation | Benjamin P Taylor"><meta property="og:description" content="Prepare a decision, conversation, or practical test."><meta property="og:url" content="https://antlerboy.com/library/use/"></head><body id="top">{nav}<main>{intro}{''.join(sections)}{roles}</main><footer><div class="wrap">Benjamin P Taylor · <a href="/library/">Public work library</a> · Routes updated {h(data['updated'])}</div></footer><script src="/library/practical-routes.js"></script></body></html>'''
target = ROOT / 'library/use/index.html'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(page, encoding='utf-8')

home = '<section id="start-here" class="alt"><div class="wrap"><div class="section-head"><p class="eyebrow">Practical routes</p><h2 class="section-title">Start with your situation</h2></div><div class="grid"><article class="card third"><h3>A live issue</h3><p>Choose questions and tools for a recurring barrier, a difficult conversation, a team pattern, or an intervention you need to design. Download a note of your decisions and next step.</p><p><a href="/library/use/">Choose your situation →</a></p></article><article class="card third"><h3>Develop your practice</h3><p>Bring a consulting, facilitation, or transformation problem to a small practitioner cohort, or choose supported modules.</p><p><a href="/toolshed/">The Tool Shed and Leading Transformation →</a></p></article><article class="card third"><h3>Find a source</h3><p>Search my writing and selected public resources. Results distinguish the writing archive, curated library entries, and the broader SysCoI link stream.</p><p><a href="/library/search/">Search the public work →</a></p></article></div><p><a href="/library/use/#where-things-live">Where the different sites fit</a></p></div></section>'
replace_section(ROOT / 'index.html', 'estate-start', home, '    <section id="work">')
library = '<section class="section alt" id="start-here"><div class="wrap"><p class="eyebrow">Use the work</p><h2>Start with your situation</h2><p>Choose questions, sources, and a working note for a commissioning decision, a difficult conversation, a team pattern, or an intervention.</p><div class="actions"><a class="button primary" href="/library/use/">Choose a practical route</a><a class="button" href="/library/use/#where-things-live">Where the sites fit</a></div></div></section>'
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
