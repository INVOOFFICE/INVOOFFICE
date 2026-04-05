/**
 * Génère INVOOFFICE-Articles-SEO-31-planification-2026.csv
 * — 31 articles récents, dates étalées (1/jour) pour planification Sheets.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'INVOOFFICE-Articles-SEO-31-planification-2026.csv');

/** JJ/MM/AAAA à partir du 11 avril 2026 */
function dateFr(dayIndex) {
  const d = new Date(Date.UTC(2026, 3, 11 + dayIndex, 12, 0, 0));
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/2026`;
}

const rows = [
  {
    id: 'avoir-facture-maroc-quand-emettre-2026',
    title: "Avoir (facture d’avoir) au Maroc : quand l’émettre et comment le lier à la facture d’origine",
    tag: 'Facturation',
    excerpt:
      'L’avoir annule ou réduit une facture déjà émise. Mal utilisé, il crée des incohérences en TVA et en compta. Rappel des cas utiles pour les PME marocaines.',
    body: `Un avoir n’est pas une « petite réduction » : c’est un document qui corrige une facture déjà enregistrée — retour marchandise, erreur de prix, remise commerciale après coup ou annulation partielle. Au Maroc comme ailleurs, il doit rester traçable vers la facture d’origine pour que la TVA et le chiffre d’affaires reflètent la réalité.

Émettre un avoir sans référence claire à la facture initiale complique les contrôles et les rapprochements bancaires. La bonne pratique : numérotation distincte des avoirs, mention explicite du numéro de facture corrigée, et conservation des deux pièces ensemble.

Les équipes qui gèrent beaucoup de retours ou de négociations après facturation gagnent à industrialiser le flux avoir plutôt que de refaire une nouvelle facture « en négatif » à la main.

INVOOffice permet d’émettre des avoirs rattachés aux factures, avec cohérence des montants et des taux de TVA, pour garder un dossier propre côté DGI et comptabilité.`,
  },
  {
    id: 'facture-dirhams-client-etranger-maroc-2026',
    title: 'Facturer en dirhams un client à l’étranger : devises, mentions et bonnes habitudes',
    tag: 'Facturation',
    excerpt:
      'Exporter un service ou une marchandise depuis le Maroc vers un client hors pays implique des choix de devise et de mentions sur la facture. Points de vigilance pour éviter les blocages.',
    body: `La facture marocaine vers un client étranger doit rester lisible pour les deux parties : montants, devise, coordonnées complètes, nature de l’opération. Même si le client paie en euros ou dollars, afficher clairement l’équivalent ou le montant contractuel en MAD évite les malentendus au paiement.

La TVA et le traitement comptable dépendent du type d’opération (B2B hors Maroc, services, biens). Une PME doit harmoniser sa facturation avec l’avis de son expert-comptable — l’outil ne remplace pas l’analyse fiscale.

Centraliser devis, factures et versions dans un même outil réduit les erreurs de conversion et les doubles envois.

INVOOffice aide à structurer factures et devis avec mentions cohérentes et exports utiles pour le suivi des ventes à l’international depuis le Maroc.`,
  },
  {
    id: 'archivage-factures-numeriques-maroc-dgi-2026',
    title: 'Archivage numérique des factures au Maroc : durée, organisation et recherche rapide',
    tag: 'Conformité DGI',
    excerpt:
      'Dix ans de conservation : la règle est connue, la mise en œuvre l’est moins. Comment classer ses factures PDF et les retrouver sans perdre une journée.',
    body: `Les entreprises marocaines savent qu’il faut conserver les pièces plusieurs années — mais beaucoup les stockent dans des dossiers mal nommés ou des boîtes mail. Quand la DGI ou un audit client demande une facture de 2022, la panique n’est pas une stratégie.

Un archivage efficace repose sur trois axes : nom de fichier ou tag incluant année-mois et numéro de facture, arborescence par exercice fiscal, et sauvegarde hors du poste unique (cloud ou disque externe).

Numériser le flux dès l’émission évite la ressaisie et les versions contradictoires entre « Word du bureau » et « PDF envoyé au client ».

INVOOffice centralise l’émission et l’historique des factures avec numérotation continue et exports par période — pour retrouver une pièce en secondes, pas en heures.`,
  },
  {
    id: 'tva-restaurant-snack-maroc-taux-2026',
    title: 'TVA dans la restauration au Maroc : ce que les snacks et cafés doivent vérifier sur la caisse',
    tag: 'Fiscalité',
    excerpt:
      'Bar, snack ou restaurant : les taux et les libellés sur ticket et facture doivent être cohérents. Les erreurs les plus fréquentes et comment les éviter.',
    body: `Une caisse qui applique un mauvais taux de TVA sur une partie du menu fausse la déclaration et la marge réelle. En restauration marocaine, la complexité vient souvent des produits mélangés — boissons, plats, produits à emporter.

Former l’équipe à sélectionner la bonne catégorie produit au moment de la vente est aussi important que choisir le logiciel. Une catégorie « repas » et une catégorie « boisson » bien paramétrées réduisent les erreurs à la source.

Les contrôles croisés en fin de semaine (échantillon de tickets vs rapport TVA) détectent les dérives avant la clôture mensuelle.

INVOOCoffee permet de paramétrer catégories et TVA sur le menu, avec rapports de ventes pour aligner encaissements et obligations fiscales des établissements au Maroc.`,
  },
  {
    id: 'bon-livraison-vs-facture-maroc-pme-2026',
    title: 'Bon de livraison et facture au Maroc : deux rôles, une seule chaîne à ne pas casser',
    tag: 'Gestion',
    excerpt:
      'Le bon de livraison prouve le mouvement physique ; la facture enregistre la créance. Les PME qui mélangent les deux documents créent des écarts stock et trésorerie.',
    body: `Dans la distribution et le BTP marocain, le bon de livraison signé par le client est souvent la preuve que la marchandise est partie. La facture doit suivre avec le même détail — références, quantités, prix — sinon le client conteste et le stock interne ne correspond plus.

La séquence idéale : bon de livraison → validation logistique → facturation automatique à partir des mêmes lignes. Toute ressaisie manuelle entre les deux étapes est une source d’erreur.

Les dirigeants qui pilotent à la trésorerie ont besoin que chaque BL non facturé apparaisse clairement dans un état « à facturer ».

INVOOffice relie devis, bons de livraison et factures pour que la PME marocaine garde une chaîne unique du premier envoi au paiement.`,
  },
  {
    id: 'auto-entrepreneur-maroc-facturation-simple-2026',
    title: 'Auto-entrepreneur au Maroc : facturation simple sans se noyer dans la paperasse',
    tag: 'Facturation',
    excerpt:
      'Peu de volume mais besoin de sérieux : clients professionnels exigent des factures propres. Comment tenir un rythme léger tout en restant crédible.',
    body: `L’auto-entrepreneur marocain jongle souvent entre plusieurs clients et peu de temps administratif. Pourtant, un PDF mal nommé ou une TVA mal indiquée peut bloquer le paiement d’une grande entreprise cliente.

Deux habitudes suffisent souvent : un modèle unique de facture validé une fois pour toutes, et une numérotation automatique jamais modifiée à la main.

Garder une copie de chaque facture dans un dossier par année facilite les déclarations et les demandes de justificatifs.

INVOOffice offre une facturation claire, des exports par période et un usage local adapté aux indépendants qui veulent un outil sérieux sans infrastructure lourde.`,
  },
  {
    id: 'whatsapp-et-devis-maroc-convertir-2026',
    title: 'Devis validé sur WhatsApp au Maroc : valeur probante et passage à la facture',
    tag: 'Ventes',
    excerpt:
      'Un « OK » sur WhatsApp peut engager — mais la forme du devis PDF reste la référence. Comment sécuriser le passage devis → facture pour les TPE.',
    body: `Beaucoup de commerciaux marocains ferment un deal sur WhatsApp avec un message court. La valeur juridique dépend du contexte, mais pour l’entreprise, le vrai repère reste le document PDF du devis : montant, délais, périmètre.

La bonne pratique opérationnelle : envoyer le PDF officiel après le OK, mentionner le numéro de devis dans la conversation, puis transformer le devis en facture sans ressaisir les lignes.

Cela réduit les litiges du type « je croyais que c’était inclus » — le devis structuré tranche.

INVOOffice enchaîne devis et facture dans un même flux pour les PME marocaines qui vendent autant sur le terrain que sur messagerie.`,
  },
  {
    id: 'inventaire-tournant-stock-maroc-pme-2026',
    title: 'Inventaire tournant : comment les PME marocaines peuvent l’organiser sans fermer boutique',
    tag: 'Gestion',
    excerpt:
      'Compter tout le stock une fois par an paralyse l’activité. L’inventaire tournant par famille de produits réduit les écarts et la fatigue.',
    body: `L’inventaire annuel complet est exigeant pour une petite équipe : fermeture, stress, erreurs de comptage. L’inventaire tournant consiste à vérifier un sous-ensemble de références chaque semaine ou mois — sur un an, tout le catalogue est couvert.

Les commerces marocains avec rotation rapide (alimentaire, pièces) y gagnent en réactivité : on détecte les vols, pertes et erreurs de saisie avant qu’ils ne s’accumulent.

La méthode exige une liste de références prioritaires (A, B, C) et un calendrier tenu.

INVOOffice soutient le suivi des mouvements de stock et des écarts pour que l’inventaire tournant repose sur des chiffres à jour, pas sur des tableurs figés.`,
  },
  {
    id: 'declaration-tva-maroc-erreurs-frequentes-2026',
    title: 'Déclaration de TVA au Maroc : cinq erreurs fréquentes des PME (et comment les éviter)',
    tag: 'Fiscalité',
    excerpt:
      'Oublis d’achats, mauvais taux, écarts de période : les régularisations coûtent du temps et de l’argent. Check-list avant envoi.',
    body: `La TVA marocaine se déclare sur des périodes fixes ; chaque oubli d’achat déductible ou chaque taux mal appliqué sur une vente se voit en fin de période. Les PME qui attendent le dernier jour pour tout reconstituer subissent le plus de stress.

Une check-list simple : total ventes par taux, total achats par taux, avoirs de la période, factures d’acompte, et rapprochement avec le livre des factures émises.

Les outils qui exportent des synthèses par mois réduisent la ressaisie dans le portail de déclaration.

INVOOffice structure les ventes et la TVA sur les factures pour que la PME marocaine dispose de bases fiables avant la clôture fiscale.`,
  },
  {
    id: 'pdf-facture-modele-maroc-professionnel-2026',
    title: 'Modèle de facture PDF au Maroc : ce qui fait pro aux yeux d’un client exigeant',
    tag: 'Facturation',
    excerpt:
      'Logo, mentions légales, lisibilité : la facture est une carte de visite. Les détails qui rassurent les acheteurs B2B et les banques.',
    body: `Une facture illisible ou tronquée sur mobile donne une image d’amateurisme — même si les montants sont justes. Les clients B2B marocains comparent les fournisseurs aussi sur la qualité documentaire.

Mentions complètes, hiérarchie visuelle (totaux visibles en un coup d’œil), et cohérence avec le devis précédent renforcent la confiance.

Les PDF générés depuis un modèle unique évitent les « copier-coller oubliés » d’une ancienne facture.

INVOOffice propose des modèles PDF structurés pour des factures et devis présentables, adaptés aux standards des entreprises marocaines.`,
  },
  {
    id: 'location-courte-duree-vs-longue-duree-maroc-2026',
    title: 'Location courte ou longue durée au Maroc : impact sur tarifs, contrats et planning flotte',
    tag: 'Location auto',
    excerpt:
      'Les agences qui mélangent les deux sans cadre clair perdent en rentabilité. Comment distinguer les processus et éviter les doubles réservations.',
    body: `La location à la journée et la location mensuelle n’impliquent pas les mêmes contrats, les mêmes cautions ni le même usure véhicule. Une agence marocaine qui traite les deux dans le même tableur sans filtre finit par promettre la même voiture deux fois.

Séparer les statuts de réservation (courte / longue), les tarifs et les modèles de contrat clarifie le travail des équipes.

Un calendrier unique par véhicule montre immédiatement les chevauchements.

INVOORent Pro aide à gérer réservations, types de location et contrats pour que la flotte marocaine soit affectée sans conflit de dates.`,
  },
  {
    id: 'caution-location-voiture-maroc-bonnes-pratiques-2026',
    title: 'Caution et dépôt de garantie en location de voiture au Maroc : bonnes pratiques agence',
    tag: 'Location auto',
    excerpt:
      'Montant, restitution, contestation : la caution est un sujet sensible. Comment documenter pour protéger l’agence et rassurer le client.',
    body: `La caution en location automobile au Maroc doit être expliquée clairement au client avant signature : montant, mode de préautorisation ou d’encaissement, délais de restitution après restitution du véhicule.

Les litiges naissent souvent d’un état des lieux sortie flou ou d’une rayure non photographiée. Photos horodatées et checklist signée réduisent les discussions interminables.

Tracer la caution dans le même dossier que le contrat évite les pertes d’information entre le comptoir et l’administratif.

INVOORent Pro structure fiches client, contrats et historique pour que chaque caution soit liée à une location identifiable.`,
  },
  {
    id: 'vehicule-indisponible-flotte-location-maroc-2026',
    title: 'Véhicule en panne ou en réparation : comment une agence de location marocaine réorganise sa flotte',
    tag: 'Location auto',
    excerpt:
      'Imprévu mécanique + réservations confirmées = stress. Anticiper avec statuts véhicule et communication client limite les avis négatifs.',
    body: `Quand une voiture tombe en panne la veille d’une location, l’agence doit proposer une alternative de même catégorie ou mieux — vite. Sans statut « hors service » dans le système, le risque est de la vendre encore en ligne.

Marquer le véhicule indisponible, libérer ou reporter les réservations, et notifier le client avant son arrivée préserve la relation.

Un historique des immobilisations aide aussi à négocier avec l’assurance ou le garage.

INVOORent Pro permet de suivre l’état des véhicules et les réservations pour réaffecter la flotte sans oublier un client marocain ou touristique.`,
  },
  {
    id: 'tarifs-weekend-location-auto-maroc-2026',
    title: 'Tarifs week-end et jours fériés : ajuster la grille de location au Maroc sans perdre en clarté',
    tag: 'Stratégie',
    excerpt:
      'La demande explose aux ponts et vacances. Majorations possibles si elles sont annoncées et cohérentes sur le contrat.',
    body: `Les agences de location au Maroc savent que le week-end et l’Aïd chargent le parc. Une majoration est légitime si elle est affichée avant réservation et reflétée sur le devis et le contrat.

Le client qui découvre une surprime au comptoir part mécontent et laisse un avis — même si le prix reste dans le marché.

Paramétrer des grilles ou des périodes dans l’outil évite les calculs manuels le vendredi soir.

INVOORent Pro aide à structurer tarifs et réservations pour appliquer des règles de prix lisibles toute l’année.`,
  },
  {
    id: 'retour-vehicule-etat-lieux-maroc-2026',
    title: 'Retour de véhicule en location : état des lieux et dégâts au Maroc, procédure sereine',
    tag: 'Location auto',
    excerpt:
      'Rayure, kilométrage, carburant : chaque point doit être constaté. Une procédure courte protège l’agence et accélère la file d’attente.',
    body: `L’état des lieux de retour est le moment où l’agence et le client peuvent se retrouver en désaccord. Au Maroc comme partout, la clarté prime : parcourir le véhicule ensemble, noter kilométrage et niveau de carburant, signer si les deux parties sont d’accord.

Photographier les zones sensibles (jantes, pare-chocs) à l’aller et au retour évite les « ce n’était pas là ».

Une file d’attente au retour pénalise l’image de l’agence : une checklist d’une page accélère le flux.

INVOORent Pro accompagne la documentation contrat et client pour que le retour de location reste traçable et professionnel.`,
  },
  {
    id: 'location-entreprise-contrat-cadre-maroc-2026',
    title: 'Location longue durée B2B au Maroc : contrat-cadre et facturation récurrente',
    tag: 'Location auto',
    excerpt:
      'Les entreprises clientes demandent un cadre clair et des factures régulières. Comment structurer l’offre agence vers les flottes PME.',
    body: `Une PME marocaine qui loue trois véhicules en permanence préfère un contrat-cadre avec tarif négocié et facturation mensuelle plutôt que trois dossiers séparés à renouveler chaque mois.

L’agence gagne en prévisibilité ; le client gagne en simplicité administrative.

Centraliser les véhicules, les conducteurs autorisés et les échéances de facturation dans un même outil évite les oublis de renouvellement.

INVOORent Pro permet de suivre clients entreprise, contrats et historique pour les agences marocaines qui développent le B2B.`,
  },
  {
    id: 'cafe-maroc-qr-menu-digital-2026',
    title: 'Menu digital et QR code dans un café marocain : opportunités et limites',
    tag: 'Stratégie',
    excerpt:
      'Moins de carte papier, mise à jour des prix en temps réel — le QR séduit. Il faut tout de même penser aux clients moins à l’aise avec le smartphone.',
    body: `Le menu QR s’est généralisé après la pandémie ; au Maroc, les cafés touristiques et urbains l’adoptent vite. L’intérêt : changer les prix ou les plats du jour sans réimprimer.

La limite : une partie de la clientèle préfère une carte physique — garder les deux options évite d’exclure.

Le menu digital doit refléter exactement les prix encaissés en caisse pour éviter les litiges.

INVOOCoffee facilite la gestion du menu et des catégories pour aligner affichage, caisse et rapports dans le café marocain.`,
  },
  {
    id: 'pourboires-restaurant-maroc-declaration-2026',
    title: 'Pourboires en restaurant au Maroc : transparence en caisse et équité en équipe',
    tag: 'Gestion',
    excerpt:
      'Espèce ou carte, pooling ou individuel : sans règle, les tensions montent. Quelques principes pour les gérants.',
    body: `Les pourboires ne sont pas toujours déclarés de la même façon selon l’établissement. Ce qui compte pour l’équipe, c’est la clarté : qui touche quoi, sur quelle base, et comment la caisse enregistre l’écoulement des montants.

Une politique écrite — même courte — évite les rumeurs et les départs.

La caisse doit pouvoir distinguer vente et pourboire si la législation ou la convention interne l’exige.

INVOOCoffee aide à tracer les ventes et modes de paiement pour que le gérant de restaurant marocain garde une vision nette de l’activité réelle.`,
  },
  {
    id: 'service-brunch-cafe-maroc-organisation-2026',
    title: 'Brunch du week-end au Maroc : organiser cuisine et salle pour absorber le pic',
    tag: 'Gestion',
    excerpt:
      'Samedi et dimanche midi : files d’attente et cuisine saturée. Anticiper la carte et le staffing évite les avis négatifs.',
    body: `Le brunch attire une clientèle qui veut tout en même temps — salé, sucré, boissons — ce qui charge la cuisine sur une fenêtre courte. Les cafés marocains qui réussissent limitent la carte du brunch, préparent en amont, et forment le service à annoncer les délais réalistes.

Le POS qui envoie les commandes en cuisine dans l’ordre et par poste réduit les oublis de plat.

Analyser les ventes des trois derniers brunchs ajuste les quantités pour le suivant.

INVOOCoffee soutient le flux commandes-cuisine-caisse pour les pics de week-end au Maroc.`,
  },
  {
    id: 'livraison-aggregator-resto-maroc-2026',
    title: 'Livraison via plateformes au Maroc : concilier commissions, menu et caisse du restaurant',
    tag: 'Stratégie',
    excerpt:
      'Les agrégateurs apportent du volume mais mangent la marge. Comment suivre ce canal sans perdre le fil en salle.',
    body: `Les restaurants marocains partenaires de livraison doivent aligner prix affichés, promotions et disponibilité des plats — sinon annulations et mauvais avis.

Une vision des ventes « salle » vs « livraison » aide à décider si le canal reste rentable après commission.

Mettre à jour le menu sur la plateforme et en cuisine le même jour est une discipline.

INVOOCoffee permet de suivre catégories et volumes de ventes pour comparer canaux et ajuster l’offre des établissements marocains.`,
  },
  {
    id: 'formation-serveur-caisse-tactile-maroc-2026',
    title: 'Former les serveurs à la caisse tactile : réduire les erreurs en restaurant au Maroc',
    tag: 'POS & Caisse',
    excerpt:
      'Un écran tactile mal maîtrisé génère des commandes fausses et des additions incorrectes. Programme de formation minimal.',
    body: `Un serveur pressé tape vite — et sélectionne la mauvaise table ou le mauvais plat. Au Maroc, la rotation élevée du personnel en restauration rend la formation continue indispensable.

Quinze minutes d’onboarding sur les scénarios fréquents (split bill, annulation, remise manager) évitent des pertes quotidiennes.

Un référent « caisse » par équipe raccourcit la résolution des blocages.

INVOOCoffee offre une interface caisse pensée pour la rapidité et la clarté, adaptée aux équipes des cafés et restaurants marocains.`,
  },
  {
    id: 'stocks-perissables-restaurant-maroc-dlc-2026',
    title: 'Stocks périssables en cuisine marocaine : DLC, rotation et pertes évitables',
    tag: 'Gestion',
    excerpt:
      'Produits frais et pertes silencieuses : la discipline du premier entré, premier sorti et le suivi des écarts.',
    body: `Une cuisine marocaine qui ne fait pas tourner les stocks perd de l’argent chaque semaine en produits jetés. Le principe PEPS doit être visible — étiquetage à la réception, rangement par date.

Un inventaire hebdomadaire des produits à forte valeur (viandes, poissons) suffit souvent à détecter les fuites.

Relier les ventes réelles aux quantités sorties en cuisine affine les commandes fournisseurs.

INVOOCoffee aide à suivre stocks consommables et ventes pour réduire le gaspillage dans les restaurants au Maroc.`,
  },
  {
    id: 'pwa-maroc-connexion-installe-2026',
    title: 'PWA au Maroc : travailler avec une connexion instable (3G, coupures)',
    tag: 'Stratégie',
    excerpt:
      'Les logiciels dans le navigateur qui tiennent hors ligne évitent les arrêts d’activité quand le réseau faiblit.',
    body: `Dans beaucoup de zones marocaines, la fibre n’est pas garantie ; les commerces et agences subissent des coupures courtes mais répétées. Un outil 100 % cloud sans mode dégradé bloque la vente ou la facturation.

Les PWA avec stockage local permettent de continuer à saisir et synchroniser ensuite.

Pour une PME, c’est aussi un argument de résilience face aux pannes opérateur.

INVOOffice, INVOORent Pro et INVOOCoffee s’inscrivent dans cette logique PWA hors ligne pour les professionnels marocains.`,
  },
  {
    id: 'sauvegarde-donnees-locales-pme-maroc-2026',
    title: 'Sauvegardes quand les données restent en local : stratégie simple pour les PME marocaines',
    tag: 'Sécurité',
    excerpt:
      'Données sur le poste : avantage de contrôle, risque de panne disque. Export périodique et routine à caler.',
    body: `Travailler avec des données locales rassure sur la confidentialité, mais un disque dur mort sans copie efface des années d’activité. Une PME marocaine doit définir une fréquence d’export — hebdomadaire ou mensuelle — et un lieu de stockage distinct (NAS, cloud chiffré, clé dédiée).

Tester une restauration une fois par an valide que les fichiers ne sont pas corrompus.

Former une personne responsable du « jour de sauvegarde » évite que la tâche soit toujours reportée.

Les logiciels INVOOffice permettent d’exporter et d’archiver les données métier pour compléter cette discipline côté entreprise.`,
  },
  {
    id: 'conformite-facture-ice-if-maroc-rappel-2026',
    title: 'ICE et IF sur facture au Maroc : rappel utile pour les nouvelles TPE en 2026',
    tag: 'Conformité DGI',
    excerpt:
      'Les jeunes structures oublient souvent une mention sur les premières factures. Éviter les retours client et les frictions administratives.',
    body: `Une TPE qui démarre en 2026 peut se concentrer sur le produit et négliger les mentions sur les premiers documents. Pourtant, un client professionnel refusera une facture sans ICE cohérent ou sans IF lisible.

Un modèle validé par un conseiller évite de renégocier après coup.

Les contrôles automatisés sur les champs ICE/IF réduisent l’erreur humaine à la saisie.

INVOOffice intègre des repères pour la facturation marocaine et les données professionnelles attendues sur les pièces.`,
  },
  {
    id: 'tableau-bord-ventes-hebdo-pme-maroc-2026',
    title: 'Tableau de bord des ventes hebdomadaires : trois indicateurs suffisants pour une PME marocaine',
    tag: 'Gestion',
    excerpt:
      'Se noyer dans les KPI paralyse. CA, panier moyen (ou ticket) et top produits : le minimum pour décider.',
    body: `Les dirigeants marocains reçoivent souvent trop de chiffres et trop peu d’insight. Trois indicateurs hebdomadaires — chiffre d’affaires, évolution vs semaine précédente, et trois meilleures lignes de produits ou services — suffisent pour ajuster prix ou promo.

La régularité du regard compte plus que la sophistication du tableau.

Un export automatique depuis la facturation ou la caisse évite les tableurs reconstruits le dimanche soir.

INVOOffice et INVOOCoffee fournissent des bases de données structurées pour extraire ces signaux selon l’activité.`,
  },
  {
    id: 'relance-douce-avant-echeance-maroc-2026',
    title: 'Relance avant échéance : prévenir l’impayé sans agresser le client au Maroc',
    tag: 'Gestion & Trésorerie',
    excerpt:
      'Un rappel trois jours avant la date de paiement augmente les règlements à temps. Ton et canal importent.',
    body: `Attendre le jour J pour relancer place le client en position défensive. Un message court trois jours avant — « nous nous assurons que la facture est bien parvenue » — ouvre la porte à une question sans accusation.

Au Maroc, le relationnel prime : le ton professionnel et chaleureux préserve le partenariat commercial.

Automatiser ce type de rappel depuis la facturation garantit qu’aucun dossier ne passe à travers les mailles.

INVOOffice aide à suivre échéances et factures pour structurer les relances avant retard.`,
  },
  {
    id: 'multilingue-facture-client-etranger-maroc-2026',
    title: 'Facture bilingue français–anglais pour client étranger : utile ou superflu au Maroc ?',
    tag: 'Facturation',
    excerpt:
      'Export de services : parfois une version anglaise rassure. Attention à ne pas créer deux versions contradictoires.',
    body: `Les PME marocaines qui vendent à des clients en Europe ou au Moyen-Orient envoient parfois une facture avec libellés bilingues. L’objectif est la clarté, pas le double juridique : une seule vérité sur les montants et la TVA.

Si deux langues sont utilisées, la version française peut rester la référence officielle avec mention explicite.

Les modèles dupliqués à la main divergent vite ; un modèle unique avec champs bilingues est plus sûr.

INVOOffice permet d’adapter les modèles de documents pour les entreprises marocaines à clientèle internationale.`,
  },
  {
    id: 'agence-location-saison-touristique-maroc-2026',
    title: 'Agence de location au Maroc : préparer la saison touristique sans saturer le parc',
    tag: 'Location auto',
    excerpt:
      'Surcharge estivale : surbooking et véhicules mal préparés coûtent cher en réputation. Anticipation maintenance et pré-réservations.',
    body: `Les mois forts au Maroc remplissent les agences de location ; la tentation est de promettre plus de voitures que le parc ne peut tenir. La maintenance préventive avant la saison réduit les pannes en pleine location.

Les pré-réservations doivent être visibles sur un seul calendrier — pas sur trois fichiers.

Une marge de véhicules « tampon » ou des partenariets avec d’autres agences sécurisent le pic.

INVOORent Pro centralise réservations et état du parc pour les agences marocaines qui préparent la haute saison.`,
  },
  {
    id: 'snack-maroc-pointe-midi-caisse-2026',
    title: 'Snack au Maroc : absorber la pointe du midi sans file interminable',
    tag: 'POS & Caisse',
    excerpt:
      'Préparation, menu du jour limité, caisse rapide : trois leviers pour le rush de 12 h à 14 h.',
    body: `Le client du snack marocain veut manger vite et repartir. Si la cuisine n’a pas préparé en amont ou si la caisse bloque sur une option, la file s’allonge et les ventes perdues s’accumulent.

Limiter le menu du jour à des plats exécutables en volume évite l’effet « tout le monde commande le plat le plus long ».

Deux personnes caisse aux heures de pointe coûtent moins qu’une dizaine de clients partis frustrés.

INVOOCoffee est pensé pour des encaissements rapides et un suivi des pics pour ajuster l’organisation du snack au Maroc.`,
  },
  {
    id: 'digitalisation-etape-par-etape-pme-maroc-2026',
    title: 'Digitaliser une PME marocaine par étapes : facturation d’abord, le reste ensuite',
    tag: 'Stratégie',
    excerpt:
      'Tout changer d’un coup échoue souvent. Commencer par la facturation et le suivi client crée une base pour le reste.',
    body: `Beaucoup de dirigeants marocains veulent « une transformation digitale » complète et repoussent le projet parce qu’il semble énorme. Découper en étapes — d’abord factures et devis unifiés, puis stock, puis caisse — donne des victoires rapides.

La première étape doit être utilisée quotidiennement par l’équipe ; sinon la motivation retombe.

Un outil local et simple à adopter réduit la résistance au changement.

INVOOffice sert de socle facturation pour les PME marocaines qui avancent progressivement vers plus de digitalisation.`,
  },
];

function escapeCsvField(s) {
  const t = String(s);
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

const header = ['id', 'title', 'date', 'tag', 'excerpt', 'body', 'published'];
const lines = [header.join(',')];

rows.forEach((r, idx) => {
  const date = dateFr(idx);
  const published = '';
  const fields = [r.id, r.title, date, r.tag, r.excerpt, r.body, published].map(escapeCsvField);
  lines.push(fields.join(','));
});

writeFileSync(out, lines.join('\n'), 'utf8');
console.log('Wrote', out, '—', rows.length, 'articles, dates 11/04 →', dateFr(rows.length - 1));
