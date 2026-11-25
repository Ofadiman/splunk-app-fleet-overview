import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './playwright',
    outputDir: './dist/playwright',
    use: {
        baseURL: 'http://localhost:18000',
        trace: 'retain-on-failure',
        video: process.env.CI ? 'retain-on-failure' : 'off',
    },
    projects: [
        { name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } },
        { name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        {
            name: 'webkit',
            ...(process.env.CI && { expect: { timeout: 10_000 } }),
            use: { browserName: 'webkit' },
        },
    ],
});
