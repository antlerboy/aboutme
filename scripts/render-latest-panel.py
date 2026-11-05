#!/usr/bin/env python3
"""Render the editorial three-item panel and its expiry-aware browser fallback."""

from pathlib import Path
import re
import sys

from curated_latest import load_contract, render_cards, runtime_markup, write_assets

REPO = Path(__file__).resolve().parents[1]


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO
    home = root / "index.html"
    contract = load_contract(REPO)
    cards = render_cards(contract["selected"], "latest")
    runtime = runtime_markup(contract, "latest")
    panel = f'''<section id="latest" class="alt" data-latest-panel><div class="wrap"><div class="latest-panel-heading"><div><p class="eyebrow">Latest news and social media</p><h2 class="section-title">Three things worth a look</h2></div><p>Selected for relevance, not simply whatever was posted last.</p></div><div class="latest-grid" data-latest-grid>{cards}</div></div>{runtime}</section>'''
    markup, count = re.subn(r'<section id="latest"(?=[\s>]).*?</section>', lambda match: panel, home.read_text(), flags=re.S)
    if count != 1:
        raise SystemExit(f"Expected exactly one latest panel, found {count}")
    home.write_text(markup)
    write_assets(REPO, root, contract)
    print("Rendered three current topics:", ", ".join(item["topic"] for item in contract["selected"]))
    if contract["review_needed"]:
        print("Editorial review due; inspect assets/data/latest.json")


if __name__ == "__main__":
    main()
