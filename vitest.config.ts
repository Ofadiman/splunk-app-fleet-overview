import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { playwright } from '@vitest/browser-playwright';
import {
    collectTestCoverage,
    createTestCoverageReport,
    instrumentTestCoverage,
} from './scripts/testCoverage.ts';
import { sharedComponentSpecs, testAliases, testDependencyOptimization } from './testAliases.ts';

const coverage = collectTestCoverage ? createTestCoverageReport('vitest') : undefined;

export default defineConfig({
    legacy: { inconsistentCjsInterop: true },
    define: { 'import.meta.env.FLEET_TEST_COVERAGE': JSON.stringify(collectTestCoverage) },
    plugins: [
        coverage && instrumentTestCoverage(),
        react({ plugins: [['@swc/plugin-styled-components', {}]] }),
    ],
    optimizeDeps: {
        ...testDependencyOptimization,
        include: ['@testing-library/jest-dom/vitest', ...testDependencyOptimization.include],
    },
    resolve: { alias: testAliases },
    test: {
        attachmentsDir: './dist/test-attachments',
        globals: true,
        include: [sharedComponentSpecs],
        reporters: coverage ? ['default', { onTestRunEnd: coverage.report }] : ['default'],
        setupFiles: './vitest.setup.ts',
        browser: {
            enabled: true,
            headless: true,
            viewport: { width: 1280, height: 720 },
            commands: coverage && { recordCoverage: (_, data) => coverage.record(data) },
            provider: playwright(),
            instances: [
                {
                    name: 'chrome',
                    browser: 'chromium',
                    provider: playwright({ launchOptions: { channel: 'chrome' } }),
                },
                {
                    name: 'edge',
                    browser: 'chromium',
                    provider: playwright({ launchOptions: { channel: 'msedge' } }),
                },
                { name: 'firefox', browser: 'firefox' },
                { name: 'webkit', browser: 'webkit' },
            ],
        },
    },
});
