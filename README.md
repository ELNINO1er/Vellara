# Vellara Pharma — Plateforme catalogue (prototype)

Plateforme de présentation et de gestion de médicaments pour les professionnels de santé.
**Prototype de démonstration** : produits fictifs, connexion vérifiée côté navigateur, données stockées dans le navigateur.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseigner l'e-mail et l'empreinte du mot de passe admin
npm run dev        # http://localhost:5180
npm test           # tests unitaires (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
```

## Stack

React 19 · TypeScript (strict) · Tailwind CSS 4 · React Router 8 · Vite 8 · Vitest.

## Architecture

```
src/
├── config/brand.ts          Nom provisoire, coordonnées par défaut, listes (formes, professions), limites d'import
├── types/catalog.ts         Modèle de données (Medicine, Category, Laboratory, DocumentSource…)
├── data/seed.ts             Données de démonstration (fictives, sans contenu médical)
├── lib/                     Logique métier pure et testée
│   ├── catalog.ts           Filtres, tri, recherche, liens de partage
│   ├── validation.ts        Règles de validation (brouillon / publication / contact / paramètres)
│   ├── medicineForm.ts      Conversion fiche ↔ formulaire
│   ├── video.ts             Détection YouTube / Vimeo / Dailymotion / fichier → mode d'affichage
│   ├── files.ts             Import d'images et de PDF (contrôles type/poids)
│   └── text.ts, date.ts, palette.ts
├── services/repository.ts   Accès aux données (interface CatalogRepository + implémentation localStorage)
├── store/                   État applicatif (React Context)
│   ├── CatalogContext.tsx   Actions métier : créer, publier, supprimer, référentiels, paramètres…
│   ├── AuthContext.tsx      ⚠️ Connexion de démonstration (vérifiée côté navigateur)
│   └── ToastContext.tsx     Notifications (aria-live)
├── components/
│   ├── ui/                  Design system : Button, Field, Select (liste déroulante accessible), Segmented, Feedback, Icon
│   ├── share/               Dialogue de partage à un médecin
│   ├── brand/               Logo, gélule signature
│   └── product/             Carte, ligne, visuel généré, fiche détaillée, lecteur vidéo
├── layouts/                 Gabarits public et administration (+ garde d'accès)
├── hooks/                   Filtres synchronisés avec l'URL, titre de page
├── pages/public/            Accueil, Catalogue, Fiche, Contact, 404
└── pages/admin/             Connexion, Tableau de bord, Médicaments, Éditeur, Catégories, Laboratoires, Documents & vidéos, Paramètres
```

### Routes

| Public | Administration |
|---|---|
| `/` accueil | `/admin` tableau de bord |
| `/catalogue?q=&categorie=&forme=&laboratoire=&video=&tri=&vue=` | `/admin/medicaments` |
| `/catalogue/:slug` fiche | `/admin/medicaments/nouveau`, `/admin/medicaments/:id` |
| `/contact?produit=:id` | `/admin/categories`, `/admin/laboratoires`, `/admin/documents`, `/admin/parametres` |
| `/partage/:jeton` page du médecin | `/admin/partages` suivi des partages |

Les filtres du catalogue vivent dans l'URL : une recherche filtrée peut être partagée.

## Accès administrateur

Les accès sont définis dans `.env.local` (ignoré par git) : `VITE_ADMIN_EMAIL` et `VITE_ADMIN_PASSWORD_SHA256`
(empreinte SHA-256 du mot de passe, jamais le mot de passe en clair). Session fermée à la fermeture de l'onglet,
blocage de 30 s après 5 échecs. Relancer `npm run dev` après modification du fichier.

## Partage à un médecin

Depuis la liste des médicaments (icône ✈), l'éditeur d'une fiche publiée ou la page **Partages médecins** :
nom, spécialité, e-mail du médecin, message personnalisé et durée de validité (7, 30 ou 90 jours).
Un lien nominatif `/partage/:jeton` (jeton aléatoire de 128 bits) est créé ; le bouton « Envoyer par e-mail »
ouvre la messagerie avec un message prérempli. Le médecin voit une page dédiée : message, fiche complète,
documents et vidéo. L'administration suit le nombre de consultations et peut désactiver un lien.

Prototype : les données restant dans le navigateur, le lien ne s'ouvre que sur le poste qui l'a créé.
En production : jetons stockés côté serveur, envoi d'e-mail transactionnel, journal des consultations.

## Vidéos de démonstration

Liens réels et libres de droits (films ouverts de la Blender Foundation, extrait CC0 de MDN), choisis pour
simuler chaque mode d'affichage : YouTube et Vimeo → lecteur intégré ; fichier `.mp4` → lecture directe ;
page web → bouton d'ouverture. Ils n'ont aucun lien avec les produits fictifs.

## Points clés

- **Identité « Fiery Ocean »** : jetons dans `src/styles/index.css` (`@theme`). Bordeaux `#780000`, rouge `#C1121F`, crème `#FDF0D5`, bleu nuit `#003049`, bleu ciel `#669BBC`. Typographies Archivo (étroite) et IBM Plex Mono.
- **Visuel de repli** : sans photo, ou si l'image ne se charge pas, un étui de médicament est généré aux couleurs de la catégorie.
- **Vidéo** : lecteur intégré pour YouTube (domaine sans cookies), Vimeo et Dailymotion, chargé seulement au clic. Lecture directe des fichiers `.mp4`/`.webm`. Bouton d'ouverture pour les autres liens. Section masquée sans lien.
- **Contenus médicaux** : uniquement des espaces réservés « À renseigner à partir de la documentation validée ». Aucune posologie, efficacité ou autorisation n'est inventée.
- **Accessibilité** : libellés reliés aux champs, messages d'erreur annoncés, focus visible, dialogues natifs `<dialog>` (focus piégé, Échap), navigation clavier, lien d'évitement, mouvement réduit respecté.
- **Sécurité éditoriale** : alerte avant de quitter une fiche non enregistrée ; une catégorie ou un laboratoire utilisé ne peut pas être supprimé.

## Passage en production

1. **Authentification serveur** (SSO/OIDC ou e-mail + MFA), session `httpOnly`, rôles vérifiés côté API (éditeur, validateur, administrateur). Remplacer `store/AuthContext.tsx`.
2. **API + base de données** : implémenter `CatalogRepository` (`services/repository.ts`) sur une API. Les pages et composants n'ont pas à changer.
3. **Stockage des fichiers** : remplacer les data URL (`lib/files.ts`) par un envoi vers un stockage objet avec analyse antivirus.
4. **Circuit de validation** : relecture médicale/réglementaire avant publication, historique des versions, journal d'audit.
5. **Formulaire de contact** : envoi réel (e-mail/CRM), conformité RGPD (mentions, durée de conservation).
6. Rendu serveur ou pré-rendu des fiches publiques pour le référencement et le partage.
