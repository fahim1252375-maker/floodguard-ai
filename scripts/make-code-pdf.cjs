#!/usr/bin/env node
/**
 * make-code-pdf.js
 * Generates an honest, clean submission/code.pdf containing all source code developed
 * for the FloodGuard AI project, formatted in monospace with line numbers and a TOC.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const ALLOWED_EXTS = new Set(['.ts', '.tsx', '.js', '.json', '.html', '.md', '.css']);
const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.playwright-cli',
  'aistudio',
  'screenshots',
  'submission'
]);
const EXCLUDED_FILES = new Set([
  'bun.lock',
  'package-lock.json',
  'icon.svg'
]);

function getFiles(dir, base = '') {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    if (EXCLUDED_FILES.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(getFiles(fullPath, relPath));
    } else {
      const ext = path.extname(entry.name);
      if (ALLOWED_EXTS.has(ext)) {
        results.push(relPath);
      }
    }
  }
  return results;
}

const files = getFiles('.').sort();
console.log(`Found ${files.length} code and configuration files to include in Code PDF.`);

let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>FloodGuard AI - Complete Source Code</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 15mm 15mm;
    @bottom-right {
      content: counter(page);
    }
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    font-size: 8pt;
    color: #1e293b;
    line-height: 1.4;
  }
  .cover {
    page-break-after: always;
    padding-top: 40px;
  }
  h1 { font-size: 24pt; color: #0284c7; margin-bottom: 5px; }
  .meta { color: #64748b; font-size: 10pt; margin-bottom: 25px; }
  .toc { margin-top: 20px; column-count: 2; column-gap: 20px; font-size: 8pt; }
  .toc-item { margin-bottom: 3px; font-family: monospace; }
  .file-block {
    page-break-before: always;
  }
  .file-header {
    background: #0f172a;
    color: #f8fafc;
    padding: 6px 10px;
    font-family: monospace;
    font-size: 9pt;
    font-weight: bold;
    border-radius: 4px 4px 0 0;
  }
  pre {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-top: none;
    border-radius: 0 0 4px 4px;
    padding: 8px 10px;
    margin: 0;
    font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
    font-size: 6.8pt;
    line-height: 1.35;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .line-num {
    display: inline-block;
    width: 32px;
    color: #94a3b8;
    user-select: none;
    text-align: right;
    margin-right: 8px;
  }
</style>
</head>
<body>
<div class="cover">
  <h1>FloodGuard AI — Complete Source Code</h1>
  <div class="meta">
    <strong>DSH Hacks V2</strong> (Theme: AI x Healthcare) · Complete Implementation Archive<br>
    Built with TypeScript, React 19, Tailwind CSS 4, Express, and Google Gemini API.<br>
    Files included: ${files.length} · Generated: ${new Date().toISOString().slice(0, 10)}
  </div>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 20px;">
  <h2>Table of Contents</h2>
  <div class="toc">
`;

files.forEach((f, idx) => {
  html += `    <div class="toc-item">${idx + 1}. ${escapeHtml(f)}</div>\n`;
});

html += `  </div>
</div>
`;

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  html += `<div class="file-block">
  <div class="file-header">${escapeHtml(file)} (${lines.length} lines)</div>
  <pre>`;

  lines.forEach((line, i) => {
    html += `<span class="line-num">${i + 1}</span>${escapeHtml(line)}\n`;
  });

  html += `</pre>
</div>
`;
});

html += `</body></html>`;

const outHtml = path.resolve('public', 'code-doc.html');
fs.writeFileSync(outHtml, html, 'utf-8');
console.log('Generated code HTML in public/code-doc.html.');

try {
  console.log('Rendering Code PDF via playwright-cli...');
  execSync('playwright-cli open http://localhost:3000/code-doc.html && playwright-cli pdf --filename=submission/code.pdf && playwright-cli close', { stdio: 'inherit' });
  console.log('✓ Successfully created submission/code.pdf');
} catch (err) {
  console.error('Playwright PDF render warning:', err.message);
} finally {
  if (fs.existsSync(outHtml)) fs.unlinkSync(outHtml);
}
