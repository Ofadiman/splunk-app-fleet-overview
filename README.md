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
    http://localhost:18000/en-US/account/insecurelogin?username=admin&password=password&return_to=/en-US/app/fleet_overview/home
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

While it runs, the script prints each step with the time and a label, such as `backfill` or `live`.
A spinner at the bottom shows how far the backfill is, then the events written to each index since
the backfill finished, updated every second, with `+` for the last second. Every hour, a line
records the events of that hour, and Ctrl+C prints the total of the run. When the output isn't a
terminal, for example when you send it to a file, the script prints the backfill day by day and the
live counts every 10 seconds instead, without colors.

- Each file holds one UTC day, such as `phonehomes_simulated_2026-11-21.log`. When it starts and
  at midnight UTC, the script deletes the files whose day is older than their index keeps events.
- When it starts again, the script continues after the newest event in the files, so after a day
  off it backfills only that day. The events depend only on their time, a fixed seed and the time
  zone, so a run that stopped and started again writes the same events as one that never stopped.
- The first backfill writes about 5 GB in less than a minute: 1.6 GB of phone homes, 1.4 GB of
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

Once the clients exist, the script picks 45 of them with a seed of their own to be the
[problem forwarders](#problem-forwarders).

### Phone homes

Every client phones home once an hour. Each hour, the script spreads the 25,000 phone homes over
the 60 minutes so that every minute gets between 400 and 450, in a different pattern every hour. A
client's phone home moves by a minute or two from one hour to the next. At 1-minute resolution,
the connected forwarders line stays between 400 and 450 outside the network outage, and dips to 399
now and then when a [silent forwarder](#problem-forwarders) skips its turn. At 1 hour or more,
every client that isn't silent phones home in each bucket, so the line shows the whole fleet: 24,994
to 25,000, depending on how many forwarders are silent.

### Scenarios

The scenarios repeat every 8 hours, starting at 00:00, 08:00 and 16:00 UTC. Each one lasts an hour,
and each client takes part at its phone home in that hour:

| Hours (UTC)         | Scenario             | What happens                                                                                                                                                                                                                                 |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00, 08, 16          | Rollout              | A new version of `fleet_base` goes to one of the four deployment rings, `fleet_ring_1` to `fleet_ring_4`, the next ring each time. Its about 6,250 clients log `Download`/`Ok` and `Install`/`Ok`.                                           |
| 01, 09, 17          | Server class removed | The about 1,250 clients in `fleet_canary` log `Uninstall`/`Ok` for `fleet_canary_inputs`.                                                                                                                                                    |
| 02–03, 10–11, 18–19 | Failing install      | A new version of `fleet_blocked_inputs` fails on the about 500 clients in `fleet_blocked`. At both phone homes, each one logs `Download`/`Ok`, then `Install`/`Fail` with `Failed to untar archive=…`.                                       |
| 04, 12, 20          | Install fixed        | The same clients log `Download`/`Ok` and `Install`/`Ok`.                                                                                                                                                                                     |
| 06, 14, 22          | Network outage       | One of the 10 sites, the next one each time, can't reach the deployment server for the first 30 minutes. Its about 2,500 clients skip the phone homes they'd make then, so the connected forwarders line drops to about 355 to 405 a minute. |
| 07, 15, 23          | Recovery             | The clients that skipped a phone home connect again at their next one, about 1,250 `_dsclient` events in the first half hour. `fleet_canary` comes back, and its clients log `Download`/`Ok` and `Install`/`Ok` for `fleet_canary_inputs`.   |

No scenario runs in hours 05, 13 and 21. Once a day, at a random time between 03:00 and 06:00 in the
time zone of the machine that runs the script, the deployment server restarts. The script prints the
time zone when it starts, such as `Europe/Warsaw`, and follows its daylight saving time. Every
client connects again at its next phone home and logs a `_dsclient` event, so for the next hour the
reconnects chart shows 400 to 450 a minute. If the hour runs into the network outage, the clients
that skip a phone home connect again in the recovery hour instead.

On top of the scenarios, 40 to 60 random clients restart every hour and log a `_dsclient` event at
their phone home, about one a minute.

### Problem forwarders

45 clients have the same problem all the time, so the
[problem forwarders table](#problem-forwarders-table) has clear leaders in every column:

| Clients | Problem       | What happens                                                                                                                                                                                                                                                                                                               |
| ------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15      | Crash-looping | Each one restarts between 1 and 5 times an hour, the same number every hour, at random times. Each restart logs a `_dsclient` event right away, so these clients log 25 to 120 a day instead of 1 to 4. Together they add about 50 reconnects an hour, so outside the spikes the reconnects chart shows 85 to 112 an hour. |
| 10      | Stuck install | Each one is in the `fleet_stuck` server class, whose `fleet_stuck_inputs` never installs. At every phone home, it logs `Download`/`Ok`, then `Install`/`Fail` with `Failed to untar archive=…`, so the deployment activity chart shows 10 more failed forwarders in every hour.                                            |
| 10      | Silent        | Each one stops phoning home for 2 days in every 7, starting at its own hour. It logs nothing while it's silent, and connects again at its first phone home after, which logs a `_dsclient` event. Up to six of them are silent at a time.                                                                                  |

The crash-looping and stuck clients keep their phone homes, and go quiet in a network outage like the
other clients of their site.

### Version switches

10 other clients, picked with another seed, switch between two forwarder versions once a week, each at
its own hour: one week they run their own version, the next week the next newer one (the next older
one for 10.4.0). Each switch restarts the client, so it connects again at its phone home in that hour
with the new version and build in its `_dsclient` event. The
[activity list](#agent-details) of these agents shows the version change.

The script keeps three things simpler than a real deployment server: a randomly restarted client
logs its handshake at its next phone home rather than right after the restart, a client keeps its
place in the hour after it connects again, and a client that was offline doesn't catch up on the
deployments it missed.

The fleet size, the shares, the problem forwarders, the version switches, the schedule and the Splunk
connection are constants at the top of `scripts/simulate.ts`.

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
- `pnpm format` / `pnpm format:verify` - Format code with Prettier, or check formatting
- `pnpm simulate` - Backfill and keep writing the events of 25,000
  [simulated forwarders](#simulated-fleet) into `.simulation/`
- `mise run appinspect` - Package the app and validate it with Splunk AppInspect

### Browser tests

| Browser | Vitest                     | Cypress component tests     |
| ------- | -------------------------- | --------------------------- |
| Chrome  | `pnpm test:vitest:chrome`  | `pnpm test:cypress:chrome`  |
| Edge    | `pnpm test:vitest:edge`    | `pnpm test:cypress:edge`    |
| Firefox | `pnpm test:vitest:firefox` | `pnpm test:cypress:firefox` |
| WebKit  | `pnpm test:vitest:webkit`  | `pnpm test:cypress:webkit`  |

Install Chrome and Edge for both suites, and install Firefox for Cypress. `pnpm install` installs
Cypress and its WebKit build. Download the browser builds used by Vitest with
`pnpm exec playwright install firefox webkit`. Both WebKit commands cover Safari's engine.
Cypress WebKit support is experimental and uses the Playwright WebKit version Cypress tests against.

Both runners execute the component specs under `src/`. Use `#component-tests` for hooks and assertions
in shared specs. Cypress also runs three integration cases under `cypress/components/` that stub
Splunk HTTP responses and check chart rendering, table sorting, and navigation from a forwarder row
to its agent details.

Run `pnpm test:coverage` to run both suites in Chrome and check that they cover the same statements,
functions, and branches in the app source. Run `pnpm test:vitest:coverage` or
`pnpm test:cypress:coverage` for an individual report. The reports are saved as
`dist/coverage/vitest/coverage-final.json` and `dist/coverage/cypress/coverage-final.json`.

Generated files go to `dist/`, which git ignores. This includes the app in `dist/fleet_overview/`,
the package `dist/fleet_overview.tar.gz`, the AppInspect report `dist/appinspect.json`, and test
failure screenshots in `dist/test-attachments/` for Vitest and `dist/cypress/screenshots/` for
Cypress. `pnpm simulate` writes to `.simulation/`, which git ignores too.

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

## CI and releases

GitHub Actions runs dedicated jobs for Actionlint, Prettier, TypeScript, and AppInspect. Vitest and
Cypress each run in a matrix across Chrome, Edge, Firefox, and WebKit. These checks run on pull
requests into `main`, pushes to `main`, version tags, and manual workflow runs.

The AppInspect job logs its results. Download the validated `fleet_overview.tar.gz` from the
workflow artifacts. Pushing a tag such as `v0.1.0` publishes the package built from that commit
to GitHub Releases after all checks pass. The release trigger matches tags starting with `v`.

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
│   ├── default/data/ui/views/home.xml
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
    ├── formatTime.ts            Formats times, times ago and durations in the user's locale
    ├── components/
    │   ├── AgentActivity/       List of what happened to one agent, with repeated events as one entry
    │   ├── AgentAppsTable/      Table of the latest state of each app on one agent
    │   ├── AgentCounts/         Failing apps, failing hours and reconnects of one agent
    │   ├── AgentDetails/        Agent details screen: who the agent is, its phone home status, and its sections
    │   ├── AgentPhoneHomesChart/ Chart of one agent's phone homes in each bucket
    │   ├── AgentReconnectsChart/ Chart of how many times one agent connected again in each bucket
    │   ├── ConnectedForwardersChart/ Chart of the forwarders that phoned home in each bucket
    │   ├── DeploymentActivityChart/ Chart of the forwarders that installed, uninstalled or failed an app in each bucket
    │   ├── ForwarderReconnectsChart/ Chart of how many times forwarders connected again in each bucket
    │   ├── ProblemForwardersTable/ Table of the top 100 forwarders by failing apps, failing hours or reconnects
    │   ├── RouterLink/          Splunk UI Link that opens pages through the router
    │   └── TimeRangeControls/   Time range picker and resolution of the charts, and their URL schema
    ├── testing/
    │   ├── mockTimeParser.ts    Answers the time parser requests of the charts in tests
    │   ├── renderWithQueryClient.tsx Renders components in tests with a fresh query client
    │   ├── renderWithRouter.tsx Renders pages in tests with a router, an in-memory URL and a query client
    │   └── SplunkwebConnectorMock.tsx Gives the time range picker its default presets in tests
    └── pages/
        ├── home/                Home page at /home, titled Overview: Home.tsx, its URL schema, styles, and test
        └── agents/              Agents page at /agents?guid=<GUID>: Agents.tsx, its URL schema, styles, and test
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

- A path with more segments doesn't load the page on reload or from a link. For one more segment,
  such as `/agents/123`, Splunk answers with `{}` as JSON. For two or more, such as
  `/agents/123/apps`, it shows its 404 page. Put details such as the selected agent in query
  parameters instead, such as the agent in `/agents?guid=<GUID>`.
- Hash routes, such as `/home#/agents`, don't survive logging in. Splunk keeps the path and the
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
of the page content. The nav file lists only the home view, with `default="true"`, because its
only remaining job is to set the page that opens at `/app/fleet_overview/`. Without the file,
Splunk uses its system nav and opens the Search page there. Views load by their URL whether or not
the nav file lists them.

`show_in_nav = false` in `[ui]` of `splunk/default/app.conf` keeps the app out of the app list on
the Splunk home page and out of the **Apps** menu in the Splunk bar. The app stays visible
(`is_visible = true`), so its pages still open by URL, such as `/app/fleet_overview/home`.
With `is_visible = false`, Splunk would not open the app's pages at all.

For links between pages, use `RouterLink` from `src/components/RouterLink/RouterLink.tsx`, such as
`<RouterLink to="/home">Overview</RouterLink>` on the agents page. It renders a Splunk UI `Link`,
but the router opens the page without loading it from Splunk again, and `to` only accepts the paths
of existing routes. The link's `href` includes the base path, so opening it in a new tab works too.
A Splunk UI `Link` with `to` would make Splunk send the whole page again.

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
`/agents?guid=<GUID>`: the loader calls `queryClient.prefetchQuery` or `ensureQueryData` with the same
`queryOptions`, and the component still reads the data with `useQuery`. Also set
`defaultPreloadStaleTime: 0` on the router then, so the router's preload cache doesn't serve data
that TanStack Query considers stale.

Tests need a query client too. `renderWithRouter` provides one, and `renderWithQueryClient` from
`src/testing/renderWithQueryClient.tsx` renders a single component with one. Each test gets a fresh
client with the same default options and query retries turned off, so a failing request shows its
error right away.

## Time range and resolution

The overview page has two controls above the charts, and all three charts follow them. The
[problem forwarders table](#problem-forwarders-table) follows the time range and ignores the
resolution. The [agent details](#agent-details) screen has the same two controls, with the same
defaults and URL parameters:

- The time range picker is `TimeRangeDropdown` from `@splunk/react-time-range`, the same picker as
  on the Search page. `SplunkwebConnector` from the same package loads the presets from Splunk and
  checks relative and absolute times as you type them. Real-time ranges are turned off, because the
  charts run each search once.
- The resolution is a `Select` with Auto and fixed bucket sizes from 1 minute to 1 week. Auto picks
  the smallest size that gives at most 100 points for the time range. The menu dims the sizes that
  give more than 1,440 points or fewer than 2, and says why.

The defaults are Last 24 hours (`-24h@h` to `now`) and 1 hour. With forwarders that phone home once
an hour, 1-hour buckets count every forwarder once, so the connected forwarders line shows the whole
fleet. Buckets shorter than the phone home interval only count the forwarders whose turn falls in
them.

- The choice lives in the URL of the overview page, as `earliest`, `latest` and `resolution`, so a
  reload or a shared link keeps it. `chartTimeRangeSearchSchema` in `TimeRangeControls.schema.ts`
  is a [zod](https://zod.dev) schema for these three. It turns epoch times, which the router reads
  as numbers, back into strings, and replaces a missing or unknown value with its default.
  `homeSearchSchema` in `Home.schema.ts` extends it with the table's sorted column and order, as
  `sort` and `order`, and `agentsSearchSchema` in `Agents.schema.ts` with the agent's `guid`.
  `src/router.tsx` passes each page's schema to `validateSearch`. `stripSearchParams` leaves the
  defaults out of the URL: it takes them from `homeSearchSchema.parse({})` and
  `agentsSearchSchema.parse({})`, which fill in every default.
- Changing the time range, the resolution or the table's sort keeps your place on the page. After
  every navigation, TanStack Router scrolls the window back to the top unless it gets
  `resetScroll: false`, so `Home.tsx` passes it to both of its `navigate` calls, and `Agents.tsx`
  to its own. Links to other pages keep the default and open at the top.
- To know how long the range is, `TimeRangeControls.hooks.ts` asks Splunk's `search/timeparser` REST
  endpoint for both ends of the range in epoch seconds (`output_time_format=%s`). TanStack Query
  caches the answer per range, so the controls and the three charts share one request.
- Each chart turns the resolution into a bucket size and passes it to its search as `span`. When the
  bucket size from the URL gives too many or too few points for the range, the charts use Auto
  instead. When you pick another range, a fixed resolution that doesn't fit it switches to Auto.
- The searches ask for `count=0`, because a one-shot search returns only the first 100 rows by
  default, and 7 days in 1-hour buckets are 169 rows.
- The charts only show complete buckets. A range that ends `now` ends in the middle of a bucket, and
  a range like Last 4 hours (`-4h@m`) can start in the middle of one. Those buckets hold only part
  of their events, so the connected forwarders line would drop at the edges as if the fleet went
  quiet. `addinfo` adds the search's own start and end, `info_min_time` and `info_max_time`, and
  `where` keeps the buckets that lie fully between them. All time ends at `+Infinity`, so it ends at
  `now()` instead. The newest point is therefore up to one bucket old: up to an hour with the
  default resolution.
- Tests mock `SplunkwebConnector` with `src/testing/SplunkwebConnectorMock.tsx`, which passes the
  default presets, and answer the time parser requests with `mockTimeParser` from
  `src/testing/mockTimeParser.ts`.

## Connected forwarders chart

The overview page shows `ConnectedForwardersChart`, a line chart of how many forwarders phoned home
to the deployment server in each bucket of the [time range](#time-range-and-resolution). The
deployment server writes one event per phone home to the `_dsphonehome` index, with the forwarder's
GUID in the indexed field `data.clientId`, so the chart counts distinct GUIDs per bucket. `<span>`
is the bucket size, such as `1h`:

```spl
| tstats prestats=t dc(data.clientId) where index=_dsphonehome by _time span=<span>
| timechart span=<span> dc(data.clientId) AS connected
| addinfo
| where _time >= info_min_time AND _time + _span <= if(info_max_time="+Infinity", now(), info_max_time)
| fields - _span info_*
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

- `timechart` fills buckets with no phone homes with `0`, so an outage shows as a drop. When no
  forwarder phoned home in the whole time range, the search returns no rows, and the card says so
  instead of drawing a chart.
- Only roles that can search internal indexes, such as `admin` (`srchIndexesAllowed = *;_*`), see
  phone homes. For `user` and `power`, the search returns no rows, so they see the same message,
  which names the index they need.
- `_dsphonehome` keeps events for 7 days. Locally, it starts empty on every
  `docker compose up --renew-anon-volumes`.
- `@splunk/visualizations` is large: it makes every page script about 1.6 MB gzipped, up from about
  0.2 MB. The time range picker adds about 0.07 MB more. The build inlines dynamic imports, so lazy
  loading doesn't split them out.
- Tests mock `Line` to check the data and options passed to the chart.

## Forwarder reconnects chart

Below the connected forwarders chart, the overview page shows `ForwarderReconnectsChart`, a column
chart of how many times forwarders connected to the deployment server again in each bucket of the
time range. The deployment server writes one event to the `_dsclient` index each time a forwarder
connects, with the forwarder's GUID, name, version and address, so the chart counts those events per
bucket:

```spl
| tstats prestats=t count where index=_dsclient by _time span=<span>
| timechart span=<span> count AS reconnects
| addinfo
| where _time >= info_min_time AND _time + _span <= if(info_max_time="+Infinity", now(), info_max_time)
| fields - _span info_*
```

`useForwarderReconnects` in `ForwarderReconnectsChart.hooks.ts` runs it the same way as the
connected forwarders search, with the same caching and retries.

- A forwarder connects again each time its splunkd starts: when you restart the forwarder or its
  container, when the deployment server installs an app that needs a restart, and when it disables
  an app. A new forwarder's first connection counts too.
- After a gap in phone homes, forwarders don't always connect again, so the chart can miss the fleet
  coming back. The connected forwarders chart still shows it as a rise.
- A small fleet often has no reconnects in a short time range. Then the search returns no rows, and
  the card says so instead of drawing a chart. The message also names the index, because roles that can't search
  internal indexes, such as `user` and `power`, get no rows either.
- The y-axis has a mark every 1 reconnect up to 5, every 2 up to 10 and every 5 up to 25. Above that,
  the chart spaces the marks itself. Without this, it labels small counts in steps such as 0.5 or 2.5.
- `_dsclient` keeps events for 60 days.
- Tests mock `Column`, like the connected forwarders tests mock `Line`.

## Deployment activity chart

Below the reconnects chart, the overview page shows `DeploymentActivityChart`, a stacked column chart
of how many forwarders installed, uninstalled or failed to deploy an app in each bucket of the time
range. The deployment server writes an event to the `_dsappevent` index for each step of a
deployment on each forwarder, with `data.action` (`Download`, `Install` or `Uninstall`) and
`data.result` (`Ok` or `Fail`). The chart counts forwarders, not events:

```spl
| tstats count where index=_dsappevent by _time span=<span> data.clientId data.appName data.action data.result
| eval downloaded=if('data.action'="Download" AND 'data.result'="Ok", 1, 0)
| eval installed=if('data.action'="Install" AND 'data.result'="Ok", 1, 0)
| eval uninstalled=if('data.action'="Uninstall" AND 'data.result'="Ok", 1, 0)
| eval failed=if('data.result'!="Ok", 1, 0)
| stats max(downloaded) AS downloaded max(installed) AS installed max(uninstalled) AS uninstalled
    max(failed) AS failed by _time data.clientId data.appName
| eval installed=downloaded*installed
| stats max(installed) AS installed max(uninstalled) AS uninstalled max(failed) AS failed
    by _time data.clientId
| timechart span=<span> sum(installed) AS installed sum(uninstalled) AS uninstalled sum(failed) AS failed
| fillnull value=0 installed uninstalled failed
| addinfo
| where _time >= info_min_time AND _time + _span <= if(info_max_time="+Infinity", now(), info_max_time)
| fields - _span info_*
```

`useDeploymentActivity` in `DeploymentActivityChart.hooks.ts` runs it the same way as the other
chart searches.

- A failed install repeats on every phone home: the forwarder writes a `Download` with `Ok` and an
  `Install` with `Fail` until someone fixes the problem. Counted as events, one stuck forwarder that
  phones home every second shows as 60 failures a minute. The chart counts it once per bucket.
- A forwarder counts as installed only when it downloaded and installed the same app in the same
  bucket. Forwarders also write an `Install` with `Ok` and no `Download` for apps they already have:
  after a reload of the deployment server, after a restart, and when the deployment server disables
  an app. Those don't change the app, so the chart leaves them out.
- Any event whose result isn't `Ok` counts as failed.
- A forwarder can count in more than one series in the same bucket, for example when an install
  fails and then succeeds a few seconds later. The column then adds up to more than the number of
  forwarders.
- When no forwarder installed, uninstalled or failed in the whole time range, the card says so instead
  of drawing a chart, also when the range only has the events that the chart leaves out. The message
  also names the index, because roles that can't search internal indexes get no rows.
- The series colors are the `severityColorNormal`, `severityColorInfo` and `severityColorCritical`
  tokens of the Prisma theme in the user's color scheme, from `getTheme`. The 1CD theme gives these
  tokens as `oklch()` colors, and `@splunk/visualizations` draws those as black.
- The y-axis marks follow the same steps as in the reconnects chart.
- `_dsappevent` keeps events for 60 days.

## Problem forwarders table

Below the deployment activity chart, the overview page shows `ProblemForwardersTable`, a table of
the forwarders that failed to deploy an app or connected to the deployment server again in the
[time range](#time-range-and-resolution). Each problem has its own column, and the table lists the
top 100 forwarders by the column you sort by:

| Column                   | What it shows                                                                                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forwarder, Host, Version | The forwarder's latest name, host name and version in `_dsclient`, from the whole 60 days that the index keeps. The name links to the forwarder's [agent details](#agent-details), and shows the GUID when `_dsclient` has no event for the forwarder. A dash means the same for the host and the version. |
| Failing apps             | Apps whose last deployment in the time range failed: their latest failure in `_dsappevent` is newer than their latest `Install` or `Uninstall` with `Ok`.                                                                                                                                                  |
| Failing hours            | Clock hours in which at least one app failed to deploy on the forwarder.                                                                                                                                                                                                                                   |
| Reconnects               | The forwarder's `_dsclient` events in the time range, the same events that the reconnects chart counts.                                                                                                                                                                                                    |

With the default sort, the search is:

```spl
| tstats max(_time) AS last where index=_dsappevent by data.clientId data.appName data.action data.result
| eval failed_at=if('data.result'!="Ok", last, null())
| eval fixed_at=if('data.result'="Ok" AND 'data.action'!="Download", last, null())
| stats max(failed_at) AS failed_at max(fixed_at) AS fixed_at by data.clientId data.appName
| where failed_at > coalesce(fixed_at, 0)
| stats count AS failingApps by data.clientId
| append [| tstats count where index=_dsappevent data.result!=Ok by _time span=1h data.clientId
    | stats count AS failingHours by data.clientId]
| append [| tstats count AS reconnects where index=_dsclient by data.clientId]
| append [| tstats latest(data.name) AS name latest(data.hostname) AS host
    latest(data.splunkVersion) AS version where index=_dsclient earliest=1 latest=now by data.clientId]
| stats max(failingApps) AS failingApps max(failingHours) AS failingHours max(reconnects) AS reconnects
    first(name) AS name first(host) AS host first(version) AS version by data.clientId
| fillnull value=0 failingApps failingHours reconnects
| where failingApps > 0 OR failingHours > 0 OR reconnects > 0
| eventstats count AS total
| sort 100 - failingApps - failingHours - reconnects + name
| rename data.clientId AS clientId
| table clientId name host version failingApps failingHours reconnects total
```

`useProblemForwarders` in `ProblemForwardersTable.hooks.ts` runs it like the chart searches, with
the same caching and retries, but asks for `output_mode=json`, which returns one object per row.
`searchResultsSchema` in `ProblemForwardersTable.schema.ts` checks the rows and turns the counts into
numbers.

- You can sort by the three counts. Clicking a heading sorts by its column from the highest count,
  and clicking the same heading again reverses the order. The search sorts and keeps the first 100
  rows, so each sort runs it again: sorting 100 rows in the browser would only reorder the top 100
  of another column. Ties go to the other two counts, highest first, then to the name.
- The sort lives in the URL next to the time range, as `sort` (`failingApps`, `failingHours` or
  `reconnects`) and `order` (`desc` or `asc`). The defaults are `failingApps` and `desc`.
- Above the table, a line says how many forwarders the search found, such as "Showing the top 100
  of 25,000 forwarders". `eventstats` counts every forwarder that passes the `where`, before `sort`
  keeps 100.
- Every forwarder connects again after the deployment server restarts, so in a range with a
  restart, almost the whole fleet counts. Reconnects matter when they stand out: the
  [crash-looping forwarders](#problem-forwarders) log 25 to 120 a day, the others 1 to 4.
- An app stays failing until the forwarder installs or uninstalls it with `Ok`. A `Download` with
  `Ok` doesn't count, because one comes right before each failing install. When you remove a
  failing app from its server class, the forwarder logs nothing more for it, so the app counts as
  failing until its last failure leaves the time range. `tstats` gives whole seconds, and a failure
  and a fix in the same second count as fixed.
- Failing hours count clock hours, not events, for the same reason as the
  [deployment activity chart](#deployment-activity-chart): a failing install repeats at every phone
  home. The resolution doesn't change them. An hour that the range only partly covers counts too.
- `_dsclient` only gets an event when a forwarder connects, which can be weeks before the time
  range. `earliest=1 latest=now` in the `where` of the last `tstats` replaces the time range of the
  search, so the names come from everything the index keeps, like in Splunk's own
  `DeploymentServerClients` search. `earliest=0` doesn't work: `tstats` keeps the time range then.
- Each `append` runs a subsearch, which returns at most 50,000 rows, so a fleet of more than 50,000
  forwarders would lose some. `tstats prestats=t append=t` merges searches without subsearches,
  but `count` then also counts the rows of the other `tstats`.
- With the 25,000 simulated forwarders, the search takes about 2 seconds for Last 24 hours and
  about 3 seconds for 60 days.
- While the first search runs, the table shows its headings with the loading message below them,
  so you can pick the sort right away. When no forwarder failed or reconnected, the card says so
  instead and names the indexes, because roles that can't search internal indexes get no rows.
- When you pick another sort, the table keeps the rows it has until the new ones arrive, and the
  line above it says "Loading problem forwarders" meanwhile. `TableContent` searches with
  `useDeferredValue` copies of the column and the order, so React keeps showing the old rows while
  the new search suspends, instead of the loading state. The loading state is shorter than the
  table, so showing it would make the page shorter and move it up when you're at the bottom.
- Once the new rows arrive, the list scrolls back to its first row, so you see the top of the new
  order. `useScrollToTopOnSort` in `ProblemForwardersTable.hooks.ts` keeps the scrolling element
  that the table's `onScroll` reports, and sets its `scrollTop` to 0 when the sort changes. A list
  that you never scrolled is at its first row already.
- An icon next to each count heading shows what the count means. The heading stays in place and
  the rows scroll inside the card after 480 pixels, about 12 rows.
- The table makes every page script about 0.06 MB bigger, gzipped.
- Tests mock `oneShot`, like the chart tests do.

## Agent details

The agents page shows one agent at `/app/fleet_overview/agents?guid=<GUID>`. Each name in the
[problem forwarders table](#problem-forwarders-table) links to it and passes the table's time range
and resolution along, so the details cover the same time. The GUID is a query parameter because
Splunk can't serve a sub-path such as `/agents/<GUID>` (see [How pages work](#how-pages-work)).

`Agents.tsx` reads the GUID with `agentsSearchSchema`. Without one, the page asks you to pick an
agent from the overview page. With something that isn't a GUID (`z.guid()`: 32 hexadecimal digits
in five groups), it says so and runs no search. Otherwise it renders `AgentDetails`, from top to
bottom:

1. **Who the agent is.** The name is the page heading, followed by the phone home status, then the
   host, IP address, version and build, OS, package and GUID. They come from the agent's latest
   `_dsclient` event, and the phone homes from `_dsphonehome`. This search ignores the time range:

    ```spl
    | tstats latest(data.name) AS name latest(data.hostname) AS host latest(data.ip) AS ip
        latest(data.splunkVersion) AS version latest(data.build) AS build latest(data.utsname) AS os
        latest(data.package) AS package latest(data.packageType) AS packageType
        where index=_dsclient data.clientId="<GUID>"
    | appendcols [| tstats values(data.lastPhoneHomeTime) AS phoneHomes
        where index=_dsphonehome data.clientId="<GUID>"]
    | eval lastPhoneHome=tonumber(mvindex(phoneHomes, -1)), recent=mvindex(phoneHomes, -4, -1)
    | eval interval=if(mvcount(recent) > 1, round((tonumber(mvindex(recent, -1))
        - tonumber(mvindex(recent, 0))) / (mvcount(recent) - 1)), null())
    | fields - phoneHomes recent
    ```

    The interval is the average gap between the last 4 phone homes, the same way as Splunk's
    `DeploymentServerClients` search. The status compares the time since the last phone home with
    it: "Phoning home" up to 2 intervals, "Late" up to 10, "Silent since" after that. With a single
    phone home there's no interval, so the status only says when it was. When the search finds
    neither a `_dsclient` event nor a phone home, the page says the indexes have no agent with this
    GUID and shows nothing else.

2. **The time range and resolution**, with the same controls as the overview page.
3. **The same three counts as the problem forwarders table**, from `AgentCounts`, with the same
   rules, so a click from the table lands on the same numbers.
4. **Phone homes and reconnects charts**, from `AgentPhoneHomesChart` and `AgentReconnectsChart`.
   They run the fleet charts' searches with `data.clientId="<GUID>"` added, count events per
   bucket, and fill empty buckets with 0, so a gap in phone homes shows as missing columns.
   `_dsphonehome` keeps 7 days, so for older ranges the phone homes chart says it has nothing.
5. **Apps**, from `AgentAppsTable`: one row per app and server class, failing apps first, from all
   the app events the index keeps, whatever the time range. An app is failing when it failed after
   its last `Install` or `Uninstall` with `Ok`, the same rule as the problem forwarders table.
   "Failing since" is the first failure after that, and the failure reason is the latest one, with
   the quotes that the deployment server puts around it removed. "Last success" moves after a
   deployment server restart, because forwarders confirm the apps they have with an `Install` and
   `Ok`.
6. **Activity**, from `AgentActivity`: the 100 most recent entries in the time range, newest first.
   Reconnects and app events go into separate runs, and consecutive events of the same run become
   one entry, such as "fleet_stuck_inputs failed to install 24 times". A run of app events ends
   when the app's action, result or checksum changes, so each new version of an app is an entry of
   its own. A run of reconnects ends when the agent's name, version or IP address changes, and the
   entry says what changed, such as "Version 10.0.7 → 10.2.4". To find that change at the start of
   the time range, the reconnects part reads all of `_dsclient` with `earliest=1 latest=now` and
   leaves out the older reconnects only after comparing them. `Download` with `Ok` doesn't count,
   because one comes right before every install.

- Each section has its own loading message, error with Try again, and empty message, like the
  overview cards. The empty messages name the indexes, because roles that can't search internal
  indexes get no rows.
- Times show in the browser's time zone, formatted for the user's Splunk locale by
  `src/formatTime.ts`. `@splunk/moment` would use the Splunk time zone, but it needs timezone data
  that only Splunk pages have, and it fails in tests.
- For one simulated agent, each search takes a second or less: about 1 s for who the agent is,
  0.8 s for the apps, and under 0.4 s for the counts and the activity of the last 7 days.
- `streamstats` needs `global=false` with `window=1` and `by`. Without it, the window is the
  previous event of any run, so the runs of different apps cut each other into pieces.
- The page title stays Agents. The heading has the agent's name.

## Theme

Pages render with the 1CD theme: the Prisma family with `unstable_splunk1cdThemeCustomizer` from
`@splunk/themes`. The color scheme follows the user's Splunk theme preference (light or dark).
