#!/usr/bin/env python3
"""Render the Bangla first-run guide as a standalone, readable PDF."""
from pathlib import Path
import mistune
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'START_HERE_BN.md'
OUTPUT = ROOT / 'submission' / 'quick-start-bn.pdf'
markdown = mistune.create_markdown(plugins=['table'])
body = markdown(SOURCE.read_text(encoding='utf-8'))
html = f'''<!doctype html>
<html lang="bn"><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 17mm 16mm 18mm;
  @bottom-left {{ content: "FloodGuard AI · বাংলা quick start"; font: 8pt "Noto Sans Bengali"; color: #64748b; }}
  @bottom-right {{ content: "Page " counter(page); font: 8pt sans-serif; color: #64748b; }}
}}
* {{ box-sizing: border-box; }}
body {{ font-family: "Noto Sans Bengali", sans-serif; font-size: 10.2pt; line-height: 1.62; color: #172033; }}
h1 {{ font-size: 20pt; color: #075985; line-height: 1.4; margin: 0 0 5mm; }}
h2 {{ font-size: 13.2pt; color: #075985; margin: 7mm 0 2mm; padding-bottom: 1.5mm; border-bottom: 1px solid #cbd5e1; break-after: avoid; }}
p {{ margin: 0 0 3mm; }}
ul,ol {{ padding-left: 7mm; margin: 2mm 0 4mm; }}
li {{ margin: 0 0 1.4mm; }}
pre {{ font-family: "DejaVu Sans Mono", monospace; font-size: 8.6pt; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; color: #0f172a; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3mm; padding: 3mm; margin: 2mm 0 4mm; break-inside: avoid; }}
code {{ font-family: "DejaVu Sans Mono", monospace; font-size: .9em; background: #f1f5f9; padding: .2mm .7mm; border-radius: 1mm; }}
strong {{ color: #0f172a; }}
hr {{ border: 0; border-top: 1px solid #cbd5e1; margin: 6mm 0; }}
blockquote {{ margin: 3mm 0; padding: 2mm 4mm; border-left: 3px solid #0e7490; color: #334155; background: #f8fafc; }}
a {{ color: #0369a1; text-decoration: none; }}
</style></head><body>{body}</body></html>'''
HTML(string=html, base_url=str(ROOT)).write_pdf(OUTPUT)
print(f'Created {OUTPUT}')
