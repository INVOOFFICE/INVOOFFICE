/**
 * Régénère sitemap.xml et la ligne Sitemap de robots.txt à partir de data/blog-posts.json.
 * — lastmod blog / accueil : date la plus récente parmi les articles (ou aujourd’hui si vide).
 * — Les articles sont sur une seule page (/blog/) : pas d’entrée par #fragment (recommandation Google).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'data', 'blog-posts.json');
const sitemapPath = join(root, 'sitemap.xml');
const robotsPath = join(root, 'robots.txt');

const DEFAULT_SITE_BASE = 'https://invooffice.github.io/INVOOFFICE';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function maxPostDate(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return todayIsoDate();
  return posts.reduce((max, p) => {
    const d = String(p.date || '').slice(0, 10);
    return d > max ? d : max;
  }, '1970-01-01');
}

function normalizeBase(url) {
  return String(url || DEFAULT_SITE_BASE).replace(/\/+$/, '');
}

let siteBaseUrl = DEFAULT_SITE_BASE;
let posts = [];

try {
  const raw = readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);
  siteBaseUrl = normalizeBase(data.siteBaseUrl || DEFAULT_SITE_BASE);
  posts = Array.isArray(data.posts) ? data.posts : [];
} catch {
  console.warn('generate-sitemap: pas de blog-posts.json ou JSON invalide — sitemap minimal avec URL par défaut');
}

const lastmod = maxPostDate(posts);
const homeLoc = `${siteBaseUrl}/`;
const blogLoc = `${siteBaseUrl}/blog/`;
const sitemapUrl = `${siteBaseUrl}/sitemap.xml`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(homeLoc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(blogLoc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`;

writeFileSync(sitemapPath, sitemap, 'utf8');

const robots = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

writeFileSync(robotsPath, robots, 'utf8');

console.log('generate-sitemap:', homeLoc, blogLoc, 'lastmod=', lastmod, 'posts=', posts.length);
