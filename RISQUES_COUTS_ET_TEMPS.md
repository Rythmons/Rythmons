# Ce qui peut faire perdre de l’argent et du temps (site + app)

Ce document recense les points du produit et de la stack qui peuvent générer des **coûts** (facturation tierce, hébergement, bande passante) ou du **temps perdu** (modération, support, corrections, abus). Il sert de référence pour la roadmap et les décisions produit.

---

## Coûts directs (argent)

| Source | Où / Comment | Risque |
|--------|--------------|--------|
| **Emails (Resend)** | `packages/auth/src/email/mailer.ts` – vérification compte, mot de passe oublié, reset | Chaque envoi est facturé. Abus : inscriptions en masse, renvoi répété de "mot de passe oublié" ou "renvoyer l’email de vérification" sans limite. |
| **Uploads (UploadThing)** | `apps/web/src/app/api/uploadthing/core.ts` – images 8 Mo max, pas de limite du nombre de fichiers par utilisateur | Stockage et bande passante facturés. Un compte peut multiplier les profils (5 artistes + 5 lieux) et chaque profil : photo, bannière, galerie (`images[]`). Pas de quota global par user. |
| **Base de données** | Prisma / PostgreSQL (hébergeur type Neon, Supabase, etc.) | Croissance des tables (users, artistes, lieux, messages/bookings si Epic 3–4). Comptes fantômes ou spam = données inutiles + coût stockage. |
| **Géocodage** | `packages/api/src/geocode.ts` – API Adresse (data.gouv.fr) | Limite 1 par requête ; à chaque création/édition lieu (ou artiste avec ville/CP). En cas d’abus (création/modif en boucle), possible surcharge ou blocage selon politique du fournisseur. |
| **App native** | Builds, stores, éventuels services (push, etc.) | Coûts liés aux stores et aux outils ; moins sensibles aux abus "contenu" que le web tant qu’on n’expose pas d’upload illimité. |

---

## Temps perdu (modération, support, abus)

| Source | Risque |
|--------|--------|
| **Contenus libres** | Bio, description lieu, fiche technique, message de proposition : spam, insultes, liens malveillants, contenu illégal. Sans modération ni signalement = temps de réaction manuelle et risque juridique. |
| **Liens externes** | URLs Spotify, YouTube, Bandcamp, etc. sur les profils : liens vers du phishing, du contenu choquant ou illégal. Validation côté client (format URL) mais pas de vérification du contenu cible. |
| **Photos / images** | Upload de contenus inappropriés (droits, contenu illégal). UploadThing peut avoir des limites ou TOS ; pas de modération automatique dans l’app. |
| **Comptes multiples** | Un même acteur peut créer plusieurs comptes (email gratuit) pour gonfler des listes, spammer des propositions, ou contourner les limites (5 artistes, 5 lieux). |
| **Extrait audio (non implémenté)** | Si ajouté plus tard : hébergement/streaming, modération du contenu, abus (fichiers énormes, contenu non musical). Décision : ne pas faire en MVP. |
| **Messagerie / notifications (Epic 4)** | Spam de messages, envoi massif de propositions. Sans rate limiting ni quotas = charge serveur + temps de modération/support. |

---

## Ce qui existe déjà (limites actuelles)

- **Artistes** : max 5 par compte (`packages/api/src/routers/artist.ts`).
- **Lieux** : max 5 par compte (`packages/api/src/routers/venue.ts`).
- **Upload** : type image uniquement, 8 Mo max par fichier ; pas de limite sur le nombre d’uploads par utilisateur ou par profil.
- **Auth** : email requis, vérification email (better-auth) ; pas de limite sur "renvoyer l’email" ou "mot de passe oublié".
- **API** : pas de rate limiting global ou par route (recherche, création, édition, etc.).

---

## Pistes de réduction des risques (à prioriser en produit)

- **Emails** : limiter le nombre d’envois par adresse IP ou par email (ex. 1 vérification / 1 reset par 15 min), et/ou capoter les comptes non vérifiés après X jours.
- **Uploads** : quota par utilisateur (ex. X Mo ou Y fichiers par mois) et/ou par profil (ex. 1 photo + 1 bannière + N images galerie max) ; surveiller l’usage UploadThing.
- **Contenus** : limites de longueur en base (bio, description) ; politique de modération et bouton "Signaler" ; modération a posteriori si pas de modération préalable.
- **Abus / spam** : rate limiting sur les routes sensibles (inscription, login, envoi email, création artiste/lieu, envoi message) ; détection de comportement bot (optionnel).
- **Liens** : whitelist de domaines autorisés (spotify.com, youtube.com, etc.) pour les liens musique ; refuser les URLs non listées ou les ouvrir en "noopener" + avertissement.

Ces pistes ne sont pas dans le scope actuel ; ce document sert de référence pour les prochaines itérations.
