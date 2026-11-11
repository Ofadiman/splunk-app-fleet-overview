# Fleet Overview

A Splunk app (`fleet_overview`) built with Vite, React, TypeScript and the Splunk UI design system.
It started from `npx @splunk/create --mode=standalone` and adds the Splunk app packaging on top.

## Prerequisites

- Node.js 22 or higher
- pnpm 11 (pinned in `package.json` under `packageManager`)
- Docker, for the local Splunk instance

## Getting started

1. Install dependencies:

    ```bash
    pnpm install
    ```

2. Create a `.env` file next to `compose.yaml` with an admin password for the local Splunk:

    ```bash
    printf 'SPLUNK_PASSWORD=%s\n' "$(openssl rand -hex 16)" > .env
    ```

    If ports 8000 or 8089 are taken on your machine, add `SPLUNK_WEB_PORT` and `SPLUNK_MGMT_PORT`
    to `.env` with free ports.

3. Build the app once, so `stage/` exists before the container mounts it:

    ```bash
    pnpm build
    ```

4. Start Splunk:

    ```bash
    docker compose up --detach
    ```

    The first start takes several minutes. Wait until `docker compose ps` shows the container as
    `healthy`, then open `http://localhost:8000/en-US/app/fleet_overview/overview` (or your
    `SPLUNK_WEB_PORT`) and log in as `admin` with the password from `.env`.

## Development

Run `pnpm dev` to rebuild `stage/` on every change, then refresh the page in Splunk.

- Splunk caches static files. If the browser keeps the old JavaScript, open
  `http://localhost:8000/en-US/_bump` and press the button to clear the cache.
- Splunk reads `.conf` and view files at startup. After changing files in `splunk/`, run
  `pnpm build` and `docker compose restart`.

## Scripts

- `pnpm dev` - Rebuild the app into `stage/` on every change
- `pnpm build` - Type-check and build the app into `stage/`
- `pnpm package` - Build and create `dist/fleet_overview.tar.gz`, installable in Splunk
- `pnpm test` - Run tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run ESLint and Stylelint checks
- `pnpm eslint` / `pnpm eslint:fix` - Run ESLint, optionally fixing issues
- `pnpm stylelint` - Run Stylelint on source files
- `pnpm format` / `pnpm format:verify` - Format code with Prettier, or check formatting

## Project structure

```
.
├── compose.yaml                 Local Splunk with stage/ mounted as the fleet_overview app
├── scripts/
│   ├── build-pages.mjs          Builds each folder in src/pages into its own page script
│   └── package-app.mjs          Packs stage/ into dist/fleet_overview.tar.gz
├── splunk/                      Splunk app files, copied as-is into stage/
│   ├── default/app.conf
│   ├── default/data/ui/nav/default.xml
│   ├── default/data/ui/views/overview.xml
│   └── metadata/default.meta
└── src/
    ├── pages/overview/index.tsx Page entry: 1CD theme and the Splunk header via @splunk/react-page
    ├── App.tsx                  Page content
    └── tests/                   Vitest tests
```

## How pages work

Each view uses Splunk's built-in `pages/splunk_ui_app.html` template. That template loads
`appserver/static/pages/<view name>.js` from the app as a classic script, so every folder in
`src/pages/` is built separately into one self-contained script named after the folder.

To add a page:

1. Create `src/pages/<name>/index.tsx`.
2. Create `splunk/default/data/ui/views/<name>.xml` with `template="pages/splunk_ui_app.html"`.
3. Add `<view name="<name>" />` to `splunk/default/data/ui/nav/default.xml`.

## Theme

Pages render with the 1CD theme: the Prisma family with `unstable_splunk1cdThemeCustomizer` from
`@splunk/themes`. The color scheme follows the user's Splunk theme preference (light or dark).
