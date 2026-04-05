/**
 * INVOOffice — Synchronisation Google Sheets → GitHub (data/blog-posts.json)
 *
 * DÉPLOIEMENT :
 * 1. Ajouter ce fichier + Setup.html dans le même projet Apps Script (même projet que la feuille).
 * 2. Feuille des articles : onglet « Articles » s’il existe, sinon la feuille active (celle que vous regardez).
 *    Si la ligne 1 est vide, les en-têtes id | title | date | tag | excerpt | body | published sont créés automatiquement.
 * 3. Menu « Blog GitHub » → « Configurer les colonnes… » pour associer chaque champ à une colonne.
 *    Optionnel : propriété script BLOG_SHEET_NAME = nom exact d’un onglet à utiliser à la place.
 * 4. GitHub : PAT — Propriétés du script : GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, SITE_BASE_URL (optionnel).
 *    Domaine perso plus tard (ex. www.invooffice.com) : mettre SITE_BASE_URL sur l’URL définitive + voir docs/domaine-personnalise.md dans le dépôt (Search Console, canonical).
 * 5. Indexation (optionnel) : après un push réussi, envoi d’une notification « URL_UPDATED » via l’API Google Indexing
 *    (compte de service). Sync manuelle : une fois après le commit. Publication planifiée (publishScheduledArticlesDaily) :
 *    une fois après le batch du jour (tous les articles publiés dans la même exécution), pas un appel par article.
 *    Propriétés du script : GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY (clé PEM du JSON Cloud, avec \n pour les retours ligne).
 *    — Cloud : activer « Web Search Indexing API » sur le projet ; créer une clé compte de service.
 *    — Search Console : ajouter ce compte comme propriétaire (ou utilisateur complet) sur la propriété du site.
 *    — Rappel Google : l’API Indexing est officiellement réservée aux pages avec schémas JobPosting ou BroadcastEvent ;
 *      pour un blog générique, Google peut refuser la notification (403) ; la demande reste sans effet sur le push GitHub.
 * 6. Synchroniser vers GitHub : pousse data/blog-posts.json ; GitHub Actions exécute npm run build et publie Pages.
 *
 * 7. Twitter / X (optionnel) : après chaque article réellement publié (publication planifiée ou sync avec
 *    lignes « published » vides devenues tamponnées), envoi d’un tweet avec titre + lien vers /blog/#id.
 *    Propriétés du script (OAuth 1.0a — contexte utilisateur, clés depuis le portail développeur X) :
 *    TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET.
 *    Désactiver : TWITTER_DISABLE = 1. Menu « Tester publication Twitter / X » pour valider sans GitHub.
 *    Compte X doit avoir accès API « tweet.write » (niveau projet selon les règles X).
 *
 * SÉCURITÉ : ne commitez jamais le token GitHub dans ce fichier (dépôt public = fuite).
 * Seule la propriété script GITHUB_TOKEN est obligatoire ; owner/repo/branche/site ont des défauts ci-dessous.
 *
 * Colonne « published » : laisser vide pour les nouveaux articles ; après envoi réussi, horodatage « Publié … ».
 *
 * Publication planifiée (jusqu’à 3 articles / jour) :
 * — Menu « Installer déclencheur quotidien (9 h) » : chaque jour vers 9 h (fuseau du projet),
 *   le script publie jusqu’à 3 lignes (de haut en bas) avec « published » vide — une fusion GitHub par article.
 * — Après le batch (1 à 3 articles), une seule notification Indexing API (URL_UPDATED) est envoyée pour la home + /blog/
 *   si GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY sont configurés — liée explicitement au même flux que publishScheduledArticlesDaily.
 * — Fusionne avec data/blog-posts.json sur GitHub (n’efface pas les articles déjà en ligne).
 * — « Tester jusqu’à 3 articles » ou « Tester 1 article » pour essayer sans attendre le déclencheur.
 * — « Supprimer déclencheur publication planifiée » supprime les déclencheurs liés (y compris anciens hebdo).
 *
 * Rapport (onglet feuille) : une ligne est ajoutée après chaque sync, publication ou test d’indexation.
 * Onglet par défaut « Rapport automatisation » ; propriété optionnelle BLOG_LOG_SHEET_NAME = autre nom.
 * Désactiver les logs : BLOG_LOG_DISABLE = 1 dans les propriétés du script.
 */

/** Défauts projet INVOOFFICE (modifiables). Les propriétés du script les remplacent si définies. */
var DEFAULT_GITHUB_OWNER = 'invooffice';
var DEFAULT_GITHUB_REPO = 'INVOOFFICE';
var DEFAULT_GITHUB_BRANCH = 'main';
var DEFAULT_SITE_BASE_URL = 'https://invooffice.github.io/INVOOFFICE';

/** Nombre max d’articles publiés à chaque passage du déclencheur quotidien (file = lignes « published » vides). */
var SCHEDULED_PUBLISH_PER_RUN = 3;

var ARTICLE_SHEET_NAME = 'Articles';
/** En-têtes créés automatiquement en ligne 1 si la feuille est vide */
var DEFAULT_HEADER_ROW = ['id', 'title', 'date', 'tag', 'excerpt', 'body', 'published'];
var JSON_PATH = 'data/blog-posts.json';
/** Propriété : JSON des numéros de colonne 1-based { "id": 1, "title": 2, …, "published"?: 7 } */
var PROP_COLUMN_MAP = 'BLOG_COLUMN_MAP';

/** Onglet des lignes de rapport (créé automatiquement si absent). Surcharge : BLOG_LOG_SHEET_NAME */
var DEFAULT_LOG_SHEET_NAME = 'Rapport automatisation';
var LOG_HEADER_ROW = ['Date / heure', 'Source', 'Statut', 'Résumé', 'Détail'];

var SETUP_FIELDS = [
  { key: 'id', label: 'Identifiant (slug URL)', required: true },
  { key: 'title', label: 'Titre', required: true },
  { key: 'date', label: 'Date (AAAA-MM-JJ ou date Sheets)', required: true },
  { key: 'tag', label: 'Tag / catégorie', required: true },
  { key: 'excerpt', label: 'Extrait (carte accueil)', required: true },
  { key: 'body', label: 'Corps (texte ou HTML commençant par <p)', required: true },
  { key: 'published', label: 'Publié (TRUE/oui/1 — optionnel)', required: false },
];

