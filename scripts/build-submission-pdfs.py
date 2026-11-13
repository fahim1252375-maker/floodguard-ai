#!/usr/bin/env python3
"""Build readable submission PDFs from the English one-pager and current source tree."""
from html import escape
from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
SUBMISSION = ROOT / 'submission'


def collect_source_files():
    excluded_dirs = {'node_modules', 'dist', '.git', 'coverage', '.vite', '__pycache__'}
    excluded_files = {'package-lock.json', 'icon.svg', 'code.pdf', 'one-page-description.pdf', 'START_HERE_BN.md'}
    allowed = {'.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.json', '.html', '.md', '.css', '.py', '.yml', '.yaml'}
    items = []
    for file in ROOT.rglob('*'):
        if not file.is_file():
            continue
        rel = file.relative_to(ROOT)
        if any(part in excluded_dirs for part in rel.parts):
            continue
        if rel.parts[0] == 'submission':
            continue
        if file.name in excluded_files:
            continue
        if file.suffix.lower() in allowed or file.name in {'.env.example', '.gitignore', 'LICENSE'}:
            items.append(file)
    return sorted(items, key=lambda f: str(f.relative_to(ROOT)).lower())


def one_page():
    out = SUBMISSION / 'one-page-description.pdf'
    HTML(filename=str(SUBMISSION / 'one-page-description.html'), base_url=str(ROOT)).write_pdf(out)
    return out


def source_pdf():
    out = SUBMISSION / 'code.pdf'
    files = collect_source_files()
    toc = ''.join(f'<li>{escape(str(f.relative_to(ROOT)))}</li>' for f in files)
    sections = []
    for index, file in enumerate(files, 1):
        rel = str(file.relative_to(ROOT))
        try:
            content = file.read_text(encoding='utf-8')
        except Exception as exc:
            content = f'[Could not decode this file as UTF-8: {exc}]'
        content = content.replace('\r\n', '\n').replace('\r', '\n') or '[empty file]'
        contains_bengali = any('\u0980' <= char <= '\u09ff' for char in content)
        font_class = ' contains-bengali' if contains_bengali else ''
        sections.append(
            f'<section class="source-file{font_class}"><h2>{index:03d} · {escape(rel)}</h2>'
            f'<pre>{escape(content)}</pre></section>'
        )

    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
      @page {{ size: letter; margin: 14mm 12mm 15mm;
        @bottom-left {{ content: "FloodGuard AI · Source snapshot · 11 Nov 2026"; font: 7pt sans-serif; color: #64748b; }}
        @bottom-right {{ content: "Page " counter(page); font: 7pt sans-serif; color: #64748b; }} }}
      * {{ box-sizing: border-box; }}
      body {{ font-family: "DejaVu Sans", sans-serif; color: #0f172a; font-size: 8pt; line-height: 1.35; }}
      h1 {{ color: #075985; font-size: 24pt; margin: 0 0 4mm; }}
      h2 {{ color: white; background: #0f172a; font-size: 8.5pt; padding: 2.5mm 3mm; margin: 0 0 3mm; overflow-wrap: anywhere; }}
      .meta {{ color: #475569; font-size: 9pt; margin-bottom: 5mm; }}
      .note {{ border: 1px solid #cbd5e1; background: #f8fafc; padding: 4mm; margin-bottom: 5mm; }}
      .toc {{ columns: 3; column-gap: 7mm; font-size: 6.5pt; line-height: 1.35; padding-left: 5mm; }}
      .toc li {{ break-inside: avoid; margin-bottom: 1mm; overflow-wrap: anywhere; }}
      .source-file {{ break-before: page; }}
      pre {{ margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; tab-size: 2;
        font-family: "DejaVu Sans Mono", monospace; font-size: 5.2pt; line-height: 1.25; }}
      .contains-bengali pre {{ font-family: "Noto Sans Bengali", "DejaVu Sans Mono", monospace; }}
    </style></head><body>
      <h1>FloodGuard AI</h1>
      <div class="meta">Source Code Snapshot · React / TypeScript / Express / SQLite<br>{len(files)} source and configuration files · Generated 11 November 2026</div>
      <div class="note"><b>Scope:</b> This PDF is a readable snapshot of the source/configuration files included in the accompanying ZIP. The editable source files in the ZIP remain authoritative.<br>
      <b>Verification:</b> 117 TypeScript/TSX files passed syntax parsing and 97 dependency-free Node test cases passed. Full npm/Vitest, lint and production build remain unverified because npm registry DNS was unavailable during this review.</div>
      <h2 style="break-before:avoid">Contents</h2><ol class="toc">{toc}</ol>
      {''.join(sections)}
    </body></html>'''
    HTML(string=html, base_url=str(ROOT)).write_pdf(out)
    return out, len(files)


if __name__ == '__main__':
    one = one_page()
    code, count = source_pdf()
    print(f'Created {one} and {code} from {count} source/config files.')
