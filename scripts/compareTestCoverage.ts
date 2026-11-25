import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { FileCoverageData } from 'istanbul-lib-coverage';

const load = (runner: 'vitest' | 'cypress'): Record<string, FileCoverageData> =>
    JSON.parse(
        readFileSync(
            new URL(`../dist/coverage/${runner}/coverage-final.json`, import.meta.url),
            'utf8',
        ),
    );

const coveredLocations = ({ statementMap, fnMap, branchMap, s, f, b }: FileCoverageData) => ({
    statementMap,
    fnMap,
    branchMap,
    statements: Object.values(s).map(Boolean),
    functions: Object.values(f).map(Boolean),
    branches: Object.values(b).map((hits) => hits.map(Boolean)),
});

const vitest = load('vitest');
const cypress = load('cypress');
const files = new Set([...Object.keys(vitest), ...Object.keys(cypress)]);
const differences = [...files].filter(
    (file) =>
        !vitest[file] ||
        !cypress[file] ||
        !isDeepStrictEqual(coveredLocations(vitest[file]), coveredLocations(cypress[file])),
);

if (!files.size) throw new Error('Both coverage reports are empty.');
if (differences.length) {
    for (const file of differences)
        console.error(`Coverage differs for ${relative(process.cwd(), file)}`);
    process.exitCode = 1;
} else {
    console.log(
        `Vitest and Cypress cover the same source locations across ${files.size} app files.`,
    );
}