/**
 * Token : uniquement via propriété GITHUB_TOKEN (jamais en dur dans le code).
 * Owner / repo / branche / site : défauts INVOOFFICE ci-dessus, surchargeables par propriétés du script.
 */
function getProps_() {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty('GITHUB_TOKEN');
  var owner = p.getProperty('GITHUB_OWNER') || DEFAULT_GITHUB_OWNER;
  var repo = p.getProperty('GITHUB_REPO') || DEFAULT_GITHUB_REPO;
  var branch = p.getProperty('GITHUB_BRANCH') || DEFAULT_GITHUB_BRANCH;
  var siteBase = p.getProperty('SITE_BASE_URL') || DEFAULT_SITE_BASE_URL;
  siteBase = String(siteBase).replace(/\/+$/, '');
  if (!token) {
    throw new Error(
      'Propriété manquante : GITHUB_TOKEN. Paramètres du projet → Propriétés du script → ajoutez la clé GITHUB_TOKEN avec votre token (github_pat_…). Ne collez pas le token dans getProperty(\'…\') : seul le nom GITHUB_TOKEN.'
    );
  }
  return { token: token, owner: owner, repo: repo, branch: branch, siteBase: siteBase };
}

function getLogSheetName_() {
  var forced = PropertiesService.getScriptProperties().getProperty('BLOG_LOG_SHEET_NAME');
  return forced ? String(forced).trim() : DEFAULT_LOG_SHEET_NAME;
}

/**
 * Ajoute une ligne de suivi sur l’onglet rapport (ne bloque jamais l’automatisation en cas d’erreur interne).
 * @param {string} source ex. « Sync GitHub (menu) », « Publication hebdo », « Test indexation »
 * @param {string} statut OK | Échec | Ignoré | Partiel
 * @param {string} resume courte phrase
 * @param {string} [detail] URL commit, message d’erreur, indexation…
 */
function appendAutomationLog_(source, statut, resume, detail) {
  try {
    if (PropertiesService.getScriptProperties().getProperty('BLOG_LOG_DISABLE') === '1') {
      return;
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return;
    }
    var name = getLogSheetName_();
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, LOG_HEADER_ROW.length).setValues([LOG_HEADER_ROW]);
      sh.setFrozenRows(1);
    } else {
      var h = sh.getRange(1, 1, 1, LOG_HEADER_ROW.length).getValues()[0];
      if (String(h[0] || '').trim() === '') {
        sh.getRange(1, 1, 1, LOG_HEADER_ROW.length).setValues([LOG_HEADER_ROW]);
        sh.setFrozenRows(1);
      }
    }
    var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var d = detail == null ? '' : String(detail);
    if (d.length > 4500) {
      d = d.slice(0, 4497) + '…';
    }
    sh.appendRow([stamp, String(source || ''), String(statut || ''), String(resume || ''), d]);
  } catch (e) {
    Logger.log('appendAutomationLog_: ' + e);
  }
}

/** Ouvre et affiche l’onglet rapport (menu). */
function openAutomationLogSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = getLogSheetName_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    SpreadsheetApp.getUi().alert(
      'L’onglet « ' +
        name +
        ' » n’existe pas encore. Il sera créé au premier sync / publication / test d’indexation réussi.'
    );
    return;
  }
  ss.setActiveSheet(sh);
}

/** URLs à signaler après publication (page d’accueil + listing blog, régénérées par le build). */
function buildBlogRefreshIndexingUrls_(siteBase) {
  var base = String(siteBase).replace(/\/+$/, '');
  return [base + '/', base + '/blog/'];
}

/** Lit GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY ; null si incomplet. */
function getIndexingServiceAccountCredentials_() {
  var p = PropertiesService.getScriptProperties();
  var email = p.getProperty('GSC_CLIENT_EMAIL');
  var key = p.getProperty('GSC_PRIVATE_KEY');
  if (!email || !key) return null;
  key = String(key).replace(/\\n/g, '\n').trim();
  return { client_email: String(email).trim(), private_key: key };
}

function base64UrlRemovePadding_(s) {
  return String(s).replace(/=+$/, '');
}

function base64UrlEncodeBytes_(bytes) {
  return base64UrlRemovePadding_(Utilities.base64EncodeWebSafe(bytes));
}

function createServiceAccountJwt_(clientEmail, privateKeyPem, scope) {
  var now = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var claim = {
    iss: clientEmail,
    scope: scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  var encHeader = base64UrlEncodeBytes_(Utilities.newBlob(JSON.stringify(header)).getBytes());
  var encClaim = base64UrlEncodeBytes_(Utilities.newBlob(JSON.stringify(claim)).getBytes());
  var toSign = encHeader + '.' + encClaim;
  var sigBytes = Utilities.computeRsaSha256Signature(toSign, privateKeyPem);
  var encSig = base64UrlRemovePadding_(Utilities.base64EncodeWebSafe(sigBytes));
  return toSign + '.' + encSig;
}

function fetchServiceAccountAccessToken_(creds, scope) {
  var jwt = createServiceAccountJwt_(creds.client_email, creds.private_key, scope);
  var resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    muteHttpExceptions: true,
    payload:
      'grant_type=' +
      encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
      '&assertion=' +
      encodeURIComponent(jwt),
  });
  var code = resp.getResponseCode();
  var text = resp.getContentText();
  if (code !== 200) {
    throw new Error('OAuth2 service account HTTP ' + code + ' : ' + text.slice(0, 400));
  }
  var data = JSON.parse(text);
  if (!data.access_token) {
    throw new Error('OAuth2 : pas de access_token dans la réponse.');
  }
  return data.access_token;
}

function indexingPublishUrl_(absoluteUrl, accessToken) {
  var resp = UrlFetchApp.fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + accessToken },
    payload: JSON.stringify({ url: absoluteUrl, type: 'URL_UPDATED' }),
  });
  var code = resp.getResponseCode();
  var body = resp.getContentText();
  if (code >= 200 && code < 300) return { ok: true };
  return { ok: false, code: code, body: body };
}

