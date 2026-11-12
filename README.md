# Fleet Overview

A Splunk app (`fleet_overview`) built with Vite, React, TypeScript and the Splunk UI design system.
It started from `npx @splunk/create --mode=standalone` and adds the Splunk app packaging on top.

## Prerequisites

- [mise](https://mise.jdx.dev). It installs the versions pinned in `mise.toml`: Node.js (latest
  LTS), pnpm, and the AppInspect tooling (Python, uv, jq and libmagic).
- Docker, for the local Splunk instance

## Getting started

1. Install the pinned tools and the dependencies (run `mise trust` first if mise asks you to trust
   `mise.toml`):

    ```bash
    mise install
    pnpm install
    ```

2. If ports 8000 or 8089 are taken on your machine, create a `.env` file next to `compose.yaml`
   with free ports:

    ```bash
    printf 'SPLUNK_WEB_PORT=18000\nSPLUNK_MGMT_PORT=18089\n' > .env
    ```

3. Build the app once, so `fleet_overview/` exists before the container mounts it:

    ```bash
    pnpm build
    ```

4. Start Splunk:

    ```bash
    docker compose up --detach --renew-anon-volumes
    ```

    Each start sets up Splunk from scratch, which takes about two minutes. Wait until
    `docker compose ps` shows the container as `healthy`, then open
    `http://localhost:8000/en-US/app/fleet_overview/overview` (or your `SPLUNK_WEB_PORT`) and log
    in as `admin` with the password `password`.

5. Stop Splunk and delete everything it stored:

    ```bash
    docker compose down --volumes
    ```

The container keeps no state between runs. Splunk's configuration and data live in unnamed volumes
that the image itself declares. `--renew-anon-volumes` replaces them on every start, and
`--volumes` deletes them on stop, so they don't pile up on disk. `docker compose restart` keeps
them, so a restart within one run keeps your data.

The container runs a small image built from `Dockerfile` on top of `splunk/splunk`. It creates
`/opt/splunk/etc/apps` owned by the `splunk` user, so Splunk can still install its built-in apps
next to the mounted `fleet_overview`. Compose builds it on the first start. After changing the
Dockerfile, add `--build` to the start command.

## Development

Run `pnpm dev` to rebuild `fleet_overview/` on every change, then refresh the page in Splunk.

- Splunk caches static files. If the browser keeps the old JavaScript, open
  `http://localhost:8000/en-US/_bump` and press the button to clear the cache.
- Splunk reads `.conf` and view files at startup. After changing files in `splunk/`, run
  `pnpm build` and `docker compose restart`.

## Scripts

- `pnpm dev` - Rebuild the app into `fleet_overview/` on every change
- `pnpm build` - Type-check and build the app into `fleet_overview/`
- `pnpm package` - Build and create `dist/fleet_overview.tar.gz`, installable in Splunk
- `pnpm test` - Run tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm format` / `pnpm format:verify` - Format code with Prettier, or check formatting
- `mise run appinspect` - Package the app and validate it with Splunk AppInspect

## Validating with AppInspect

[AppInspect](https://dev.splunk.com/enterprise/docs/developapps/testvalidate/appinspect/) is
Splunk's validator for app packages. Splunk Cloud and Splunkbase run it on every uploaded app.

With the tools from `mise install` in place, package and validate the app:

```bash
mise run appinspect
```

The task builds `dist/fleet_overview.tar.gz`, creates `.venv/` from `uv.lock` if needed, and writes
the full report to `dist/appinspect.json`. It prints failures, errors and warnings, and fails if
AppInspect reports any failure or error.

- uv uses only the repository's `uv.toml`, through `UV_CONFIG_FILE` in `mise.toml`. Your personal
  uv configuration is ignored here, so packages always come from public PyPI.
- libmagic comes from conda-forge through mise. AppInspect finds it through
  `DYLD_FALLBACK_LIBRARY_PATH`, which macOS removes whenever `/bin/sh` starts. That is why the
  task sets it on the AppInspect command itself and runs `.venv/bin/splunk-appinspect` directly.
- To change the AppInspect version, edit `pyproject.toml`, then run `uv lock` inside the repository.

## Project structure

```
.
├── compose.yaml                 Local Splunk with fleet_overview/ mounted as the app
├── Dockerfile                   Splunk image with the apps folder owned by the splunk user
├── .dockerignore                Keeps the repository out of the Docker build
├── mise.toml                    Pinned tools (Node.js, pnpm, AppInspect tooling), appinspect task
├── pyproject.toml, uv.lock      AppInspect and its locked Python dependencies
├── uv.toml                      uv settings for this repository: public PyPI, mise's Python
├── scripts/
│   ├── build-pages.mjs          Builds each folder in src/pages into its own page script
│   └── package-app.mjs          Packs fleet_overview/ into dist/fleet_overview.tar.gz
├── splunk/                      Splunk app files, copied as-is into fleet_overview/
│   ├── default/app.conf
│   ├── default/data/ui/nav/default.xml
│   ├── default/data/ui/views/overview.xml
│   ├── default/data/ui/views/agents.xml
│   └── metadata/default.meta
└── src/
    ├── renderPage.tsx           Renders a page with the 1CD theme and the Splunk header via @splunk/react-page
    ├── pages/overview/index.tsx Overview page entry
    ├── pages/agents/index.tsx   Agents page entry
    ├── App.tsx                  Overview page content
    ├── Agents.tsx               Agents page content
    └── tests/                   Vitest tests
```

## How pages work

Each view uses Splunk's built-in `pages/splunk_ui_app.html` template. That template loads
`appserver/static/pages/<view name>.js` from the app as a classic script, so every folder in
`src/pages/` is built separately into one self-contained script named after the folder.

To add a page:

1. Create `src/pages/<name>/index.tsx` that calls `renderPage` with the page content and title.
2. Create `splunk/default/data/ui/views/<name>.xml` with `template="pages/splunk_ui_app.html"`.
3. Add `<view name="<name>" />` to `splunk/default/data/ui/nav/default.xml`.

## Theme

Pages render with the 1CD theme: the Prisma family with `unstable_splunk1cdThemeCustomizer` from
`@splunk/themes`. The color scheme follows the user's Splunk theme preference (light or dark).
