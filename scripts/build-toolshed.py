"""Render the personal Tool Shed page from the shared RedQuadrant programme record."""
import html
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
record = json.loads((ROOT / 'content/leading-transformation.json').read_text(encoding='utf-8'))
h = lambda value: html.escape(str(value), quote=True)
ts, psta = record['routes']['toolshed'], record['routes']['psta']
fee = lambda route: f'£{route["fee"]["amount"]:,} {route["fee"]["vat"]} per {route["fee"]["unit"]}'
blocks = []
for start in range(0, 24, 6):
    items = ''.join(f'<li><h3>{h(m["title"])}</h3><p class="module-perspective">{h(m["worldLabel"])}</p><p>{h(m["focus"])}</p></li>' for m in record['modules'][start:start + 6])
    blocks.append(f'<details class="curriculum-group"><summary>Modules {start + 1}–{start + 6}</summary><ol start="{start + 1}">{items}</ol></details>')
version = date.fromisoformat(record['version'])
checked = f'{version.day} {version.strftime("%B %Y")}'
body = f'''<h1>The Tool Shed and Leading Transformation</h1><p><strong>{h(fee(ts))}.</strong> {h(ts['accreditation'])}.</p><p class="offer-lead">A small practitioner cohort for making better use of methods, experience, and each other’s judgement in live work.</p>
<section><h2>Who joins</h2><p>Change-makers, consultants, facilitators, and systems practitioners working in different sectors and countries. Bring a real situation: a difficult intervention, an organisational pattern, a client relationship, or a change you are trying to support.</p></section>
<section><h2>What the cohort provides</h2><ul><li>{h(ts['groupSize'])}, with Benjamin P Taylor.</li><li>{h(ts['meetings'])}.</li><li>Co-coaching, action learning, constructive challenge, and discussion of live practice.</li><li>Leading Transformation core content and supporting practice resources, with access agreed for the cohort.</li><li>Mentoring and ‘shadow consulting’ to think through engagements, approaches, and interventions, within the agreed support arrangement.</li><li>A continuing community of practice, with communication arrangements agreed by the group.</li></ul><p>{h(ts['duration'])}. Additional one-to-one support and organisational groups can be discussed separately. {h(ts['availability'])}</p></section>
<section><h2>How the group works</h2><p>Small groups, adult and peer learning, generosity, confidentiality, multiple perspectives, and inquiry through action. Participants can question both a method and its application, including my interpretation.</p><p>Bring something you are trying to do. Use the group to examine the situation, rehearse a conversation or intervention, and review what happened when you tried it. The repertoire needs to earn its place in the work.</p><p>Try a <a href="/library/use/">practical route through a live issue</a>, read the <a href="/flawfulconsulting/">systemic consulting guide</a>, or examine <a href="https://redquadrant.com/practice-evidence/">public practice accounts and their evidence</a>.</p></section>
<section><h2>Leading Transformation: the 2026 curriculum</h2><p>The revised 24-module route moves across five perspectives: leadership and political life, citizens, services, management, and learning and change. Live practice starts in module 3, service prototyping in module 12, and the final simulation leads into a hundred-day plan.</p><p>The Five Core Practices recur throughout. The Four Dynamics are introduced early and applied fully to organisation design. Optional depth connects the route with Seven Ways, Resource Optimisation, Patterns of Strategy, behavioural insight, Positive Deviance, Appreciative Inquiry, lean and operational tools, commissioning, and Breaking the Shell.</p><p>{h(record['curriculumStatus'])} The 2026 curriculum develops the established programme. Ask about current materials and agree the mix, support, dates, and time commitment for your cohort before booking.</p></section>
<section id="curriculum"><h2>The 24-module learning route</h2>{''.join(blocks)}</section>
<section><h2>Choose the support that fits</h2><h3>The Tool Shed practitioner cohort</h3><p>{h(fee(ts))}. {h(ts['groupSize'])}; {h(ts['meetings'].lower())}. {h(ts['duration'])}.</p><p>Peer inquiry, co-coaching, and mentoring around live consulting, facilitation, and change work. <a href="{h(ts['url'])}">See the RedQuadrant Tool Shed</a>.</p><h3>Supported modules through PSTA</h3><p>{h(fee(psta))}. {h(psta['support'])} {h(psta['organisationalDelivery'])}</p><p><a href="{h(psta['url'])}">Explore Leading Transformation through PSTA</a>.</p></section>
<section><h2>Ask about joining</h2><p>Tell me what you are working on, what support would help, and your intended timing. We will discuss the fit, available cohort, current materials, and commitment before you decide.</p><p><a href="mailto:{h(ts['contact'])}?subject=Tool%20Shed%20cohort%20enquiry">Ask about a Tool Shed cohort</a>, or <a href="mailto:benjamin.taylor@redquadrant.com?subject=Leading%20Transformation%20enquiry">ask me about supported modules</a>.</p><p>Programme details last synchronised on {h(checked)}. Current arrangements are confirmed with the <a href="{h(ts['url'])}">RedQuadrant Tool Shed</a> or <a href="{h(psta['url'])}">PSTA programme</a> before joining.</p><p><a href="/library/use/">Start with a practical question</a> · <a href="/library/">Public writing and resources</a> · <a href="https://transduction.systems/">The Necessary Tangle</a></p></section>'''
path = ROOT / 'toolshed/index.html'
text = path.read_text(encoding='utf-8')
text, count = re.subn(r'<main>[\s\S]*?</main>', lambda _: '<main>' + body + '</main>', text, count=1)
assert count == 1
text = re.sub(r'<link rel="describedby"[^>]*>', '', text)
text = re.sub(r'<meta name="programme-record-version"[^>]*>', '', text)
text = re.sub(r'<style(?: id="toolshed-programme-style")?>\.module-perspective[\s\S]*?</style>', '', text)
text = text.replace('</head>', f'<link rel="describedby" type="application/json" href="{h(record["canonicalUrl"])}"><meta name="programme-record-version" content="{h(record["version"])}"><style id="toolshed-programme-style">.module-perspective{{font-size:.85rem;text-transform:uppercase;letter-spacing:.06em;color:#65514a}}details li{{padding:7px 0}}main{{overflow-wrap:break-word}}@media(max-width:500px){{h1{{font-size:34px}}}}</style></head>')
path.write_text(text, encoding='utf-8')
print(f'Rendered 24 Tool Shed modules and two support routes from RedQuadrant record {record["version"]}.')