/**
 * Envoie URL_UPDATED pour la home et /blog/ après mise en ligne du build.
 * @return {string|null} texte pour l’UI, ou null si clés GSC non configurées
 */
function notifyIndexingAfterPublish_(props) {
  var creds = getIndexingServiceAccountCredentials_();
  if (!creds) {
    Logger.log('Indexing API : propriétés GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY absentes — ignoré.');
    return null;
  }

  var token = fetchServiceAccountAccessToken_(creds, 'https://www.googleapis.com/auth/indexing');
  var urls = buildBlogRefreshIndexingUrls_(props.siteBase);
  var errors = [];
  for (var i = 0; i < urls.length; i++) {
    var r = indexingPublishUrl_(urls[i], token);
    if (!r.ok) errors.push(urls[i] + ' → HTTP ' + r.code + ' ' + r.body.slice(0, 200));
  }
  if (errors.length) {
    Logger.log('Indexing API erreur(s) : ' + errors.join(' | '));
    return "Indexation Google : échec partiel ou refus (voir exécutions / politique Google pour l'URL).";
  }
  Logger.log('Indexing API OK : ' + urls.join(', '));
  return 'Indexation Google : notification URL_UPDATED envoyée (' + urls.length + ' URLs).';
}

function safeNotifyIndexingAfterPublish_(props) {
  try {
    return notifyIndexingAfterPublish_(props);
  } catch (e) {
    Logger.log('Indexing API exception : ' + e);
    return 'Indexation Google : erreur — ' + (e.message || e);
  }
}

// --- Twitter / X (API v2, OAuth 1.0a User context) ---------------------------------

/** @return {Object|null} clés ou null si désactivé / incomplet */
function getTwitterCredentials_() {
  var p = PropertiesService.getScriptProperties();
  if (String(p.getProperty('TWITTER_DISABLE') || '').trim() === '1') return null;
  var apiKey = p.getProperty('TWITTER_API_KEY');
  var apiSecret = p.getProperty('TWITTER_API_SECRET');
  var accessToken = p.getProperty('TWITTER_ACCESS_TOKEN');
  var accessSecret = p.getProperty('TWITTER_ACCESS_TOKEN_SECRET');
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) return null;
  return {
    apiKey: String(apiKey).trim(),
    apiSecret: String(apiSecret).trim(),
    accessToken: String(accessToken).trim(),
    accessTokenSecret: String(accessSecret).trim(),
  };
}

function oauthPercentEncode_(s) {
  return encodeURIComponent(String(s))
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Publie un tweet (API v2). Lève une exception si échec HTTP.
 * @return {{ tweetId: string }}
 */
function postTwitterV2Tweet_(text, c) {
  var url = 'https://api.twitter.com/2/tweets';
  var bodyStr = JSON.stringify({ text: String(text) });
  var sha1Bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, bodyStr, Utilities.Charset.UTF_8);
  var bodyHash = Utilities.base64Encode(sha1Bytes);

  var oauth = {
    oauth_body_hash: bodyHash,
    oauth_consumer_key: c.apiKey,
    oauth_nonce: Utilities.getUuid().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: c.accessToken,
    oauth_version: '1.0',
  };

  var keys = Object.keys(oauth).sort();
  var paramParts = [];
  for (var i = 0; i < keys.length; i++) {
    paramParts.push(oauthPercentEncode_(keys[i]) + '=' + oauthPercentEncode_(oauth[keys[i]]));
  }
  var paramString = paramParts.join('&');
  var baseString = 'POST&' + oauthPercentEncode_(url) + '&' + oauthPercentEncode_(paramString);
  var signingKey = oauthPercentEncode_(c.apiSecret) + '&' + oauthPercentEncode_(c.accessTokenSecret);
  var sigBytes = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1, baseString, signingKey);
  var signature = Utilities.base64Encode(sigBytes);
  oauth.oauth_signature = signature;

  var hdrKeys = Object.keys(oauth).sort();
  var hdrParts = [];
  for (var j = 0; j < hdrKeys.length; j++) {
    var k = hdrKeys[j];
    hdrParts.push(oauthPercentEncode_(k) + '="' + oauthPercentEncode_(oauth[k]) + '"');
  }
  var authHeader = 'OAuth ' + hdrParts.join(', ');

  var resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { Authorization: authHeader },
    payload: bodyStr,
  });
  var code = resp.getResponseCode();
  var respText = resp.getContentText();
  if (code !== 200 && code !== 201) {
    throw new Error('Twitter HTTP ' + code + ' : ' + respText.slice(0, 600));
  }
  var parsed = JSON.parse(respText);
  var id = parsed.data && parsed.data.id ? String(parsed.data.id) : '';
  return { tweetId: id };
}

