# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LevelUp Waterloo — a full-stack app for discovering volunteering opportunities and extracurricular activities for students in the Waterloo region. Built with React Native (Expo) + Express.js + tRPC + MySQL (Drizzle ORM).

## Commands

```bash
pnpm dev              # Run backend + frontend concurrently
pnpm dev:server       # Backend only (Express, port 3000)
pnpm dev:metro        # Frontend only (Expo web, port 8081)
pnpm build            # Production build (esbuild for backend, Expo export for frontend)
pnpm start            # Run production build
pnpm test             # Run vitest suite
pnpm check            # TypeScript type checking (tsc --noEmit)
pnpm lint             # ESLint (via expo lint)
pnpm format           # Prettier
pnpm db:push          # Generate and run Drizzle migrations
pnpm db:studio        # Open Drizzle Studio GUI
pnpm qr               # Generate QR code for current dev URL
```

Run a single test file: `pnpm test -- tests/auth.logout.test.ts` (or `pnpm vitest run <file>`). Vitest picks up suites in `tests/`, `server/routers/__tests__/`, and `server/schedulers/__tests__/`.

Admin operations have a CLI alternative to the in-app dashboard: `tsx scripts/admin-cli.ts <add|update|inactivate|delete|stats|expire-all|list>`.

## Architecture

### Dual-directory structure

The repo has **three** copies of the codebase at different stages:

- **Root level** (`server/`, `app/`, `lib/`, `drizzle/`, `shared/`) — the active codebase used by root `package.json` scripts
- **`backend/`** and **`frontend/`** — refactored standalone packages with their own `package.json` files (legacy, not actively used)
- **`demo/`** — frontend-only snapshot with its own `package.json` and `dist/` build (for showcase/screenshots, not part of the dev loop)

The root-level `pnpm dev` uses `server/_core/index.ts` as the backend entry point and Expo Router from `app/` for the frontend.

### Backend (Express + tRPC)

- **Entry point**: `server/_core/index.ts` — Express app with CORS, tRPC middleware at `/api/trpc`, health check at `/api/health`, OAuth routes, scheduler initialization
- **Router**: `server/routers.ts` — main `appRouter` composing sub-routers: `system`, `auth`, `opportunities`, `admin`, `import`
  - `server/routers/admin.ts` — admin-only CRUD procedures (addOpportunity, updateOpportunity, deleteOpportunity, listAll, getStatistics, inactivateAllExpired)
  - `server/routers/import.ts` — bulk import utilities (importCSV, importJSON, getCSVTemplate, exportCSV)
- **Database layer**: `server/db.ts` — query functions using Drizzle ORM (lazy DB initialization to support local tooling without a database)
- **tRPC setup**: `server/_core/trpc.ts` — SuperJSON transformer, exports `publicProcedure`, `protectedProcedure`, `adminProcedure`
- **Services**: `server/services/email-service.ts` — nodemailer-based deadline reminder emails (Ethereal for dev, SendGrid for prod)
- **Schedulers**: `server/schedulers/` — cron-based background jobs
  - `expiration-scheduler.ts` — marks expired opportunities as inactive
  - `reminder-scheduler.ts` — sends deadline reminder emails
- **Utilities**: `server/utils/import-opportunities.ts` — CSV/JSON parsing and validation for bulk imports
- **Schema**: `drizzle/schema.ts` — 6 MySQL tables: `users`, `opportunities`, `submissions`, `userInterests`, `emailNotifications`, `bookmarks`

### Frontend (Expo Router + NativeWind)

- **Routing**: File-based via Expo Router in `app/` — 2-tab layout (`(tabs)/index.tsx` Home, `(tabs)/bookmarks.tsx` Bookmarks) plus `opportunity/[id].tsx` detail screen, `admin.tsx` admin dashboard, `oauth/callback.tsx`, `dev/theme-lab.tsx`
- **Providers** (in `app/_layout.tsx`): GestureHandlerRootView, BookmarkProvider (AsyncStorage-backed), tRPC + React Query, ThemeProvider, SafeAreaProvider
- **tRPC client**: `lib/trpc.ts` — uses `httpBatchLink` with SuperJSON (transformer must be inside `httpBatchLink` for tRPC v11)
- **Styling**: NativeWind (Tailwind CSS for React Native), theme tokens in `theme.config.js`
- **Bookmarks**: `lib/bookmark-context.tsx` — local-only via AsyncStorage, no server sync (DB `bookmarks` table exists but is unused by client)
- **Core libs**: `lib/_core/` — api client setup, auth utilities, theme config, runtime initialization

### Path aliases

- `@/*` → project root
- `@shared/*` → `shared/`

### Environment variables

**Backend (required):** `DATABASE_URL` (MySQL connection string), `NODE_ENV`, `PORT` (default 3000).

**Backend (optional):** `VITE_APP_ID`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `SENDGRID_API_KEY` (production email).

**Frontend (Expo public):** `EXPO_PUBLIC_OAUTH_PORTAL_URL`, `EXPO_PUBLIC_OAUTH_SERVER_URL`, `EXPO_PUBLIC_APP_ID`, `EXPO_PUBLIC_OWNER_OPEN_ID`, `EXPO_PUBLIC_OWNER_NAME`, `EXPO_PUBLIC_API_BASE_URL`.

### Category enums

Shared across `opportunities`, `submissions`, and `userInterests` tables: `extracurricular`, `grant`, `stem_competition`, `sports`, `volunteering`, `other`. Adding a category requires updating all three table definitions in `drizzle/schema.ts`.
