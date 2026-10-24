#!/usr/bin/env python3
from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'data/nets.json').read_text())
nets = data.get('nets', [])
if not isinstance(nets, list): raise SystemExit('data/nets.json: nets must be an array')
ids = [n.get('id') for n in nets]
if None in ids or len(ids) != len(set(ids)): raise SystemExit('Every net requires a unique id')
(root / 'data/nets.js').write_text('/* Generated. Do not edit directly. */\nwindow.RF_NETS = ' + json.dumps(nets, ensure_ascii=False, indent=2) + ';\n')
print(f'Wrote {len(nets)} nets to data/nets.js')