/** Titre + lien blog (max ~280 car. côté X — troncature titre si besoin). */
function buildTweetTextForArticle_(siteBase, post) {
  var base = String(siteBase).replace(/\/+$/, '');
  var url = base + '/blog/#' + String(post.id || '').replace(/#/g, '');
  var suffix = '\n' + url;
  var maxTotal = 275;
  var maxTitle = maxTotal - suffix.length;
  var title = String(post.title || 'Nouvel article').trim();
  if (title.length > maxTitle) {
    title = title.slice(0, Math.max(1, maxTitle - 1)) + '…';
  }
  return title + suffix;
}

/**
 * Tweet après publication d’un article (ne bloque jamais la synchro : journalise seulement).
 */
function safeNotifyTwitterNewArticle_(props, post) {
  try {
    var tw = getTwitterCredentials_();
    if (!tw) {
      Logger.log('Twitter / X : ignoré (propriétés absentes ou TWITTER_DISABLE=1).');
      return;
    }
    var text = buildTweetTextForArticle_(props.siteBase, post);
    var r = postTwitterV2Tweet_(text, tw);
    appendAutomationLog_(
      'Twitter (X)',
      'OK',
      'Tweet « ' + String(post.id || '') + ' »',
      r.tweetId ? 'id=' + r.tweetId : ''
    );
  } catch (e) {
    var msg = e.message || String(e);
    Logger.log('Twitter / X erreur : ' + msg);
    appendAutomationLog_(
      'Twitter (X)',
      'Échec',
      'Article « ' + String(post.id || '') + ' »',
      msg.slice(0, 4500)
    );
  }
}

/**
 * Test isolé : envoie URL_UPDATED pour SITE_BASE_URL (home + /blog/) sans toucher à GitHub.
 * Vérifiez aussi Exécutions → Journal après le test.
 */
function testGoogleIndexingOnly() {
  var props = getProps_();
  if (!getIndexingServiceAccountCredentials_()) {
    appendAutomationLog_(
      'Test indexation Google (menu)',
      'Ignoré',
      'Clés GSC non configurées',
      'Renseigner GSC_CLIENT_EMAIL et GSC_PRIVATE_KEY'
    );
    SpreadsheetApp.getUi().alert(
      'Propriétés du script manquantes : GSC_CLIENT_EMAIL et GSC_PRIVATE_KEY.\n\nParamètres du projet → Propriétés du script.'
    );
    return;
  }
  var note = safeNotifyIndexingAfterPublish_(props);
  var st = 'OK';
  if (note && (note.indexOf('échec') !== -1 || note.indexOf('erreur') !== -1 || note.indexOf('Erreur') !== -1)) {
    st = 'Partiel';
  }
  appendAutomationLog_('Test indexation Google (menu)', st, note || '—', props.siteBase + ' → home + /blog/');
  SpreadsheetApp.getUi().alert(note || 'Erreur inattendue : aucun retour.');
}

/**
 * Test tweet sans GitHub (vérifie OAuth 1.0a + droit tweet.write sur le compte X).
 */
function testTwitterPostMenu() {
  var tw = getTwitterCredentials_();
  if (!tw) {
    SpreadsheetApp.getUi().alert(
      'Twitter / X non configuré ou TWITTER_DISABLE=1.\n\n' +
        'Propriétés du script :\n' +
        '• TWITTER_API_KEY (Consumer Key)\n' +
        '• TWITTER_API_SECRET (Consumer Secret)\n' +
        '• TWITTER_ACCESS_TOKEN\n' +
        '• TWITTER_ACCESS_TOKEN_SECRET\n\n' +
        'Portail développeur X : projet avec OAuth 1.0a + permission lecture/écriture pour votre compte.'
    );
    return;
  }
  try {
    var r = postTwitterV2Tweet_('Test INVOOffice — publication blog depuis Google Sheets ✓', tw);
    appendAutomationLog_('Test Twitter (menu)', 'OK', 'Tweet test', r.tweetId ? 'id=' + r.tweetId : '');
    SpreadsheetApp.getUi().alert('Tweet publié sur X.\nID : ' + (r.tweetId || '—'));
  } catch (e) {
    appendAutomationLog_('Test Twitter (menu)', 'Échec', e.message || String(e), '');
    SpreadsheetApp.getUi().alert('Erreur Twitter / X :\n' + (e.message || e));
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Blog GitHub')
    .addItem('Configurer les colonnes…', 'setupBlogColumns')
    .addItem('Réinitialiser le mapping colonnes', 'resetBlogColumnMap')
    .addSeparator()
    .addItem('Synchroniser vers GitHub', 'syncBlogPostsToGitHub')
    .addItem('Tester indexation Google (sans GitHub)', 'testGoogleIndexingOnly')
    .addItem('Tester publication Twitter / X (sans GitHub)', 'testTwitterPostMenu')
    .addItem('Ouvrir le rapport automatisation…', 'openAutomationLogSheet')
    .addSeparator()
    .addItem('Installer déclencheur quotidien (9 h, jusqu’à 3 articles)', 'installDailyPublishTrigger')
    .addItem('Supprimer déclencheur publication planifiée', 'removeScheduledPublishTriggers')
    .addItem('Tester jusqu’à 3 articles (maintenant)', 'testPublishScheduledBatch')
    .addItem('Tester 1 seul article (maintenant)', 'testPublishOneArticle')
    .addToUi();
}

/**
 * Ouvre la boîte de dialogue : choix de la colonne pour chaque champ (basé sur la ligne 1).
 */
function setupBlogColumns() {
  var data = getSetupData_();
  var t = HtmlService.createTemplateFromFile('Setup');
  t.headers = data.headers;
  t.labels = data.labels;
  t.current = data.current;
  t.fields = SETUP_FIELDS;
  t.sheetName = data.sheetName;
  var html = t.evaluate().setWidth(520).setHeight(680);
  SpreadsheetApp.getUi().showModalDialog(html, 'Configuration des colonnes — Blog');
}

/**
 * Onglet cible : BLOG_SHEET_NAME (propriété script) sinon « Articles » sinon feuille active.
 */
function getArticleSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p = PropertiesService.getScriptProperties();
  var forced = p.getProperty('BLOG_SHEET_NAME');
  if (forced) {
    var byProp = ss.getSheetByName(forced);
    if (byProp) return byProp;
    throw new Error('Onglet introuvable : « ' + forced + ' » (propriété BLOG_SHEET_NAME).');
  }
  var byDefaultName = ss.getSheetByName(ARTICLE_SHEET_NAME);
  if (byDefaultName) return byDefaultName;
  return ss.getActiveSheet();
}

/**
 * Si la feuille n’a pas de ligne 1 utilisable, écrit les en-têtes par défaut et fige la ligne 1.
 */
function ensureHeaderRow_(sheet) {
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  var writeDefaults = false;

  if (lastCol < 1 || lastRow < 1) {
    writeDefaults = true;
  } else {
    var width = Math.max(lastCol, DEFAULT_HEADER_ROW.length);
    var r1 = sheet.getRange(1, 1, 1, width).getValues()[0];
    var allEmpty = true;
    for (var i = 0; i < r1.length; i++) {
      if (String(r1[i]).trim() !== '') {
        allEmpty = false;
        break;
      }
    }
    if (allEmpty) writeDefaults = true;
  }

  if (writeDefaults) {
    sheet.getRange(1, 1, 1, DEFAULT_HEADER_ROW.length).setValues([DEFAULT_HEADER_ROW]);
    sheet.setFrozenRows(1);
  }
}

function getSetupData_() {
  var sheet = getArticleSheet_();
  ensureHeaderRow_(sheet);

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    throw new Error('Impossible de lire les colonnes après initialisation. Réessayez.');
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var labels = [];
  for (var c = 1; c <= lastCol; c++) {
    labels.push(columnToLetter_(c));
  }
  var raw = PropertiesService.getScriptProperties().getProperty(PROP_COLUMN_MAP);
  var current = null;
  if (raw) {
    try {
      current = JSON.parse(raw);
    } catch (e) {
      current = null;
    }
  }
  return { headers: headers, labels: labels, current: current, sheetName: sheet.getName() };
}

/**
 * Appelé depuis Setup.html — enregistre le mapping (indices de colonne 1 = colonne A).
 */
function saveBlogColumnMap(map) {
  if (!map || typeof map !== 'object') {
    throw new Error('Données invalides.');
  }
  var cleaned = {};
  var required = ['id', 'title', 'date', 'tag', 'excerpt', 'body'];
  for (var i = 0; i < required.length; i++) {
    var k = required[i];
    var v = map[k];
    var n = v === '' || v === null || v === undefined ? NaN : parseInt(v, 10);
    if (isNaN(n) || n < 1) {
      throw new Error('Choisissez une colonne pour : « ' + k + ' ».');
    }
    cleaned[k] = n;
  }
  if (map.published !== '' && map.published !== null && map.published !== undefined) {
    var p = parseInt(map.published, 10);
    if (!isNaN(p) && p >= 1) {
      cleaned.published = p;
    }
  }
  PropertiesService.getScriptProperties().setProperty(PROP_COLUMN_MAP, JSON.stringify(cleaned));
}

function resetBlogColumnMap() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert(
    'Réinitialiser le mapping',
    'Les colonnes seront de nouveau détectées par les noms d’en-têtes (id, title, date, …). Continuer ?',
    ui.ButtonSet.YES_NO
  );
  if (r !== ui.Button.YES) return;
  PropertiesService.getScriptProperties().deleteProperty(PROP_COLUMN_MAP);
  ui.alert('Mapping supprimé. Utilisez les en-têtes par défaut ou rouvrez « Configurer les colonnes ».');
}

