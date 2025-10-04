# Rythmons

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Next, TRPC, and more.

## Features

- **TypeScript** – End-to-end type safety
- **Next.js** – Full-stack React framework powering the web app and API
- **React Native + Expo** – Shared mobile experience built with Expo Router
- **TailwindCSS** – Utility-first styling for fast iteration
- **shadcn/ui** – Reusable Radix-powered UI components
- **tRPC** – Type-safe client ↔ server contracts
- **Prisma** – TypeScript-first ORM for PostgreSQL
- **PostgreSQL** – Primary relational database
- **Better Auth** – Auth flows with Expo integration
- **Biome** – Unified linting and formatting
- **Husky** – Git hooks for code quality
- **PWA Support** – Progressive Web App enhancements
- **Turborepo** – Monorepo build and task orchestration

## Getting Started

### Prerequisites

- PostgreSQL 15 or newer
- [pnpm](https://pnpm.io/) (see `packageManager` in `package.json` for the recommended version)

### Setup

1. Install dependencies:

    ```bash
    pnpm install
    ```

2. Create the web app environment file by copying `apps/web/.env.example` to `apps/web/.env`, then fill in the required variables. At a minimum you should provide:

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/rythmons"
    BETTER_AUTH_URL="http://localhost:3000"
    BETTER_AUTH_SECRET="replace-with-a-strong-secret"
    CORS_ORIGIN="exp://,mybettertapp://"
    ```

3. Set up the database schema:

    ```bash
    pnpm db:push
    ```

4. Start the development servers:

    ```bash
    pnpm dev
    ```

    - Web app + API: [http://localhost:3000](http://localhost:3000)
    - Expo development server (on device or simulator): start the Expo Go app after the command above.

Need to work on a single app? Use `pnpm dev:web` or `pnpm dev:native`.


## Project Structure

```
Rythmons/
├── apps/
│   ├── web/         # Next.js full-stack app (frontend + API routes)
│   └── native/      # Expo / React Native mobile app
├── docs/            # Product, UX, and technical documentation
└── packages/        # Shared packages (if/when added)
```

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm check`: Run Biome formatting and linting
- `pnpm dev:web`: Start only the web application
- `pnpm dev:native`: Start the React Native/Expo development server
- `pnpm db:push`: Push schema changes to the database
- `pnpm db:studio`: Open Prisma Studio in the web app
- `pnpm db:generate`: Generate the Prisma client
- `pnpm db:migrate`: Run Prisma migrations in dev mode
- `pnpm deploy`: Deploy the web app preview to Vercel
- `pnpm deploy:prod`: Deploy the web app to production on Vercel

For more in-depth guidance, including API usage and authentication flows, see `apps/web/README.md` and the documents inside `docs/`.
