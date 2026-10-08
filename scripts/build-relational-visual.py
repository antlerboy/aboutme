"""Preserve the delivered TRIP26 image and compose it with the workshop extension."""
from pathlib import Path
import base64
import hashlib
import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
import fitz
import cairosvg

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '_site')
PAGE = ROOT / 'sysprac26' / 'relational'
SOURCE_URL = 'https://www.dropbox.com/scl/fi/2fupfdismqxnr5glp7l0i/2026-06-25-TRIP26-Benjamin-Taylor-why-do-relational-public-services-fail-v1.0BT.pdf?rlkey=bminwqzpruwghaukmsq0t86f6&dl=1'
IMAGE_SHA = '34981a69cad81b153b59117e5b548877ba5edbc71c7fdf492bf6f5b33f96dc93'
STEM = '2026-10-08 RedQuadrant relational public services combined infographic v0.02 BT'
ORIGINAL_STEM = '2026-10-08 RedQuadrant TRIP26 original infographic v0.01 BT'
CACHE = Path('build-cache') / ('trip26-' + IMAGE_SHA + '.jpeg')
SVG = 'http://www.w3.org/2000/svg'
XLINK = 'http://www.w3.org/1999/xlink'
ET.register_namespace('', SVG)
ET.register_namespace('xlink', XLINK)


def original_bytes():
    supplied = os.environ.get('TRIP26_ORIGINAL_IMAGE')
    if supplied:
        data = Path(supplied).read_bytes()
        if hashlib.sha256(data).hexdigest() != IMAGE_SHA:
            raise ValueError('Supplied image is not the verified TRIP26 original')
        return data
    if CACHE.exists() and hashlib.sha256(CACHE.read_bytes()).hexdigest() == IMAGE_SHA:
        return CACHE.read_bytes()
    with urllib.request.urlopen(SOURCE_URL, timeout=90) as response:
        pdf = response.read(20_000_000)
    if not pdf.startswith(b'%PDF-'):
        raise ValueError('TRIP26 source did not return a PDF')
    document = fitz.open(stream=pdf, filetype='pdf')
    seen = set()
    for page in document:
        for item in page.get_images(full=True):
            if item[0] in seen:
                continue
            seen.add(item[0])
            data = document.extract_image(item[0])['image']
            if hashlib.sha256(data).hexdigest() == IMAGE_SHA:
                CACHE.parent.mkdir(parents=True, exist_ok=True)
                CACHE.write_bytes(data)
                return data
    raise ValueError('Public PDF does not contain the exact image from the delivered TRIP26 slide 4. Refusing substitution.')


def text(parent, x, y, size, value, colour='#161313', weight='400'):
    node = ET.SubElement(parent, '{%s}text' % SVG, {
        'x': str(x), 'y': str(y), 'font-size': str(size), 'fill': colour,
        'font-weight': weight, 'font-family': 'DejaVu Sans,Arial,sans-serif'})
    node.text = value


