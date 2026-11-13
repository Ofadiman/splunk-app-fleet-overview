import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from '@xmldom/xmldom';
import { build } from 'vite';

const watch = process.argv.includes('--watch');
const root = fileURLToPath(new URL('..', import.meta.url));
const viewsDir = join(root, 'splunk/default/data/ui/views');
const entry = join(root, 'src/main.tsx');
const appDir = join(root, 'dist/fleet_overview');

const readLabel = (view: string) => {
    const xml = readFileSync(join(viewsDir, `${view}.xml`), 'utf8');
    const root = new DOMParser().parseFromString(xml, 'text/xml').documentElement;
    const label = [...(root?.childNodes ?? [])]
        .find((node) => node.nodeName === 'label')
        ?.textContent?.trim();
    if (!label) {
        throw new Error(`${view}.xml has no <label>. The label is the page title.`);
    }
    return label;
};

const views = readdirSync(viewsDir, { withFileTypes: true })
    .filter((file) => file.isFile() && file.name.endsWith('.xml'))
    .map((file) => basename(file.name, '.xml'));

const viewLabels = Object.fromEntries(views.map((view) => [view, readLabel(view)]));

mkdirSync(appDir, { recursive: true });
for (const name of readdirSync(appDir)) {
    rmSync(join(appDir, name), { recursive: true, force: true });
}

for (const [index, view] of views.entries()) {
    await build({
        root,
        mode: watch ? 'development' : 'production',
        define: {
            __VIEW_LABELS__: JSON.stringify(viewLabels),
        },
        build: {
            copyPublicDir: index === 0,
            watch: watch ? {} : null,
            rollupOptions: {
                input: { [view]: entry },
            },
        },
    });
}
