import type { CoverageMapData } from 'istanbul-lib-coverage';

const getCoverage = (scope: Window): CoverageMapData | undefined =>
    Reflect.get(scope, '__coverage__');

after(() =>
    cy.window({ log: false }).then((appWindow) => {
        const coverage = new Set([getCoverage(window), getCoverage(appWindow)]);

        for (const data of coverage) {
            if (data) cy.task('recordCoverage', data, { log: false });
        }
    }),
);
