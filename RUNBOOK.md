# Plan de Rollback — Rythmons

## Niveaux de sévérité

| Niveau | Symptôme | Délai cible |
|---|---|---|
| P1 — Critique | Plateforme inaccessible / données corrompues | < 15 min |
| P2 — Majeur | Fonctionnalité clé cassée en prod | < 1h |
| P3 — Mineur | Bug non bloquant introduit par un déploiement | < 24h |

---

## Procédure 1 — Rollback applicatif (Vercel)

**Quand :** régression de code, bug introduit par le dernier déploiement,
sans changement de schéma DB.

**Qui :** tout membre ayant accès au projet Vercel.

**Étapes :**

# Option A — Via CLI (recommandé en urgence)
vercel rollback --scope=rythmons

# Option B — Via dashboard
# 1. Ouvrir https://vercel.com/rythmons
# 2. Onglet "Deployments"
# 3. Trouver le dernier déploiement stable (indicateur vert)
# 4. Cliquer "..." → "Promote to Production"

**Vérification :**
curl https://rythmons.vercel.app/api/trpc/healthCheck
# Réponse attendue : "OK"

---

## Procédure 2 — Rollback de migration Prisma

**Quand :** une migration a introduit un changement de schéma problématique
(colonne supprimée, contrainte trop stricte, type modifié).

**Qui :** développeur avec accès DATABASE_URL de production.

**Étapes :**

# 1. Identifier la migration à annuler
ls packages/db/prisma/migrations/
# Ex : 20260301120000_add_fee_columns

# 2. Écrire la migration inverse dans un nouveau fichier
# Ex : supprimer les colonnes ajoutées
cat > packages/db/prisma/migrations/20260301130000_revert_fee_columns/migration.sql << 'EOF'
ALTER TABLE "artist" DROP COLUMN IF EXISTS "feeMin";
ALTER TABLE "artist" DROP COLUMN IF EXISTS "feeMax";
ALTER TABLE "artist" DROP COLUMN IF EXISTS "isNegotiable";
EOF

# 3. Appliquer la migration inverse en production
DATABASE_URL=<prod_url> npx prisma migrate deploy

# 4. Rollback applicatif Vercel vers la version compatible
vercel rollback --scope=rythmons

**Note :** grâce à prisma-compat.ts, si la colonne est simplement
absente (pas corrompue), le rollback Vercel seul suffit généralement —
l'application gère les colonnes manquantes sans planter.

---

## Procédure 3 — Rollback Git + redéploiement

**Quand :** plusieurs commits problématiques, impossible de cibler
un build Vercel précis, ou rollback Vercel insuffisant.

**Qui :** développeur avec droits push sur main.

**Étapes :**

# 1. Identifier le dernier commit stable
git log --oneline -20

# 2. Créer un commit de revert propre (préférable à --force)
git revert <commit_hash> --no-commit
git revert <commit_hash_2> --no-commit   # si plusieurs commits
git commit -m "revert: rollback vers état stable du <date>"
git push origin main
# → Vercel redéploie automatiquement

# Si revert impossible (conflits complexes) :
git reset --hard <commit_stable>
git push origin main --force-with-lease  # --force-with-lease, jamais --force

---

## Procédure 4 — Restauration des variables d'environnement

**Quand :** variables d'environnement modifiées accidentellement
ou corrompues sur Vercel.

**Qui :** tout membre ayant accès à .env.production.backup.

**Étapes :**

# 1. Récupérer la config de référence
cat .env.production.backup

# 2. Restaurer via Vercel CLI
vercel env rm DATABASE_URL production      # supprime la valeur actuelle
vercel env add DATABASE_URL production     # resaisit depuis le backup

# Ou en masse via le dashboard Vercel :
# Settings → Environment Variables → éditer chaque variable

# 3. Forcer un redéploiement avec la config restaurée
vercel redeploy --prod

---

## Checklist post-rollback

- [ ] healthCheck répond "OK" : /api/trpc/healthCheck
- [ ] Connexion utilisateur fonctionnelle
- [ ] Création d'un profil artiste ou lieu testée
- [ ] Logs Vercel sans erreur 500
- [ ] Notifier l'équipe du rollback effectué et de la cause
- [ ] Ouvrir une issue GitHub décrivant la régression
- [ ] Planifier le correctif avant tout nouveau déploiement en prod
