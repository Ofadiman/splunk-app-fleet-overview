import {
    appendFileSync,
    closeSync,
    existsSync,
    mkdirSync,
    openSync,
    readdirSync,
    readSync,
    statSync,
    unlinkSync,
} from 'node:fs';
import { request } from 'node:https';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { faker } from '@faker-js/faker';

const SEED = 2026;
const CLIENT_COUNT = 25_000;
const MIN_PHONE_HOMES_PER_MINUTE = 400;
const MAX_PHONE_HOMES_PER_MINUTE = 450;
const SITE_COUNT = 10;
const RING_COUNT = 4;
const CANARY_SHARE = 0.05;
const BLOCKED_SHARE = 0.02;
const RESTARTS_PER_HOUR = { min: 40, max: 60 };
const OUTAGE_MINUTES = 30;
const SERVER_RESTART_HOURS = { min: 3, max: 6 };
const TIME_ZONE = Temporal.Now.timeZoneId();
const SPLUNK_URL = 'https://127.0.0.1:18089';
const SPLUNK_AUTH = 'admin:password';
const TICK_MS = 1000;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const SLOT_SECONDS = 58;

const MGMT_PORT = '8089';
const UTSNAME = 'linux-x86_64';
const NO_FAILURE = "''";

const schedule = [
    'rollout',
    'canaryRemoval',
    'failingInstall',
    'failingInstall',
    'fixedInstall',
    'quiet',
    'outage',
    'recovery',
] as const;

const versions = [
    { weight: 1, value: { splunkVersion: '9.3.13', build: '688758e24bbe' } },
    { weight: 2, value: { splunkVersion: '9.4.12', build: '9dfc486f3d48' } },
    { weight: 3, value: { splunkVersion: '10.0.7', build: 'd24b16fd5f20' } },
    { weight: 3, value: { splunkVersion: '10.2.4', build: '1526e5e5df42' } },
    { weight: 1, value: { splunkVersion: '10.4.0', build: 'f798d4d49089' } },
];

const indexes = {
    clients: '_dsclient',
    appevents: '_dsappevent',
    phonehomes: '_dsphonehome',
} as const;

type Stream = keyof typeof indexes;

type ByStream<T> = Record<Stream, T>;

type SimulatedEvent = {
    time: number;
    stream: Stream;
    line: string;
};

type Client = {
    guid: string;
    ip: string;
    hostname: string;
    name: string;
    splunkVersion: string;
    build: string;
    connectionId: string;
    site: number;
    ring: number;
    canary: boolean;
    blocked: boolean;
};

type Deployment = {
    serverClassName: string;
    appName: string;
    checksum: string;
};

const streams = Object.keys(indexes) as Stream[];
const outputDir = fileURLToPath(new URL('../.simulation', import.meta.url));
const filePattern = /^(phonehomes|clients|appevents)_simulated_(\d{4}-\d{2}-\d{2})\.log$/;

const seed = (...values: number[]) => faker.seed([SEED, ...values]);

const byStream = <T>(value: (stream: Stream) => T) =>
    Object.fromEntries(streams.map((stream) => [stream, value(stream)])) as ByStream<T>;

const createClients = (): Client[] => {
    seed(0);
    const domain = faker.internet.domainName();

    return Array.from({ length: CLIENT_COUNT }, (_, index) => {
        const site = faker.number.int(SITE_COUNT - 1);
        const name = `${faker.internet.domainWord()}-${String(index + 1).padStart(5, '0')}`;
        const hostname = `${name}.dc${site + 1}.${domain}`;
        const ip = faker.internet.ipv4({ cidrBlock: `10.${site + 1}.0.0/16` });
        const { splunkVersion, build } = faker.helpers.weightedArrayElement(versions);
        const guid = faker.string.uuid().toUpperCase();
        const connectionId = ['connection', ip, MGMT_PORT, hostname, hostname, UTSNAME, guid, name]
            .map((part) => part.replaceAll('_', '%'))
            .join('_');

        return {
            guid,
            ip,
            hostname,
            name,
            splunkVersion,
            build,
            connectionId,
            site,
            ring: faker.number.int(RING_COUNT - 1),
            canary: faker.datatype.boolean(CANARY_SHARE),
            blocked: faker.datatype.boolean(BLOCKED_SHARE),
        };
    });
};

const clients = createClients();

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

