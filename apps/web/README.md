# Rythmons Web - Next.js Full-Stack

Application Next.js full-stack combinant le frontend web et l'API backend.

## 🚀 Stack Technique

- **Framework** : Next.js 15.5 avec Turbopack
- **UI** : Tailwind CSS v4, Radix UI, shadcn/ui
- **API** : tRPC v11 (type-safe API)
- **Auth** : Better Auth (email/password, sessions, cookies)
- **Database** : PostgreSQL avec Prisma ORM
- **Mobile Support** : API compatible Expo avec Better Auth Expo plugin

## 📦 Installation

```bash
pnpm install
```

## 🔧 Configuration

Créer un fichier `.env` :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rythmons"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key-here"

# CORS (pour l'app mobile uniquement)
CORS_ORIGIN="exp://,rythmons://
```

## 🗄️ Database

```bash
# Générer le client Prisma
pnpm db:generate

# Appliquer les migrations committees
pnpm db:deploy

# Pousser le schéma vers la DB
pnpm db:push

# Pousser le schéma puis seed en une seule commande
pnpm db:setup

# Lancer Prisma Studio
pnpm db:studio

# Créer une migration
pnpm db:migrate

# Seed de demo locale
pnpm db:seed
```

Workflow recommande pour les changements de schema :

1. Modifiez `packages/db/prisma/schema.prisma`.
2. Lancez `pnpm db:migrate` pour generer une migration versionnee.
3. Committez le contenu de `packages/db/prisma/migrations/`.
4. Laissez le deploy executer `pnpm db:deploy` avant le build.

Gardez `pnpm db:push` pour initialiser une base locale ou pour du prototypage rapide. Ne l'utilisez pas comme mecanisme principal pour la production.

Le seed cree des comptes de demo reutilisables :

```text
demo.artist@rythmons.local / Rythmons123!
demo.organizer@rythmons.local / Rythmons123!
demo.both@rythmons.local / Rythmons123!
```

## 💻 Développement

```bash
pnpm dev
```

L'application sera disponible sur http://localhost:3000

## 🏗️ Build

```bash
pnpm build
pnpm start
```

## 📁 Structure

```
src/
├── app/              # Pages Next.js (App Router)
│   ├── api/         # Routes API (Better Auth)
│   ├── dashboard/   # Pages dashboard
│   ├── login/       # Page de connexion
│   ├── layout.tsx   # Layout principal
│   └── page.tsx     # Page d'accueil
├── components/      # Composants React
│   └── ui/         # Composants UI (shadcn)
├── lib/            # Utilitaires
│   ├── auth.ts     # Configuration Better Auth (server)
│   ├── auth-client.ts  # Client Better Auth
│   ├── context.ts  # Context tRPC
│   └── trpc.ts     # Configuration tRPC (server)
├── routers/        # Routers tRPC
│   └── index.ts    # Router principal
├── utils/          # Utilitaires
│   └── trpc.ts     # Client tRPC
├── db/             # Prisma client
└── index.css       # Styles globaux

prisma/
└── schema/         # Schémas Prisma
```

## 🔐 Authentification

### Routes API
- `POST /api/auth/sign-up` - Créer un compte
- `POST /api/auth/sign-in/email` - Se connecter
- `POST /api/auth/sign-out` - Se déconnecter
- `GET /api/auth/session` - Obtenir la session

### Client
```typescript
import { authClient } from "@/lib/auth-client";

// Sign up
await authClient.signUp.email({
  email: "user@example.com",
  password: "password",
  name: "User Name"
});

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "password"
});

// Sign out
await authClient.signOut();
```

## 📡 tRPC

### Définir une procédure (server)
```typescript
// src/routers/index.ts
export const appRouter = router({
  healthCheck: publicProcedure.query(() => true),
  
  getUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
});
```

### Appeler depuis le client
```typescript
import { trpc } from "@/utils/trpc";

function MyComponent() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  
  return <div>{healthCheck.data ? "✓" : "✗"}</div>;
}
```

## 📱 Support Mobile

L'API est compatible avec l'application mobile Expo via :
- CORS configuré pour les routes `/api` et `/trpc`
- Better Auth Expo plugin
- Support des schemes personnalisés (exp://, rythmons://)

## 🎨 UI Components

Utilise shadcn/ui pour les composants :

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

## 🔄 Migration

Ce projet est le résultat de la fusion de `apps/web` et `apps/server`.

Voir [MIGRATION_FULLSTACK.md](../../docs/MIGRATION_FULLSTACK.md) pour plus de détails.

## 📝 Scripts

```json
{
  "dev": "next dev --turbopack",
  "build": "prisma generate && next build",
  "start": "next start",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:seed": "prisma db seed",
  "db:setup": "prisma db push && prisma db seed"
}
```

## 🌐 Déploiement

### Vercel
```bash
vercel
```

### Variables d'environnement (Production)
- `DATABASE_URL`
- `BETTER_AUTH_URL` (URL de production)
- `BETTER_AUTH_SECRET`
- `CORS_ORIGIN` (pour l'app mobile)