/**
 * Retourne les index 0-based par champ : { id, title, …, published? }
 */
function getColumnIndices_(values) {
  var numCols = values[0].length;
  var raw = PropertiesService.getScriptProperties().getProperty(PROP_COLUMN_MAP);
  if (raw) {
    var colMap;
    try {
      colMap = JSON.parse(raw);
    } catch (e) {
      colMap = null;
    }
    if (colMap) {
      function toZeroBased(name) {
        if (colMap[name] === undefined || colMap[name] === null) return undefined;
        var n = parseInt(colMap[name], 10);
        if (isNaN(n) || n < 1) return undefined;
        return n - 1;
      }
      var ci = {
        id: toZeroBased('id'),
        title: toZeroBased('title'),
        date: toZeroBased('date'),
        tag: toZeroBased('tag'),
        excerpt: toZeroBased('excerpt'),
        body: toZeroBased('body'),
      };
      if (colMap.published !== undefined && colMap.published !== null) {
        var p = parseInt(colMap.published, 10);
        if (!isNaN(p) && p >= 1) {
          ci.published = p - 1;
        }
      }
      var req = ['id', 'title', 'date', 'tag', 'excerpt', 'body'];
      for (var i = 0; i < req.length; i++) {
        var k = req[i];
        if (ci[k] === undefined) {
          throw new Error('Mapping colonnes incomplet : « ' + k + ' ». Ouvrez « Configurer les colonnes ».');
        }
        if (ci[k] >= numCols) {
          throw new Error('La colonne pour « ' + k + ' » dépasse la largeur du tableau (ligne 1).');
        }
      }
      if (ci.published !== undefined && ci.published >= numCols) {
        throw new Error('La colonne « published » est hors limites.');
      }
      return ci;
    }
  }

  var header = values[0].map(function (h) {
    return String(h).trim().toLowerCase();
  });
  var col = {};
  for (var j = 0; j < header.length; j++) {
    col[header[j]] = j;
  }
  function reqHeader(name) {
    if (col[name] === undefined) {
      throw new Error(
        'Colonne « ' +
          name +
          ' » introuvable en ligne 1. Renommez les en-têtes ou utilisez le menu « Configurer les colonnes ».'
      );
    }
    return col[name];
  }
  var ci2 = {
    id: reqHeader('id'),
    title: reqHeader('title'),
    date: reqHeader('date'),
    tag: reqHeader('tag'),
    excerpt: reqHeader('excerpt'),
    body: reqHeader('body'),
  };
  if (col['published'] !== undefined) {
    ci2.published = col['published'];
  }
  return ci2;
}

function columnToLetter_(column) {
  var s = '';
  var n = column;
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = ((n - m - 1) / 26) | 0;
  }
  return s;
}

/**
 * Lit la feuille, construit le JSON et pousse un commit sur GitHub.
 * Après succès : remplit « published » pour les lignes qui étaient vides (horodatage).
 */
