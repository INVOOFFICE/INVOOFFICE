/**
 * Valide data/blog-posts.json avant generate-blog.mjs.
 * Évite un build Pages silencieux ou cassé si le Sheets a produit un JSON incomplet.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'data', 'blog-posts.json');

const ISO = /^\d{4}-\d{2}-\d{2}$/;

if (!existsSync(dataPath)) {
  console.warn(
    'validate-blog-posts: data/blog-posts.json absent — skip (fichier ignoré par Git ou non encore créé ; Apps Script peut le pousser sur GitHub).'
  );
  process.exit(0);
}

let data;
try {
  data = JSON.parse(readFileSync(dataPath, 'utf8'));
} catch (e) {
  console.error('validate-blog-posts: fichier JSON illisible ou invalide —', e.message);
  process.exit(1);
}

if (data.siteBaseUrl == null || String(data.siteBaseUrl).trim() === '') {
  console.error('validate-blog-posts: siteBaseUrl manquant dans blog-posts.json (obligatoire pour SEO / liens).');
  process.exit(1);
}

const posts = Array.isArray(data.posts) ? data.posts : [];
const errors = [];

posts.forEach((p, idx) => {
  const n = idx + 1;
  const prefix = `Article #${n} (id=${JSON.stringify(p.id)}):`;
  if (p == null || typeof p !== 'object') {
    errors.push(`${prefix} entrée invalide.`);
    return;
  }
  if (!p.id || String(p.id).trim() === '') {
    errors.push(`${prefix} champ "id" obligatoire (slug non vide).`);
  }
  if (p.title == null || String(p.title).trim() === '') {
    errors.push(`${prefix} champ "title" obligatoire.`);
  }
  if (!p.date || !ISO.test(String(p.date).trim())) {
    errors.push(`${prefix} champ "date" doit être AAAA-MM-JJ (ex. 2026-03-28).`);
  }
  if (p.tag == null || String(p.tag).trim() === '') {
    errors.push(`${prefix} champ "tag" obligatoire.`);
  }
  if (p.excerpt == null || String(p.excerpt).trim() === '') {
    errors.push(`${prefix} champ "excerpt" obligatoire.`);
  }
  const hasHtml = p.bodyHtml != null && String(p.bodyHtml).trim() !== '';
  const paras = Array.isArray(p.paragraphs) ? p.paragraphs : [];
  const hasParas = paras.some((x) => String(x).trim() !== '');
  if (!hasHtml && !hasParas) {
    errors.push(`${prefix} corps vide : renseigner le texte (paragraphes) ou bodyHtml commençant par <p.`);
  }
});

if (errors.length) {
  console.error('validate-blog-posts: corrections nécessaires dans la feuille ou data/blog-posts.json :\n');
  errors.forEach((line) => console.error('  •', line));
  console.error(
    '\nAstuce : après sync depuis Sheets, ouvrez le JSON sur GitHub et vérifiez chaque objet sous "posts".'
  );
  process.exit(1);
}

console.log('validate-blog-posts: OK —', posts.length, 'article(s), siteBaseUrl =', data.siteBaseUrl);
