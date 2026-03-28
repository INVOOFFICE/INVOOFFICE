import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'index.html');

function shortHash(filePath) {
  if (!existsSync(filePath)) {
    console.warn('cache-bust: missing', filePath);
    return '0';
  }
  return createHash('sha256').update(readFileSync(filePath)).digest('hex').slice(0, 10);
}

const vCss = shortHash(join(root, 'styles.min.css'));
const vJs = shortHash(join(root, 'main.min.js'));

let html = readFileSync(htmlPath, 'utf8');
html = html.replace(
  /href="styles\.min\.css(\?v=[^"]*)?"/g,
  `href="styles.min.css?v=${vCss}"`
);
html = html.replace(
  /src="main\.min\.js(\?v=[^"]*)?"/g,
  `src="main.min.js?v=${vJs}"`
);

writeFileSync(htmlPath, html, 'utf8');
console.log('cache-bust:', { 'styles.min.css': vCss, 'main.min.js': vJs });
