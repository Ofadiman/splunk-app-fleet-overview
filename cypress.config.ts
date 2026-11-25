import { unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'cypress';
import { sharedComponentSpecs, testAliases, testDependencyOptimization } from './testAliases.ts';
import {
    collectTestCoverage,
    createTestCoverageReport,
    instrumentTestCoverage,
} from './testCoverage.ts';

const ciCommandTimeout = 10_000;

export default defineConfig({
    screenshotsFolder: 'dist/cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
    e2e: {
        ...(process.env.CI && { defaultCommandTimeout: ciCommandTimeout }),
        baseUrl: 'http://localhost:18000',
        specPattern: 'cypress/e2e/**/*.cy.ts',
        supportFile: false,
        screenshotsFolder: 'dist/cypress/e2e/screenshots',
        video: Boolean(process.env.CI),
        videoCompression: true,
        videosFolder: 'dist/cypress/e2e/videos',
        setupNodeEvents(on) {
            on('after:spec', async (_spec, results) => {
                if (!results?.video || results.error) return;

                const hasFailures = results.tests.some((test) =>
                    test.attempts.some((attempt) => attempt.state === 'failed'),
                );
                if (!hasFailures) await unlink(results.video);
            });
        },
    },
    component: {
        ...(process.env.CI &&
            process.env.BROWSER === 'webkit' && { defaultCommandTimeout: ciCommandTimeout }),
        devServer: {
            framework: 'react',
            bundler: 'vite',
            viteConfig: {
                configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
                cacheDir: fileURLToPath(new URL('./node_modules/.vite/cypress', import.meta.url)),
                optimizeDeps: {
                    ...testDependencyOptimization,
                    include: [
                        ...testDependencyOptimization.include,
                        '@testing-library/jest-dom/matchers',
                        '@vitest/expect',
                        'cypress/react',
                    ],
                },
                server: {
                    forwardConsole: { unhandledErrors: false, logLevels: ['error', 'warn'] },
                },
                plugins: collectTestCoverage ? [instrumentTestCoverage()] : [],
                resolve: {
                    alias: {
                        ...testAliases,
                        '#component-tests': fileURLToPath(
                            new URL('./cypress/support/testRuntime.ts', import.meta.url),
                        ),
                    },
                },
            },
        },
        specPattern: ['cypress/components/**/*.cy.tsx', sharedComponentSpecs],
        supportFile: collectTestCoverage ? 'cypress/support/coverage.ts' : false,
        setupNodeEvents(on) {
            if (!collectTestCoverage) return;

            const coverage = createTestCoverageReport('cypress');
            on('task', { recordCoverage: coverage.record });
            on('after:run', coverage.report);
        },
    },
});
