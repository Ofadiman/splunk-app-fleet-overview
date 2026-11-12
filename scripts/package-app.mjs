import { mkdirSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'tar';

const appId = 'fleet_overview';
const appDir = fileURLToPath(new URL('../fleet_overview', import.meta.url));
const distDir = fileURLToPath(new URL('../dist', import.meta.url));
const file = `${distDir}/${appId}.tar.gz`;

mkdirSync(distDir, { recursive: true });

await create(
    {
        gzip: true,
        file,
        cwd: appDir,
        prefix: appId,
        portable: true,
        filter: (path) => !basename(path).startsWith('.'),
    },
    readdirSync(appDir).filter((name) => !name.startsWith('.')),
);

console.log(`Created ${file}`);