function syncBlogPostsToGitHub() {
  try {
    var props = getProps_();
    var sheet = getArticleSheet_();
    ensureHeaderRow_(sheet);

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      appendAutomationLog_('Sync GitHub (menu)', 'Échec', 'Aucune ligne de données', 'En-tête seul ou feuille vide');
      SpreadsheetApp.getUi().alert('Erreur : Aucune ligne de données (en-tête seul ?)');
      return;
    }

    var ci = getColumnIndices_(values);

    var posts = [];
    /** Numéros de ligne feuille (1-based) où published était vide et qu’on marquera après envoi */
    var sheetRowsToMarkPublished = [];
    /** Articles correspondants (même ordre) pour tweet X après succès */
    var newlyPublishedPostsForTwitter = [];

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var pubCellEmpty = false;
      // Colonne « published » : vide ou TRUE/oui/1/Publié… = inclure. Seuls FALSE/non/no/0/brouillon = brouillon.
      if (ci.published !== undefined) {
        var pub = row[ci.published];
        var pubStrRaw = String(pub === null || pub === undefined ? '' : pub).trim();
        pubCellEmpty = pubStrRaw === '';
        var pubStr = pubStrRaw.toLowerCase();
        if (
          pubStr === 'false' ||
          pubStr === 'non' ||
          pubStr === 'no' ||
          pubStr === '0' ||
          pubStr === 'brouillon' ||
          pubStr === 'draft'
        ) {
          continue;
        }
      }

      var id = String(row[ci.id] || '').trim();
      if (!id) continue;

      var title = String(row[ci.title] || '').trim();
      var dateCell = row[ci.date];
      var dateStr = formatDateIso_(dateCell);
      var tag = String(row[ci.tag] || '').trim();
      var excerpt = String(row[ci.excerpt] || '').trim();
      var bodyRaw = String(row[ci.body] || '').trim();

      var post = {
        id: id,
        title: title,
        date: dateStr,
        tag: tag,
        excerpt: excerpt,
      };

      if (bodyRaw.indexOf('<p') === 0 || bodyRaw.indexOf('<P') === 0) {
        post.bodyHtml = bodyRaw;
      } else {
        var parts = bodyRaw.split(/\n\s*\n/).map(function (s) {
          return s.trim();
        }).filter(Boolean);
        post.paragraphs = parts;
      }

      posts.push(post);

      if (ci.published !== undefined && pubCellEmpty) {
        sheetRowsToMarkPublished.push(r + 1);
        newlyPublishedPostsForTwitter.push(post);
      }
    }

    posts.sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });

    var payload = {
      siteBaseUrl: props.siteBase,
      posts: posts,
    };

    var jsonString = JSON.stringify(payload, null, 2) + '\n';

    if (posts.length === 0) {
      appendAutomationLog_(
        'Sync GitHub (menu)',
        'Ignoré',
        '0 article à envoyer',
        props.owner + '/' + props.repo + ' — aucun commit'
      );
      SpreadsheetApp.getUi().alert(
        'Aucun article à envoyer : 0 ligne valide (vérifiez id rempli, colonnes, et que la ligne n’est pas en brouillon). Aucun commit GitHub.'
      );
      return;
    }

    var pushResult = pushJsonToGitHub_(props, jsonString);
    var indexingNote = safeNotifyIndexingAfterPublish_(props);

    if (ci.published !== undefined && sheetRowsToMarkPublished.length > 0) {
      var colPub = ci.published + 1;
      var stamp =
        'Publié ' +
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
      for (var m = 0; m < sheetRowsToMarkPublished.length; m++) {
        sheet.getRange(sheetRowsToMarkPublished[m], colPub).setValue(stamp);
      }
      for (var tx = 0; tx < newlyPublishedPostsForTwitter.length; tx++) {
        safeNotifyTwitterNewArticle_(props, newlyPublishedPostsForTwitter[tx]);
      }
    }

    var logStat = 'OK';
    if (indexingNote && (indexingNote.indexOf('échec') !== -1 || indexingNote.indexOf('erreur') !== -1)) {
      logStat = 'Partiel';
    }
    var logDetail =
      (pushResult && pushResult.commitUrl ? pushResult.commitUrl : '') +
      (indexingNote ? ' | ' + indexingNote : '') +
      (newlyPublishedPostsForTwitter.length > 0 ? ' | X : ' + newlyPublishedPostsForTwitter.length + ' tweet(s) tenté(s)' : '');
    appendAutomationLog_(
      'Sync GitHub (menu)',
      logStat,
      posts.length + ' article(s) → ' + props.owner + '/' + props.repo + ' (' + props.branch + ')',
      logDetail
    );

    var msg =
      'OK : commit sur ' +
      props.owner +
      '/' +
      props.repo +
      ' (branche « ' +
      props.branch +
      ' ») → ' +
      JSON_PATH +
      '\n\n' +
      posts.length +
      ' article(s) dans le JSON.';
    if (pushResult && pushResult.commitUrl) {
      msg += '\n\nLien du commit GitHub :\n' + pushResult.commitUrl;
    } else {
      msg += '\n\n⚠ Si ce message apparaît sans lien : vérifiez GITHUB_OWNER / GITHUB_REPO / GITHUB_BRANCH dans les propriétés du script.';
    }
    if (indexingNote) {
      msg += '\n\n' + indexingNote;
    }
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    appendAutomationLog_('Sync GitHub (menu)', 'Échec', e.message || String(e), '');
    SpreadsheetApp.getUi().alert('Erreur : ' + (e.message || e));
  }
}

/**
 * Déclencheur quotidien : jusqu’à SCHEDULED_PUBLISH_PER_RUN articles (file = « published » vide).
 * @deprecated Ancien nom — redirige vers la publication quotidienne (pour déclencheurs déjà créés).
 */
function publishNextArticleWeekly() {
  publishScheduledArticlesDaily();
}

/**
 * Appelé par le déclencheur horaire quotidien.
 * Enchaîne les publications GitHub puis, si au moins un article a été poussé, déclenche l’indexation Google
 * (même logique que safeNotifyIndexingAfterPublish_ : home + /blog/).
 */
function publishScheduledArticlesDaily() {
  publishScheduledBatchCore_(false, SCHEDULED_PUBLISH_PER_RUN);
}

/** Menu : teste jusqu’à 3 publications d’affilée. */
function testPublishScheduledBatch() {
  publishScheduledBatchCore_(true, SCHEDULED_PUBLISH_PER_RUN);
}

/** Menu : teste une seule publication. */
function testPublishOneArticle() {
  publishScheduledBatchCore_(true, 1);
}

/**
 * Boucle : publie jusqu’à maxArticles articles (un commit GitHub par article).
 * @param {boolean} showUi alertes finales
 * @param {number} maxArticles ex. 3 ou 1
 */
