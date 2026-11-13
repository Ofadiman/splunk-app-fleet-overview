import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const watch = process.argv.includes('--watch');
const root = fileURLToPath(new URL('..', import.meta.url));
const viewsDir = join(root, 'splunk/default/data/ui/views');
const entry = join(root, 'src/main.tsx');
const appDir = join(root, 'fleet_overview');

const views = readdirSync(viewsDir, { withFileTypes: true })
    .filter((file) => file.isFile() && file.name.endsWith('.xml'))
    .map((file) => basename(file.name, '.xml'));

mkdirSync(appDir, { recursive: true });
for (const name of readdirSync(appDir)) {
    rmSync(join(appDir, name), { recursive: true, force: true });
}

for (const [index, view] of views.entries()) {
    await build({
        root,
        mode: watch ? 'development' : 'production',
        build: {
            copyPublicDir: index === 0,
            watch: watch ? {} : null,
            rollupOptions: {
                input: { [view]: entry },
            },
        },
    });
}
