import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function shortHash(filePath) {
  if (!existsSync(filePath)) {
    console.warn('cache-bust: missing', filePath);
    return '0';
  }
  return createHash('sha256').update(readFileSync(filePath)).digest('hex').slice(0, 10);
}

const vCss = shortHash(join(root, 'styles.min.css'));
const vJs = shortHash(join(root, 'main.min.js'));

const htmlFiles = [join(root, 'index.html'), join(root, 'blog', 'index.html')];

for (const htmlPath of htmlFiles) {
  if (!existsSync(htmlPath)) {
    console.warn('cache-bust: skip missing', htmlPath);
    continue;
  }
  let html = readFileSync(htmlPath, 'utf8');
  html = html.replace(
    /href="((?:\.\.\/)?)styles\.min\.css(\?v=[^"]*)?"/g,
    (_, prefix) => `href="${prefix}styles.min.css?v=${vCss}"`
  );
  html = html.replace(
    /src="((?:\.\.\/)?)main\.min\.js(\?v=[^"]*)?"/g,
    (_, prefix) => `src="${prefix}main.min.js?v=${vJs}"`
  );
  writeFileSync(htmlPath, html, 'utf8');
}

console.log('cache-bust:', { 'styles.min.css': vCss, 'main.min.js': vJs, htmlFiles: htmlFiles.filter(existsSync).length });