function publishScheduledBatchCore_(showUi, maxArticles) {
  var sourceBase = showUi ? 'Publication test (menu)' : 'Publication planifiée (quotidien)';
  var count = 0;
  var titles = [];
  var lastCommit = '';
  var lastIndexing = '';
  try {
    getProps_();
    for (var i = 0; i < maxArticles; i++) {
      var slotLabel = sourceBase + (maxArticles > 1 ? ' [' + (i + 1) + '/' + maxArticles + ']' : '');
      var one = publishOneQueuedArticle_(slotLabel);
      if (!one) break;
      count++;
      titles.push('« ' + one.newPost.title + ' » (' + one.newPost.id + ')');
      if (one.pushResult && one.pushResult.commitUrl) lastCommit = one.pushResult.commitUrl;
    }

    if (count > 0) {
      var propsIx = getProps_();
      lastIndexing = safeNotifyIndexingAfterPublish_(propsIx) || '';
      if (lastIndexing) {
        var ixFail =
          lastIndexing.indexOf('échec') !== -1 ||
          lastIndexing.indexOf('erreur') !== -1 ||
          lastIndexing.indexOf('Erreur') !== -1;
        appendAutomationLog_(
          sourceBase + ' — indexation Google',
          ixFail ? 'Partiel' : 'OK',
          'Après ' + count + ' publication(s) : URL_UPDATED (home + /blog/)',
          lastIndexing
        );
      }
    }

    if (count === 0) {
      var msgNone =
        'Aucun article en attente : aucune ligne avec « published » vide (hors brouillon). Remplissez la file puis relancez.';
      appendAutomationLog_(sourceBase, 'Ignoré', 'File vide (published)', '');
      if (showUi) SpreadsheetApp.getUi().alert(msgNone);
      else Logger.log('publishScheduledBatch: ' + msgNone);
      return;
    }

    var summary =
      count +
      ' article(s) publié(s)' +
      (count > 1 ? ' successivement' : '') +
      '.\n\n' +
      titles.join('\n');
    if (lastCommit) summary += '\n\nDernier commit :\n' + lastCommit;
    if (lastIndexing) summary += '\n\n' + lastIndexing;

    if (showUi) SpreadsheetApp.getUi().alert(summary);
    else
      Logger.log(
        'publishScheduledBatch OK: ' + count + ' article(s) — ' + titles.join(' | ')
      );
  } catch (e) {
    Logger.log('publishScheduledBatch erreur: ' + e);
    appendAutomationLog_(sourceBase, 'Échec', e.message || String(e), count > 0 ? 'après ' + count + ' OK' : '');
    if (showUi) SpreadsheetApp.getUi().alert('Erreur : ' + (e.message || e));
  }
}

/**
 * Publie le prochain article éligible (première ligne « published » vide). Un commit GitHub.
 * @return {{ newPost: Object, postsTotal: number, pushResult: Object }|null} null si file vide
 * (L’indexation Google est déclenchée une fois par batch dans publishScheduledBatchCore_, pas ici.)
 */
function publishOneQueuedArticle_(sourceLabel) {
  var props = getProps_();
  var sheet = getArticleSheet_();
  ensureHeaderRow_(sheet);

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    appendAutomationLog_(sourceLabel, 'Ignoré', 'Feuille vide ou en-tête seul', '');
    return null;
  }

  var ci = getColumnIndices_(values);
  if (ci.published === undefined) {
    var err = 'La colonne « published » est requise (configurez les colonnes).';
    appendAutomationLog_(sourceLabel, 'Échec', err, '');
    throw new Error(err);
  }

  var found = null;
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var pub = row[ci.published];
    var pubStrRaw = String(pub === null || pub === undefined ? '' : pub).trim();
    if (pubStrRaw !== '') continue;

    var pubStr = pubStrRaw.toLowerCase();
    if (
      pubStr === 'false' ||
      pubStr === 'non' ||
      pubStr === 'no' ||
      pubStr === '0' ||
      pubStr === 'brouillon' ||
      pubStr === 'draft'
    ) {
      continue;
    }

    var id = String(row[ci.id] || '').trim();
    if (!id) continue;

    found = { sheetRow: r + 1, row: row };
    break;
  }

  if (!found) return null;

  var newPost = buildPostFromRow_(found.row, ci);

  var remoteText = getRemoteBlogPostsJson_(props);
  var posts = [];
  if (remoteText) {
    try {
      var remoteObj = JSON.parse(remoteText);
      posts = remoteObj.posts || [];
    } catch (e) {
      posts = [];
    }
  }

  var replaced = false;
  for (var j = 0; j < posts.length; j++) {
    if (posts[j].id === newPost.id) {
      posts[j] = newPost;
      replaced = true;
      break;
    }
  }
  if (!replaced) posts.push(newPost);

  posts.sort(function (a, b) {
    return String(b.date).localeCompare(String(a.date));
  });

  var payload = {
    siteBaseUrl: props.siteBase,
    posts: posts,
  };
  var jsonString = JSON.stringify(payload, null, 2) + '\n';

  var commitMsg = 'chore(blog): publication planifiée (' + newPost.id + ')';
  var pushResult = pushJsonToGitHub_(props, jsonString, commitMsg);

  var colPub = ci.published + 1;
  var stamp =
    'Publié ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  sheet.getRange(found.sheetRow, colPub).setValue(stamp);

  var logDetail = pushResult && pushResult.commitUrl ? pushResult.commitUrl : '';
  appendAutomationLog_(
    sourceLabel,
    'OK',
    '« ' + newPost.title + ' » (' + newPost.id + ') — ' + posts.length + ' article(s) sur le site',
    logDetail
  );

  safeNotifyTwitterNewArticle_(props, newPost);

  return { newPost: newPost, postsTotal: posts.length, pushResult: pushResult };
}

