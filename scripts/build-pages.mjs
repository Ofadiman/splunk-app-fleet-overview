import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const watch = process.argv.includes('--watch');
const root = fileURLToPath(new URL('..', import.meta.url));
const pagesDir = join(root, 'src/pages');
const appDir = join(root, 'fleet_overview');

const pages = readdirSync(pagesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => basename(entry.name, '.tsx'));

mkdirSync(appDir, { recursive: true });
for (const name of readdirSync(appDir)) {
    rmSync(join(appDir, name), { recursive: true, force: true });
}

for (const [index, page] of pages.entries()) {
    await build({
        root,
        mode: watch ? 'development' : 'production',
        build: {
            copyPublicDir: index === 0,
            watch: watch ? {} : null,
            rollupOptions: {
                input: { [page]: join(pagesDir, `${page}.tsx`) },
            },
        },
    });
}
