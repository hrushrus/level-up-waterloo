# LevelUp Waterloo - Backend API

Express.js + tRPC backend API for the LevelUp Waterloo app.

## Quick Start

### Development

```bash
pnpm install
pnpm dev
```

Server runs on `http://localhost:3000`

### Production Build

```bash
pnpm build
pnpm start
```

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@host:3306/database
API_URL=https://levelup-api.render.com
FRONTEND_URL=https://levelup-waterloo.vercel.app
CORS_ORIGIN=https://levelup-waterloo.vercel.app
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/trpc/opportunities.list` - List all opportunities
- `POST /api/trpc/opportunities.byCategory` - Filter by category
- `POST /api/trpc/opportunities.search` - Search opportunities
- `POST /api/trpc/opportunities.byId` - Get single opportunity

## Database

### Setup

```bash
pnpm db:push
```

### Studio (GUI)

```bash
pnpm db:studio
```

## Deployment

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables
4. Build command: `pnpm install && pnpm build`
5. Start command: `NODE_ENV=production node dist/index.js`

See `../DEPLOYMENT_GUIDE.md` for detailed instructions.

## Project Structure

```
backend/
├── server/
│   ├── _core/
│   │   ├── index.ts       ← Server entry point
│   │   ├── context.ts     ← tRPC context
│   │   ├── oauth.ts       ← OAuth routes
│   │   └── trpc.ts        ← tRPC setup
│   ├── db.ts              ← Database queries
│   ├── routers.ts         ← tRPC procedures
│   └── storage.ts         ← File storage
├── drizzle/
│   ├── schema.ts          ← Database schema
│   └── migrations/        ← Database migrations
├── shared/
│   ├── const.js           ← Shared constants
│   └── _core/
│       └── errors.js      ← Error types
└── package.json
```

## Technologies

- **Framework**: Express.js
- **API**: tRPC
- **Database**: MySQL + Drizzle ORM
- **Language**: TypeScript
- **Build**: esbuild

## Troubleshooting

### Port Already in Use

The server automatically finds an available port if 3000 is busy.

### Database Connection Failed

Check `DATABASE_URL` environment variable and ensure database is running.

### CORS Errors

Update `CORS_ORIGIN` environment variable to match your frontend URL.

## Support

See `../DEPLOYMENT_GUIDE.md` for deployment help.