const formatTime = (time: number) => {
    const date = new Date(time);
    const day = `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}-${date.getUTCFullYear()}`;
    const clock = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
    return `${day} ${clock}.${pad(date.getUTCMilliseconds(), 3)} +0000`;
};

const parseTime = (datetime: string) => {
    const match = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/.exec(datetime);
    if (!match) {
        return undefined;
    }
    const [month, day, year, hours, minutes, seconds, milliseconds] = match.slice(1).map(Number);
    return Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds);
};

const serialize = (time: number, component: string, data: object) =>
    JSON.stringify({ datetime: formatTime(time), log_level: 'INFO', component, data });

const phoneHome = (client: Client, time: number): SimulatedEvent => ({
    time,
    stream: 'phonehomes',
    line: serialize(time, 'DSphonehome', {
        clientId: client.guid,
        connectionId: client.connectionId,
        lastPhoneHomeTime: Math.floor(time / SECOND),
        updaterRunning: '0',
    }),
});

const handshake = (client: Client, time: number): SimulatedEvent => ({
    time,
    stream: 'clients',
    line: serialize(time, 'DSclient', {
        guid: client.guid,
        instanceId: client.guid,
        ip: client.ip,
        dns: client.hostname,
        hostname: client.hostname,
        mgmt: MGMT_PORT,
        build: client.build,
        instanceName: client.name,
        connectionId: client.connectionId,
        utsname: UTSNAME,
        splunkVersion: client.splunkVersion,
        package: 'universal_forwarder',
        clientId: client.guid,
        name: client.name,
        packageType: 'tgz',
        upgradeStatus: 'none',
        upgradeTime: 'none',
    }),
});

const appEvent = (
    client: Client,
    time: number,
    deployment: Deployment,
    action: 'Download' | 'Install' | 'Uninstall',
    result: 'Ok' | 'Fail',
    failedReason = NO_FAILURE,
): SimulatedEvent => ({
    time,
    stream: 'appevents',
    line: serialize(time, 'DSappevent', {
        key: `${client.guid}_${deployment.serverClassName}_${deployment.appName}`,
        clientId: client.guid,
        serverClassName: deployment.serverClassName,
        appName: deployment.appName,
        action,
        failedReason,
        checksum: action === 'Uninstall' ? '0' : deployment.checksum,
        result,
        timestamp: Math.floor(time / SECOND),
        connectionId: client.connectionId,
    }),
});

const checksum = (app: number, cycle: number) => {
    seed(3, app, cycle);
    return faker.number.bigInt({ min: 10n ** 15n, max: 2n ** 64n - 1n }).toString();
};

const ringDeployment = (ring: number, cycle: number): Deployment => ({
    serverClassName: `fleet_ring_${ring + 1}`,
    appName: 'fleet_base',
    checksum: checksum(1, cycle),
});

const canaryDeployment = (cycle: number): Deployment => ({
    serverClassName: 'fleet_canary',
    appName: 'fleet_canary_inputs',
    checksum: checksum(2, cycle),
});

const blockedDeployment = (cycle: number): Deployment => ({
    serverClassName: 'fleet_blocked',
    appName: 'fleet_blocked_inputs',
    checksum: checksum(3, cycle),
});

const untarFailure = ({ serverClassName, appName }: Deployment, bundleTime: number) => {
    const bundle = `/opt/splunkforwarder/var/run/${serverClassName}/${appName}-${Math.floor(bundleTime / SECOND)}.bundle`;
    return `'Failed to untar archive=${bundle} to='/opt/splunkforwarder/etc/apps/${appName}''`;
};

const minuteCounts = () => {
    const range = MAX_PHONE_HOMES_PER_MINUTE - MIN_PHONE_HOMES_PER_MINUTE;
    const extra = CLIENT_COUNT - 60 * MIN_PHONE_HOMES_PER_MINUTE;
    const exponent = (60 * range) / extra - 1;
    const counts = Array.from({ length: 60 }, () =>
        Math.round(range * faker.number.float() ** exponent),
    );
    let missing = extra - counts.reduce((sum, count) => sum + count, 0);

    while (missing !== 0) {
        const minute = faker.number.int(59);
        const step = Math.sign(missing);
        const count = counts[minute] + step;
        if (count >= 0 && count <= range) {
            counts[minute] = count;
            missing -= step;
        }
    }

    return counts.map((count) => MIN_PHONE_HOMES_PER_MINUTE + count);
};

