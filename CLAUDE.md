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
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm db:push          # Generate and run Drizzle migrations
pnpm db:studio        # Open Drizzle Studio GUI
```

## Architecture

### Dual-directory structure

The repo has **two copies** of the codebase at different stages of refactoring:

- **Root level** (`server/`, `app/`, `lib/`, `drizzle/`, `shared/`) — the active codebase used by root `package.json` scripts
- **`backend/`** and **`frontend/`** — refactored standalone packages with their own `package.json` files

The root-level `pnpm dev` uses `server/_core/index.ts` as the backend entry point and Expo Router from `app/` for the frontend.

### Backend (Express + tRPC)

- **Entry point**: `server/_core/index.ts` — Express app with CORS, tRPC middleware at `/api/trpc`, health check at `/api/health`, OAuth routes
- **Router**: `server/routers.ts` — defines all tRPC procedures (`system`, `auth.me`, `auth.logout`, `opportunities.list/byCategory/search/byId`)
- **Database layer**: `server/db.ts` — query functions using Drizzle ORM (`getAllOpportunities`, `searchOpportunities`, etc.)
- **tRPC setup**: `server/_core/trpc.ts` — SuperJSON transformer, exports `publicProcedure`, `protectedProcedure`, `adminProcedure`
- **Schema**: `drizzle/schema.ts` — 4 MySQL tables: `users`, `opportunities`, `submissions`, `userInterests`

### Frontend (Expo Router + NativeWind)

- **Routing**: File-based via Expo Router v6 in `app/` — 3-tab layout (`(tabs)/index.tsx`, `search.tsx`, `saved.tsx`) plus `opportunity/[id].tsx` detail screen
- **Providers** (in `app/_layout.tsx`): tRPC + React Query, BookmarkProvider (AsyncStorage-backed), ThemeProvider, SafeAreaProvider
- **tRPC client**: `lib/trpc.ts` — uses `httpBatchLink` with SuperJSON (transformer must be inside `httpBatchLink` for tRPC v11)
- **Styling**: NativeWind (Tailwind CSS for React Native), theme tokens in `theme.config.js`
- **Bookmarks**: `lib/bookmark-context.tsx` — local-only via AsyncStorage, no server sync

### Path aliases

- `@/*` → project root
- `@shared/*` → `shared/`

### Environment variables

Backend requires: `DATABASE_URL` (MySQL connection string), `NODE_ENV`, `PORT` (default 3000). Optional: `VITE_APP_ID`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`.

### Category enums

Shared across `opportunities`, `submissions`, and `userInterests` tables: `extracurricular`, `grant`, `stem_competition`, `sports`, `volunteering`, `other`. Adding a category requires updating all three table definitions in `drizzle/schema.ts`.
