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

2. Build the app once, so `fleet_overview/` exists before the container mounts it:

    ```bash
    pnpm build
    ```

3. Start Splunk and the [forwarders](#forwarders):

    ```bash
    docker compose up --detach --renew-anon-volumes
    ```

    Each start sets up Splunk from scratch, which takes about two minutes. Wait until
    `docker compose ps` shows the `splunk` container as `healthy`, then open this URL, which logs
    you in as `admin` with the password `password` and opens the app:

    ```
    http://localhost:18000/en-US/account/insecurelogin?username=admin&password=password&return_to=/en-US/app/fleet_overview/overview
    ```

    Bookmark it, because you log in again after every start and restart. Splunk's management port
    is on `https://localhost:18089`. To start Splunk without the forwarders, add `splunk` to the end
    of the command.

4. Stop Splunk and the forwarders, and delete everything they stored:

    ```bash
    docker compose down --volumes
    ```

The containers keep no state between runs. Their configuration and data live in unnamed volumes
that the images themselves declare. `--renew-anon-volumes` replaces them on every start, and
`--volumes` deletes them on stop, so they don't pile up on disk. `docker compose restart` keeps
them, so a restart within one run keeps your data.

Compose builds every image from a target in `Dockerfile` on the first start:

- `splunk` builds on top of `splunk/splunk`. It sets the environment variables that accept the
  license and set the `admin` password, and copies `docker/splunk.yml` into the image. It also
  creates `/opt/splunk/etc/apps` owned by the `splunk` user, so Splunk can still install its
  built-in apps next to the mounted `fleet_overview`.
- `splunkforwarder` builds on top of `splunk/universalforwarder`, in the version from the
  `SPLUNKFORWARDER_VERSION` build argument. It sets the same license and password variables, turns
  the `CLIENT_NAME` and `INSTANCE_NAME` build arguments into environment variables, writes the
  `GUID` build argument to `instance.cfg`, and copies `docker/splunkforwarder.yml` into the image.

After changing `Dockerfile` or a file in `docker/`, add `--build` to the start command.

`docker/splunk.yml` also keeps you logged in to Splunk Web for the whole run:

- `ui_inactivity_timeout = 0` in `[settings]` of `web.conf` keeps the session alive for as long as
  a Splunk tab is open.
- `tools.sessions.timeout = 525600` in `[settings]` of `web.conf` and `sessionTimeout = 365d` in
  `[general]` of `server.conf` keep it alive for a year with no tab open. Browsers keep a cookie for
  at most 400 days, so a longer timeout wouldn't last any longer.

Splunk forgets every session when it restarts, so you still log in after each start and each
`docker compose restart`. `enable_insecure_login = true` in `[settings]` of `web.conf` turns on the
`/account/insecurelogin` URL from [Getting started](#getting-started), which logs you in with the
user name and password in the URL. Only use it locally: Splunk Web listens on `127.0.0.1` only, and
the password is already in `Dockerfile`.

`docker/splunk.yml` also turns off the tour that Splunk offers the first time you open the Search
page. `viewed = 1` in `[search-tour]` of `ui-tour.conf` is what Splunk saves after you skip or
finish the tour.

It also turns off telemetry, and hides the "Helping You Get More Value from Splunk Software" window
that Splunk shows after the first login. With these settings, the app's pages send no requests
outside your machine:

- `telemetry.conf` in `[general]`, written to `etc/apps/splunk_instrumentation/local/`:
    - `sendAnonymizedUsage`, `sendLicenseUsage` and `sendAnonymizedWebAnalytics` are `false`. The
      last one stops every page from loading `swa.js`, which reports Splunk Web usage to Splunk.
    - `optInVersionAcknowledged = 4` marks the window as answered. Without it, Splunk turns
      `sendLicenseUsage` back on at every start, and shows the window on the Search page and the
      other classic pages. It must be at least `optInVersion` in the same file, which is `4` in
      Splunk 10.6.1.1. If a newer Splunk raises `optInVersion`, raise this value too.
- `hideInstrumentationOptInModal = 1` in `[general]` of `user-prefs.conf` hides the window on the
  launcher home page, which ignores `optInVersionAcknowledged`.
- `updateCheckerBaseURL = 0` in `[settings]` of `web.conf` stops every page from asking
  `quickdraw.splunk.com` for new Splunk versions. That request includes the instance GUID and the
  license details.

## Forwarders

`compose.yaml` also starts five universal forwarders, one per version, built from the
`splunkforwarder` target. Each one is a deployment client of the `splunk` service, which acts as
their deployment server. Each forwarder's host name is `<service>.splunk.com`:

| Service     | Version | Client name | Instance name            | GUID                                   |
| ----------- | ------- | ----------- | ------------------------ | -------------------------------------- |
| `yennefer`  | 9.3.13  | Yennefer    | `splunkforwarder-9-3-13` | `F432A8B8-4ADB-42DE-9184-D79990A48FB0` |
| `ciri`      | 9.4.12  | Ciri        | `splunkforwarder-9-4-12` | `1C0F090E-085D-426A-BA94-A99A0D352D48` |
| `triss`     | 10.0.7  | Triss       | `splunkforwarder-10-0-7` | `316BB7CA-93DC-4C3C-BE06-D154E9A38A0C` |
| `vesemir`   | 10.2.4  | Vesemir     | `splunkforwarder-10-2-4` | `9AFF545B-0AC6-4062-95CF-BDD989C175D6` |
| `dandelion` | 10.4.0  | Dandelion   | `splunkforwarder-10-4-0` | `C211DFA1-A277-44AB-BD49-840AB198CB45` |

These values come from the `SPLUNKFORWARDER_VERSION`, `CLIENT_NAME`, `INSTANCE_NAME` and `GUID`
build arguments of each service. To add a forwarder, copy one of the forwarder services in
`compose.yaml`, then change its name, build arguments and host name. Give it a new GUID from
`uuidgen`.

`docker/splunkforwarder.yml` writes the forwarder settings through the splunk-ansible `conf` list:

- `server.conf`: `serverName` in `[general]` from the `INSTANCE_NAME` environment variable, and
  `pass4SymmKey` in `[deployment]`.
- `deploymentclient.conf`: `clientName` from the `CLIENT_NAME` environment variable and
  `phoneHomeIntervalInSecs = 1` in `[deployment-client]`, and `targetUri = splunk:8089` in
  `[target-broker:deploymentServer]`.

The names use `{{ lookup('env', ...) }}`, which splunk-ansible fills in as it writes the files, so
every forwarder uses the same file. The GUID can't go through the `conf` list: splunk-ansible adds
`.conf` to every file name it writes, and Splunk reads the GUID from `etc/instance.cfg`. The
`splunkforwarder` target writes it to `/opt/splunkforwarder-etc/instance.cfg` instead, and the image
copies that folder into `etc/` on the first start.

splunk-ansible writes these settings before the forwarder starts, so a forwarder doesn't wait for
the deployment server or restart. It retries the handshake until the deployment server answers,
then phones home every second. The forwarders show up in Splunk under
**Settings > Agent management** as soon as the deployment server answers, usually before
`docker compose ps` shows `splunk` as `healthy`.

The forwarder images report `healthy` as soon as they start, so `docker compose ps` doesn't tell you
whether a forwarder is connected. Check the Agent management page, or the forwarder logs with
`docker compose logs yennefer`.

The deployment server only accepts clients that sign their requests with its pass4SymmKey:

- `docker/splunk.yml` sets `pass4SymmKey` in the `[deployment]` stanza of `server.conf`.
  It also sets `requireAuthentication = true` in `restmap.conf` for the `[broker:broker]` endpoint,
  which handles handshakes and phone homes, and for the `[streams:deployment]` endpoint, which
  serves app downloads.
- `docker/splunkforwarder.yml` sets the same `pass4SymmKey` in the `[deployment]` stanza of
  `server.conf` on every forwarder.

Both files are [splunk-ansible](https://github.com/splunk/splunk-ansible) defaults. `Dockerfile`
copies them to `/tmp/defaults/default.yml`, and splunk-ansible writes the settings before Splunk
starts. To change the key, change it in both files and rebuild with `--build`. The deployment
server rejects a forwarder with a different key, or with no key, and logs
`Failed to verify HMAC signature` in `splunkd.log`.

## Development

Run `pnpm dev` to rebuild `fleet_overview/` on every change, then refresh the page in Splunk.

- Splunk doesn't cache static files, so a normal refresh loads the new JavaScript.
  `docker/splunk.yml` sets three settings in `[settings]` of `web.conf`, and each one is needed:
    - `cacheEntriesLimit = 0` turns off the copy of static files that splunkd keeps in memory.
      Without it, splunkd keeps serving the old file, with headers that cache it for a year.
    - `use_future_expires = false` stops Splunk from sending headers that cache static files for a
      year.
    - `replyHeader.Cache-Control = no-store` adds a header that tells the browser not to store any
      response. Without it, static files have no caching headers, and the browser can choose to
      cache them anyway.
- Splunk reads `.conf`, nav and view files at startup. After changing files in `splunk/`, run
  `pnpm build`, then open `http://localhost:18000/en-US/debug/refresh` and press **Refresh**.
  Splunk reloads the app's views, nav and `app.conf` without restarting, so you stay logged in. If
  a change still doesn't show up, run `docker compose restart`.

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
├── compose.yaml                 Local Splunk with fleet_overview/ mounted as the app, and forwarders
├── Dockerfile                   splunk and splunkforwarder targets: environment and settings files
├── docker/
│   ├── splunk.yml               Splunk settings: deployment auth, sessions, login, popups, telemetry, caching
│   └── splunkforwarder.yml      Forwarder settings: names, deployment server, the same pass4SymmKey
├── .dockerignore                Keeps everything but docker/*.yml out of the Docker build
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

`renderPage` passes `hideAppBar: true` to `layout`, so pages render without the app bar, the bar
that lists the views from the nav file. The Splunk bar stays. Links between pages have to be part
of the page content. The nav file still sets the page that opens at `/app/fleet_overview/`, through
`default="true"`.

To add a page:

1. Create `src/pages/<name>/index.tsx` that calls `renderPage` with the page content and title.
2. Create `splunk/default/data/ui/views/<name>.xml` with `template="pages/splunk_ui_app.html"`.
3. Add `<view name="<name>" />` to `splunk/default/data/ui/nav/default.xml`.

## Theme

Pages render with the 1CD theme: the Prisma family with `unstable_splunk1cdThemeCustomizer` from
`@splunk/themes`. The color scheme follows the user's Splunk theme preference (light or dark).
