import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const watch = process.argv.includes('--watch');
const root = fileURLToPath(new URL('..', import.meta.url));
const viewsDir = join(root, 'splunk/default/data/ui/views');
const entry = join(root, 'src/main.tsx');
const appDir = join(root, 'fleet_overview');

const xmlEntities: Partial<Record<string, string>> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
};

const decodeXml = (text: string) =>
    text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity: string, name: string) => {
        if (/^#x/i.test(name)) {
            return String.fromCodePoint(parseInt(name.slice(2), 16));
        }
        if (name.startsWith('#')) {
            return String.fromCodePoint(Number(name.slice(1)));
        }
        return xmlEntities[name] ?? entity;
    });

const readLabel = (view: string) => {
    const xml = readFileSync(join(viewsDir, `${view}.xml`), 'utf8');
    const match = /<label>([\s\S]*?)<\/label>/.exec(xml);
    if (!match) {
        throw new Error(`${view}.xml has no <label>. The label is the page title.`);
    }
    return decodeXml(match[1].trim());
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
