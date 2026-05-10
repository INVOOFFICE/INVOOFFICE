// ============================================================
// INVOO OFFICE — Build Blog Pages
// scripts/build-blog-pages.mjs
// Génère : blogs/<slug>/index.html + sitemap.xml + llms.txt + robots.txt
// ============================================================

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const SITE_URL  = 'https://invooffice.com';

// CTA WhatsApp (fin de chaque article)
const CTA_WA = 'https://wa.me/212630230803?text=Bonjour%20INVOO%20OFFICE%20%F0%9F%91%8B%20Je%20souhaite%20essayer%20votre%20solution%20de%20facturation.';

const CORE_INTERNAL_LINKS = [
  { href: '../../#fonctionnalites', anchor: 'logiciel de facturation Maroc' },
  { href: '../../#dashboard', anchor: 'tableau de bord TVA et paiements' },
  { href: '../../#faq', anchor: 'FAQ facturation DGI Maroc' },
  { href: '../../blogs/', anchor: 'guides facturation Maroc' },
];

const ENTITY_TOPICS = [
  'INVOO OFFICE',
  'facturation Maroc',
  'facture electronique Maroc',
  'DGI Maroc',
  'TVA Maroc',
  'ICE',
  'IF',
  'patente',
  'CNSS',
  'SARL',
  'auto entrepreneur Maroc',
  'PME Maroc',
  'logiciel devis facture',
  'gestion commerciale Maroc',
  'comptabilite Maroc',
];

// ============================================================
// LECTURE DE blogs.json
// ============================================================
const blogsJsonPath = path.join(ROOT, 'blogs.json');
if (!fs.existsSync(blogsJsonPath)) {
  console.log('blogs.json introuvable — rien à générer.');
  process.exit(0);
}

const articles = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf8'));
const published = articles.filter(a => a.status === 'published' && a.slug);

console.log(`📝 ${published.length} article(s) à générer...`);

// ============================================================
// GÉNÉRATION DES PAGES INDIVIDUELLES
// ============================================================
for (const article of published) {
  const dir = path.join(ROOT, 'blogs', article.slug);
  fs.mkdirSync(dir, { recursive: true });

  const html = buildArticlePage(article, published);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  console.log(`  ✅ blogs/${article.slug}/index.html`);
}

