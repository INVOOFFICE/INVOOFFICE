/**
 * Lit data/blog-posts.json et régénère les blocs blog dans index.html et blog/index.html.
 * À exécuter avant le minify (npm run build).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'data', 'blog-posts.json');
const indexPath = join(root, 'index.html');
const blogPath = join(root, 'blog', 'index.html');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatFr(isoDate) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat('fr-MA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function buildArticleBody(post) {
  if (post.bodyHtml && String(post.bodyHtml).trim()) {
    return post.bodyHtml.trim();
  }
  const paras = Array.isArray(post.paragraphs) ? post.paragraphs : [];
  return paras
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n      ');
}

/** Numéro wa.me : chiffres uniquement, sans + (ex. 212630230803). */
function normalizeWhatsappPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  return d || '212630230803';
}

function buildWhatsappArticleHref(phoneDigits, leadText, post, appendTitle) {
  const lead = String(leadText || 'Bonjour, je veux en savoir plus').trim();
  const msg =
    appendTitle === false ? lead : `${lead} — Article : ${post.title}`;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`;
}

function buildArticleWhatsappCta(href) {
  return `    <div class="blog-article-cta">
      <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="btn-wa blog-article-wa">
        <svg class="wa-icon" aria-hidden="true"><use href="#icon-wa"/></svg>
        <span class="btn-wa-label btn-wa-label--full">Commander via WhatsApp</span>
        <span class="btn-wa-label btn-wa-label--short">WhatsApp</span>
      </a>
    </div>`;
}

function buildBlogGridHtml(posts) {
  return posts
    .map((post, i) => {
      const delay = i === 0 ? '' : ` style="transition-delay:${(i * 0.06).toFixed(2)}s"`;
      const display = post.dateDisplay || formatFr(post.date);
      return `      <article class="blog-card reveal"${delay} itemscope itemtype="https://schema.org/BlogPosting">
        <div class="blog-card-meta">
          <time class="blog-card-date" datetime="${escapeHtml(post.date)}" itemprop="datePublished">${escapeHtml(display)}</time>
          <span class="blog-card-tag">${escapeHtml(post.tag)}</span>
        </div>
        <h3 class="blog-card-title" itemprop="headline">${escapeHtml(post.title)}</h3>
        <p class="blog-card-excerpt" itemprop="description">${escapeHtml(post.excerpt)}</p>
        <a href="blog/index.html#${escapeHtml(post.id)}" class="blog-card-link">Lire l’article <span aria-hidden="true">→</span></a>
      </article>`;
    })
    .join('\n\n');
}

function buildBlogArticlesHtml(posts, waPhoneDigits, waLeadText, waAppendTitle) {
  return posts
    .map((post, i) => {
      const delay = i === 0 ? '' : ` style="transition-delay:${(i * 0.06).toFixed(2)}s"`;
      const display = post.dateDisplay || formatFr(post.date);
      const body = buildArticleBody(post);
      const waHref = buildWhatsappArticleHref(waPhoneDigits, waLeadText, post, waAppendTitle);
      const waCta = buildArticleWhatsappCta(waHref);
      return `  <article id="${escapeHtml(post.id)}" class="blog-article reveal"${delay} itemscope itemtype="https://schema.org/BlogPosting">
    <div class="blog-article-meta">
      <time datetime="${escapeHtml(post.date)}" itemprop="datePublished">${escapeHtml(display)}</time>
      <span class="blog-card-tag">${escapeHtml(post.tag)}</span>
    </div>
    <h2 class="blog-article-title" itemprop="headline">${escapeHtml(post.title)}</h2>
    <div class="blog-article-body" itemprop="articleBody">
      ${body}
    </div>
${waCta}
  </article>`;
    })
    .join('\n\n');
}

function buildJsonLd(siteBaseUrl, posts) {
  const base = siteBaseUrl.replace(/\/$/, '');
  const blogUrl = `${base}/blog/`;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${blogUrl}#blog`,
        name: 'Blog INVOOffice',
        url: blogUrl,
        description:
          'Une boutique de solutions pour TPE, PME et entrepreneurs : usage personnel, données chez vous, travail hors ligne — et le reste quand vous en avez besoin.',
        publisher: { '@id': `${base}/#organization` },
        blogPost: posts.map((p) => ({
          '@type': 'BlogPosting',
          headline: p.title,
          datePublished: p.date,
          url: `${base}/blog/#${p.id}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${blogUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: `${base}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: blogUrl,
          },
        ],
      },
    ],
  };
  return `<script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n</script>`;
}

function replaceRegion(html, startMarker, endMarker, newInner) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`generate-blog: marqueurs introuvables ou invalides: ${startMarker}`);
  }
  return html.slice(0, start + startMarker.length) + '\n' + newInner + '\n' + html.slice(end);
}

let raw;
try {
  raw = readFileSync(dataPath, 'utf8');
} catch (e) {
  console.warn('generate-blog: pas de blog-posts.json, skip');
  process.exit(0);
}

const data = JSON.parse(raw);
const siteBaseUrl = data.siteBaseUrl || 'https://invooffice.github.io/INVOOFFICE';
const posts = sortPosts(data.posts || []);
const waPhoneDigits = normalizeWhatsappPhone(data.whatsappPhone);
const waLeadText =
  data.whatsappArticleMessage != null && String(data.whatsappArticleMessage).trim() !== ''
    ? String(data.whatsappArticleMessage).trim()
    : 'Bonjour, je veux en savoir plus';
const waAppendTitle = data.whatsappArticleAppendTitle !== false;

let indexHtml = readFileSync(indexPath, 'utf8');
indexHtml = replaceRegion(
  indexHtml,
  '<!-- BLOG_GRID_AUTO_START -->',
  '<!-- BLOG_GRID_AUTO_END -->',
  buildBlogGridHtml(posts)
);
writeFileSync(indexPath, indexHtml, 'utf8');

let blogHtml = readFileSync(blogPath, 'utf8');
blogHtml = replaceRegion(
  blogHtml,
  '<!-- BLOG_ARTICLES_AUTO_START -->',
  '<!-- BLOG_ARTICLES_AUTO_END -->',
  buildBlogArticlesHtml(posts, waPhoneDigits, waLeadText, waAppendTitle)
);

const jsonLdStart = '<!-- BLOG_JSONLD_AUTO_START -->';
const jsonLdEnd = '<!-- BLOG_JSONLD_AUTO_END -->';
if (blogHtml.includes(jsonLdStart) && blogHtml.includes(jsonLdEnd)) {
  blogHtml = replaceRegion(blogHtml, jsonLdStart, jsonLdEnd, buildJsonLd(siteBaseUrl, posts));
}

writeFileSync(blogPath, blogHtml, 'utf8');
console.log('generate-blog:', posts.length, 'article(s), siteBaseUrl=', siteBaseUrl);
