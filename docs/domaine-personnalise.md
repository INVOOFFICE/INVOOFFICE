# Passage futur : domaine personnalisé (ex. www.invooffice.com)

Tant que le site vit sur **GitHub Pages** (`https://invooffice.github.io/INVOOFFICE/`), une seule URL « officielle » doit apparaître partout (canonical, JSON-LD, sitemap, `siteBaseUrl` dans `data/blog-posts.json`).

Quand vous achèterez un domaine, l’objectif est d’éviter **deux sites jumeaux** dans Google (perte d’autorité). Voici l’ordre recommandé.

## 1. GitHub Pages + DNS

1. Acheter le domaine (OVH, Gandi, Cloudflare, etc.).
2. Dans le dépôt GitHub : **Settings → Pages → Custom domain** → saisir `www.invooffice.com` (ou la variante choisie, **une seule** version canonique : en général `https://www.invooffice.com`).
3. Chez le registrar / DNS : enregistrements indiqués par [la doc GitHub Pages (domaine personnalisé)](https://docs.github.com/fr/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).
4. Cocher **Enforce HTTPS** une fois le certificat actif.

## 2. Une seule URL « source de vérité » dans le projet

À mettre à jour **le même jour** que le DNS :

| Élément | Action |
|--------|--------|
| **Apps Script** | Propriété `SITE_BASE_URL` = `https://www.invooffice.com` (sans slash final, ou avec — le script normalise). |
| **`data/blog-posts.json`** | Champ `siteBaseUrl` aligné (prochaine sync depuis la feuille utilisera `SITE_BASE_URL`). |
| Rebuild | Un push déclenche `npm run build` : canonical, Open Graph, **sitemap.xml** et **robots.txt** (ligne `Sitemap:`) sont régénérés via `scripts/generate-sitemap.mjs` à partir de `data/blog-posts.json`. |

Référence code : `DEFAULT_SITE_BASE_URL` dans `BlogSyncToGitHub.gs` peut servir de défaut pour les clones ; en production, **privilégiez la propriété `SITE_BASE_URL`**.

## 3. Google Search Console

1. Ajouter une propriété **Préfixe d’URL** pour `https://www.invooffice.com/` et la vérifier.
2. Garder (temporairement) la propriété `https://invooffice.github.io/INVOOFFICE/` pour la redirection « logique » côté Google.
3. Utiliser l’outil **Changement d’adresse** (ou équivalent dans l’interface actuelle) **quand les deux propriétés sont vérifiées**, pour indiquer la migration vers le nouveau domaine.
4. Mettre à jour le compte de service **Indexing** : droits **Propriétaire** sur la **nouvelle** propriété (sinon 403 « ownership »).

## 4. Ancienne URL `github.io`

- Idéal : **redirection 301** de `https://invooffice.github.io/INVOOFFICE/*` vers `https://www.invooffice.com/...`. GitHub Pages seul ne propose pas toujours une 301 automatique sur l’ancienne URL de projet ; options possibles plus tard :
  - **Cloudflare** (gratuit) devant le domaine + règles de redirect si vous exposez l’ancienne URL ailleurs, ou
  - s’appuyer sur **canonical 100 % vers le nouveau domaine** + **Changement d’adresse** dans la Search Console.
- Tant que l’ancien site reste en ligne sans canonical unique, Google peut indexer les deux : d’où l’intérêt de basculer **vite** les balises canonical + `siteBaseUrl` après la bascule DNS.

## 5. Résumé

- **Maintenant** : rien d’obligatoire ; gardez une seule URL cohérente (`github.io/…/INVOOFFICE/`).
- **Le jour J** : DNS → domaine dans GitHub → `SITE_BASE_URL` + `siteBaseUrl` → rebuild → Search Console + (si possible) 301 ou changement d’adresse.
