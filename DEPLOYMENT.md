# Production Deployment

The root app is deployed as two services:

- Expo web frontend on EAS Hosting.
- Express/tRPC backend and MySQL on Railway.

## Railway

Create a Railway project with:

1. A service connected to this GitHub repository.
2. A Railway MySQL database in the same project.
3. The repository root as the service root directory.

Required service variables:

```text
DATABASE_URL=${{MySQL.MYSQL_URL}}
NODE_ENV=production
JWT_SECRET=<random-secret>
CORS_ORIGINS=*
OPPORTUNITY_DISCOVERY_ENABLED=true
OPPORTUNITY_DISCOVERY_CRON=0 10 * * *
OPPORTUNITY_DISCOVERY_RUN_ON_STARTUP=false
OPPORTUNITY_DISCOVERY_AUTO_APPROVE=false
```

Optional authentication and integration variables:

```text
VITE_APP_ID=
OAUTH_SERVER_URL=
OWNER_OPEN_ID=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
SENDGRID_API_KEY=
EMAIL_FROM=
```

Run database migrations and the verified import against the Railway database:

```bash
DATABASE_URL="<railway-mysql-url>" pnpm db:push
DATABASE_URL="<railway-mysql-url>" pnpm exec tsx scripts/import-verified-opportunities.ts
```

The API health check is `/api/health`.

## EAS Hosting

Configure the Expo production environment:

```text
EXPO_PUBLIC_API_BASE_URL=<Railway-service-URL>
```

Add the OAuth-related `EXPO_PUBLIC_*` variables when OAuth is configured.

Deploy:

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli deploy --environment production
```

After EAS returns the production URL, replace Railway `CORS_ORIGINS=*` with that
exact origin and redeploy the Railway service.
