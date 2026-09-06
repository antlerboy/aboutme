"""Preserve the discussion shortcut when public catalogues are regenerated."""
from pathlib import Path
import sys, re, html, json

root = Path(sys.argv[1])
css = '.discussion-pixel{position:fixed!important;right:0!important;bottom:0!important;width:44px!important;height:44px!important;background:transparent!important;opacity:1!important;z-index:1000}.discussion-pixel::after{content:"";position:absolute;right:8px;bottom:8px;width:5px;height:5px;background:#981b3a;opacity:.45;border-radius:50%}.discussion-pixel:focus-visible{outline:3px solid #b98736;outline-offset:-3px}.discussion-pixel:hover::after{opacity:1}'
for page in root.rglob('*.html'):
    text = page.read_text()
    if '</body>' not in text:
        continue
    if 'class="discussion-pixel"' not in text:
        text = text.replace('</body>', '<a class="discussion-pixel" href="https://github.com/antlerboy/aboutme/issues/1" aria-label="Antlerboy.com updates and discussion"></a></body>')
    if '.discussion-pixel::after' not in text:
        text = text.replace('</head>', '<style>' + css + '</style></head>')
    text = text.replace('—', ', ').replace('–', '-').replace('&mdash;', ', ').replace('&ndash;', '-').replace('&#8212;', ', ').replace('&#8211;', '-')
    if 'property="og:title"' not in text:
        title=re.search(r'<title>(.*?)</title>',text,re.S)
        desc=re.search(r'<meta name="description" content="([^"]*)"',text)
        canonical=re.search(r'<link rel="canonical" href="([^"]*)"',text)
        if title and canonical:
            title=html.unescape(title.group(1));url=html.unescape(canonical.group(1));description=html.unescape(desc.group(1)) if desc else title
            meta='<meta property="og:type" content="website"><meta property="og:title" content="'+html.escape(title,quote=True)+'"><meta property="og:description" content="'+html.escape(description,quote=True)+'"><meta property="og:url" content="'+html.escape(url,quote=True)+'"><meta name="twitter:card" content="summary">'
            text=text.replace('</head>',meta+'</head>')
    page.write_text(text)