// ============================================================
// GÉNÉRATION DE sitemap.xml
// ============================================================
const sitemapUrls = [
  { loc: `${SITE_URL}/`,        priority: '1.0', changefreq: 'weekly'  },
  { loc: `${SITE_URL}/blogs/`,  priority: '0.9', changefreq: 'daily'   },
  ...published.map(a => ({
    loc:        `${SITE_URL}/blogs/${a.slug}/`,
    priority:   '0.8',
    changefreq: 'monthly',
    lastmod:    a.published_at ? a.published_at.substring(0, 10) : '',
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
console.log('  ✅ sitemap.xml');

// ============================================================
// GÉNÉRATION DE llms.txt (pour les LLM crawlers)
// ============================================================
const llms = `# INVOO OFFICE - Blog et ressources
# Solution marocaine de facturation, devis et gestion commerciale
# ${SITE_URL}

## A propos
INVOO OFFICE est un logiciel marocain de devis, factures TVA et gestion commerciale,
concu pour les PME, TPE, SARL, freelances, commercants et auto-entrepreneurs au Maroc.

## Entite
INVOO OFFICE est un SaaS de facturation pour les entreprises marocaines. La plateforme
aide a creer des devis, factures, documents commerciaux et exports utiles au suivi
comptable.

## Domaines d'expertise
- Facturation au Maroc
- Devis et factures pour PME, TPE, SARL et auto-entrepreneurs
- TVA marocaine sur factures : HT, TVA, TTC
- Conformite DGI et facture normalisee
- Identifiants d'entreprise : ICE, IF, patente, CNSS
- Gestion commerciale : clients, paiements, documents et suivi
- Workflows comptables et preparation des exports

## Pages de reference recommandees
- ${SITE_URL}/facturation-maroc/
- ${SITE_URL}/tva-maroc/
- ${SITE_URL}/dgi-maroc-facturation/
- ${SITE_URL}/auto-entrepreneur-maroc-facturation/
- ${SITE_URL}/pme-maroc-gestion-facturation/
- ${SITE_URL}/gestion-commerciale-maroc/
- ${SITE_URL}/logiciel-devis-facture-maroc/
- ${SITE_URL}/facture-electronique-maroc/
- ${SITE_URL}/comptabilite-maroc-factures/

## Articles de blog disponibles
${published.map(a =>
  `- [${a.title}](${SITE_URL}/blogs/${a.slug}/)\n  ${a.meta_description || a.description || ''}`
).join('\n\n')}
`;

fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms, 'utf8');
console.log('  ✅ llms.txt');

// ============================================================
// GÉNÉRATION DE robots.txt
// ============================================================
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots, 'utf8');
console.log('  ✅ robots.txt');

console.log('\n🎉 Build terminé avec succès !');

// ============================================================
// TEMPLATE HTML — Page article individuelle
// ============================================================
function buildArticlePage(article, allArticles) {
  const dateFormatted = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-MA', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : '';

  // 3 articles récents (hors article courant)
  const related = getRelatedArticles(article, allArticles, 4);

  const keywords = typeof article.keywords === 'string'
    ? article.keywords
    : (article.keywords || []).join(', ');

  const enrichedContent = buildArticleContent(article, related);
  const faqs = extractFaqs(enrichedContent);

  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(article.seo_title || article.title)} — INVOO OFFICE</title>
  <meta name="description" content="${escAttr(article.meta_description || article.description)}">
  <meta name="keywords" content="${escAttr(keywords)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_URL}/blogs/${article.slug}/">

  <!-- Open Graph -->
  <meta property="og:type"        content="article">
  <meta property="og:title"       content="${escAttr(article.seo_title || article.title)}">
  <meta property="og:description" content="${escAttr(article.meta_description || article.description)}">
  <meta property="og:url"         content="${SITE_URL}/blogs/${article.slug}/">
  ${article.image_url ? `<meta property="og:image" content="${escAttr(article.image_url)}">` : ''}
  <meta property="og:site_name"   content="INVOO OFFICE">
  <meta property="article:published_time" content="${article.published_at || ''}">

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="${article.image_url ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title"       content="${escAttr(article.seo_title || article.title)}">
  <meta name="twitter:description" content="${escAttr(article.meta_description || article.description)}">
  ${article.image_url ? `<meta name="twitter:image" content="${escAttr(article.image_url)}">` : ''}

  <!-- Schema.org BlogPosting + Breadcrumb -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${escJson(article.title)}",
    "description": "${escJson(article.meta_description || article.description)}",
    "datePublished": "${article.published_at || ''}",
    "author": {
      "@type": "Organization",
      "name": "INVOO OFFICE",
      "knowsAbout": ["DGI Maroc", "TVA Maroc", "ICE", "IF", "facturation Maroc", "gestion commerciale Maroc"]
    },
    "publisher": {
      "@type": "Organization",
      "name": "INVOO OFFICE",
      "url": "${SITE_URL}"
    },
    "articleSection": "${escJson(article.category || 'Guides facturation Maroc')}",
    "keywords": "${escJson(keywords)}",
    "inLanguage": "fr-MA",
    "mainEntityOfPage": "${SITE_URL}/blogs/${article.slug}/",
    "about": ${JSON.stringify(ENTITY_TOPICS)},
    "url": "${SITE_URL}/blogs/${article.slug}/"
    ${article.image_url ? `, "image": "${escJson(article.image_url)}"` : ''}
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "${SITE_URL}/" },
      { "@type": "ListItem", "position": 2, "name": "Guides facturation Maroc", "item": "${SITE_URL}/blogs/" },
      { "@type": "ListItem", "position": 3, "name": "${escJson(article.title)}", "item": "${SITE_URL}/blogs/${article.slug}/" }
    ]
  }
  </script>