const slotsForHour = (hour: number) => {
    seed(1, hour);
    const slots = new Array<number>(CLIENT_COUNT);
    let index = 0;

    minuteCounts().forEach((count, minute) => {
        for (let position = 0; position < count; position += 1) {
            const second = Math.floor((position * SLOT_SECONDS) / count);
            slots[index] = hour * HOUR + minute * MINUTE + second * SECOND + faker.number.int(999);
            index += 1;
        }
    });

    return slots;
};

const restartsForHour = (hour: number) => {
    seed(2, hour);
    return Array.from({ length: faker.number.int(RESTARTS_PER_HOUR) }, () =>
        faker.number.int(CLIENT_COUNT - 1),
    );
};

const localDayOf = (time: number) =>
    Temporal.Instant.fromEpochMilliseconds(time).toZonedDateTimeISO(TIME_ZONE).toPlainDate();

const localTime = (day: Temporal.PlainDate, hour: number) =>
    day.toZonedDateTime({ timeZone: TIME_ZONE, plainTime: Temporal.PlainTime.from({ hour }) })
        .epochMilliseconds;

const serverRestartTime = (day: Temporal.PlainDate) => {
    seed(5, day.year, day.month, day.day);
    return faker.number.int({
        min: localTime(day, SERVER_RESTART_HOURS.min),
        max: localTime(day, SERVER_RESTART_HOURS.max) - 1,
    });
};

const outageSite = (cycle: number) => cycle % SITE_COUNT;

const missedPhoneHome = (client: Client, slot: number, hour: number) =>
    schedule[hour % schedule.length] === 'outage' &&
    client.site === outageSite(Math.floor(hour / schedule.length)) &&
    slot < hour * HOUR + OUTAGE_MINUTES * MINUTE;

const eventsForHour = (hour: number, wanted: ReadonlySet<Stream>) => {
    const cycle = Math.floor(hour / schedule.length);
    const scenario = schedule[hour % schedule.length];
    const slots = slotsForHour(hour);
    const online = (index: number) => !missedPhoneHome(clients[index], slots[index], hour);
    const events: SimulatedEvent[] = [];

    if (wanted.has('phonehomes')) {
        clients.forEach((client, index) => {
            if (online(index)) {
                events.push(phoneHome(client, slots[index]));
            }
        });
    }

    if (wanted.has('clients')) {
        const reconnects = new Set(restartsForHour(hour));
        let previousSlots: number[] | undefined;
        const slotsBefore = () => (previousSlots ??= slotsForHour(hour - 1));
        const restarts = new Set(
            [hour, hour - 1].map((each) => serverRestartTime(localDayOf(each * HOUR))),
        );

        for (const restartedAt of restarts) {
            const restartHour = Math.floor(restartedAt / HOUR);
            if (restartHour === hour) {
                clients.forEach((_, index) => {
                    if (slots[index] >= restartedAt) {
                        reconnects.add(index);
                    }
                });
            }
            if (restartHour === hour - 1) {
                const before = slotsBefore();
                clients.forEach((_, index) => {
                    if (before[index] < restartedAt) {
                        reconnects.add(index);
                    }
                });
            }
        }

        if (scenario === 'recovery') {
            const before = slotsBefore();
            clients.forEach((client, index) => {
                if (missedPhoneHome(client, before[index], hour - 1)) {
                    reconnects.add(index);
                }
            });
        }

        for (const index of reconnects) {
            if (online(index)) {
                events.push(handshake(clients[index], slots[index]));
            }
        }
    }

    if (wanted.has('appevents')) {
        const rings = Array.from({ length: RING_COUNT }, (_, ring) => ringDeployment(ring, cycle));
        const canary = canaryDeployment(cycle);
        const blocked = blockedDeployment(cycle);
        const bundleTime = (cycle * schedule.length + schedule.indexOf('failingInstall')) * HOUR;
        const blockedFailure = untarFailure(blocked, bundleTime);

        seed(4, hour);
        const deploy = (index: number, deployment: Deployment, failedReason?: string) => {
            const client = clients[index];
            const installedAt = slots[index] + faker.number.int({ min: 100, max: 900 });
            const result = failedReason ? 'Fail' : 'Ok';
            events.push(
                appEvent(client, slots[index], deployment, 'Download', 'Ok'),
                appEvent(client, installedAt, deployment, 'Install', result, failedReason),
            );
        };

        clients.forEach((client, index) => {
            if (scenario === 'rollout' && client.ring === cycle % RING_COUNT) {
                deploy(index, rings[client.ring]);
            }
            if (scenario === 'canaryRemoval' && client.canary) {
                events.push(appEvent(client, slots[index], canary, 'Uninstall', 'Ok'));
            }
            if (scenario === 'failingInstall' && client.blocked) {
                deploy(index, blocked, blockedFailure);
            }
            if (scenario === 'fixedInstall' && client.blocked) {
                deploy(index, blocked);
            }
            if (scenario === 'recovery' && client.canary) {
                deploy(index, canary);
            }
        });
    }

    return events.sort((first, second) => first.time - second.time);
};

