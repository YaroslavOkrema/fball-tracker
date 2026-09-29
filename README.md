# Football Tracker

Web-only foundation built with Next.js App Router, React, and strict TypeScript.
This stage contains a minimal home page; football features are not implemented yet.

## Requirements

- Node.js 24.x (`nvm use` reads `.nvmrc`).
- npm 11.x; the lockfile is maintained with npm 11.13.0.

No environment variables or external services are required.

## Local development

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Edit `src/app/page.tsx` to change the home page.

## Verification and production

```bash
npm run typecheck
npm run build
npm start
```

`typecheck` generates Next.js route types before running TypeScript, so it also works
on a clean checkout. `build` creates the production output in `.next/`; `start`
serves that output on port 3000. Stop the development server before starting
production on the same port, or pass `-- --port 3001` to either server command.

## Project structure

- `src/app/layout.tsx`: root HTML layout and page metadata.
- `src/app/page.tsx`: home route (`/`).
- `src/global.css`: base web styles.
- `assets/`: preserved project images and icons; import assets from source code
  or place files in `public/` when they need a public URL.

The `@/*` alias maps to `src/*`; `@/assets/*` maps to `assets/*`.
Expo and React Native runtime dependencies and platform configuration have been removed.
