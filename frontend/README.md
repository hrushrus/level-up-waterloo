# LevelUp Waterloo - Frontend Web App

React Native web app for the LevelUp Waterloo project.

## Quick Start

### Development

```bash
pnpm install
pnpm dev
```

App runs on `http://localhost:8081`

### Production Build

```bash
pnpm build
pnpm start
```

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=https://levelup-api.render.com
```

## Features

- 🏠 **Home Screen** - Browse opportunities with category filtering
- 🔍 **Search** - Real-time search with recent searches
- ❤️ **Bookmarks** - Save favorite opportunities
- 📄 **Details** - Full opportunity information with deadlines
- 🎯 **Advanced Filters** - Level, type, duration filtering
- 📊 **Sorting** - Sort by newest, deadline, or alphabetical

## Deployment

### Deploy to Vercel

1. Create account at https://vercel.com
2. Connect your GitHub repository
3. Set environment variable: `VITE_API_URL = https://levelup-api.render.com`
4. Deploy

See `../DEPLOYMENT_GUIDE.md` for detailed instructions.

## Project Structure

```
frontend/
├── app/
│   ├── _layout.tsx        ← Root layout with providers
│   └── (tabs)/
│       ├── _layout.tsx    ← Tab navigation
│       ├── index.tsx      ← Home screen
│       ├── search.tsx     ← Search screen
│       └── saved.tsx      ← Bookmarks screen
├── components/
│   ├── screen-container.tsx
│   ├── themed-view.tsx
│   └── ui/
│       └── icon-symbol.tsx
├── hooks/
│   ├── use-colors.ts
│   ├── use-color-scheme.ts
│   └── use-auth.ts
├── lib/
│   ├── trpc.ts            ← tRPC client
│   ├── bookmark-context.tsx ← Bookmarks state
│   └── utils.ts
├── constants/
│   └── theme.ts
└── assets/
    └── images/
```

## Technologies

- **Framework**: React Native with Expo
- **Routing**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **API**: tRPC Client
- **State**: React Context + AsyncStorage
- **Language**: TypeScript

## Troubleshooting

### Build Fails on Vercel

Check that `VITE_API_URL` environment variable is set correctly.

### API Calls Fail

Ensure backend is running and `VITE_API_URL` points to correct backend URL.

### Styling Issues

Clear cache and rebuild:
```bash
rm -rf .expo dist node_modules
pnpm install
pnpm build
```

## Support

See `../DEPLOYMENT_GUIDE.md` for deployment help.