function buildPostFromRow_(row, ci) {
  var title = String(row[ci.title] || '').trim();
  var dateCell = row[ci.date];
  var dateStr = formatDateIso_(dateCell);
  var tag = String(row[ci.tag] || '').trim();
  var excerpt = String(row[ci.excerpt] || '').trim();
  var bodyRaw = String(row[ci.body] || '').trim();

  var post = {
    id: String(row[ci.id] || '').trim(),
    title: title,
    date: dateStr,
    tag: tag,
    excerpt: excerpt,
  };

  if (bodyRaw.indexOf('<p') === 0 || bodyRaw.indexOf('<P') === 0) {
    post.bodyHtml = bodyRaw;
  } else {
    post.paragraphs = bodyRaw
      .split(/\n\s*\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }
  return post;
}

/** Contenu brut de data/blog-posts.json sur la branche, ou null. */
function getRemoteBlogPostsJson_(props) {
  var path = JSON_PATH;
  var url =
    'https://api.github.com/repos/' +
    encodeURIComponent(props.owner) +
    '/' +
    encodeURIComponent(props.repo) +
    '/contents/' +
    path.split('/').map(encodeURIComponent).join('/');

  var getResp = UrlFetchApp.fetch(url + '?ref=' + encodeURIComponent(props.branch), {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + props.token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    muteHttpExceptions: true,
  });

  if (getResp.getResponseCode() !== 200) return null;
  var fileMeta = JSON.parse(getResp.getContentText());
  if (!fileMeta.content) return null;
  return Utilities.newBlob(Utilities.base64Decode(fileMeta.content.replace(/\n/g, ''))).getDataAsString();
}

/** Supprime les déclencheurs publication planifiée (quotidien + ancien hebdo). */
function deleteScheduledPublishTriggersSilent_() {
  var handlers = { publishScheduledArticlesDaily: true, publishNextArticleWeekly: true };
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = triggers.length - 1; i >= 0; i--) {
    var fn = triggers[i].getHandlerFunction();
    if (handlers[fn]) ScriptApp.deleteTrigger(triggers[i]);
  }
}

/**
 * Déclencheur : chaque jour vers 9 h (fuseau Projet Apps Script → Réglages généraux).
 * Jusqu’à SCHEDULED_PUBLISH_PER_RUN articles par passage (un commit par article).
 */
function installDailyPublishTrigger() {
  deleteScheduledPublishTriggersSilent_();
  ScriptApp.newTrigger('publishScheduledArticlesDaily')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  SpreadsheetApp.getUi().alert(
    'Déclencheur installé : chaque jour vers 9 h, jusqu’à ' +
      SCHEDULED_PUBLISH_PER_RUN +
      ' article(s) (lignes « published » vides, dans l’ordre de la feuille). Anciens déclencheurs hebdo supprimés.'
  );
}

function removeScheduledPublishTriggers() {
  var before = 0;
  var handlers = { publishScheduledArticlesDaily: true, publishNextArticleWeekly: true };
  var triggers = ScriptApp.getProjectTriggers();
  for (var j = 0; j < triggers.length; j++) {
    if (handlers[triggers[j].getHandlerFunction()]) before++;
  }
  deleteScheduledPublishTriggersSilent_();
  SpreadsheetApp.getUi().alert(
    before > 0
      ? before + ' déclencheur(s) de publication supprimé(s).'
      : 'Aucun déclencheur de publication planifiée à supprimer.'
  );
}

function formatDateIso_(cell) {
  if (cell instanceof Date) {
    var y = cell.getFullYear();
    var m = ('0' + (cell.getMonth() + 1)).slice(-2);
    var d = ('0' + cell.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  var s = String(cell).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // JJ/MM/AAAA (format courant au Maroc / FR)
  var fr = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (fr) {
    var day = parseInt(fr[1], 10);
    var month = parseInt(fr[2], 10);
    var year = parseInt(fr[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return year + '-' + ('0' + month).slice(-2) + '-' + ('0' + day).slice(-2);
    }
  }
  throw new Error('Date invalide (AAAA-MM-JJ, JJ/MM/AAAA ou cellule date Sheets) : ' + s);
}

/**
 * Met à jour data/blog-posts.json. Retourne { commitUrl, commitSha } pour vérifier sur GitHub.
 * @param {string} [optCommitMessage] message de commit Git (optionnel).
 */
function pushJsonToGitHub_(props, content, optCommitMessage) {
  var path = JSON_PATH;
  var url =
    'https://api.github.com/repos/' +
    encodeURIComponent(props.owner) +
    '/' +
    encodeURIComponent(props.repo) +
    '/contents/' +
    path.split('/').map(encodeURIComponent).join('/');

  var getResp = UrlFetchApp.fetch(url + '?ref=' + encodeURIComponent(props.branch), {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + props.token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    muteHttpExceptions: true,
  });

  var sha = null;
  if (getResp.getResponseCode() === 200) {
    var fileMeta = JSON.parse(getResp.getContentText());
    sha = fileMeta.sha;
  } else if (getResp.getResponseCode() !== 404) {
    throw new Error('GitHub GET ' + getResp.getResponseCode() + ' : ' + getResp.getContentText());
  }

  var blob = Utilities.newBlob(content, 'application/json; charset=utf-8', 'blog-posts.json');
  var base64 = Utilities.base64Encode(blob.getBytes());

  var body = {
    message: optCommitMessage || 'chore(blog): sync depuis Google Sheets',
    content: base64,
    branch: props.branch,
  };
  if (sha) body.sha = sha;

  var putResp = UrlFetchApp.fetch(url, {
    method: 'put',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + props.token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  var code = putResp.getResponseCode();
  var putText = putResp.getContentText();
  if (code !== 200 && code !== 201) {
    throw new Error('GitHub PUT ' + code + ' : ' + putText);
  }

  var commitUrl = '';
  var commitSha = '';
  try {
    var out = JSON.parse(putText);
    if (out.commit) {
      commitUrl = out.commit.html_url || '';
      commitSha = out.commit.sha || '';
    }
  } catch (e) {
    /* ignore */
  }
  if (!commitUrl) {
    throw new Error(
      'Réponse GitHub inattendue (pas d’URL de commit). Dépôt cible : ' +
        props.owner +
        '/' +
        props.repo +
        ' — vérifiez les propriétés du script. Corps : ' +
        putText.slice(0, 500)
    );
  }
  return { commitUrl: commitUrl, commitSha: commitSha };
}
