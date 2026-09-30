# Football Tracker

Web-only foundation built with Next.js App Router, React, and strict TypeScript.
This stage contains a minimal home page; football features are not implemented yet.

## Requirements

- Node.js 24.x (`nvm use` reads `.nvmrc`).
- npm 11.x; the lockfile is maintained with npm 11.13.0.

No environment variables or external services are required.

The planned free-tier football data endpoints, field contract, and required
account-specific smoke check are documented in
[docs/football-data-api-contract.md](docs/football-data-api-contract.md).

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

## UI foundation

Tailwind CSS 4 runs through `@tailwindcss/postcss`. Shared light-theme colors,
spacing, system typography, radii, and keyboard focus styles live in
`src/global.css`. Use semantic utilities such as `bg-primary`,
`text-muted-foreground`, and spacing from Tailwind's 4px scale.

The local shadcn/ui primitives are `Button`, `Sheet`, `Tabs`, and `Skeleton` in
`src/components/ui/`. Their Radix behavior is preserved; `components.json` defines
the project aliases. `cn` from `@/lib/utils` combines conditional classes and
resolves Tailwind conflicts. No theme switcher is included.

```tsx
import { Button } from '@/components/ui/button';
import { FootballLogo } from '@/components/football-logo';

<Button type="button">View matches</Button>
<FootballLogo kind="team" name="Arsenal" src={team.crest} />
<FootballLogo kind="competition" name="Premier League" src={competition.emblem} />
```

`FootballLogo` shows a shield or trophy for missing, empty, or failed image URLs,
keeps a fixed layout footprint, and provides an accessible name. A new source URL
can load after a failure. Small crests use `next/image` with `unoptimized` to
support SVG logos without an image proxy or a global remote-host wildcard.

Compose `Sheet` with a `SheetTrigger`, `SheetContent`, `SheetTitle`, and
`SheetDescription`; put navigation links inside the content and use `SheetClose`
with `asChild` to close on navigation. Radix handles focus trapping, Escape, and
focus restoration. Give icon-only buttons accessible labels and tab lists an
`aria-label`. Skeletons are decorative; announce loading once on their containing
region. Skeleton and sheet animations respect reduced-motion preferences.

## Project structure

- `src/app/layout.tsx`: root HTML layout and page metadata.
- `src/app/page.tsx`: home route (`/`).
- `src/global.css`: Tailwind entry point and shared visual tokens.
- `src/components/ui/`: the four shadcn/ui primitives.
- `src/components/football-logo.tsx`: team and competition image fallbacks.
- `src/lib/utils.ts`: the shadcn/ui class-name helper.
- `assets/`: preserved project images and icons; import assets from source code
  or place files in `public/` when they need a public URL.

The `@/*` alias maps to `src/*`; `@/assets/*` maps to `assets/*`.
Expo and React Native runtime dependencies and platform configuration have been removed.
