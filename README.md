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

2. Build the app once, so `dist/fleet_overview/` exists before the container mounts it:

    ```bash
    pnpm build
    ```

3. Start Splunk:

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
    is on `https://localhost:18089`. To also start the [forwarders](#forwarders), add
    `--profile forwarders` after `docker compose`. To fill Splunk with the events of 25,000
    forwarders instead, run the [simulated fleet](#simulated-fleet).

4. Stop Splunk and the forwarders, and delete everything they stored:

    ```bash
    docker compose down --volumes
    ```

The containers keep no state between runs. Their configuration and data live in unnamed volumes
that the images themselves declare. `--renew-anon-volumes` replaces them on every start, and
`--volumes` deletes them on stop, so they don't pile up on disk. `docker compose restart` keeps
them, so a restart within one run keeps your data. The only exception is `.simulation/`, the
folder of the [simulated fleet](#simulated-fleet), which lives in the repository and stays.

Compose builds every image from a target in `Dockerfile` on the first start:

- `splunk` builds on top of `splunk/splunk`. It sets the environment variables that accept the
  license and set the `admin` password, and copies `docker/splunk.yml` into the image. It also
  creates `/opt/splunk/etc/apps` owned by the `splunk` user, so Splunk can still install its
  built-in apps next to the mounted `fleet_overview`. For the same reason, it creates
  `/opt/splunk/var/log/client_events` and gives it and `/opt/splunk/var/log` to the `splunk` user.
  Without them, Docker creates `/opt/splunk/var/log` owned by `root` to mount `.simulation/`, and
  Splunk fails to start with `cannot create "/opt/splunk/var/log/splunk"`.
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

`compose.yaml` also defines five universal forwarders, one per version, built from the
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

The forwarders are in the `forwarders` profile, so `docker compose up` doesn't start them. Their
events would mix with the [simulated fleet](#simulated-fleet). To start them with Splunk, add the
profile:

```bash
docker compose --profile forwarders up --detach --renew-anon-volumes
```

`docker compose down --volumes` stops them too, with or without the profile.

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

## Simulated fleet

`pnpm simulate` runs `scripts/simulate.ts`, which simulates a fleet of 25,000 forwarders. It writes
the events that the deployment server would log for them, in the same JSON format, to
`.simulation/` in the repository. `compose.yaml` mounts that folder at
`/opt/splunk/var/log/client_events`, where the deployment server writes its own logs. Splunk's
built-in `SplunkDeploymentServerConfig` app watches that folder and indexes the files into
`_dsphonehome`, `_dsclient` and `_dsappevent`, with the same source types, timestamps and indexed
fields as real events. Git ignores `.simulation/`.

Start Splunk, wait until `docker compose ps` shows it as `healthy`, then run:

```bash
pnpm simulate
```

The script first backfills each index as far back as the index keeps events. It reads the
retention, `frozenTimePeriodInSecs`, from Splunk's REST API on `https://localhost:18089`:

| Index          | Retention | Files                            |
| -------------- | --------- | -------------------------------- |
| `_dsphonehome` | 7 days    | `phonehomes_simulated_<day>.log` |
| `_dsclient`    | 60 days   | `clients_simulated_<day>.log`    |
| `_dsappevent`  | 60 days   | `appevents_simulated_<day>.log`  |

Then it keeps writing events every second as they happen, until you stop it with Ctrl+C.

- Each file holds one UTC day, such as `phonehomes_simulated_2026-11-21.log`. When it starts and
  at midnight UTC, the script deletes the files whose day is older than their index keeps events.
- When it starts again, the script continues after the newest event in the files, so after a day
  off it backfills only that day. The events depend only on their time, a fixed seed and the time
  zone, so a run that stopped and started again writes the same events as one that never stopped.
- The first backfill writes about 4.9 GB in less than a minute: 1.6 GB of phone homes, 1.4 GB of
  client events and 2 GB of app events. Splunk indexes them in about two and a half minutes and
  stores them in about 2.5 GB.
- Each start with `--renew-anon-volumes` gives Splunk empty indexes, and Splunk indexes everything
  in `.simulation/` again as it starts. It finishes about three minutes after `docker compose ps`
  shows `healthy`. `docker compose restart` keeps the indexes, and Splunk carries on where it
  stopped.
- Docker Desktop doesn't pass file events from macOS to the container, so Splunk doesn't notice a
  new file in `.simulation/` on its own. It does notice new lines in the files it already reads.
  After creating a file, the script asks Splunk to look for new files with
  `POST /services/data/inputs/monitor/_reload`.
- To start over, stop the script, delete `.simulation/`, then start Splunk with
  `--renew-anon-volumes`. Don't delete the folder while Splunk keeps its indexes: the script would
  write the same events again, and Splunk would index them twice.
- The deployment server writes its own logs to `.simulation/` too, such as
  `phonehomes_<GUID>.log`. They stay empty while the forwarders are off. Splunk gets a new GUID on
  every start, so three new files appear each time, and you can delete the old ones. If you run the
  forwarders, their events land in these files, and Splunk indexes them again on every start until
  you delete them.

### Clients

`@faker-js/faker` generates the clients from a fixed seed, so every run simulates the same 25,000
forwarders. Each client has:

- a GUID, used as `clientId`, `guid` and `instanceId`
- a name such as `fortunate-responsibility-17843`, used as the client name and the instance name
- one of 10 sites, which gives it a host name such as
  `fortunate-responsibility-17843.dc7.which-leading.com` and an IP address in `10.7.0.0/16`
- one of the five forwarder versions from [Forwarders](#forwarders), most often 10.0.7 and 10.2.4
- one of four deployment rings. About 5% of the clients are also in the `fleet_canary` server
  class, and about 2% in `fleet_blocked`.

### Phone homes

Every client phones home once an hour. Each hour, the script spreads the 25,000 phone homes over
the 60 minutes so that every minute gets between 400 and 450, in a different pattern every hour. A
client's phone home moves by a minute or two from one hour to the next. The connected forwarders
chart counts the forwarders that phoned home in each minute, so its line stays between 400 and 450
outside the network outage.

### Scenarios

The scenarios repeat every 8 hours, starting at 00:00, 08:00 and 16:00 UTC. Each one lasts an hour,
and each client takes part at its phone home in that hour:

| Hours (UTC)         | Scenario             | What happens                                                                                                                                                                                                                               |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 00, 08, 16          | Rollout              | A new version of `fleet_base` goes to one of the four deployment rings, `fleet_ring_1` to `fleet_ring_4`, the next ring each time. Its about 6,250 clients log `Download`/`Ok` and `Install`/`Ok`.                                         |
| 01, 09, 17          | Server class removed | The about 1,250 clients in `fleet_canary` log `Uninstall`/`Ok` for `fleet_canary_inputs`.                                                                                                                                                  |
| 02–03, 10–11, 18–19 | Failing install      | A new version of `fleet_blocked_inputs` fails on the about 500 clients in `fleet_blocked`. At both phone homes, each one logs `Download`/`Ok`, then `Install`/`Fail` with `Failed to untar archive=…`.                                     |
| 04, 12, 20          | Install fixed        | The same clients log `Download`/`Ok` and `Install`/`Ok`.                                                                                                                                                                                   |
| 06, 14, 22          | Network outage       | One of the 10 sites, the next one each time, can't reach the deployment server for the first 30 minutes. Its about 2,500 clients skip the phone homes they'd make then, so the connected forwarders line drops to about 355 to 405.        |
| 07, 15, 23          | Recovery             | The clients that skipped a phone home connect again at their next one, about 1,250 `_dsclient` events in the first half hour. `fleet_canary` comes back, and its clients log `Download`/`Ok` and `Install`/`Ok` for `fleet_canary_inputs`. |

Nothing happens in hours 05, 13 and 21. Once a day, at a random time between 03:00 and 06:00 in the
time zone of the machine that runs the script, the deployment server restarts. The script prints the
time zone when it starts, such as `Europe/Warsaw`, and follows its daylight saving time. Every
client connects again at its next phone home and logs a `_dsclient` event, so for the next hour the
reconnects chart shows 400 to 450 a minute. If the hour runs into the network outage, the clients
that skip a phone home connect again in the recovery hour instead.

On top of the scenarios, 40 to 60 random clients restart every hour and log a `_dsclient` event at
their phone home, about one a minute.

The script keeps two things simpler than a real deployment server: a client logs its handshake at
its next phone home rather than right after a restart, and it keeps its place in the hour after it
connects again.

The fleet size, the shares, the schedule and the Splunk connection are constants at the top of
`scripts/simulate.ts`.

## Development

Run `pnpm dev` to rebuild `dist/fleet_overview/` on every change, then refresh the page in Splunk.

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
  a change still doesn't show up, run `docker compose restart`. `pnpm dev` reads the view labels
  only when it starts, so restart it after changing a `<label>`.

## Scripts

- `pnpm dev` - Rebuild the app into `dist/fleet_overview/` on every change
- `pnpm build` - Type-check and build the app into `dist/fleet_overview/`
- `pnpm package` - Build and create `dist/fleet_overview.tar.gz`, installable in Splunk
- `pnpm test` - Run tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm format` / `pnpm format:verify` - Format code with Prettier, or check formatting
- `pnpm simulate` - Backfill and keep writing the events of 25,000
  [simulated forwarders](#simulated-fleet) into `.simulation/`
- `mise run appinspect` - Package the app and validate it with Splunk AppInspect

Everything these scripts generate goes to `dist/`, which git ignores: the app in
`dist/fleet_overview/`, the package `dist/fleet_overview.tar.gz`, and the AppInspect report
`dist/appinspect.json`. The only exception is `pnpm simulate`, which writes to `.simulation/`, which
git ignores too.

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
├── compose.yaml                 Local Splunk with dist/fleet_overview/ as the app and .simulation/ as its deployment server logs, and forwarders
├── Dockerfile                   splunk and splunkforwarder targets: environment and settings files
├── docker/
│   ├── splunk.yml               Splunk settings: deployment auth, sessions, login, popups, telemetry, caching
│   └── splunkforwarder.yml      Forwarder settings: names, deployment server, the same pass4SymmKey
├── .dockerignore                Keeps everything but docker/*.yml out of the Docker build
├── .simulation/                 Events of the simulated fleet, one file per index and day, ignored by git
├── mise.toml                    Pinned tools (Node.js, pnpm, AppInspect tooling), appinspect task
├── pyproject.toml, uv.lock      AppInspect and its locked Python dependencies
├── uv.toml                      uv settings for this repository: public PyPI, mise's Python
├── scripts/                     TypeScript that Node runs directly, type-checked by tsconfig.node.json
│   ├── build.ts                 Builds src/main.tsx into one page script per Splunk view, with the view labels
│   ├── package.ts               Packs dist/fleet_overview/ into dist/fleet_overview.tar.gz
│   └── simulate.ts              Writes the deployment server events of 25,000 simulated forwarders to .simulation/
├── splunk/                      Splunk app files, copied as-is into dist/fleet_overview/
│   ├── default/app.conf
│   ├── default/data/ui/nav/default.xml
│   ├── default/data/ui/views/overview.xml
│   ├── default/data/ui/views/agents.xml
│   └── metadata/default.meta
├── AGENTS.md                    Conventions for coding agents: React component architecture
└── src/
    ├── main.tsx                 The page script for every view: renders the router and the query client
    ├── queryClient.ts           Default options of the query client, shared with the test client
    ├── router.tsx               TanStack Router routes, one per Splunk view, and the page title
    ├── renderPage.tsx           Renders a page with the 1CD theme and the Splunk header via @splunk/react-page
    ├── GlobalStyles.ts          Makes the area below the Splunk bar fill the window
    ├── globals.d.ts             Type of __VIEW_LABELS__, the view labels that the build passes in
    ├── components/
    │   ├── ConnectedForwardersChart/ Chart of the forwarders that phoned home in each minute
    │   ├── DeploymentActivityChart/ Chart of the forwarders that installed, uninstalled or failed an app in each minute
    │   ├── ForwarderReconnectsChart/ Chart of how many times forwarders connected again in each minute
    │   └── RouterLink/          Splunk UI Link that opens pages through the router
    ├── testing/
    │   ├── renderWithQueryClient.tsx Renders components in tests with a fresh query client
    │   └── renderWithRouter.tsx Renders pages in tests with a router, an in-memory URL and a query client
    └── pages/
        ├── overview/            Overview page: Overview.tsx, its styles, and test
        └── agents/              Agents page: Agents.tsx, its styles, and test
```

Each component follows the file conventions in `AGENTS.md`: `Component.tsx`,
`Component.styles.ts`, `Component.test.tsx`, and the other files it needs.

## How pages work

Each view uses Splunk's built-in `pages/splunk_ui_app.html` template. That template loads
`appserver/static/pages/<view name>.js` from the app as a classic script. `scripts/build.ts`
reads the view names from `splunk/default/data/ui/views/` and builds `src/main.tsx` once for each,
into a self-contained script named after the view.

Every page script renders the same app: the TanStack Router router from `src/router.tsx`. The router
picks the page from the URL, so moving between pages inside the app doesn't reload the page. Each
route path matches a Splunk view, such as `/agents` for `agents.xml`, because Splunk only serves a
page at a view's URL, with or without a query string:

- A path with more segments, such as `/agents/123`, shows `{}` or Splunk's 404 page on reload. Put
  details such as the selected agent in query parameters instead: `/agents?agent=123`.
- Hash routes, such as `/overview#/agents`, don't survive logging in. Splunk keeps the path and the
  query string when it sends you back from the login page, but drops the `#` part.

The router's `basepath` comes from `createURL` in `@splunk/splunk-utils/url`. It includes the
user's locale, such as `/en-US/app/fleet_overview`, and the root path when Splunk Web runs under one.

The `<label>` of each view is its page title, and it's the only place where titles are written:

- When Splunk sends a page, its template puts the label in the `<title>` element, so the tab shows
  the right title before any script runs. Without a label, it would show the view name, such as
  `agents`, until the page script changed it.
- When the router changes the page, Splunk sends nothing, so `setViewTitle` in `src/router.tsx`
  sets the title. `scripts/build.ts` reads every label and passes them to the bundle as
  `__VIEW_LABELS__`, through Vite's `define` option. `setViewTitle` takes the label of the view
  whose name matches the path of the current route. The build fails if a view has no `<label>`.

`setViewTitle` runs as the root route's `onEnter` and `onStay`, so it covers every route without
any code in the routes themselves. The root route is entered once, on the first load, and stays
matched on every navigation after that. TanStack Router calls these callbacks right after it has
switched to the new route, before React renders the new page, so the title and the page content
change in the same frame.

TanStack Router's `head` option and `HeadContent` don't work here on their own. The browser takes
the title from the first `<title>` element in the document, and that's always the one Splunk's
template puts in `<head>`.

`renderPage` passes `hideAppBar: true` to `layout`, so pages render without the app bar, the bar
that lists the views from the nav file. The Splunk bar stays. Links between pages have to be part
of the page content. The nav file lists only the overview view, with `default="true"`, because its
only remaining job is to set the page that opens at `/app/fleet_overview/`. Without the file,
Splunk uses its system nav and opens the Search page there. Views load by their URL whether or not
the nav file lists them.

`show_in_nav = false` in `[ui]` of `splunk/default/app.conf` keeps the app out of the app list on
the Splunk home page and out of the **Apps** menu in the Splunk bar. The app stays visible
(`is_visible = true`), so its pages still open by URL, such as `/app/fleet_overview/overview`.
With `is_visible = false`, Splunk would not open the app's pages at all.

For links between pages, use `RouterLink` from `src/components/RouterLink/RouterLink.tsx`, such as
`<RouterLink to="/agents">Agents</RouterLink>`. It renders a Splunk UI `Link`, but the router opens
the page without loading it from Splunk again, and `to` only accepts the paths of existing routes.
The link's `href` includes the base path, so opening it in a new tab works too. A Splunk UI `Link`
with `to` would make Splunk send the whole page again.

Tests of a page or a component with router links need a router. `renderWithRouter` from
`src/testing/renderWithRouter.tsx` renders the given pages under their paths, starting at the
given path, with the URL kept in memory.

`renderPage` also renders `GlobalStyles` from `src/GlobalStyles.ts`. It makes the area below
the Splunk bar fill the rest of the window. To fill that area, give the outermost element of a page
`min-height: 100%`, not `100vh` or `100dvh`: those add the height of the Splunk bar, so the page
scrolls even when its content fits. The area grows with the content, and the whole page scrolls.

To add a page:

1. Create the page component in `src/pages/<name>/`, following the conventions in `AGENTS.md`.
2. Add a route with `path: '/<name>'` to `src/router.tsx`.
3. Create `splunk/default/data/ui/views/<name>.xml` with `template="pages/splunk_ui_app.html"` and
   a `<label>`, which is the page title. The build creates the page script for it.

## Data fetching

Components fetch data with [TanStack Query](https://tanstack.com/query). `src/main.tsx` creates one
`QueryClient` and renders the router inside its `QueryClientProvider`, so every page and component
can use `useQuery`. The client takes `queryClientDefaultOptions` from `src/queryClient.ts`: once a
query has data, it doesn't run again when a component that uses it mounts again, the network
reconnects, or the tab becomes visible. Mutations don't retry. Put the `queryOptions` and the hook
that calls `useQuery` in the component's `Component.hooks.ts`.

Route loaders aren't used yet. Add one when a page needs data from its URL, such as an agent from
`/agents?agent=123`: the loader calls `queryClient.prefetchQuery` or `ensureQueryData` with the same
`queryOptions`, and the component still reads the data with `useQuery`. Also set
`defaultPreloadStaleTime: 0` on the router then, so the router's preload cache doesn't serve data
that TanStack Query considers stale.

Tests need a query client too. `renderWithRouter` provides one, and `renderWithQueryClient` from
`src/testing/renderWithQueryClient.tsx` renders a single component with one. Each test gets a fresh
client with the same default options and query retries turned off, so a failing request shows its
error right away.

## Connected forwarders chart

The overview page shows `ConnectedForwardersChart`, a line chart of how many forwarders phoned home
to the deployment server in each of the last 60 complete minutes. The deployment server writes one event per phone home to the `_dsphonehome` index, with the
forwarder's GUID in the indexed field `data.clientId`, so the chart counts distinct GUIDs per minute:

```spl
| tstats prestats=t dc(data.clientId) where index=_dsphonehome by _time span=1m
| timechart span=1m dc(data.clientId) AS connected
| fields - _span
```

`useConnectedForwarders` in `ConnectedForwardersChart.hooks.ts` runs it through TanStack Query with
`oneShot` from `@splunk/splunk-utils/search`, and `output_mode=json_cols` returns the `fields` and
`columns` that the `Line` chart from `@splunk/visualizations` takes. TanStack Query decides when it
runs:

- It runs the search once and doesn't refresh the chart. When you come back to the overview page
  from another page of the app within 5 minutes, the card shows the same chart without running the
  search again. After 5 minutes away, TanStack Query drops the cached chart and runs the search
  again.
- It retries a failed search three times, about 7 seconds in total, before the card shows the error
  and a Try again button.

- `timechart` fills minutes with no phone homes with `0`, so an outage shows as a drop. When no
  forwarder phoned home in the whole hour, the search returns no rows, and the card says so instead
  of drawing a chart.
- Only roles that can search internal indexes, such as `admin` (`srchIndexesAllowed = *;_*`), see
  phone homes. For `user` and `power`, the search returns no rows, so they see the same message,
  which names the index they need.
- `_dsphonehome` keeps events for 7 days. Locally, it starts empty on every
  `docker compose up --renew-anon-volumes`.
- `@splunk/visualizations` is large: it makes every page script about 1.4 MB gzipped, up from about
  0.2 MB. The build inlines dynamic imports, so lazy loading doesn't split it out.
- Tests mock `Line`, because jsdom draws nothing. `vitest.setup.ts` stubs `window.matchMedia`, which
  the chart libraries call when they load.

## Forwarder reconnects chart

Below the connected forwarders chart, the overview page shows `ForwarderReconnectsChart`, a column
chart of how many times forwarders connected to the deployment server again in each of the last 60
complete minutes. The deployment server writes one event to the `_dsclient` index each time a
forwarder connects, with the forwarder's GUID, name, version and address, so the chart counts those
events per minute:

```spl
| tstats prestats=t count where index=_dsclient by _time span=1m
| timechart span=1m count AS reconnects
| fields - _span
```

`useForwarderReconnects` in `ForwarderReconnectsChart.hooks.ts` runs it the same way as the
connected forwarders search, with the same caching and retries.

- A forwarder connects again each time its splunkd starts: when you restart the forwarder or its
  container, when the deployment server installs an app that needs a restart, and when it disables
  an app. A new forwarder's first connection counts too.
- After a gap in phone homes, forwarders don't always connect again, so the chart can miss the fleet
  coming back. The connected forwarders chart still shows it as a rise.
- Most hours have no reconnects in a small fleet. Then the search returns no rows, and the card says
  so instead of drawing a chart. The message also names the index, because roles that can't search
  internal indexes, such as `user` and `power`, get no rows either.
- The y-axis has a mark every 1 reconnect up to 5, every 2 up to 10 and every 5 up to 25. Above that,
  the chart spaces the marks itself. Without this, it labels small counts in steps such as 0.5 or 2.5.
- `_dsclient` keeps events for 60 days.
- Tests mock `Column`, like the connected forwarders tests mock `Line`.

## Deployment activity chart

Below the reconnects chart, the overview page shows `DeploymentActivityChart`, a stacked column chart
of how many forwarders installed, uninstalled or failed to deploy an app in each of the last 60
complete minutes. The deployment server writes an event to the `_dsappevent` index for each step of a
deployment on each forwarder, with `data.action` (`Download`, `Install` or `Uninstall`) and
`data.result` (`Ok` or `Fail`). The chart counts forwarders, not events:

```spl
| tstats count where index=_dsappevent by _time span=1m data.clientId data.appName data.action data.result
| eval downloaded=if('data.action'="Download" AND 'data.result'="Ok", 1, 0)
| eval installed=if('data.action'="Install" AND 'data.result'="Ok", 1, 0)
| eval uninstalled=if('data.action'="Uninstall" AND 'data.result'="Ok", 1, 0)
| eval failed=if('data.result'!="Ok", 1, 0)
| stats max(downloaded) AS downloaded max(installed) AS installed max(uninstalled) AS uninstalled
    max(failed) AS failed by _time data.clientId data.appName
| eval installed=downloaded*installed
| stats max(installed) AS installed max(uninstalled) AS uninstalled max(failed) AS failed
    by _time data.clientId
| timechart span=1m sum(installed) AS installed sum(uninstalled) AS uninstalled sum(failed) AS failed
| fillnull value=0 installed uninstalled failed
| fields - _span
```

`useDeploymentActivity` in `DeploymentActivityChart.hooks.ts` runs it the same way as the other
chart searches.

- A failed install repeats on every phone home: the forwarder writes a `Download` with `Ok` and an
  `Install` with `Fail` until someone fixes the problem. Counted as events, one stuck forwarder that
  phones home every second shows as 60 failures a minute. The chart counts it once.
- A forwarder counts as installed only when it downloaded and installed the same app in the same
  minute. Forwarders also write an `Install` with `Ok` and no `Download` for apps they already have:
  after a reload of the deployment server, after a restart, and when the deployment server disables
  an app. Those don't change the app, so the chart leaves them out.
- Any event whose result isn't `Ok` counts as failed.
- A forwarder can count in more than one series in the same minute, for example when an install
  fails and then succeeds a few seconds later. The column then adds up to more than the number of
  forwarders.
- When no forwarder installed, uninstalled or failed in the whole hour, the card says so instead of
  drawing a chart, also when the hour only has the events that the chart leaves out. The message
  also names the index, because roles that can't search internal indexes get no rows.
- The series colors are the `severityColorNormal`, `severityColorInfo` and `severityColorCritical`
  tokens of the Prisma theme in the user's color scheme, from `getTheme`. The 1CD theme gives these
  tokens as `oklch()` colors, and `@splunk/visualizations` draws those as black.
- The y-axis marks follow the same steps as in the reconnects chart.
- `_dsappevent` keeps events for 60 days.

## Theme

Pages render with the 1CD theme: the Prisma family with `unstable_splunk1cdThemeCustomizer` from
`@splunk/themes`. The color scheme follows the user's Splunk theme preference (light or dark).
