import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const watch = process.argv.includes('--watch');
const root = fileURLToPath(new URL('..', import.meta.url));
const pagesDir = join(root, 'src/pages');
const stageDir = join(root, 'stage');

const pages = readdirSync(pagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

mkdirSync(stageDir, { recursive: true });
for (const name of readdirSync(stageDir)) {
    rmSync(join(stageDir, name), { recursive: true, force: true });
}

for (const [index, page] of pages.entries()) {
    await build({
        root,
        mode: watch ? 'development' : 'production',
        build: {
            copyPublicDir: index === 0,
            watch: watch ? {} : null,
            rollupOptions: {
                input: { [page]: join(pagesDir, page, 'index.tsx') },
            },
        },
    });
}