let cachedHour: { hour: number; key: string; events: SimulatedEvent[] } | undefined;

const cachedEventsForHour = (hour: number, wanted: ReadonlySet<Stream>) => {
    const key = [...wanted].join();
    if (cachedHour?.hour !== hour || cachedHour.key !== key) {
        cachedHour = { hour, key, events: eventsForHour(hour, wanted) };
    }
    return cachedHour.events;
};

const dayOf = (time: number) => new Date(time).toISOString().slice(0, 10);

const simulatedFiles = () =>
    readdirSync(outputDir).flatMap((name) => {
        const match = filePattern.exec(name);
        return match ? [{ name, stream: match[1] as Stream, day: match[2] }] : [];
    });

let filesCreated = false;

const append = (events: SimulatedEvent[]) => {
    const counts = byStream(() => 0);
    const lines = byStream<string[]>(() => []);

    for (const event of events) {
        lines[event.stream].push(event.line);
        counts[event.stream] += 1;
    }

    for (const stream of streams) {
        if (lines[stream].length > 0) {
            const file = join(outputDir, `${stream}_simulated_${dayOf(events[0].time)}.log`);
            filesCreated ||= !existsSync(file);
            appendFileSync(file, `${lines[stream].join('\n')}\n`);
        }
    }

    return counts;
};

const writeRange = (from: number, to: number, starts: ByStream<number>) => {
    const counts = byStream(() => 0);

    for (let hour = Math.floor(from / HOUR); hour * HOUR < to; hour += 1) {
        const wanted = new Set(streams.filter((stream) => (hour + 1) * HOUR > starts[stream]));
        if (wanted.size === 0) {
            continue;
        }

        const written = append(
            cachedEventsForHour(hour, wanted).filter(
                (event) => event.time >= Math.max(from, starts[event.stream]) && event.time < to,
            ),
        );
        for (const stream of streams) {
            counts[stream] += written[stream];
        }
    }

    return counts;
};

const lastEventTime = (file: string) => {
    const size = statSync(file).size;
    const length = Math.min(size, 64 * 1024);
    const buffer = Buffer.alloc(length);
    const descriptor = openSync(file, 'r');
    readSync(descriptor, buffer, 0, length, size - length);
    closeSync(descriptor);

    for (const line of buffer.toString('utf8').split('\n').reverse()) {
        try {
            const time = parseTime(JSON.parse(line).datetime);
            if (time !== undefined) {
                return time;
            }
        } catch {
            continue;
        }
    }

    return undefined;
};

const lastWrittenTime = () => {
    const newest = new Map<Stream, string>();
    for (const file of simulatedFiles().sort((first, second) =>
        first.day.localeCompare(second.day),
    )) {
        newest.set(file.stream, file.name);
    }

    const times = [...newest.values()]
        .map((name) => lastEventTime(join(outputDir, name)))
        .filter((time) => time !== undefined);

    return times.length > 0 ? Math.max(...times) : undefined;
};

const prune = (starts: ByStream<number>) => {
    for (const file of simulatedFiles()) {
        if (Date.parse(file.day) + DAY <= starts[file.stream]) {
            unlinkSync(join(outputDir, file.name));
            console.log(
                `Deleted ${file.name}, which is older than the retention of ${indexes[file.stream]}`,
            );
        }
    }
};

