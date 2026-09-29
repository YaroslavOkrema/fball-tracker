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

## Code quality

[Biome](https://biomejs.dev/) is the project's formatter and linter for TypeScript,
TSX, JavaScript, CSS, and JSON configuration files.

```bash
npm run format
npm run lint
npm run check
npm run typecheck
```

- `format` writes formatting changes.
- `lint` checks lint rules without changing files.
- `check` checks formatting, lint rules, and import organization without changing
  files. Both `lint` and `check` fail on warnings as well as errors.
- `typecheck` generates Next.js route types before running TypeScript, so it also
  works on a clean checkout.

Biome respects `.gitignore` and excludes dependencies (`node_modules/`), generated
Next.js output (`.next/`, `out/`, and `next-env.d.ts`), the npm lockfile, and preserved
assets. Its settings are in `biome.json`.

Run `npm run check` and `npm run typecheck` before committing. To apply safe lint
and import fixes as well as formatting, use `npm run check -- --write`.

### VS Code and Cursor

Install the recommended `biomejs.biome` extension and open the repository root as
your workspace. The settings in `.vscode/settings.json` enable Biome formatting,
safe fixes, and import organization when explicitly saving supported source and
configuration files (`Cmd+S` / `Ctrl+S`). Diagnostics appear while editing;
auto-save is not required. The extension uses the project's installed Biome.

## Production

```bash
npm run build
npm start
```

`build` creates the production output in `.next/`; `start`
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
