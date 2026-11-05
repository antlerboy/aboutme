"""Refresh or check the programme facts owned by RedQuadrant."""
import argparse
import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'content/leading-transformation.json'
URL = 'https://redquadrant.com/records/leading-transformation.json'
parser = argparse.ArgumentParser(description=__doc__)
mode = parser.add_mutually_exclusive_group(required=True)
mode.add_argument('--check', action='store_true', help='Fail if the public owner record differs from the local snapshot.')
mode.add_argument('--refresh', action='store_true', help='Replace the snapshot with the public owner record.')
mode.add_argument('--source', type=Path, help='Import an owner record from a local checkout before its first publication.')
args = parser.parse_args()
if args.source:
    record = json.loads(args.source.read_text(encoding='utf-8'))
else:
    request = Request(URL, headers={'User-Agent': 'antlerboy-programme-check/1.0'})
    with urlopen(request, timeout=30) as response:
        record = json.load(response)
assert record['schemaVersion'] == 1 and record['id'] == 'leading-transformation'
assert record['canonicalUrl'] == URL and record['recordOwner'] == 'RedQuadrant'
assert [m['number'] for m in record['modules']] == list(range(1, 25))
assert {'toolshed', 'psta'} <= record['routes'].keys()
if args.check:
    current = json.loads(DEST.read_text(encoding='utf-8'))
    if record != current:
        sys.exit('The RedQuadrant programme record has changed. Run scripts/sync-programme-record.py --refresh, rebuild the Tool Shed, and review the change before publication.')
    print(f'Programme facts match RedQuadrant record {record["version"]}.')
else:
    DEST.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Synchronised RedQuadrant programme record {record["version"]}.')