const callSplunk = (method: 'GET' | 'POST', path: string) =>
    new Promise<string>((resolve, reject) => {
        const url = `${SPLUNK_URL}${path}`;
        const options = { method, auth: SPLUNK_AUTH, rejectUnauthorized: false };
        const req = request(url, options, (response) => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', (chunk: string) => {
                body += chunk;
            });
            response.on('end', () => {
                if (response.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(
                        new Error(`Splunk answered ${response.statusCode} for ${method} ${url}`),
                    );
                }
            });
        });
        req.on('error', reject);
        req.end();
    });

const getRetention = async (index: string) => {
    const body = await callSplunk('GET', `/services/data/indexes/${index}?output_mode=json`);
    const { frozenTimePeriodInSecs } = JSON.parse(body).entry[0].content;
    return Number(frozenTimePeriodInSecs) * SECOND;
};

const rescanNewFiles = async () => {
    if (filesCreated) {
        filesCreated = false;
        try {
            await callSplunk('POST', '/services/data/inputs/monitor/_reload');
        } catch (error) {
            filesCreated = true;
            throw error;
        }
    }
};

const readRetention = async () => {
    try {
        const values = await Promise.all(streams.map((stream) => getRetention(indexes[stream])));
        return byStream((stream) => values[streams.indexOf(stream)]);
    } catch (error) {
        throw new Error(
            `Couldn't read the index retention from Splunk at ${SPLUNK_URL}. Start Splunk with docker compose up and wait until it is healthy.`,
            { cause: error },
        );
    }
};

const formatCounts = (counts: ByStream<number>) =>
    streams
        .map((stream) => `${counts[stream].toLocaleString('en-US')} ${indexes[stream]}`)
        .join(', ');

mkdirSync(outputDir, { recursive: true });

const retention = await readRetention();
const startsAt = (now: number) => byStream((stream) => now - retention[stream]);

for (const stream of streams) {
    console.log(`${indexes[stream]} keeps events for ${retention[stream] / DAY} days`);
}
console.log(
    `The deployment server restarts once a day between ${pad(SERVER_RESTART_HOURS.min)}:00 and ${pad(SERVER_RESTART_HOURS.max)}:00 ${TIME_ZONE} time`,
);

const backfillUntil = Date.now();
const backfillStarts = startsAt(backfillUntil);
const resumeAfter = lastWrittenTime();
let writtenUntil = Math.max(
    resumeAfter === undefined ? -Infinity : resumeAfter + 1,
    Math.min(...Object.values(backfillStarts)),
);

prune(backfillStarts);
console.log(
    resumeAfter === undefined
        ? `Backfilling from ${new Date(writtenUntil).toISOString()} into ${outputDir}`
        : `Resuming after ${new Date(resumeAfter).toISOString()} in ${outputDir}`,
);

while (writtenUntil < backfillUntil) {
    const dayEnd = Math.min((Math.floor(writtenUntil / DAY) + 1) * DAY, backfillUntil);
    const counts = writeRange(writtenUntil, dayEnd, backfillStarts);
    console.log(`Backfilled ${dayOf(writtenUntil)}: ${formatCounts(counts)}`);
    writtenUntil = dayEnd;
}

await rescanNewFiles();
console.log('Backfill done. Writing events as they happen, press Ctrl+C to stop');

let liveCounts = byStream(() => 0);
let liveHour = Math.floor(writtenUntil / HOUR);

setInterval(() => {
    const now = Date.now();
    if (now <= writtenUntil) {
        return;
    }
    const hour = Math.floor(now / HOUR);

    if (hour !== liveHour) {
        const counts = writeRange(writtenUntil, hour * HOUR, startsAt(now));
        streams.forEach((stream) => {
            liveCounts[stream] += counts[stream];
        });
        console.log(
            `Wrote ${new Date(liveHour * HOUR).toISOString()}: ${formatCounts(liveCounts)}`,
        );
        writtenUntil = hour * HOUR;
        liveCounts = byStream(() => 0);
        if (dayOf(hour * HOUR) !== dayOf(liveHour * HOUR)) {
            prune(startsAt(now));
        }
        liveHour = hour;
    }

    const counts = writeRange(writtenUntil, now, startsAt(now));
    streams.forEach((stream) => {
        liveCounts[stream] += counts[stream];
    });
    writtenUntil = now;

    rescanNewFiles().catch((error: unknown) => {
        console.error('Splunk did not rescan the new files in .simulation/', error);
    });
}, TICK_MS);