def build():
    if not (PAGE / 'index.html').is_file():
        raise FileNotFoundError('The relational index.html is missing from the publication bundle')
    original = original_bytes()
    (PAGE / 'trip26-original.jpeg').write_bytes(original)
    (PAGE / (ORIGINAL_STEM + '.jpeg')).write_bytes(original)
    source_path = PAGE / 'workshop-extension.svg'
    if not source_path.exists():
        source_path.write_bytes((PAGE / 'ordinary-map.svg').read_bytes())
    extension = ET.fromstring(source_path.read_bytes())
    extension.set('x', '0')
    extension.set('y', '1240')
    extension.set('aria-labelledby', 'workshop-title workshop-description')
    for el in extension.iter():
        if el.get('id') == 'title':
            el.set('id', 'workshop-title')
        elif el.get('id') == 'description':
            el.set('id', 'workshop-description')
    root = ET.Element('{%s}svg' % SVG, {
        'width': '1800', 'height': '3680', 'viewBox': '0 0 1800 3680',
        'role': 'img', 'aria-labelledby': 'combined-title combined-description'})
    ET.SubElement(root, '{%s}title' % SVG, {'id': 'combined-title'}).text = 'Making relational public services ordinary: original TRIP26 infographic and workshop application'
    ET.SubElement(root, '{%s}desc' % SVG, {'id': 'combined-description'}).text = 'The complete, unchanged original TRIP26 infographic is embedded at the top. Below it is the October workshop extension: Asha, the loss of meaning in service records, governing conditions, authorised learning, and operational and institutional tests.'
    ET.SubElement(root, '{%s}rect' % SVG, {'width': '1800', 'height': '3680', 'fill': '#FFFFFF'})
    ET.SubElement(root, '{%s}rect' % SVG, {'width': '1800', 'height': '16', 'fill': '#99141B'})
    text(root, 60, 80, 43, 'TRIP26: the original infographic', '#3E0908', '700')
    text(root, 60, 125, 25, 'Benjamin P Taylor | 25 June 2026 | Delivered slide 4, reproduced unchanged')
    uri = 'data:image/jpeg;base64,' + base64.b64encode(original).decode('ascii')
    ET.SubElement(root, '{%s}image' % SVG, {
        'id': 'trip26-original', 'x': '35', 'y': '160', 'width': '1730', 'height': str(1730 * 1128 / 2015),
        'preserveAspectRatio': 'xMidYMid meet', '{%s}href' % XLINK: uri})
    text(root, 60, 1186, 36, 'Workshop application | 8 October 2026', '#99141B', '700')
    root.append(extension)
    combined = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    (PAGE / 'ordinary-map.svg').write_bytes(combined)
    (PAGE / (STEM + '.svg')).write_bytes(combined)
    cairosvg.svg2png(bytestring=combined, write_to=str(PAGE / (STEM + '.png')), output_width=2250, output_height=4600)
    cairosvg.svg2pdf(bytestring=combined, write_to=str(PAGE / (STEM + '.pdf')))
    html = (PAGE / 'index.html').read_text(encoding='utf-8')
    html = html.replace('This expanded map adds the loss of meaning', 'The combined visual below contains the complete original TRIP26 graphic, unchanged, followed by a workshop extension. The extension adds the loss of meaning')
    html = html.replace('width="1800" height="2440"', 'width="1800" height="3680"')
    html = html.replace('alt="Expanded practice map.', 'alt="The complete original TRIP26 infographic, reproduced unchanged above the October workshop extension. Expanded practice map.')
    html = html.replace('Based on Benjamin P Taylor\'s TRIP26 infographic, the 8 October workshop, and the Taylor&ndash;Boxer work on demand and relationality.', 'Original TRIP26 infographic at the top; the October workshop application below. The original image is reproduced intact, not redrawn or summarised.')
    marker = '<details id="map-transcript">'
    download_links = '<div class="actions">' + ''.join(
        '<a class="button secondary" href="' + STEM + '.' + ext + '" download="' + STEM + '.' + ext + '">' + label + '</a>'
        for ext, label in [('pdf', 'Combined infographic: PDF'), ('png', 'Combined infographic: PNG'), ('svg', 'Combined infographic: SVG')]
    ) + '<a class="button secondary" href="' + ORIGINAL_STEM + '.jpeg" download="' + ORIGINAL_STEM + '.jpeg">Original TRIP26 graphic</a></div>'
    if 'Combined infographic: PDF' not in html:
        if marker not in html:
            raise ValueError('Cannot locate visual section; refusing an unreviewed page edit')
        html = html.replace(marker, download_links + marker, 1)
    html = html.replace('First edition: 8 October 2026 &middot; v0.01', 'Updated: 8 October 2026 &middot; v0.02')
    (PAGE / 'index.html').write_text(html, encoding='utf-8')
    manifest = {
        'edition': 'v0.02', 'commit': os.environ.get('GITHUB_SHA', 'local-verification'),
        'original_image_sha256': IMAGE_SHA,
        'original_source': '2026-06-25 TRIP26 - Benjamin Taylor - why do relational public services fail v1.1BT AS DELIVERED.pdf, slide 4',
        'original_reproduced_unchanged': True,
        'combined_dimensions': [1800, 3680],
        'files': ['index.html', 'style.css', 'tool.js', 'trip26-original.jpeg', 'ordinary-map.svg']}
    (PAGE / 'publication.json').write_text(json.dumps(manifest, indent=2) + '\n')
    for filename in manifest['files']:
        if not (PAGE / filename).is_file():
            raise FileNotFoundError(filename)
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    build()
