import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import libCoverage from 'istanbul-lib-coverage';
import type { CoverageMapData } from 'istanbul-lib-coverage';
import libInstrument from 'istanbul-lib-instrument';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import type { Plugin } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceFiles = () =>
    globSync('src/**/*.{ts,tsx}', {
        cwd: root,
        exclude: [
            'src/testing/**',
            'src/**/*.test.{ts,tsx}',
            'src/**/*.stories.tsx',
            'src/**/*.d.ts',
        ],
    }).map((file) => join(root, file));

const sourceInstrumenter = () =>
    libInstrument.createInstrumenter({
        coverageGlobalScope: 'globalThis',
        coverageGlobalScopeFunc: false,
        parserPlugins: ['typescript', 'jsx'],
        produceSourceMap: true,
    });

export const collectTestCoverage = process.env.FLEET_TEST_COVERAGE === 'true';

export function instrumentTestCoverage(): Plugin {
    const files = new Set(sourceFiles());
    const instrumenter = sourceInstrumenter();

    return {
        name: 'fleet-test-coverage',
        enforce: 'pre',
        transform(source, id) {
            const filename = id.split('?')[0];
            if (!files.has(filename)) return;

            const code = instrumenter.instrumentSync(source, filename);
            return { code, map: JSON.stringify(instrumenter.lastSourceMap()) };
        },
    };
}

export function createTestCoverageReport(runner: 'cypress' | 'vitest') {
    const coverage = libCoverage.createCoverageMap({});

    const record = (data: CoverageMapData) => {
        coverage.merge(data);
        return null;
    };

    const report = () => {
        const coveredFiles = new Set(coverage.files());
        if (coveredFiles.size === 0) {
            throw new Error(`No browser coverage was collected from ${runner}.`);
        }

        const instrumenter = sourceInstrumenter();
        for (const filename of sourceFiles()) {
            if (coveredFiles.has(filename)) continue;

            instrumenter.instrumentSync(readFileSync(filename, 'utf8'), filename);
            coverage.addFileCoverage(instrumenter.lastFileCoverage());
        }

        const context = libReport.createContext({
            dir: join(root, 'dist', 'coverage', runner),
            coverageMap: coverage,
        });
        reports.create('json').execute(context);
        reports.create('text-summary').execute(context);
    };

    return { record, report };
}
