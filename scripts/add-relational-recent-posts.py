"""Add verified published writing to both relational collections.

Called after the topic hub is built. Existing material is retained. Entries
link to published articles rather than treating conversation drafts as posts.
"""
from html import escape
from pathlib import Path
import re
import sys

POSTS = [
    {
        'date': '13 October 2026',
        'title': 'Legibility without destruction',
        'url': 'https://chosen-path.org/2026/10/13/legibility-without-destruction/',
        'summary': 'How can government obtain assurance without forcing local life into its categories? Citizen-held measures, through-life costs, AI-supported inquiry, and an unresolved question about funding and control.',
    },
    {
        'date': '15 October 2026',
        'title': 'Is insight easy in #publichealth, but impact hard?',
        'url': 'https://chosen-path.org/2026/10/15/is-insight-easy-in-publichealth-but-impact-hard/',
        'summary': 'A reflection on neighbourhood working, missing authority, and what makes shared understanding consequential. Introduces the author\'s fourteen public-health systems insight briefings, distinct from SCiO workshop materials.',
    },
    {
        'date': '6 October 2026',
        'title': 'How will a rewired state resolve disagreements?',
        'url': 'https://chosen-path.org/2026/10/06/how-will-a-rewired-state-resolve-disagreements/',
        'summary': 'Who decides when neighbourhoods, councils, and regional authorities disagree, and can experience change the division of responsibilities itself?',
    },
    {
        'date': '6 October 2026',
        'title': 'My pessimistic prediction for English local government',
        'url': 'https://chosen-path.org/2026/10/06/my-pessimistic-prediction-for-english-local-government-abolish-two-tiers-then-recreate-them-at-a-larger-scale-with-less-local-autonomy-tell-me-im-wrong/',
        'summary': 'A forecast, not an announced settlement: devolution could reproduce central control at a larger scale. Examines autonomy, cohesion, care, and the ability to challenge national assumptions.',
    },
]

START = '<!-- relational-recent-posts:start -->'
END = '<!-- relational-recent-posts:end -->'


def section():
    items = []
    for post in POSTS:
        items.append('<li><strong><a href="' + escape(post['url'], quote=True) + '">' + escape(post['title']) + '</a></strong><p><small>' + escape(post['date']) + ' | Benjamin P Taylor | Published post</small></p><p>' + escape(post['summary']) + '</p></li>')
    return (START + '\n<section id="recent-relational-writing" class="section"><div class="wrap">'
            '<h2>Recent writing: legibility, devolution, and practical change</h2>'
            '<p>Selected published posts, added 15 October 2026. Each article links to its LinkedIn discussion.</p>'
            '<ul class="resource-list">' + ''.join(items) + '</ul></div></section>\n' + END)


def build(root):
    root = Path(root)
    targets = [root / 'relational/index.html', root / 'library/relational-public-services/index.html']
    addition = section()
    for path in targets:
        text = path.read_text(encoding='utf-8')
        if START in text:
            if END not in text:
                raise ValueError('Unclosed recent-writing section: ' + str(path))
            text = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: addition, text, count=1, flags=re.S)
        elif '</main>' in text:
            text = text.replace('</main>', addition + '\n</main>', 1)
        else:
            raise ValueError('Missing main element: ' + str(path))
        path.write_text(text, encoding='utf-8')
        print('Updated relational writing collection:', path)


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else '_site')