${faqs.length ? buildFaqSchema(faqs) : ''}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <!-- CSS du site principal -->
  <link rel="stylesheet" href="../../assets/css/variables.css">
  <link rel="stylesheet" href="../../assets/css/base.css">
  <link rel="stylesheet" href="../../assets/css/animations.css">
  <link rel="stylesheet" href="../../assets/css/layout.css">
  <link rel="stylesheet" href="../../assets/css/buttons.css">

  <style>
    /* ── Article page styles ── */
    .article-hero {
      padding: 8rem 2rem 4rem;
      max-width: 860px;
      margin: 0 auto;
    }
    .article-category {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 1rem;
      background: rgba(26,107,60,0.1);
      border: 1px solid rgba(26,107,60,0.2);
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--primary-light);
      margin-bottom: 1.5rem;
      text-decoration: none;
    }
    .article-title {
      font-size: clamp(1.75rem, 5vw, 3rem);
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .article-meta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
    }
    .article-meta-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .article-meta-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
    }
    .article-cover {
      width: 100%;
      border-radius: var(--radius-xl);
      border: 1px solid var(--dark-border);
      box-shadow: 0 25px 80px rgba(0,0,0,0.5);
      margin-bottom: 3rem;
      aspect-ratio: 16/9;
      object-fit: cover;
    }
    .article-body {
      max-width: 860px;
      margin: 0 auto;
      padding: 0 2rem 4rem;
      font-size: 1.0625rem;
      line-height: 1.8;
      color: rgba(255,255,255,0.85);
    }
    .article-body h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 2.5rem 0 1rem;
      letter-spacing: -0.02em;
    }
    .article-body h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 2rem 0 0.75rem;
    }
    .article-body p  { margin-bottom: 1.25rem; }
    .article-body ul,
    .article-body ol { margin: 1rem 0 1.25rem 1.5rem; }
    .article-body li { margin-bottom: 0.5rem; }
    .article-body strong { color: var(--text-primary); font-weight: 600; }
    .article-body a  { color: var(--primary-light); text-decoration: underline; }
    .article-body blockquote {
      border-left: 3px solid var(--primary);
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      background: rgba(26,107,60,0.05);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* ── CTA Box ── */
    .cta-box {
      background: linear-gradient(135deg, rgba(26,107,60,0.1) 0%, rgba(26,107,60,0.05) 100%);
      border: 1px solid rgba(26,107,60,0.25);
      border-radius: var(--radius-xl);
      padding: 3rem 2rem;
      text-align: center;
      margin: 4rem auto;
      max-width: 860px;
      position: relative;
      overflow: hidden;
    }
    .cta-box::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(26,107,60,0.08) 0%, transparent 60%);
    }
    .cta-box-title {
      font-size: clamp(1.25rem, 3vw, 1.75rem);
      font-weight: 800;
      margin-bottom: 0.75rem;
      position: relative;
    }
    .cta-box-sub {
      color: var(--text-secondary);
      margin-bottom: 2rem;
      position: relative;
      font-size: 1rem;
    }
    .cta-box-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      position: relative;
    }

    /* ── Related articles ── */
    .related-section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 2rem 6rem;
    }
    .related-title {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 2rem;
      letter-spacing: -0.02em;
    }
    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .related-card {
      background: var(--dark-card);
      border: 1px solid var(--dark-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
      display: block;
    }
    .related-card:hover {
      transform: translateY(-4px);
      border-color: rgba(26,107,60,0.3);
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    .related-card img {
      width: 100%;
      height: 160px;
      object-fit: cover;
    }
    .related-card-body { padding: 1.25rem; }
    .related-card-cat {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--primary-light);
      margin-bottom: 0.5rem;
    }
    .related-card-title {
      font-size: 0.9375rem;
      font-weight: 700;
      line-height: 1.4;
      color: var(--text-primary);
    }

    @media (max-width: 768px) {
      .article-hero  { padding: 6rem 1.25rem 3rem; }
      .article-body  { padding: 0 1.25rem 3rem; }
      .cta-box       { margin: 3rem 1.25rem; }
      .related-section { padding: 0 1.25rem 4rem; }
    }
  </style>
</head>
<body>

  <div class="hero-bg"></div>
  <div class="noise"></div>

  <!-- NAVBAR -->
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="../../" class="nav-logo">
        <div class="nav-logo-icon">IN</div>
        INVOO OFFICE
      </a>
      <ul class="nav-links">
        <li><a href="../../#fonctionnalites">Fonctionnalités</a></li>
        <li><a href="../../#dashboard">Dashboard</a></li>
        <li><a href="../../#tarifs">Tarifs</a></li>
        <li><a href="../../blogs/">Blog</a></li>
      </ul>
      <div class="nav-cta">
        <a href="${CTA_WA}" target="_blank" rel="noopener" class="btn btn-primary">Essai gratuit</a>
      </div>
    </div>
  </nav>

  <!-- ARTICLE HERO -->
  <div class="article-hero">
    <a href="../../blogs/" class="article-category">← ${escHtml(article.category || 'Blog')}</a>
    <h1 class="article-title">${escHtml(article.title)}</h1>
    <div class="article-meta">
      <div class="article-meta-author">
        <div class="article-meta-avatar">IN</div>
        <span>INVOO OFFICE</span>
      </div>
      <span>📅 ${dateFormatted}</span>
      ${article.keywords ? `<span>🏷️ ${escHtml(keywords.split(',').slice(0,3).join(', '))}</span>` : ''}
    </div>
    ${article.image_url ? `<img src="${escAttr(article.image_url)}" alt="${escAttr(article.title)}" class="article-cover" loading="eager">` : ''}
  </div>

  <!-- CONTENU DE L'ARTICLE -->
  <div class="article-body">
    ${enrichedContent}
  </div>

  <!-- CTA BOX -->
  <div class="cta-box" style="margin-left: 2rem; margin-right: 2rem;">
    <div class="cta-box-title">Prêt à moderniser votre facturation&nbsp;?</div>
    <p class="cta-box-sub">Rejoignez les entreprises marocaines qui ont déjà adopté INVOO OFFICE.</p>
    <div class="cta-box-buttons">
      <a href="${CTA_WA}" target="_blank" rel="noopener" class="btn btn-primary btn-lg">
        💬 Commencer gratuitement
      </a>
      <a href="../../#fonctionnalites" class="btn btn-secondary btn-lg">
        Voir les fonctionnalités
      </a>
    </div>
  </div>

  <!-- ARTICLES LIÉS -->
  ${related.length > 0 ? `
  <div class="related-section">
    <h2 class="related-title">Articles similaires</h2>
    <div class="related-grid">
      ${related.map(r => `
      <a href="../../blogs/${r.slug}/" class="related-card">
        ${r.image_url ? `<img src="${escAttr(r.image_url)}" alt="${escAttr(r.title)}" loading="lazy">` : ''}
        <div class="related-card-body">
          <div class="related-card-cat">${escHtml(r.category || 'Blog')}</div>
          <div class="related-card-title">${escHtml(r.title)}</div>
        </div>
      </a>`).join('')}
    </div>
  </div>` : ''}

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="../../" class="footer-logo">
          <div class="footer-logo-icon">IN</div>
          INVOO OFFICE
        </a>
        <p class="footer-desc">La solution de facturation intelligente conforme DGI Maroc. PWA ultra rapide 100% hors ligne.</p>
      </div>
      <div class="footer-column">
        <h4>Produit</h4>
        <ul class="footer-links">
          <li><a href="../../#fonctionnalites">Fonctionnalités</a></li>
          <li><a href="../../#dashboard">Dashboard</a></li>
          <li><a href="../../#tarifs">Tarification</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h4>Blog</h4>
        <ul class="footer-links">
          <li><a href="../../blogs/">Tous les articles</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h4>Support</h4>
        <ul class="footer-links">
          <li><a href="${CTA_WA}" target="_blank" rel="noopener">WhatsApp</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copyright">© ${new Date().getFullYear()} INVOO OFFICE. Tous droits réservés. Conforme DGI Maroc.</div>
    </div>
  </footer>

  <script>
    // Navbar scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  </script>

</body>
</html>`;
}

// ============================================================
// HELPERS — Échappement HTML/attributs/JSON
// ============================================================
function buildArticleContent(article, related) {
  const base = String(article.content_html || `<p>${escHtml(article.description || '')}</p>`).trim();
  const normalized = stripUnsafeArticleTags(base);
  return `${normalized}
${buildInternalLinksBlock(related)}`;
}

function stripUnsafeArticleTags(html) {
  return String(html || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<\/?(?:html|head|body|script|style|iframe|object|embed|link|meta|title|h1)[^>]*>/gi, '')
    .trim();
}

function buildInternalLinksBlock(related) {
  const relatedLinks = related
    .slice(0, 4)
    .map(a => `<li><a href="../../blogs/${escAttr(a.slug)}/">${escHtml(a.title)}</a></li>`)
    .join('');

  const productLinks = CORE_INTERNAL_LINKS
    .map(link => `<li><a href="${link.href}">${link.anchor}</a></li>`)
    .join('');

  return `<h2>Guides et ressources associes</h2>
<p>Pour approfondir votre organisation administrative, voici des ressources utiles autour de la facturation Maroc, de la TVA Maroc, de la DGI Maroc et du logiciel devis facture.</p>
<h3>Ressources INVOO OFFICE</h3>
<ul>${productLinks}</ul>
${relatedLinks ? `<h3>Articles lies</h3><ul>${relatedLinks}</ul>` : ''}`;
}

function getRelatedArticles(article, allArticles, limit) {
  return allArticles
    .filter(a => a.slug && a.slug !== article.slug)
    .map(a => ({ article: a, score: relationScore(article, a) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.article.published_at || 0) - new Date(a.article.published_at || 0);
    })
    .slice(0, limit)
    .map(item => item.article);
}

function relationScore(a, b) {
  const aText = tokenize(`${a.title} ${a.category} ${a.keywords} ${a.description}`);
  const bText = tokenize(`${b.title} ${b.category} ${b.keywords} ${b.description}`);
  let score = 0;

  if (String(a.category || '').toLowerCase() === String(b.category || '').toLowerCase()) {
    score += 8;
  }

  for (const token of aText) {
    if (bText.has(token)) score += 1;
  }

  return score;
}

function tokenize(text) {
  const stop = new Set(['avec', 'pour', 'dans', 'sans', 'une', 'des', 'les', 'sur', 'que', 'qui', 'comment', 'maroc']);
  return new Set(
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stop.has(w))
  );
}

function extractFaqs(html) {
  const source = String(html || '');
  const faqStart = source.search(/<h2[^>]*>\s*FAQ\s*<\/h2>/i);
  if (faqStart < 0) return [];

  const faqSection = source.slice(faqStart).split(/<h2[^>]*>/i).slice(0, 2).join('<h2>');
  const matches = [...faqSection.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)];

  return matches.slice(0, 6).map(match => ({
    question: cleanText(match[1]),
    answer: cleanText(match[2]),
  })).filter(item => item.question && item.answer);
}

function buildFaqSchema(faqs) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
  </script>`;
}

function cleanText(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escHtml(str)  { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(str)  { return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }
function escJson(str)  { return String(str || '').replace(/\\/g,'\\\\').replace(/"/g,'\\"'); }
