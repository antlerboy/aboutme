#!/usr/bin/env python3
"""Reassemble large hosted-source assets, verifying every byte before replacement."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'web-estate/asset-parts/manifest.json').read_text())
for asset in manifest['assets']:
    target = (root / asset['path']).resolve()
    if not target.is_relative_to(root):
        raise ValueError('Asset path leaves repository')
    data = b''.join((root / part).read_bytes() for part in asset['parts'])
    if len(data) != asset['size_bytes'] or hashlib.sha256(data).hexdigest() != asset['sha256']:
        raise ValueError('Asset integrity check failed: ' + asset['path'])
    if target.exists() and target.read_bytes() != data:
        raise ValueError('Refusing to overwrite different local content: ' + asset['path'])
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print('Verified:', asset['path'])
